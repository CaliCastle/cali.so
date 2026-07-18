# Plan 004: Remove the dormant icon and shape switchboards

> **Executor instructions**: Preserve the exact visible v3 design. This plan
> removes dormant choice machinery; it does not standardize or replace the
> icons that were deliberately hand-picked in current source. Update only this
> plan's status row in `advisor-plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat 59a39bc..HEAD -- lib/icon-map.tsx lib/icon-context.tsx lib/shape-context.tsx types/hugeicons.d.ts components/ui/input-copy.tsx components/ui/tabs.tsx components/ui/tooltip.tsx components/ui/button.tsx package.json pnpm-lock.yaml advisor-plans/README.md`
> Compare every changed source/dependency file with the excerpts and exact
> fallback inventory below. A status-only index change from completed plans is
> expected; any meaningful mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `advisor-plans/003-remove-unreachable-v3-residue.md`
- **Category**: tech-debt
- **Planned at**: commit `59a39bc`, 2026-07-18

## Why this matters

The current site hand-picks icons through direct imports, but the initial v3
scaffold also shipped a five-family icon switchboard and a two-style radius
switchboard. Neither provider is mounted, so their interfaces can never be
used and every live caller silently receives the fallback. Removing them cuts
853 lines (845 in the switchboards and 8 in the type shim), five unused
dependency entries, two unreachable global-shortcut listeners, and a
hypothetical seam with no adapters.

The target is a visual no-op: current direct icon choices stay untouched, the
remaining copy glyph becomes one direct import, and the rendered pill geometry
stays byte-for-byte equivalent in class values.

## Current state

All three switchboard files were added and last touched by commit `1b186777` on
2026-07-10. They have no later design-history commits.

`lib/icon-context.tsx:43-49` falls back to Lucide when no provider exists:

```tsx
function useIcon(name: IconName): IconComponent {
  const ctx = useContext(IconContext)
  if (!ctx) return iconMap.lucide[name]
  return iconMap[ctx.iconLibrary][name]
}
```

`lib/icon-context.tsx:76-90` would cycle libraries on global `I`, but only if
`IconProvider` were mounted. It is not mounted.

`lib/shape-context.tsx:69-72` similarly returns the pill fallback:

```tsx
function useShape(): ShapeClasses {
  const ctx = useContext(ShapeContext)
  if (!ctx) return shapeMap.pill
  return ctx.classes
}
```

Its unmounted provider would cycle pill/rounded geometry on global `R`.

After plan 003, live consumers are only:

- `components/ui/input-copy.tsx`: `useIcon('copy')` and `shape.input`;
- `components/ui/tabs.tsx`: a structural icon prop plus `shape.container`,
  `shape.bg` twice, and `shape.focusRing`;
- `components/ui/tooltip.tsx`: `shape.bg`;
- `components/ui/button.tsx`: a structural icon prop type.

The exact visible fallback values that must survive are:

| Former lookup | Static target |
| --- | --- |
| copy icon | direct `Copy` import from `lucide-react` |
| `shape.input`, `shape.bg` | `rounded-[20px]` |
| `shape.focusRing` | `rounded-[22px]` |
| `shape.container` | `rounded-3xl` |

The unused package entries are `@tabler/icons-react`,
`@phosphor-icons/react`, `@hugeicons/core-free-icons`, `@hugeicons/react`, and
`@untitledui/icons`. `lucide-react` remains because active files directly
import hand-picked glyphs.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Consumer scan | repository-wide negative scan in Steps 1/5 | no matches after migration, exit 0 |
| Dependency scan | repository-wide negative scan in Step 5 | no removed-family imports |
| Lockfile update | `pnpm install --lockfile-only` | exit 0; only intended dependency graph changes |
| Typecheck | `pnpm typecheck` | exit 0 |
| Unit tests | `pnpm test:unit` | all tests pass |
| Build | `pnpm build` | exit 0 |
| Patch check | `git diff --check` | no output, exit 0 |

## Scope

**Delete**:

- `lib/icon-map.tsx`
- `lib/icon-context.tsx`
- `lib/shape-context.tsx`
- `types/hugeicons.d.ts`

**Modify**:

- `components/ui/input-copy.tsx`
- `components/ui/tabs.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/button.tsx`
- `package.json`
- `pnpm-lock.yaml`
- `advisor-plans/README.md` status row only

**Out of scope**:

- Existing direct icon imports in `components/preferences.tsx`,
  `components/mdx/code-block.tsx`, `components/error-home-action.tsx`, and
  `app/_views/error-page.tsx`.
- Replacing all icons with Lucide or any other family.
- Introducing a new shared icon module, icon registry, radius module, provider,
  keyboard shortcut, or runtime design preference.
