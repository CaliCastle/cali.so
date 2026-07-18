# Plan 003: Remove unreachable v3 modules and artifacts

> **Executor instructions**: This is a deletion-only plan. Repeat the reference
> checks before deleting, use `trash` or a patch rather than `rm`, and stop if
> any candidate has acquired a consumer. Update only this plan's status row in
> `advisor-plans/README.md` when done.
>
> **Drift check (run first)**:
> `git diff --stat dc24eb3..HEAD -- components/site-frame.tsx components/ui/dropdown.tsx components/ui/select.tsx components/ui/menu-item.tsx lib/ama/cookies.ts lib/springs.ts anims.json public/images/portrait.jpg advisor-plans/README.md`
> Compare any changed candidate with the excerpts and reachability inventory
> below. A status-only index change from a completed dependency is expected;
> any meaningful source or artifact mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `advisor-plans/001-stabilize-unit-test-baseline.md`
- **Category**: tech-debt
- **Planned at**: commit `dc24eb3`, 2026-07-18

## Why this matters

Six unreachable source modules add exactly 1,490 lines of interface and
implementation that no caller can exercise. The one-line `anims.json` and
91,893-byte portrait add more repository noise. Removing them improves locality and makes later
switchboard cleanup smaller without changing runtime behavior.

These are July 2026 v3 experiments, not unchanged v2 application source. The
completed v2 migration residue is handled separately in plan 002.

## Current state

- `components/site-frame.tsx:5-27` exports `SiteFrame`, but no importer exists.
  Its shell responsibility is actively owned by
  `app/_components/site-document.tsx:45-103`.
- `components/ui/dropdown.tsx`, `components/ui/select.tsx`, and
  `components/ui/menu-item.tsx` export unused UI systems. Their only internal
  edge is dropdown importing menu-item.
- `lib/ama/cookies.ts:1-14` exports `readRequestCookie`; no caller exists.
- `lib/springs.ts:1-31` exports `spring` and `exitFallbackMs`; no caller exists.
- No source or config references `anims.json`.
- No source references `public/images/portrait.jpg`.
- `app/_views/home-page.tsx:47-50` deliberately uses `headshot.jpg` and
  `portrait-square.jpg`; those are not deletion candidates.

The deletion test passes: removing these modules concentrates no complexity in
callers because no caller crosses their interfaces.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Reference scan | focused `rg` command in Step 1 | no external consumers |
| Typecheck | `pnpm typecheck` | exit 0 |
| Unit tests | `pnpm test:unit` | all tests pass |
| Build | `pnpm build` | exit 0 |
| Patch check | `git diff --check` | exit 0 |

## Scope

**Delete and only delete**:

- `components/site-frame.tsx`
- `components/ui/dropdown.tsx`
- `components/ui/select.tsx`
- `components/ui/menu-item.tsx`
- `lib/ama/cookies.ts`
- `lib/springs.ts`
- `anims.json`
- `public/images/portrait.jpg`

The only other permitted edit is this plan's status row in
`advisor-plans/README.md`.

**Out of scope**:

- Any replacement module or refactor.
- Package or lockfile changes.
- `headshot.jpg`, `portrait-square.jpg`, avatars, content images, archives,
  legacy URL contracts, migrations, or snapshots.
- Icon and shape switchboard files; plan 004 owns them after these dead
  consumers are gone.

## Git workflow

- Branch: `cali/003-remove-unreachable-residue`
- Stage the eight deletions explicitly.
- Commit: `chore: remove unreachable v3 residue`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Repeat the reachability proof

Run both path and symbol searches with every candidate file excluded:

```bash
! rg -n 'site-frame|ui/dropdown|ui/select|ui/menu-item|ama/cookies|lib/springs|anims\.json|images/portrait\.jpg' \
  . --hidden --glob '!.git/**' --glob '!advisor-plans/**' --glob '!plans/**' \
  --glob '!components/site-frame.tsx' \
  --glob '!components/ui/dropdown.tsx' \
  --glob '!components/ui/select.tsx' \
  --glob '!components/ui/menu-item.tsx' \
  --glob '!lib/ama/cookies.ts' \
  --glob '!lib/springs.ts'
! rg -n 'SiteFrame|readRequestCookie|exitFallbackMs|spring\(' \
  . --hidden --glob '!.git/**' --glob '!advisor-plans/**' --glob '!plans/**' \
  --glob '!components/site-frame.tsx' \
  --glob '!components/ui/dropdown.tsx' \
  --glob '!components/ui/select.tsx' \
  --glob '!components/ui/menu-item.tsx' \
  --glob '!lib/ama/cookies.ts' \
  --glob '!lib/springs.ts'
test "$(rg -c 'ui/menu-item' components/ui/dropdown.tsx)" -eq 1
```

**Verify**: all three commands exit 0 with no output. The first two prove no
external path/symbol consumer; the last proves the one known internal
dropdown-to-menu-item edge still exists before both modules are deleted.

### Step 2: Delete only the proven residue

Delete the eight listed files with `trash` or a patch. Do not edit callers,
because there should be none.

**Verify**:

```bash
test ! -e components/site-frame.tsx
test ! -e components/ui/dropdown.tsx
test ! -e components/ui/select.tsx
test ! -e components/ui/menu-item.tsx
test ! -e lib/ama/cookies.ts
test ! -e lib/springs.ts
test ! -e anims.json
test ! -e public/images/portrait.jpg
```

Every command exits 0.

### Step 3: Verify the import graph and build

Repeat the two exact excluded-candidate scans from Step 1, then run the
canonical verification gates.

**Verify**:

```bash
! rg -n 'site-frame|ui/dropdown|ui/select|ui/menu-item|ama/cookies|lib/springs|anims\.json|images/portrait\.jpg' \
  . --hidden --glob '!.git/**' --glob '!advisor-plans/**' --glob '!plans/**'
! rg -n 'SiteFrame|readRequestCookie|exitFallbackMs|spring\(' \
  . --hidden --glob '!.git/**' --glob '!advisor-plans/**' --glob '!plans/**'
pnpm typecheck
pnpm test:unit
pnpm build
git diff --check
git diff --name-status -- \
  components/site-frame.tsx components/ui/dropdown.tsx \
  components/ui/select.tsx components/ui/menu-item.tsx \
  lib/ama/cookies.ts lib/springs.ts anims.json public/images/portrait.jpg \
  | awk '$1 != "D" { exit 1 } { count++ } END { if (count != 8) exit 1 }'
```

All commands exit 0. The absence scans and `awk` print nothing;
`pnpm test:unit` reports 109 passed files and 1,012 passed tests. Finally,
`git status --short` may show only the eight deletions and the permitted
`advisor-plans/README.md` status edit.

## Test plan

No new behavior test is appropriate for unreachable code. Typecheck and build
prove no static or generated import remains; the deterministic unit suite
protects active behavior. The pre-deletion reference check is mandatory because
reachability can drift faster than a plan.

## Done criteria

- [ ] All eight candidates are absent.
- [ ] No external path, symbol, registry, or dynamic-import consumer exists.
- [ ] No package or lockfile changed.
- [ ] Typecheck, unit tests, build, and patch check pass.
- [ ] No adjacent asset, archive, migration, or compatibility contract changed.

## STOP conditions

- Any candidate is imported through a registry, dynamic import, generated
  path, current test, or runtime caller.
- Deletion requires editing or replacing behavior.
- Verification identifies a live responsibility in one of the files.
- Cleanup appears to require dependency removal outside this plan.

## Maintenance notes

If one of these interfaces is needed later, design it against the current use
case and v3 design language. Do not restore a large unused experiment wholesale.
