import { withClerkMiddleware } from '@clerk/nextjs/server'

// geo middleware
// export default function middleware(req: NextRequest) {
//   const { nextUrl: url, geo } = req
//   const params = {
//     country: geo?.country || 'US',
//     city: geo?.city || 'Seattle',
//     latitude: geo?.latitude || '47.608013',
//     longitude: geo?.longitude || '-122.335167',
//   }
//
//   Object.entries(params).forEach(([key, value]) => {
//     url.searchParams.set(key, value)
//   })
//
//   return NextResponse.rewrite(url)
// }

export default withClerkMiddleware()

// Stop Middleware running on static files and public folder
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - assets
     * - static
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
    '/',
  ],
}
