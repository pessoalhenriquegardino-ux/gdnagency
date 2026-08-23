import { auth } from "@/auth";
import { redirect } from "next/navigation";

/** Garante que há um usuário autenticado; redireciona para /login se não houver. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Garante que o usuário autenticado é ADMIN; redireciona para /dashboard se for MEMBER. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
