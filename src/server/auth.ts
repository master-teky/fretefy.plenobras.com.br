import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "ERP Login",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // Lazy import to avoid env parse errors at middleware/build time
        const { env } = await import("@/lib/env");

        const params = new URLSearchParams();
        params.append("grant_type", "password");
        params.append("username", credentials.username as string);
        params.append("password", credentials.password as string);

        try {
          const response = await fetch(
            `${env.AUTH_API_URL}:${env.AUTH_API_PORT}/api/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params,
            }
          );

          if (!response.ok) return null;

          const data = await response.json() as {
            username: string;
            access_token: string;
          };

          return {
            id: data.username,
            name: data.username,
            email: credentials.username as string,
            accessToken: data.access_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken: string }).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      (session as unknown as { accessToken: string }).accessToken =
        token.accessToken as string;
      return session;
    },
  },
});