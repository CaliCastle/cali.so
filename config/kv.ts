export const kvKeys = {
  totalPageViews: 'total_page_views',
  lastVisitor: 'last_visitor',
  currentVisitor: 'current_visitor',
  postViews: (id: string) => `post:views:${id}`,
  postReactions: (id: string) => `post:reactions:${id}`,
} as const
