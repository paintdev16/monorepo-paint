import { SetupGate } from "@/components/auth/setup-gate";
import { AuthForm } from "../ui/auth-form";

export default function SetupPage() {
  return <SetupGate setup><AuthForm mode="setup" /></SetupGate>;
}
