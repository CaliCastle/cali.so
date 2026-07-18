# Plan 001: Consolidate unit-test infrastructure

> **Executor instructions**: The canonical command passed three consecutive
> unchanged runs at this baseline, so do not add a worker cap, retry, or timeout.
> This plan still executes two independent cleanup findings: one rate-limit test
> bypasses the shared PGlite fixture, and Quality CI reruns Vitest subsets already
> owned by `test:unit`. Run every Verify gate and update only this plan's status
> row in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 59a39bc..HEAD -- lib/rate-limit/repository.test.ts .github/workflows/security.yml scripts/deployment-workflows.test.mjs advisor-plans/README.md`
> If an in-scope file changed, compare it with the exact ownership and command
> inventory below. A status-only index change from another completed plan is
> expected; any other meaningful mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `59a39bc`, 2026-07-18

## Why this matters

The current suite is stable without a global concurrency override: three
consecutive `pnpm test:unit` runs passed 107 files and 1,007 tests. That rejects
the earlier proposal to set `maxWorkers`, but it does not make the remaining
duplication useful.

`lib/rate-limit/repository.test.ts` still creates a new WASM database before
every test even though the repository fixture owns one migrated PGlite instance
per file and restores its state before each case. Quality CI then runs the full
non-live Vitest glob once and repeats AMA, security, and every non-live Media
subset. Consolidating those paths reduces resource churn and CI time while
preserving every assertion and focused developer command.

## Current state

`lib/rate-limit/repository.test.ts:23-31` creates, migrates, and closes PGlite
for each of its three cases:

```ts
beforeEach(async () => {
  client = new PGlite()
  const migration = await readFile(migrationUrl, 'utf8')
  await client.exec(migration.replaceAll('--> statement-breakpoint', ''))
  now = new Date('2026-07-16T06:00:00.000Z')
})

afterEach(async () => {
  await client.close()
})
```

That contradicts `db/testing/pglite.ts:9-18`, which documents the worker risk
from repeated concurrent WASM initialization and exposes
`usePGliteTestClient()` for one migrated instance per test file.

`.github/workflows/security.yml:66-117` runs `pnpm test:unit`, then reruns:

- `pnpm test:ama`, whose Vitest half is already included but whose
  `pnpm db:validate` half must remain;
- `pnpm test:security`;
- every non-live `pnpm test:media:*` suite.

`package.json` keeps those focused commands for local diagnosis. The Node-based
deployment tests, production migration compatibility, localization, dependency
audit, build, link, legacy URL, discovery, and security-boundary commands are
not duplicates and must remain in Quality.

Historical audit evidence at `dc24eb3` found moving timeout failures under
unrestricted concurrency. At `59a39bc`, the unchanged suite passed three times,
so `vitest.config.ts` is explicitly outside this plan. Reopen concurrency work
only if nondeterminism returns with fresh evidence.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Focused DB test | `pnpm exec vitest run lib/rate-limit/repository.test.ts` | 1 file, 3 tests pass |
| Canonical tests | `pnpm test:unit` | 107 files, 1,007 tests pass at this baseline |
| Workflow tests | `pnpm test:deployment` | 20 tests pass after the new ownership assertion |
| CI ownership scan | focused commands in Step 2 | one canonical Vitest run plus one database validation |
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Patch check | `git diff --check` | no output, exit 0 |

## Scope

**Modify**:

- `lib/rate-limit/repository.test.ts`
- `.github/workflows/security.yml`
- `scripts/deployment-workflows.test.mjs`
- `advisor-plans/README.md` status row only

**Reference-only**:

- `db/testing/pglite.ts`
- `package.json`
- `vitest.config.ts`

**Out of scope**:

- Production rate-limiter code.
- `vitest.config.ts`, worker counts, file parallelism, timeouts, or retries.
- `db/testing/pglite.ts`; the shared harness already has the required behavior.
- Focused `test:ama`, `test:security`, and `test:media:*` package scripts.
- Live provider suites and credentials.
- Dependency installation or lockfile changes.

## Git workflow

- Branch: `cali/001-consolidate-unit-infrastructure`
- Stage only the exact Modify paths.
- Commit: `test: consolidate unit infrastructure`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Reuse the per-file PGlite harness

In `lib/rate-limit/repository.test.ts`, remove the direct `readFile`, migration
URL, per-test `PGlite` construction, and per-test close. Reuse the established
fixture without changing any rate-limit assertion:

```ts
import { usePGliteTestClient } from '~/db/testing/pglite'

describe('database rate limiter', () => {
  const getClient = usePGliteTestClient(['0010_rate_limit_windows.sql'])
  let client: PGlite
  let now: Date

  beforeEach(() => {
    client = getClient()
    now = new Date('2026-07-16T06:00:00.000Z')
  })
})
```

Retain the `PGlite` type import, remove the now-unused `afterEach` import, and
preserve all three test names, clocks, prefixes, inputs, and expected results.

**Verify**:

```bash
pnpm exec vitest run lib/rate-limit/repository.test.ts
! rg -n 'new PGlite|readFile|migrationUrl|afterEach' \
  lib/rate-limit/repository.test.ts
