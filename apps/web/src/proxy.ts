import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthMode } from "@/lib/env/app-mode";
import { getSupabasePublicEnv } from "@/lib/env/supabase";

export async function proxy(request: NextRequest) {
  if (getAuthMode() !== "supabase") {
    return NextResponse.next();
  }

  const env = getSupabasePublicEnv();
  let response = NextResponse.next({
    request,
  });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const authResponse = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === "/login";

  if (authResponse.error || !authResponse.data.user) {
    return isLogin ? response : redirectToLogin(request);
  }

  const contextResponse = await supabase.rpc("get_current_app_user_context");
  const hasActiveAppUser = !contextResponse.error && contextResponse.data?.[0];

  if (!hasActiveAppUser) {
    return isLogin ? response : redirectToLogin(request);
  }

  return isLogin ? NextResponse.redirect(new URL("/", request.url)) : response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}
