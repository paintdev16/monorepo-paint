import { AuthForm } from "../ui/auth-form";
import { SetupGate } from "@/components/auth/setup-gate";
export default function LoginPage() {
  return <SetupGate><AuthForm mode="login" /></SetupGate>;
}
