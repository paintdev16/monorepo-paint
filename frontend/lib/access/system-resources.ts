// These immutable entries are defined by the backend; it remains authoritative.
export const isSystemRole = (name: string) => ["super_admin", "admin", "client"].includes(name);
export const isSystemPermission = (key: string) => {
  const [resource, action, ...rest] = key.split(".");
  return rest.length === 0 && ["users", "roles", "permissions"].includes(resource) && ["view", "create", "update", "delete"].includes(action);
};
