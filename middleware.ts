import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Supabase authentication error:", error);
    // Handle error appropriately, e.g., redirect to an error page
    return NextResponse.redirect(new URL("/error", request.url));
  }

  // Redirect unauthenticated users to the login page, unless they are already on an auth page
  if (!data.session && !request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.pathname.startsWith("/signup")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // For authenticated users, if they are on a login/signup page, redirect to home
  if (data.session && (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup|test-roles).*)',
  ],
};