git diff --exit-code -- db/testing/pglite.ts
```

All commands exit 0. The focused run reports one file and three tests; the
negative scan and reference-only diff print nothing.

### Step 2: Remove only proven CI duplication

In `.github/workflows/security.yml`:

1. Keep the single `pnpm test:unit` step.
2. Replace `pnpm test:ama` with `pnpm db:validate`; only its migration half is
   outside the canonical Vitest glob. Rename the step from
   `Test AMA and migrations` to `Validate database migrations`.
3. Remove the separate `pnpm test:security` step.
4. Remove every separate non-live `pnpm test:media:*` step.
5. Keep deployment workflow tests, production migration compatibility,
   localization, dependency audit, build, links, legacy URLs, discovery, and
   security-boundary verification.

Do not remove or change the focused commands in `package.json`.

**Verify**:

```bash
test "$(rg -c 'run: pnpm test:unit' .github/workflows/security.yml)" -eq 1
test "$(rg -c 'run: pnpm db:validate' .github/workflows/security.yml)" -eq 1
! rg -n 'run: pnpm test:(ama|security|media:)' .github/workflows/security.yml
for command in \
  'pnpm test:deployment' \
  'pnpm test:localization' \
  'pnpm audit:prod' \
  'pnpm build' \
  'pnpm verify:links' \
  'pnpm verify:legacy-urls' \
  'pnpm verify:public-discovery' \
  'pnpm verify:security-boundary'
do
  rg -qF "run: $command" .github/workflows/security.yml || exit 1
done
rg -qF 'run: node scripts/check-production-migrations.mjs "$BASE_SHA" "$HEAD_SHA"' \
  .github/workflows/security.yml
node --input-type=module <<'NODE'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const { scripts } = JSON.parse(await readFile('package.json', 'utf8'))
for (const name of [
  'test:ama',
  'test:security',
  'test:media:catalog',
  'test:media:geocoding',
  'test:media:alt-text',
  'test:media:admin',
  'test:media:asset-review',
  'test:media:ingestion',
  'test:media:photo-selection',
  'test:media:processing',
  'test:media:purge',
  'test:media:reconciliation',
  'test:media:storage',
]) {
  assert.equal(typeof scripts[name], 'string', `missing ${name}`)
}
NODE
```

Every command exits 0. The no-match scan and Node assertion print nothing.

### Step 3: Protect the deduplicated workflow

Add one test to `scripts/deployment-workflows.test.mjs` that parses the Quality
job and asserts:

- exactly one step runs `pnpm test:unit`;
- one step named `Validate database migrations` runs `pnpm db:validate`;
- no step runs `pnpm test:ama`, `pnpm test:security`, or a command beginning
  with `pnpm test:media:`;
- every non-Vitest Quality command listed in Step 2 remains in its current
  relative order.

Follow the existing YAML parser and `stepIndex`/`assertOrdered` style. Do not
test raw YAML strings.

**Verify**: `pnpm test:deployment` -> exactly 20 tests pass at this baseline,
including the new Quality ownership assertion.

### Step 4: Run the final scoped verification

Run the canonical suite once after the focused fixture test and workflow test
are green. A worker-cap experiment is not part of this verification.

**Verify**:

```bash
pnpm test:unit
pnpm typecheck
git diff --check
git diff --exit-code -- vitest.config.ts db/testing/pglite.ts package.json \
  pnpm-lock.yaml
git status --short
```

The first four commands exit 0. `pnpm test:unit` reports 107 files and 1,007
tests. Status lists only the three modified implementation/test paths plus the
permitted `advisor-plans/README.md` status edit.

## Test plan

- Preserve all three rate-limit assertions while moving setup to the shared
  per-file fixture.
- Add the parsed workflow ownership test described above.
- Run the canonical suite once; the unchanged baseline already passed three
  consecutive pre-plan runs without a worker cap.
- Keep focused package scripts as local diagnostic entry points.
- Do not add snapshots, retries, timeouts, or concurrency configuration.

## Done criteria

- [ ] The rate-limit repository test uses `usePGliteTestClient` and passes all
      three cases.
- [ ] CI runs the canonical non-live Vitest suite once and retains database
      validation plus every non-duplicate release/security gate.
- [ ] Focused package scripts remain unchanged.
- [ ] `pnpm test:deployment` reports 20 passing tests.
- [ ] `pnpm test:unit` reports 107 files and 1,007 tests.
- [ ] `pnpm typecheck` and `git diff --check` exit 0.
- [ ] No worker, timeout, retry, dependency, or production source changed.
- [ ] Only exact Modify paths and the status row are changed.

## STOP conditions

- The shared PGlite fixture cannot preserve all three exact rate-limit cases.
- The canonical suite fails after the fixture-only test change.
- A proposed removed CI command owns tests outside the canonical non-live glob,
  includes a live suite, or performs non-Vitest validation.
- A non-duplicate Quality command or focused package script would be removed.
- Completion requires a worker cap, retry, timeout, dependency, or production
  source change. Report fresh evidence and plan that work separately.
- The available pnpm toolchain does not match the declared package manager.

## Maintenance notes

New PGlite repository tests should use `usePGliteTestClient`, one instance per
file. Focused scripts remain valid developer tools, but Quality should not rerun
suites already owned by `test:unit`.
