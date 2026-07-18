# Plan 002: Retire the completed Sanity porting tool

> **Executor instructions**: Follow this plan exactly and update only this
> plan's status row in `advisor-plans/README.md` when done. Delete files with
> `trash` or a patch, never `rm`. Stop on any STOP condition.
>
> **Drift check (run first)**:
> `git diff --stat 59a39bc..HEAD -- scripts/port-post.mjs scripts/port-post-render.mjs scripts/port-post.test.mjs package.json README.md docs/handoff.md advisor-plans/README.md`
> If an in-scope source or documentation file changed, compare every excerpt
> and expected reference below with live code. Status-only index changes are
> expected; any meaningful mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none; the canonical suite is stable at this baseline
- **Category**: migration
- **Planned at**: commit `59a39bc`, 2026-07-18

## Why this matters

The three scripts are a one-time bridge from the retired Sanity export to the
current MDX repository. The migration is complete, but current validation docs
still present the bridge as supported tooling. Removing it trims 260 lines and
keeps fork owners from treating a private archive format as part of v3.

## Current state

`scripts/port-post.mjs:1-7` describes the one-shot contract:

```js
// Convert one archived Sanity post (Portable Text) to MDX with colocated
// images: node port-post.mjs <slug> <archive-dir> <repo-content-dir>
import { renderPortableTextBody } from './port-post-render.mjs'
```

Active references remain at:

- `package.json:33`: `test:port-post`;
- `README.md:65`: the release validation list;
- `docs/handoff.md:130`: the current handoff validation list.

`docs/adr/0001-content-as-mdx-in-repo.md` records the completed end state:
Git owns MDX and Sanity is removed after export and migration verification.
The ADR, dated readiness evidence, and published historical articles are
intentional history and must remain.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Reference check | `! rg -n 'test:port-post|scripts/port-post' package.json README.md docs/handoff.md` | no matches after cleanup, exit 0 |
| Localization | `pnpm test:localization` | all tests pass |
| Unit tests | `pnpm test:unit` | all tests pass |
| Build | `pnpm build` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Patch check | `git diff --check` | no output, exit 0 |

## Scope

**Delete**:

- `scripts/port-post.mjs`
- `scripts/port-post-render.mjs`
- `scripts/port-post.test.mjs`

**Modify**:

- `package.json`
- `README.md`
- `docs/handoff.md`
- `advisor-plans/README.md` status row only

**Out of scope**:

- `pnpm-lock.yaml`; no dependency changes are involved.
- `docs/adr/0001-content-as-mdx-in-repo.md`.
- `docs/adr/0003-retire-comments-reactions-guestbook.md`.
- `docs/v3-cutover-readiness.md`, including its dated record that four port
  tests passed.
- The bilingual cloning articles; plan 007 rewrites them.
- Published posts, newsletters, images, link previews, or private archives.

## Git workflow

- Branch: `cali/002-retire-sanity-porter`
- Stage only the listed paths.
- Commit: `chore: retire Sanity port tooling`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Confirm the tool has no current consumer

Search the complete repository for the three script names and `test:port-post`,
excluding only the three deletion candidates plus generated/vendor and advisor
plan directories. If anything beyond the three known active validation
references invokes the tool, stop and report it.

**Verify**:

```bash
test "$(rg -l 'test:port-post|(?:scripts/)?port-post(?:-render|\.test)?\.mjs' \
  . --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  --glob '!advisor-plans/**' --glob '!plans/**' \
  --glob '!scripts/port-post.mjs' \
  --glob '!scripts/port-post-render.mjs' \
  --glob '!scripts/port-post.test.mjs' \
  | sed 's#^\./##' | LC_ALL=C sort | tr '\n' ' ')" = \
  'README.md docs/handoff.md package.json '
test "$(rg -n 'test:port-post|(?:scripts/)?port-post(?:-render|\.test)?\.mjs' \
  . --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  --glob '!advisor-plans/**' --glob '!plans/**' \
  --glob '!scripts/port-post.mjs' \
  --glob '!scripts/port-post-render.mjs' \
  --glob '!scripts/port-post.test.mjs' \
  | wc -l | tr -d ' ')" -eq 3
```

Both assertions exit 0 with no output, proving the active external consumer
set is exactly README, handoff, and package metadata.

### Step 2: Remove active command references

- Remove `test:port-post` from `package.json`.
- Remove `pnpm test:port-post` from the active validation blocks in `README.md`
  and `docs/handoff.md`.
- Preserve historical prose describing v2, Sanity, or a past verification run.

**Verify**:
`! rg -n 'test:port-post|scripts/port-post' package.json README.md docs/handoff.md`
-> no matches, exit 0.

### Step 3: Delete the converter

Delete only the three scripts listed in Scope, using `trash` or a patch. Do not
remove content produced by them.

**Verify**:

```bash
test ! -e scripts/port-post.mjs
test ! -e scripts/port-post-render.mjs
test ! -e scripts/port-post.test.mjs
```

All three commands exit 0.

### Step 4: Prove v3 is independent

Run the localization suite, current deterministic unit suite, typecheck, and
production build.

**Verify**:

```bash
pnpm test:localization
pnpm test:unit
pnpm typecheck
pnpm build
git diff --check
```

All exit 0. Then run:

```bash
git diff --exit-code -- pnpm-lock.yaml
git status --short
```

The lockfile command exits 0 with no output. `pnpm test:unit` reports 107 passed
files and 1,007 passed tests. Status lists only the three script
deletions, `package.json`, `README.md`, `docs/handoff.md`, and the permitted
`advisor-plans/README.md` status edit.

## Test plan

No replacement test is needed because the behavior is intentionally deleted.
The proof is that all current content, localization, runtime tests, and the
production build succeed without the converter.

## Done criteria

- [ ] All three converter files are absent.
- [ ] No active package or maintenance doc advertises the command.
- [ ] Historical ADRs, readiness evidence, and published content remain.
- [ ] `pnpm-lock.yaml` is unchanged.
- [ ] Localization, unit tests, typecheck, and build pass.
- [ ] Only in-scope paths and the plan status row are modified.

## STOP conditions

- Any current content still requires conversion from the private archive.
- A runtime, workflow, or active operations document invokes the tool.
- Removal appears to require erasing ADRs, dated release evidence, or
  published historical content.
- Production, cloud, or private-archive access appears necessary.

## Maintenance notes

Git history preserves the converter. Do not restore it as a permanent command
unless a new, explicitly scoped migration has a real current consumer.
