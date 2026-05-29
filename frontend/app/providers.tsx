'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';

function CookieSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const appSession = session as (typeof session & { appToken?: string }) | null;
    if (appSession?.appToken) {
      document.cookie = `auth_token=${appSession.appToken}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    }
  }, [session, status]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CookieSync />
      {children}
    </SessionProvider>
  );
}
