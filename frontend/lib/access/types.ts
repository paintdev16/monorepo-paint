export type Role = {
  id: string;
  name: string;
  isRequired: boolean;
  description: string | null;
  userCount: number;
  permissionCount: number;
  permissions?: Permission[];
};
export type Permission = {
  id: string;
  key: string;
  isRequired: boolean;
  description: string | null;
  roleCount: number;
};
export type User = {
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
};
export type Page<T> = { data: T[]; page: number; limit: number; total: number };
export type Effective = {
  roles: Pick<Role, "id" | "name">[];
  permissions: string[];
};
