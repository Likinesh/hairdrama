'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { syncUser } from '@/lib/api';
import type { AppSession } from '@/types';

/**
 * AuthGate ensures the auth_token cookie is set before any children render.
 *
 * Flow:
 * 1. If appToken already exists in session → set cookie → done
 * 2. If appToken is missing (server-side sync failed) → call /auth/sync
 *    from the browser directly → set cookie → done
 * 3. If unauthenticated → clear cookie → done
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [ready, setReady] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
      setReady(true);
      return;
    }

    // Authenticated — check if we already have the token
    const appSession = session as AppSession | null;

    if (appSession?.appToken) {
      // Server-side sync succeeded — just set the cookie
      document.cookie = `auth_token=${appSession.appToken}; path=/; max-age=604800; SameSite=Lax`;
      setReady(true);
      return;
    }

    // Server-side sync failed — try from the browser
    if (syncAttempted.current) {
      setReady(true);
      return;
    }
    syncAttempted.current = true;

    const googleId = appSession?.googleId;
    const email = appSession?.googleEmail || appSession?.user?.email;

    if (!googleId || !email) {
      // No credentials available — can't sync
      console.error('No Google credentials in session, cannot sync');
      setReady(true);
      return;
    }

    // Call /auth/sync from the browser (directly to Render)
    syncUser({
      google_id: googleId,
      email: email,
      name: appSession?.googleName || appSession?.user?.name || '',
      avatar_url: appSession?.googleAvatar || appSession?.user?.image || '',
      access_token: appSession?.googleAccessToken || '',
      refresh_token: appSession?.googleRefreshToken,
    })
      .then(({ token }) => {
        document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      })
      .catch((err) => {
        console.error('Client-side sync failed:', err);
      })
      .finally(() => {
        setReady(true);
      });
  }, [session, status]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGate>{children}</AuthGate>
    </SessionProvider>
  );
}
