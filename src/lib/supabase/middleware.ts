import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define route protection
  const protectedRoutes = ['/dashboard', '/to', '/admin'];
  const toOnlyRoutes = ['/to'];
  const adminOnlyRoutes = ['/admin'];
  const authRoutes = ['/login', '/register'];

  const pathname = request.nextUrl.pathname;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isToOnlyRoute = toOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const redirect = url.searchParams.get('redirect') || '/dashboard';
    url.pathname = redirect;
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  // Role-based access control for TO and admin routes
  if (user && (isToOnlyRoute || isAdminOnlyRoute)) {
    // Fetch user role from database (single query for performance)
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      // If we can't fetch the role, deny access to protected routes
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'Unable to verify permissions');
      return NextResponse.redirect(url);
    }

    const userRole = userData.role as 'player' | 'to' | 'admin';

    // Check TO-only routes: requires 'to' or 'admin' role
    if (isToOnlyRoute && userRole !== 'to' && userRole !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'Tournament Organizer access required');
      return NextResponse.redirect(url);
    }

    // Check admin-only routes: requires 'admin' role
    if (isAdminOnlyRoute && userRole !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'Administrator access required');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
