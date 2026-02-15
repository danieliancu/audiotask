import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createUserWithPassword, upsertOAuthUser, verifyPassword } from '@/lib/users';

const hasGoogleOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasFacebookOAuth = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);

const oauthProviders = [];
if (hasGoogleOAuth) {
  oauthProviders.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })
  );
}
if (hasFacebookOAuth) {
  oauthProviders.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    ...oauthProviders,
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? '';
        if (!email || !password) return null;
        const user = await verifyPassword(email, password);
        if (!user) return null;
        return { id: String(user.id), email: user.email, name: user.name };
      }
    })
  ],
  pages: { signIn: '/auth' },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user?.id) token.id = user.id;
      if (account && account.provider !== 'credentials') {
        const profileData = profile as {
          sub?: string;
          id?: string;
          email?: string | null;
          name?: string | null;
          picture?: string | null;
          image?: string | null;
        } | null;
        const providerAccountId = account.providerAccountId ?? profileData?.sub ?? profileData?.id;
        if (providerAccountId) {
          const oauthUser = await upsertOAuthUser({
            email: profileData?.email ?? (token.email as string | undefined),
            name: profileData?.name ?? (token.name as string | undefined),
            image: profileData?.picture ?? profileData?.image ?? (token.picture as string | undefined),
            provider: account.provider,
            providerAccountId
          });
          token.id = String(oauthUser.id);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
