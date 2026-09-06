import { NextResponse, type NextRequest } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const PUBLIC_FILES = /\.(?:png|jpg|jpeg|svg|ico|css|js)$/;

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || PUBLIC_FILES.test(pathname)) return NextResponse.next();
  try {
    const status = await fetch(`${apiUrl}/api/store/status`, { cache: "no-store", signal: AbortSignal.timeout(1_500) }).then((response) => response.json() as Promise<{ onboarded: boolean }>);
    if (!status.onboarded && pathname !== "/onboarding") return NextResponse.rewrite(new URL("/onboarding", request.url));
    if (status.onboarded && pathname === "/onboarding") return NextResponse.redirect(new URL("/", request.url));
  } catch { /* API may be starting; keep the public shell available. */ }
  const subdomain = hostname.split(".").length > 2 ? hostname.split(".")[0] : undefined;
  if (subdomain && !["www", "localhost"].includes(subdomain) && pathname === "/") return NextResponse.rewrite(new URL(`/categories/${subdomain}`, request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
