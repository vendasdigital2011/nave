import { createBrowserClient } from '@supabase/ssr';

const ALLOWED_SUPABASE_HOST = "cehrtqnvxeugjqkzfnvz.supabase.co";

function validateSupabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL precisa estar configurada no ambiente.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`[SECURITY GUARD] URL do Supabase inválida: ${url}`);
  }

  // Guard anti-portas customizadas nao padrao
  if (parsed.port && parsed.port !== "" && parsed.port !== "443") {
    throw new Error(
      `[SECURITY GUARD ANTI-VPS] Bloqueio crítico ativado: Porta customizada (${parsed.port}) proibida. Apenas HTTPS padrão (443) é permitido.`
    );
  }

  // Guard anti-hosts VPS ou não oficiais
  if (parsed.hostname !== ALLOWED_SUPABASE_HOST && !parsed.hostname.endsWith(".supabase.co")) {
    throw new Error(
      `[SECURITY GUARD ANTI-VPS] Bloqueio crítico ativado: Host (${parsed.hostname}) proibido. Apenas o Supabase Cloud oficial (${ALLOWED_SUPABASE_HOST}) é permitido.`
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error(
      `[SECURITY GUARD] Protocolo seguro HTTPS é obrigatório. Recebido: ${parsed.protocol}`
    );
  }

  return url;
}

export function createClient() {
  const supabaseUrl = validateSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY precisa estar configurada no ambiente."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}


