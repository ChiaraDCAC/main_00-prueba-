// ─── Roles del sistema ────────────────────────────────────────────────────────
export const ROLES = [
  {
    value: 'admin',
    label: 'Oficial de Cumplimiento',
    shortLabel: 'Admin',
    description: 'Acceso total: ver, editar, aprobar y dar de alta usuarios.',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    level: 1,
  },
  {
    value: 'supervisor',
    label: 'Supervisor de Compliance',
    shortLabel: 'Supervisor',
    description: 'Puede ver, editar y aprobar. No puede dar de alta usuarios.',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    level: 2,
  },
  {
    value: 'analyst',
    label: 'Analista de Compliance',
    shortLabel: 'Analista',
    description: 'Puede ver y editar información. No puede aprobar ni dar de alta usuarios.',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    level: 3,
  },
  {
    value: 'auditor',
    label: 'Auditor',
    shortLabel: 'Auditor',
    description: 'Solo lectura. Puede ver información pero no modificar nada.',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    level: 4,
  },
];

// ─── Permisos por acción ──────────────────────────────────────────────────────
const PERMISSIONS = {
  admin:    ['view', 'edit', 'approve', 'alta_usuario', 'manage_users', 'delete'],
  supervisor: ['view', 'edit', 'approve'],
  analyst:  ['view', 'edit'],
  auditor:  ['view'],
};

export const can = (userRole, action) => {
  return PERMISSIONS[userRole]?.includes(action) ?? false;
};

export const getRoleInfo = (role) =>
  ROLES.find((r) => r.value === role) || { label: role, color: 'bg-gray-100 text-gray-700', shortLabel: role };
