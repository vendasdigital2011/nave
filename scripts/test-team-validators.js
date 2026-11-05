const {
  validateFullName,
  validateEmail,
  validateRole,
  validateStatus,
  validateInviteInput,
  validateUpdateInput,
} = require("../src/modules/team-management/validators/index.ts");

console.log("=== INICIANDO TESTES DOS VALIDATORS DO MÓDULO DE EQUIPE ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${message}`);
  } else {
    failed++;
    console.error(`[FAIL] ${message}`);
  }
}

// 1. validateFullName
assert(validateFullName("").valid === false, "Rejeita nome vazio");
assert(validateFullName("Jo").valid === false, "Rejeita nome < 3 caracteres");
assert(validateFullName("João Silva").valid === true, "Aceita nome válido");
assert(validateFullName("  Carlos  Eduardo  ").valid === true, "Aceita e sanitiza espaços");

// 2. validateEmail
assert(validateEmail("").valid === false, "Rejeita email vazio");
assert(validateEmail("invalido").valid === false, "Rejeita email sem @");
assert(validateEmail("teste@navetech.com.br").valid === true, "Aceita email válido");
assert(
  validateEmail(" TESTE@Navetech.COM.BR ").normalized === "teste@navetech.com.br",
  "Normaliza email para lowercase e sem espaços"
);

// 3. validateRole
assert(validateRole("admin").valid === true, "Aceita role admin");
assert(validateRole("supervisor").valid === true, "Aceita role supervisor");
assert(validateRole("vendedor").valid === true, "Aceita role vendedor");
assert(validateRole("hacker").valid === false, "Rejeita role inexistente");

// 4. validateStatus
assert(validateStatus("convite_pendente").valid === true, "Aceita convite_pendente");
assert(validateStatus("ativo").valid === true, "Aceita ativo");
assert(validateStatus("suspenso").valid === true, "Aceita suspenso");
assert(validateStatus("desativado").valid === true, "Aceita desativado");
assert(validateStatus("deletado").valid === false, "Rejeita status desconhecido");

// 5. validateInviteInput
const inviteRes1 = validateInviteInput({
  full_name: "Mariana Souza",
  email: "mariana@navetech.com.br",
  role: "vendedor",
});
assert(inviteRes1.valid === true, "Convite válido aceito");
assert(inviteRes1.data.full_name === "Mariana Souza", "Nome no objeto de dados");

const inviteRes2 = validateInviteInput({
  full_name: "M",
  email: "email-invalido",
});
assert(inviteRes2.valid === false, "Convite inválido rejeitado com múltiplos erros");
assert(Boolean(inviteRes2.errors.full_name), "Erro no campo full_name");
assert(Boolean(inviteRes2.errors.email), "Erro no campo email");

// 6. validateUpdateInput
const updateRes1 = validateUpdateInput({ role: "supervisor" });
assert(updateRes1.valid === true && updateRes1.data.role === "supervisor", "Update role válido");

const updateRes2 = validateUpdateInput({});
assert(updateRes2.valid === false, "Rejeita update vazio");

console.log(`\nRESULTADOS: ${passed} passaram, ${failed} falharam.`);
if (failed > 0) process.exit(1);
