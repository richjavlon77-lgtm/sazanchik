import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const config = {
  matcher: [
    "/admin/:path*",
    "/waiter/:path*",
    "/bar/:path*",
    "/hookah/:path*",
    "/kitchen/:path*",
    "/cold/:path*",
    "/meat/:path*",
  ],
};

// Each staff area: URL prefix → required role + its own login page.
// All staff areas share the /waiter/api/login endpoint (role-aware).
const AREAS: { prefix: string; role: string; login: string }[] = [
  { prefix: "/bar", role: "bartender", login: "/bar/login" },
  { prefix: "/hookah", role: "hookah", login: "/hookah/login" },
  { prefix: "/kitchen", role: "cook", login: "/kitchen/login" },
  { prefix: "/cold", role: "cold", login: "/cold/login" },
  { prefix: "/meat", role: "meat", login: "/meat/login" },
  { prefix: "/waiter", role: "waiter", login: "/waiter/login" },
  { prefix: "/admin", role: "manager", login: "/admin/login" },
];

// Public auth endpoints that must render without a session.
const PUBLIC = new Set([
  "/admin/login",
  "/admin/api/login",
  "/waiter/login",
  "/waiter/api/login",
  "/bar/login",
  "/hookah/login",
  "/kitchen/login",
  "/cold/login",
  "/meat/login",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.has(pathname)) return NextResponse.next();

  const area = AREAS.find((a) => pathname.startsWith(a.prefix));
  const loginPath = area?.login ?? "/admin/login";

  const token = request.cookies.get(SESSION_COOKIE.name)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) return redirectToLogin(request, loginPath);

  // Managers can view every staff board; otherwise the role must match the area.
  if (area && session.role !== "manager" && session.role !== area.role) {
    return redirectToLogin(request, loginPath);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, loginPath: string) {
  const url = request.nextUrl.clone();
  const target = url.pathname + url.search;
  url.pathname = loginPath;
  url.search =
    target && target !== loginPath ? `?next=${encodeURIComponent(target)}` : "";
  return NextResponse.redirect(url);
}
