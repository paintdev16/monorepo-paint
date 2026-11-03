import { AuthForm } from "../ui/auth-form";
import { SetupGate } from "@/components/auth/setup-gate";
export default function RegisterPage() {
  return <SetupGate><AuthForm mode="register" /></SetupGate>;
}
