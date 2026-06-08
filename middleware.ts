import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page itself to render without a session
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE.name)?.value;
  if (!token) return redirectToLogin(request);

  const session = await verifySessionToken(token);
  if (!session) return redirectToLogin(request);

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  const target = url.pathname + url.search;
  url.pathname = "/admin/login";
  url.search = target ? `?next=${encodeURIComponent(target)}` : "";
  return NextResponse.redirect(url);
}
