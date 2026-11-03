export const SYSTEM_PERMISSIONS = ['users', 'roles', 'permissions'].flatMap((resource) =>
  ['view', 'create', 'update', 'delete'].map((action) => `${resource}.${action}`),
);
export const SYSTEM_ROLES = ['super_admin', 'admin', 'client'];
