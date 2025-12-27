import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Nur für /admin Route prüfen
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Response vorbereiten
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Supabase Client mit Cookie-Handling erstellen
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // User authentifizierung prüfen
  const { data: { user } } = await supabase.auth.getUser()

  // Wenn auf /admin/login oder nicht eingeloggt
  const isLoginPage = request.nextUrl.pathname === '/admin'

  if (!user && !isLoginPage) {
    // Redirect zu Login wenn nicht eingeloggt
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // Wenn eingeloggt, Admin-Rolle prüfen
  if (user && !isLoginPage) {
    const role = user.user_metadata?.role

    if (role !== 'admin') {
      // Kein Admin - redirect zur Homepage
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: '/admin/:path*'
}
