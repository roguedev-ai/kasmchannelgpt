import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/database';
import { verifyPassword } from '@/lib/auth/password';
import { partners } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import type { Partner } from '@/lib/database';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        partnerId: { label: "Partner ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.partnerId || !credentials?.password) {
          return null;
        }

        const [partner] = await db.select().from(partners).where(eq(partners.id, credentials.partnerId));

        if (!partner) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, partner.password);

        if (!isValid) {
          return null;
        }

        return {
          id: partner.id,
          email: partner.email,
          role: partner.role,
          name: partner.name || partner.id,
          partnerId: partner.id
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.partnerId = user.partnerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as Partner['role'];
        session.user.partnerId = token.partnerId as string;
        session.user.id = token.partnerId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
