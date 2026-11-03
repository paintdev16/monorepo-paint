import { AccessPage } from "@/components/access/access-page";
import { AdminList } from "@/components/access/admin-list";
export default function Page() { return <AccessPage permission="roles.view"><AdminList kind="roles" /></AccessPage>; }