- Changing markup, dimensions, colors, shadows, animation, accessibility, or
  Base UI behavior.
- Removing `lucide-react`.

## Git workflow

- Branch: `cali/004-remove-design-switchboards`
- Stage only the listed paths.
- Commit: `refactor: remove design switchboards`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Reconfirm the live surface

After plan 003 is complete, search for every import and provider symbol. If a
provider has become mounted or another live caller exists, stop and update the
plan rather than deleting a real choice.

The exact fallback table and source checks below are the required no-regression
proof. If a named surface is already reachable in the local public UI, an
optional before screenshot may supplement that proof. Do not sign in, create
operator data, or obtain credentials merely to reach protected `InputCopy` or
error states, and do not make inaccessible browser evidence a completion gate.

**Verify**:

```bash
test "$(rg -l 'icon-context|icon-map|shape-context|IconComponent|useIcon|useShape' \
  . --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  --glob '!advisor-plans/**' --glob '!plans/**' \
  --glob '!lib/icon-map.tsx' \
  --glob '!lib/icon-context.tsx' \
  --glob '!lib/shape-context.tsx' \
  --glob '!types/hugeicons.d.ts' \
  | sed 's#^\./##' | LC_ALL=C sort | tr '\n' ' ')" = \
  'components/ui/button.tsx components/ui/input-copy.tsx components/ui/tabs.tsx components/ui/tooltip.tsx '
! rg -n 'IconProvider|ShapeProvider' . --hidden \
  --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  --glob '!advisor-plans/**' --glob '!plans/**' \
  --glob '!lib/icon-context.tsx' --glob '!lib/shape-context.tsx'
```

After plan 003, both commands exit 0 with no output. The expected fallback
values are already listed in Current state.

### Step 2: Localize the two icon prop interfaces

In `components/ui/button.tsx`, replace the imported `IconComponent` type with a
file-local structural `ButtonIcon` type based on `React.ComponentType` and the
props this module actually supplies: `size`, `strokeWidth`, and `className`.

In `components/ui/tabs.tsx`, do the same with a file-local `TabIcon` type. Do
not export either type and do not create a shared icon module. The interface is
local to the module that renders the supplied glyph.

**Verify**: `pnpm typecheck` -> exit 0 before deleting the old type source.
Then
`! rg -n 'IconComponent' components/ui/button.tsx components/ui/tabs.tsx`
returns no matches and exits 0.

### Step 3: Replace fallbacks with their exact visible choices

- In `components/ui/input-copy.tsx`, directly import the currently rendered
  `Copy` glyph from `lucide-react`; remove `useIcon` and render `Copy` directly.
- Replace `shape.input` with `rounded-[20px]`.
- In `components/ui/tooltip.tsx`, replace `shape.bg` with
  `rounded-[20px]`.
- In `components/ui/tabs.tsx`, replace all four shape occurrences:
  `shape.container` once with `rounded-3xl`, both `shape.bg` occurrences with
  `rounded-[20px]`, and `shape.focusRing` once with `rounded-[22px]`.
- Remove the unused hooks and imports. Do not alter any other class token.

**Verify**:

```bash
test "$(rg -o 'rounded-\[20px\]' components/ui/input-copy.tsx components/ui/tabs.tsx components/ui/tooltip.tsx | wc -l | tr -d ' ')" = 4
test "$(rg -o 'rounded-\[22px\]' components/ui/tabs.tsx | wc -l | tr -d ' ')" = 1
test "$(rg -o 'rounded-3xl' components/ui/tabs.tsx | wc -l | tr -d ' ')" = 1
rg -q '^import \{ Copy \} from "lucide-react";$' components/ui/input-copy.tsx
! rg -n 'useIcon|useShape|IconComponent|~/lib/(icon-context|icon-map|shape-context)' \
  components/ui/input-copy.tsx components/ui/tabs.tsx \
  components/ui/tooltip.tsx components/ui/button.tsx
pnpm typecheck
```

All commands exit 0 with no output. The exact counts prove the six former
shape occurrences became four 20px tokens, one 22px token, and one 3xl token.

### Step 4: Remove the hypothetical seams and dependencies

Delete the four switchboard/type-shim files with `trash` or a patch. Remove the
five unused dependency entries from `package.json`, retain `lucide-react`, and
regenerate only the lockfile with `pnpm install --lockfile-only`.

Inspect the lockfile diff. It should remove the five direct packages and
transitive packages no longer reachable from another dependency; it must not
upgrade unrelated versions.

**Verify**:

