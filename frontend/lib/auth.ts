import type { NextAuthOptions, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import type { GoogleProfile, AppJWT, AppSession } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.send',
          ].join(' '),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }): Promise<JWT> {
      const appToken = token as AppJWT;

      if (account && profile) {
        const gProfile = profile as GoogleProfile;

        // Store Google credentials in the JWT for client-side sync
        appToken.googleId = account.providerAccountId;
        appToken.googleEmail = gProfile.email ?? '';
        appToken.googleName = gProfile.name ?? '';
        appToken.googleAvatar = gProfile.picture ?? '';
        appToken.googleAccessToken = account.access_token ?? '';
        appToken.googleRefreshToken = account.refresh_token ?? '';

        // Try server-side sync (may fail if backend is cold-starting)
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/sync`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                google_id: account.providerAccountId,
                email: gProfile.email ?? '',
                name: gProfile.name ?? '',
                avatar_url: gProfile.picture ?? '',
                access_token: account.access_token ?? '',
                refresh_token: account.refresh_token ?? '',
              }),
            }
          );
          if (res.ok) {
            const data = await res.json() as { token: string; user: { id: string } };
            appToken.appToken = data.token;
            appToken.appUser = data.user;
          }
        } catch (err) {
          console.error('Server-side sync failed (client will retry):', err);
        }
      }
      return appToken;
    },

    async session({ session, token }): Promise<Session> {
      const appToken = token as AppJWT;
      const appSession = session as AppSession;
      appSession.appToken = appToken.appToken;

      // Expose Google credentials so client can retry sync if server-side failed
      appSession.googleId = appToken.googleId;
      appSession.googleEmail = appToken.googleEmail;
      appSession.googleName = appToken.googleName;
      appSession.googleAvatar = appToken.googleAvatar;
      appSession.googleAccessToken = appToken.googleAccessToken;
      appSession.googleRefreshToken = appToken.googleRefreshToken;

      if (appToken.appUser) {
        (appSession.user as AppSession['user'] & { id?: string }).id = appToken.appUser.id;
      }
      return appSession;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};