import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/reset-password'
  // Only allow relative paths to prevent open redirect
  const next = nextParam.startsWith('/') ? nextParam : '/reset-password'

  if (!code) return NextResponse.redirect(`${origin}/login`)

  // Pass code to client so the browser Supabase client can exchange it.
  // Server-side exchange sets httpOnly cookies the browser client can't read.
  return NextResponse.redirect(`${origin}${next}?code=${code}`)
}