```bash
test ! -e lib/icon-map.tsx
test ! -e lib/icon-context.tsx
test ! -e lib/shape-context.tsx
test ! -e types/hugeicons.d.ts
pnpm install --lockfile-only
pnpm install --lockfile-only --frozen-lockfile
! rg -n '@tabler/icons-react|@phosphor-icons/react|@hugeicons|@untitledui/icons' \
  package.json pnpm-lock.yaml
rg -q '"lucide-react"' package.json
node --input-type=module <<'NODE'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const before = JSON.parse(
  execFileSync('git', ['show', 'HEAD:package.json'], { encoding: 'utf8' }),
)
for (const name of [
  '@tabler/icons-react',
  '@phosphor-icons/react',
  '@hugeicons/core-free-icons',
  '@hugeicons/react',
  '@untitledui/icons',
]) {
  delete before.dependencies[name]
}
const after = JSON.parse(readFileSync('package.json', 'utf8'))
assert.deepEqual(after, before)
NODE
if git diff --unified=0 -- pnpm-lock.yaml \
  | rg -q --pcre2 '^\+(?!\+\+\+)'; then
  exit 1
fi
```

All commands exit 0 with no output. `package.json` differs only by the five
named removals and the lockfile has deletions only; any added lockfile line is
an unrelated rewrite/upgrade and a STOP condition.

### Step 5: Verify behavior and visible geometry

Run the full mechanical gates. If Step 1 captured a locally reachable public
surface, compare it at the same width as optional supporting evidence. The
static class/import assertions remain the authoritative proof for protected or
otherwise inaccessible surfaces. Pressing `I` or `R` must continue to have no
application behavior; there is now no listener source for either experiment.

**Verify**:

```bash
! rg -n 'icon-context|icon-map|shape-context|IconProvider|ShapeProvider|useIcon|useShape' \
  . --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  --glob '!advisor-plans/**' --glob '!plans/**'
! rg -n '@tabler/icons-react|@phosphor-icons/react|@hugeicons|@untitledui/icons' \
  . --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  --glob '!advisor-plans/**' --glob '!plans/**'
git diff --exit-code -- app/_views/error-page.tsx \
  components/error-home-action.tsx components/mdx/code-block.tsx \
  components/preferences.tsx
pnpm typecheck
pnpm test:unit
pnpm build
git diff --check
```

All commands exit 0. The first two scans and direct-icon diff print nothing;
the unit suite reports 107 passed files and 1,007 passed tests. The exact source
proof shows that radii remain 20px, 22px, and `rounded-3xl` at the same ownership
points, and the copy glyph remains Lucide `Copy` at size 14/stroke 1.5.
`git status --short` may list only the four deletions, four UI modules,
package/lockfile, and permitted index edit.

## Test plan

- Existing typecheck validates direct icon component compatibility.
- Only `app/error-pages.test.tsx` currently renders the structural Button icon
  path. No existing unit test renders Preferences/Tabs, InputCopy, or Tooltip;
  do not claim coverage they do not provide.
- Use the exact source counts and import assertion for radii and glyph
  preservation. Optional browser evidence may supplement them when a surface is
  already locally reachable. Do not add a brittle snapshot whose only assertion
  is a long Tailwind class string.
- Static absence commands below are part of the test plan because the intended
  behavior is deletion of an unreachable choice.

## Done criteria

- [ ] The four switchboard/type-shim files are absent.
- [ ] The repository-wide Step 5 switchboard scan exits 0 with no output.
- [ ] The repository-wide Step 5 removed-family scan exits 0 with no output.
- [ ] Static token counts are exactly four `rounded-[20px]`, one
      `rounded-[22px]`, and one `rounded-3xl` across the scoped UI files.
- [ ] Existing direct, hand-picked icon imports are unchanged except the new
      direct copy glyph.
- [ ] `lucide-react` remains installed.
- [ ] `pnpm typecheck`, `pnpm test:unit`, and `pnpm build` exit 0.
- [ ] `git diff --check` exits 0.
- [ ] Lockfile diff contains no unrelated upgrade.

No protected-route sign-in or provider data is required to complete this plan.

## STOP conditions

- `IconProvider` or `ShapeProvider` is now mounted.
- A new live caller depends on runtime switching.
- Preserving current visuals requires changing a class beyond the exact
  fallback substitutions listed above.
- Lockfile regeneration upgrades unrelated packages or requires changing the
  declared pnpm version.
- A verification command attempts an automatic dependency reinstall because
  the available pnpm toolchain does not match `packageManager`.

## Maintenance notes

Future icons remain deliberate direct imports in the file that uses them.
Future radius changes should edit the owning UI module or the documented design
tokens, not recreate a runtime comparison switchboard without a real product
requirement.
