import { redirect } from "next/navigation";

// A tela inicial do sistema é sempre o dashboard (após login).
// O middleware cuida de redirecionar para /login quando não autenticado.
export default function RootPage() {
  redirect("/dashboard");
}
