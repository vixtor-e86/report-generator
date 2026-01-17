import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  
  // Get the session token from cookies
  const token = req.cookies.get('sb-access-token')?.value || 
                req.cookies.get('sb-refresh-token')?.value

  // Protect Admin Routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // If no token, redirect to home
    if (!token) {
      const loginUrl = new URL('/', req.url)
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    try {
      // Get session
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        return NextResponse.redirect(new URL('/', req.url))
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        // Not an admin - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*']
}