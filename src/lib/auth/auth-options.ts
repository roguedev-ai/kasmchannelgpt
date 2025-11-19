import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "./password";
import { db } from "@/lib/database";
import { partners } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Look up user in database
        const user = await db.query.partners.findFirst({
          where: eq(partners.email, credentials.email)
        });

        if (!user) {
          return null;
        }

        // Verify password
        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
