import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 días

function resolveSlug(req: NextRequest) {
  const override = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (override) return override
  const host = req.headers.get('host') || ''
  return host.replace(/^admin\./, '')
}

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
  const slug = resolveSlug(req)
  const token = req.cookies.get(COOKIE)?.value

  // Login / reset-password: proxy al API y setear cookie de sesión HttpOnly
  if (pathname === '/api/auth/login' || pathname === '/api/auth/reset-password') {
    let body = ''
    try {
      body = await req.text()
    } catch {}

    const res = await fetch(`${apiUrl}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        'X-Tenant-Slug': slug,
      },
      body,
    })

    const data = await res.json().catch(() => ({}))
    const response = NextResponse.json(data, { status: res.status })
    if (res.ok && data.token) {
      setSessionCookie(response, data.token)
    }
    return response
  }

  // Logout: borrar cookie de sesión
  if (pathname === '/api/auth/logout') {
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
    return response
  }

  // Proxy genérico al API
  const headers = new Headers(req.headers)
  headers.delete('content-length')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('X-Tenant-Slug', slug)

  const hasBody = !['GET', 'HEAD'].includes(req.method)
  const res = await fetch(`${apiUrl}${pathname}${search}`, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
  })

  const response = new NextResponse(res.body, {
    status: res.status,
    headers: res.headers,
  })

  // Refrescar cookie si el API manda un nuevo token
  const newToken = res.headers.get('x-new-token')
  if (newToken) {
    setSessionCookie(response, newToken)
  }

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
