import type { NextAuthOptions } from "next-auth";

/**
 * NextAuth configuration for Entra ID (Azure AD) authentication.
 *
 * In development, set NEXTAUTH_DEV_BYPASS=true to skip real auth
 * and use a mock engineer session.
 */
export const authOptions: NextAuthOptions = {
  providers: getProviders(),
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.oid = (profile as Record<string, unknown>).oid as string;
        token.name = profile.name;
        token.email = profile.email;
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as Record<string, unknown>).oid = token.oid;
        (session as Record<string, unknown>).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

function getProviders() {
  // Dev bypass mode — uses credentials provider with a dummy user
  if (process.env.NEXTAUTH_DEV_BYPASS === "true") {
    const CredentialsProvider = require("next-auth/providers/credentials").default;
    return [
      CredentialsProvider({
        name: "Dev Bypass",
        credentials: {
          email: { label: "Email", type: "text", placeholder: "dev@wyretechnology.com" },
        },
        async authorize() {
          return {
            id: "dev-user-001",
            name: "Dev Engineer",
            email: "dev@wyretechnology.com",
            oid: "00000000-0000-0000-0000-000000000001",
          };
        },
      }),
    ];
  }

  // Production — Entra ID
  const AzureADProvider = require("next-auth/providers/azure-ad").default;
  return [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ];
}
