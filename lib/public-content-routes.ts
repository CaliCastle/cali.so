// Publishing a post requires adding its directory slug here. The public-route
// proxy, post index, feeds, and sitemap all consume this explicit allowlist.
export const publishedPostSlugs = [
  '2023-year-in-review',
  '8-laws-to-a-successful-engineer',
  'an-ode-to-hao-chen',
  'do-buttons-need-pointer-cursors',
  'guide-for-cloning-my-site',
  'how-to-add-rss-to-your-nextjs-app-router',
  'how-to-protect-your-site-with-upstash',
  'im-gonna-be-a-father',
  'react-or-vue-my-take-on-web-dev',
  'we-decided-to-stop-buying-saas',
] as const

export const archivedNewsletterIds = ['1'] as const

export type ArchivedNewsletterId = (typeof archivedNewsletterIds)[number]

export function isPublishedPostSlug(slug: string) {
  return publishedPostSlugs.some((publishedSlug) => publishedSlug === slug)
}

export function isArchivedNewsletterId(
  id: string,
): id is ArchivedNewsletterId {
  return archivedNewsletterIds.some((knownId) => knownId === id)
}
