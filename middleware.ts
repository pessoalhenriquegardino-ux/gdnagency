import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Middleware roda no Edge Runtime — por isso usa authConfig (sem Prisma/bcrypt)
export default NextAuth(authConfig).auth;

export const config = {
  // Protege tudo, exceto assets estáticos e a rota de API do próprio Auth.js
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
