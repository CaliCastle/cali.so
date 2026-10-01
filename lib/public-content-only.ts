/** Return a not-found response for APIs disabled in the public-only deployment. */
export function publicContentOnlyNotFound() {
  return process.env.PUBLIC_CONTENT_ONLY === 'true'
    ? new Response(null, { status: 404 })
    : null
}
