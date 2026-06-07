'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="sticky top-0 z-50 h-16 bg-background border-b border-border">
      <div className="flex items-center justify-between h-full max-w-[1280px] mx-auto px-6">
        <Link
          href="/dashboard"
          aria-label="Hairdrama Task Manager home"
          className="text-lg font-bold tracking-tight text-primary"
        >
          Hairdrama
        </Link>

        <div className="flex items-center gap-1" role="navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname === l.href
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? 'User avatar'}
              width={32}
              height={32}
              className="rounded-full border border-border object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
              {session?.user?.name?.charAt(0) ?? '?'}
            </div>
          )}
          <Button
            id="logout-btn"
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}
