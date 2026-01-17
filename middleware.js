import { NextResponse } from 'next/server'

export async function middleware(req) {
  // Protect Admin Routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Check for Supabase auth cookies
    const allCookies = req.cookies.getAll()
    const hasAuthCookie = allCookies.some(cookie => 
      cookie.name.includes('sb-') && cookie.name.includes('auth-token')
    )

    // If no auth cookies found, redirect to home
    if (!hasAuthCookie) {
      const loginUrl = new URL('/', req.url)
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If has auth cookie, let them through
    // The admin layout will do the actual role check client-side
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}