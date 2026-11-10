import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { createServiceClient } from "@/lib/supabase/server";

async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) return null;
  try {
    return JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

// Helper para normalização de telefone padrão brasileiro
function normalizePhone(raw: string): { formatted: string; rawDigits: string; isValid: boolean } {
  if (!raw) return { formatted: "", rawDigits: "", isValid: false };

  let digits = String(raw).replace(/\D/g, "");

  // Remover DDI 55 se presente no início com mais de 11 dígitos
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    const formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return { formatted, rawDigits: digits, isValid: true };
  }

  if (digits.length === 10) {
    const formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return { formatted, rawDigits: digits, isValid: true };
  }

  return { formatted: raw.trim(), rawDigits: digits, isValid: false };
}

// GET /api/campaigns/[id]/imports - Listar lotes de importação
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const supabase = createServiceClient();

    const { data: batches, error } = await supabase
      .from("import_batches")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, batches: [] });
    }

    return NextResponse.json({ success: true, batches: batches || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/campaigns/[id]/imports - Executar importação por lote com deduplicação
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      return NextResponse.json(
        { error: "Apenas administradores e supervisores podem importar planilhas." },
        { status: 403 }
      );
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { file_name, file_hash, rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Nenhuma linha válida recebida para importação." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // 1. Obter a primeira etapa da campanha (ex: 'Novos Leads' ou 'Importados')
    let defaultStageId = "10000000-0000-0000-0000-000000000001";
    const { data: stages } = await supabase
      .from("campaign_stages")
      .select("id")
      .eq("campaign_id", campaignId)
      .order("position", { ascending: true })
      .limit(1);

    if (stages && stages.length > 0) {
      defaultStageId = stages[0].id;
    }

    // 2. Criar registro do Lote (import_batches)
    const { data: batch, error: batchErr } = await supabase
      .from("import_batches")
      .insert([
        {
          campaign_id: campaignId,
          uploaded_by: user.id || null,
          operator_email: user.email,
          file_name: file_name || "planilha.xlsx",
          file_hash: file_hash || null,
          status: "processing",
          total_rows: rows.length,
          started_at: now,
        },
      ])
      .select()
      .single();

    if (batchErr || !batch) {
      return NextResponse.json({ error: "Falha ao registrar lote: " + batchErr?.message }, { status: 500 });
    }

    // 3. Processar linhas com normalização e deduplicação inteligente
    let validRows = 0;
    let insertedClients = 0;
    let linkedLeads = 0;
    let duplicateLeads = 0;
    let rejectedRows = 0;

    const batchRowsToInsert: any[] = [];
    const seenPhonesInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const rawName = String(row.name || "").trim();
      const rawPhone = String(row.phone || "").trim();

      const { formatted: phone, rawDigits, isValid } = normalizePhone(rawPhone);

      // Linha vazia ou sem telefone válido
      if (!rawName || !isValid || !rawDigits) {
        rejectedRows++;
        batchRowsToInsert.push({
          batch_id: batch.id,
          row_number: rowNumber,
          raw_name: rawName,
          raw_phone: rawPhone,
          result: "rejected",
          error_code: !rawName ? "EMPTY_NAME" : "INVALID_PHONE",
        });
        continue;
      }

      // Deduplicação dentro do mesmo arquivo
      if (seenPhonesInBatch.has(rawDigits)) {
        duplicateLeads++;
        batchRowsToInsert.push({
          batch_id: batch.id,
          row_number: rowNumber,
          raw_name: rawName,
          raw_phone: rawPhone,
          normalized_phone: phone,
          result: "duplicate",
          error_code: "DUPLICATE_IN_FILE",
        });
        continue;
      }
      seenPhonesInBatch.add(rawDigits);
      validRows++;

      // Verificar se o contato já existe no cadastro geral de clientes (clients)
      let clientId: string | null = null;
      const { data: existingClients } = await supabase
        .from("clients")
        .select("id, name")
        .or(`phone.eq.${phone},phone.eq.${rawDigits}`);

      if (existingClients && existingClients.length > 0) {
        clientId = existingClients[0].id;
      } else {
        // Criar cliente global
        const newClientId = "c_" + Date.now() + "_" + i + "_" + Math.random().toString(36).substring(2, 5);
        const { data: createdClient, error: clientCreateErr } = await supabase
          .from("clients")
          .insert([
            {
              id: newClientId,
              name: rawName,
              phone: phone,
              condominium: row.condominium || "Geral",
              current_plan: row.current_plan || "50 Mega",
              target_plan: row.target_plan || "100 Mega",
              status: "importados",
              notes: row.notes || null,
              operator_email: user.email,
            },
          ])
          .select("id")
          .single();

        if (!clientCreateErr && createdClient) {
          clientId = createdClient.id;
          insertedClients++;
        }
      }

      if (!clientId) {
        rejectedRows++;
        continue;
      }

      // Verificar se este lead já está nesta campanha
      const { data: existingLead } = await supabase
        .from("campaign_leads")
        .select("id, stage_id")
        .eq("campaign_id", campaignId)
        .eq("client_id", clientId)
        .maybeSingle();

      if (existingLead) {
        // Já existe na campanha: NÃO SOBRESCREVER status nem dados! Apenas registrar duplicata
        duplicateLeads++;
        batchRowsToInsert.push({
          batch_id: batch.id,
          row_number: rowNumber,
          raw_name: rawName,
          raw_phone: rawPhone,
          normalized_phone: phone,
          result: "duplicate",
          error_code: "ALREADY_IN_CAMPAIGN",
          client_id: clientId,
          campaign_lead_id: existingLead.id,
        });
      } else {
        // Novo lead na campanha: criar vínculo
        const { data: newLead } = await supabase
          .from("campaign_leads")
          .insert([
            {
              campaign_id: campaignId,
              client_id: clientId,
              stage_id: defaultStageId,
              first_import_batch_id: batch.id,
              notes: row.notes || null,
              created_at: now,
              updated_at: now,
            },
          ])
          .select("id")
          .single();

        linkedLeads++;
        batchRowsToInsert.push({
          batch_id: batch.id,
          row_number: rowNumber,
          raw_name: rawName,
          raw_phone: rawPhone,
          normalized_phone: phone,
          result: "linked",
          client_id: clientId,
          campaign_lead_id: newLead?.id,
        });

        // Auto-provisionar conversa na central de conversas para envio imediato
        if (newLead) {
          const defaultInstId = "6c98699d-3684-4a35-a47f-8dfcaa950476";
          try {
            const { data: existingConv } = await supabase
              .from("conversations")
              .select("id")
              .or(`contact_client_id.eq.${clientId},contact_phone.eq.${phone}`)
              .limit(1)
              .maybeSingle();

            if (existingConv) {
              await supabase
                .from("conversations")
                .update({
                  contact_client_id: clientId,
                  campaign_lead_id: newLead.id,
                  contact_name: rawName,
                  updated_at: now,
                })
                .eq("id", existingConv.id);
            } else {
              await supabase
                .from("conversations")
                .insert({
                  instance_id: defaultInstId,
                  contact_client_id: clientId,
                  campaign_lead_id: newLead.id,
                  assigned_user_id: null,
                  contact_phone: phone,
                  contact_name: rawName,
                  status: "waiting_user",
                  unread_count: 0,
                  last_message_text: "Lead importado na campanha",
                  last_message_at: now,
                  created_at: now,
                  updated_at: now,
                });
            }
          } catch {
            // Ignora conflitos pontuais
          }
        }
      }
    }

    // 4. Salvar linhas do lote (em pedaços de 50 para performance)
    if (batchRowsToInsert.length > 0) {
      for (let c = 0; c < batchRowsToInsert.length; c += 50) {
        await supabase.from("import_batch_rows").insert(batchRowsToInsert.slice(c, c + 50));
      }
    }

    // 5. Finalizar lote em import_batches
    const completedNow = new Date().toISOString();
    await supabase
      .from("import_batches")
      .update({
        status: "completed",
        valid_rows: validRows,
        inserted_clients: insertedClients,
        linked_leads: linkedLeads,
        duplicate_leads: duplicateLeads,
        rejected_rows: rejectedRows,
        completed_at: completedNow,
      })
      .eq("id", batch.id);

    // 6. Auditoria
    await supabase.from("audit_logs").insert([
      {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        operator_email: user.email,
        actor_user_id: user.id,
        action: `Importou lote "${file_name}" na campanha ID ${campaignId}: ${linkedLeads} novos leads, ${duplicateLeads} repetidos, ${rejectedRows} rejeitados`,
        timestamp: completedNow,
      },
    ]);

    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      summary: {
        total_rows: rows.length,
        valid_rows: validRows,
        inserted_clients: insertedClients,
        linked_leads: linkedLeads,
        duplicate_leads: duplicateLeads,
        rejected_rows: rejectedRows,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no processamento da importação." }, { status: 500 });
  }
}
