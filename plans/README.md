# Animation plans

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Let the desktop TOC finish closing](001-desktop-toc-close.md) | MEDIUM | DONE |
| 002 | [Limit route motion to pointer-opened posts](002-limit-route-motion-to-post-pointers.md) | HIGH | DONE |
| 003 | [Keep global chrome fixed during post transitions](003-keep-global-chrome-fixed.md) | MEDIUM | DONE |
| 004 | Prove route motion accessibility in the browser (retired with Playwright in `932d321`) | MEDIUM | RETIRED |
| 005 | [Make route motion state explicit](005-make-route-motion-state-explicit.md) | LOW | TODO |
| 006 | [Make preview cards interruptible and share their warm window](006-make-preview-cards-interruptible.md) | MEDIUM | TODO |
| 007 | [Make lightbox keyboard actions instant](007-make-lightbox-keyboard-actions-instant.md) | HIGH | TODO |
| 008 | [Make article-map keyboard actions instant](008-make-article-map-keyboard-actions-instant.md) | HIGH | TODO |

## Recommended execution order

Plan 001 is complete.

Plans 002 and 003 were completed in this order:

1. **002** establishes the input-modality contract: only primary pointer/touch
   post navigation may animate.
2. **003** depends on 002 and moves the settled route focus treatment from the
   document root to route content while keeping global chrome fixed.

Plan 004 must not be recreated. Commit `932d321` intentionally removed its
Playwright plan and suite when browser behavior moved to manual preview review.

Execute the remaining plans in numeric order:

1. **005** makes the route-motion allow-list explicit and fail-closed without
   changing the completed 002/003 behavior.
2. **006** replaces preview-card keyframes and adds one shared 300ms warm
   window. It is independent of 005.
3. **007** makes lightbox keyboard activation and Escape instant.
4. **008** applies the same native click-modality convention to the Motion-owned
   article-map controls while preserving the phone pointer sequence accepted in
   PRs #170 and #172. It is source-independent of 007, but running 007 first
   establishes the interaction-test pattern.
