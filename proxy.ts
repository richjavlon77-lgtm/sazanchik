import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/waiter/:path*"],
};

// Public auth endpoints that must render without a session
const PUBLIC = new Set([
  "/admin/login",
  "/admin/api/login",
  "/waiter/login",
  "/waiter/api/login",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.has(pathname)) return NextResponse.next();

  const isWaiterArea = pathname.startsWith("/waiter");
  const loginPath = isWaiterArea ? "/waiter/login" : "/admin/login";

  const token = request.cookies.get(SESSION_COOKIE.name)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) return redirectToLogin(request, loginPath);

  // Role isolation
  if (isWaiterArea) {
    // waiters and managers can view the waiter board
    if (session.role !== "waiter" && session.role !== "manager") {
      return redirectToLogin(request, loginPath);
    }
  } else {
    // /admin requires manager
    if (session.role !== "manager") {
      return redirectToLogin(request, "/admin/login");
    }
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
