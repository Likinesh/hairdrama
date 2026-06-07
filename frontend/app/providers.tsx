'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

/**
 * AuthGate blocks rendering of all children until the auth_token cookie
 * is confirmed set (or cleared). This eliminates the race condition where
 * API calls fire before the cookie exists.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // Clear stale cookie
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
      setReady(true);
      return;
    }

    // status === 'authenticated' — write JWT cookie from session
    const appSession = session as (typeof session & { appToken?: string }) | null;
    if (appSession?.appToken) {
      document.cookie = `auth_token=${appSession.appToken}; path=/; max-age=604800; SameSite=Lax`;
    }
    setReady(true);
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
