import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value;

  const protectedRoutes = [
    "/dashboard",
    "/my-leagues",
    "/notifications",
    "/profile",
    "/friends",
  ];

  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leagues/:path*",
    "/my-leagues/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/friends/:path*",
  ],
};
