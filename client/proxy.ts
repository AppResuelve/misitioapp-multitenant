import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname
  const isAdmin = host.startsWith("admin.")

  if (isAdmin && !pathname.startsWith("/admin") && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
    return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url))
  }

  return NextResponse.next()
}
