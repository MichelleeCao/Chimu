import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const supabase = createClient();
  const response = NextResponse.next();

  const supabaseMiddleware = createClient({
    request,
    response,
  });

  const { data, error } = await supabaseMiddleware.auth.getSession();

  if (error) {
    console.error("Supabase authentication error:", error);
    // Handle error appropriately, e.g., redirect to an error page
    return NextResponse.redirect(new URL("/error", request.url));
  }

  // Redirect unauthenticated users to the login page, unless they are already on an auth page
  if (!data.session && !request.nextUrl.pathname.startsWith("/auth/login") && !request.nextUrl.pathname.startsWith("/auth/signup")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // For authenticated users, if they are on a login/signup page, redirect to home
  if (data.session && (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/signup"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (api routes)
     * - login (login page)
     * - signup (signup page)
     * - test-roles (development only role switching page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/login|auth/signup|auth/test-roles).*)',
  ],
};
