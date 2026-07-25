export type PostTransitionElement = 'cover' | 'title'

function postTransitionId(slug: string) {
  switch (slug) {
    case '2023-year-in-review':
      return 'p01'
    case '8-laws-to-a-successful-engineer':
      return 'p02'
    case 'an-ode-to-hao-chen':
      return 'p03'
    case 'do-buttons-need-pointer-cursors':
      return 'p04'
    case 'guide-for-cloning-my-site':
      return 'p05'
    case 'how-to-add-rss-to-your-nextjs-app-router':
      return 'p06'
    case 'how-to-protect-your-site-with-upstash':
      return 'p07'
    case 'im-gonna-be-a-father':
      return 'p08'
    case 'react-or-vue-my-take-on-web-dev':
      return 'p09'
    case 'we-decided-to-stop-buying-saas':
      return 'p10'
    default:
      throw new Error('Unknown post view-transition slug')
  }
}

// View-transition names are CSS identifiers. Keep every stored content key
// behind an explicit allowlist before it reaches an inline style value.
export function postViewTransitionName(
  element: PostTransitionElement,
  slug: string,
) {
  return `${element}-${postTransitionId(slug)}`
}
