import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const CUSTOMER_PREFIXES = [
  "/account",
  "/bookings",
  "/favorites",
  "/alerts",
  "/wallet",
  "/refer",
  "/notifications",
  "/reviews",
  "/support",
  "/checkout",
];

/**
 * Routes traffic by session/role and keeps auth cookies fresh. This is a
 * convenience layer only — every server action and route handler re-checks
 * authorisation itself (see src/lib/auth.ts).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response; // local dev without keys

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshes the session if needed; also used for gating below.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsCustomer = CUSTOMER_PREFIXES.some((p) => pathname.startsWith(p));
  const needsPartner =
    pathname.startsWith("/partner") &&
    !["/partner/login", "/partner/apply"].some((p) => pathname.startsWith(p));
  const needsAdmin = pathname.startsWith("/admin");

  if ((needsCustomer || needsPartner || needsAdmin) && !user) {
    const login = needsPartner ? "/partner/login" : "/login";
    const redirectUrl = new URL(login, request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if ((needsAdmin || needsPartner) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (
      needsAdmin &&
      profile?.role !== "super_admin" &&
      profile?.role !== "support_agent"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Partner pages allow any signed-in user; those without a club are sent
    // to /partner/apply by the partner layout (server-side re-check).
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)",
  ],
};
