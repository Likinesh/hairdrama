import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

/**
 * Proxy runs server-side BEFORE any page renders.
 * It reads the appToken from the NextAuth JWT and sets it as
 * an auth_token cookie — guaranteed to be available when
 * client-side code runs.
 */
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const response = NextResponse.next();

  const appToken = token?.appToken as string | undefined;

  if (appToken) {
    response.cookies.set('auth_token', appToken, {
      path: '/',
      maxAge: 604800, // 7 days
      sameSite: 'lax',
      httpOnly: false, // needs to be readable by JS interceptor
    });
  } else {
    // No valid session — clear stale cookie
    response.cookies.delete('auth_token');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static files and Next.js internals.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
