'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutGrid, Users, Mail, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  { icon: LayoutGrid, title: 'Kanban Board',    desc: 'Drag & drop tasks across status columns' },
  { icon: Users,      title: 'Team Assignment', desc: 'Assign tasks to any registered team member' },
  { icon: Mail,       title: 'Email Alerts',    desc: 'Auto-notify assignees and creators via Gmail' },
  { icon: Zap,        title: 'Priority Levels', desc: 'High, Medium, Low with color-coded badges' },
];

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        <div className="w-[72px] h-[72px] rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-7">
          <LayoutGrid className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight leading-tight mb-5 max-w-[720px]">
          <span className="text-primary">Hairdrama</span>{' '}
          Task Manager
        </h1>

        <p className="text-lg text-muted-foreground max-w-[560px] mb-12 leading-relaxed">
          Create, assign, and track tasks with a beautiful Kanban board.
        </p>

        <Button
          id="google-sign-in-btn"
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-3 px-7 h-12 text-base font-semibold"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.3-10.3 7.3-17.5z" fill="#4285F4" />
            <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.8-6c-2.1 1.4-4.9 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.6v6.2C6.5 42.7 14.7 48 24 48z" fill="#34A853" />
            <path d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6V13H2.6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l8-6.2z" fill="#FBBC05" />
            <path d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.5 0 24 0 14.7 0 6.5 5.3 2.6 13.2l8 6.2c1.9-5.7 7.2-9.9 13.4-9.9z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Secure Google OAuth 2.0
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-[72px] max-w-[800px] w-full">
          {FEATURES.map((f) => (
            <Card key={f.title} className="text-left bg-card border-border hover:border-border/80 hover:shadow-md transition-all">
              <CardContent className="pt-5">
                <f.icon className="w-6 h-6 mb-3 text-primary" />
                <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="text-center py-5 px-6 border-t border-border text-muted-foreground text-xs">
        &copy; 2025 Hairdrama Task Manager &middot; Built with Next.js, Flask &amp; Supabase
      </footer>
    </main>
  );
}
