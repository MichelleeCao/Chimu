import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

interface CreateClientOptions {
  request?: NextRequest;
  response?: NextResponse;
}

export function createClient(options?: CreateClientOptions) {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (options?.request) {
            return options.request.cookies.get(name)?.value;
          }
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          if (options?.response) {
            options.response.cookies.set({ name, value, ...options });
          } else {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `cookies().set()` method can only be called in a Server Component or Route Handler.
              // This error is typically only seen if you're calling an all-client Supabase client in a Server Component with a `set` method.
              // If you need to set a cookie in a Server Component, you should use the `createServerClient` instead.
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          if (options?.response) {
            options.response.cookies.set({ name, value: "", ...options });
          } else {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // The `cookies().set()` method can only be called in a Server Component or Route Handler.
              // This error is typically only seen if you're calling an all-client Supabase client in a Server Component with a `set` method.
              // If you need to set a cookie in a Server Component, you should use the `createServerClient` instead.
            }
          }
        },
      },
    }
  );
}

