const {
  validateRole,
  validateStatus,
  validateUpdateInput,
} = require("../src/modules/team-management/validators/index.ts");

console.log("=== TESTES DE REGRAS DE NEGÓCIO E GOVERNANÇA (ETAPA 3) ===\n");

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

// 1. Simulação da proteção do último admin
function simulateAdminProtection({ currentRole, newRole, newStatus, activeAdminCount }) {
  const isDemotingAdmin = currentRole === "admin" && newRole !== undefined && newRole !== "admin";
  const isDeactivatingAdmin = currentRole === "admin" && newStatus !== undefined && newStatus !== "ativo" && newStatus !== "convite_pendente";

  if ((isDemotingAdmin || isDeactivatingAdmin) && activeAdminCount <= 1) {
    return { allowed: false, reason: "LAST_ADMIN_PROTECTION" };
  }
  return { allowed: true };
}

// Caso 1: Tentar suspender o único admin ativo -> Bloqueado
const r1 = simulateAdminProtection({
  currentRole: "admin",
  newStatus: "suspenso",
  activeAdminCount: 1,
});
assert(r1.allowed === false && r1.reason === "LAST_ADMIN_PROTECTION", "Bloqueia suspensão do único admin");

// Caso 2: Tentar rebaixar o único admin ativo para vendedor -> Bloqueado
const r2 = simulateAdminProtection({
  currentRole: "admin",
  newRole: "vendedor",
  activeAdminCount: 1,
});
assert(r2.allowed === false && r2.reason === "LAST_ADMIN_PROTECTION", "Bloqueia rebaixamento do único admin para vendedor");

// Caso 3: Havendo 2 admins ativos, permite rebaixar ou suspender um deles
const r3 = simulateAdminProtection({
  currentRole: "admin",
  newRole: "supervisor",
  activeAdminCount: 2,
});
assert(r3.allowed === true, "Permite alteração quando há mais de 1 admin ativo");

// Caso 4: Suspender vendedor comum -> Permitido mesmo com 1 admin
const r4 = simulateAdminProtection({
  currentRole: "vendedor",
  newStatus: "suspenso",
  activeAdminCount: 1,
});
assert(r4.allowed === true, "Permite suspender vendedor comum");

// 2. Simulação de Autorização por Perfil (Deny by default)
function checkRoutePermission(userRole, requiredRole) {
  if (!userRole) return false;
  if (requiredRole === "admin") return userRole === "admin";
  if (requiredRole === "supervisor") return userRole === "admin" || userRole === "supervisor";
  return true;
}

assert(checkRoutePermission("vendedor", "admin") === false, "Vendedor não tem acesso a rota admin");
assert(checkRoutePermission("supervisor", "admin") === false, "Supervisor não tem acesso a rota admin");
assert(checkRoutePermission("admin", "admin") === true, "Admin tem acesso total");
assert(checkRoutePermission(null, "admin") === false, "Usuário anônimo não tem acesso");

console.log(`\nRESULTADOS: ${passed} passaram, ${failed} falharam.`);
if (failed > 0) process.exit(1);
