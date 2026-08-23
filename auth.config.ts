import type { NextAuthConfig } from "next-auth";

// Configuração "edge-safe" do Auth.js: usada pelo middleware (que roda no Edge
// Runtime, sem acesso ao Prisma/bcrypt). A verificação real de credenciais
// fica em auth.ts (Node runtime).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isPublicAsset = nextUrl.pathname.startsWith("/_next");

      if (isPublicAsset) return true;

      if (isOnLogin) {
        // Já logado tentando acessar /login → manda pro dashboard
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // Toda rota fora de /login exige sessão
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: [], // providers reais são adicionados em auth.ts
} satisfies NextAuthConfig;
