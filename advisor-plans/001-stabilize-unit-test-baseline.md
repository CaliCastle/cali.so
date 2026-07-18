# Plan 001: Stabilize the canonical unit-test baseline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report instead of improvising. When done,
> update only this plan's status row in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat dc24eb3..HEAD -- vitest.config.ts lib/rate-limit/repository.test.ts .github/workflows/security.yml scripts/deployment-workflows.test.mjs advisor-plans/README.md`
> If any in-scope file changed, compare the excerpts below with live code. A
> status-only change in `advisor-plans/README.md` is expected when an earlier
> plan completed; any meaningful mismatch in this plan's row or another
> in-scope file is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `dc24eb3`, 2026-07-18

## Why this matters

The canonical unit command is concurrency-sensitive: failures move between
otherwise unrelated jsdom and PGlite files and pass when isolated. Deleting
1,000+ lines against that signal would make regressions indistinguishable from
worker starvation. The target is a bounded, repeatable suite without retries
or inflated timeouts, followed by removal of CI steps that rerun the same
Vitest files.

## Current state

`vitest.config.ts:3-8` has no worker bound:

```ts
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'e2e/**', '.claude/**'],
  },
})
```

`package.json:17-31` defines one complete non-live suite plus focused developer
commands:

```json
"test:ama": "vitest run lib/ama && pnpm db:validate",
"test:security": "vitest run lib/security",
"test:unit": "vitest run app components db lib --exclude='**/*.live.test.ts'",
"test:media:catalog": "vitest run lib/media/catalog"
```

`lib/rate-limit/repository.test.ts:23-31` creates and closes a WASM database
for every test:

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

That contradicts the repository fixture contract at
`db/testing/pglite.ts:9-18`, which explains that repeated concurrent WASM
initialization can wedge a worker and provides `usePGliteTestClient` for one
instance per file.

Observed at `dc24eb3`:

- Unrestricted direct Vitest run: 9 of 109 files failed, 17 of 1,012 tests
  failed, all through 5-second test or 10-second hook timeouts.
- One worker with file parallelism disabled: 109 files and 1,012 tests passed
  in 46.08 seconds.
- A separate audit verified two workers twice: 109 files and 1,012 tests passed
  on both runs in about 21.5 seconds after using the shared rate-limit fixture.
- The failing files passed when run alone. This is resource contention, not a
  reason to weaken assertions.

`.github/workflows/security.yml:66-117` runs `pnpm test:unit`, then reruns the
AMA, security, and every non-live Media Vitest subset already covered by that
command. The Node-based migration, deployment, localization, build, audit, and
verification commands are not duplicates and must remain.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Focused DB test | `pnpm exec vitest run lib/rate-limit/repository.test.ts` | 1 file, 3 tests pass |
| Canonical tests | `pnpm test:unit` | 109 files, 1,012 tests pass at this baseline |
| Workflow tests | `pnpm test:deployment` | all Node workflow tests pass |
| CI ownership scan | `rg -n 'run: pnpm (test:unit|db:validate|test:ama|test:security|test:media:)' .github/workflows/security.yml` | exactly `pnpm test:unit` and `pnpm db:validate` after Step 3 |
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Patch check | `git diff --check` | no output, exit 0 |

## Scope

**In scope**:

- `vitest.config.ts`
- `lib/rate-limit/repository.test.ts`
- `.github/workflows/security.yml`
- `scripts/deployment-workflows.test.mjs`
- `advisor-plans/README.md` status row only

**Out of scope**:

- Production rate-limiter code.
- Global `testTimeout`, `hookTimeout`, retries, or per-test timeout increases.
- `db/testing/pglite.ts`; the needed harness already exists.
- Focused `test:ama`, `test:security`, and `test:media:*` package scripts. They
  remain useful locally.
- Live provider suites and credentials.
- Dependency installation or lockfile changes.

## Git workflow

- Branch: `cali/001-stabilize-unit-suite`
- Stage only the in-scope paths.
- Commit: `test: stabilize unit suite concurrency`
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Reuse the per-file PGlite harness

In `lib/rate-limit/repository.test.ts`, replace direct `readFile`, `PGlite`
construction, migration execution, and per-test close with the established
repository pattern:

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

Retain the `PGlite` type import if it remains useful and preserve every rate
limiter assertion unchanged.

**Verify**: `pnpm exec vitest run lib/rate-limit/repository.test.ts` -> one
file and all three tests pass.

### Step 2: Bound Vitest concurrency

Add `maxWorkers: 2` under `test` in `vitest.config.ts`. Add one short comment:
the bound prevents concurrent PGlite and jsdom suites from starving each
other. Do not disable file parallelism and do not raise timeouts.

Run `pnpm test:unit` three consecutive times. Each run must pass all 109 files
and 1,012 tests at this planned baseline. Record the wall times in the commit or
PR description, not in source.

**Verify**:

```bash
for run in 1 2 3; do pnpm test:unit || exit 1; done
```

The loop exits 0. Every run reports 109 passed files and 1,012 passed tests,
with no retry.

### Step 3: Remove only proven CI duplication

In `.github/workflows/security.yml`:

1. Keep `pnpm test:unit`.
2. Replace the `pnpm test:ama` step with `pnpm db:validate`; only its migration
   half is outside the canonical Vitest glob. Rename that workflow step from
   `Test AMA and migrations` to `Validate database migrations` so its label
   describes the command that remains.
3. Remove the separate `pnpm test:security` step.
4. Remove every separate non-live `pnpm test:media:*` step.
5. Keep deployment workflow tests, production migration compatibility,
   localization, dependency audit, build, links, legacy URL, discovery, and
   security-boundary verification.

Do not delete the focused package scripts.

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
This treats `package.json` as a read-only assumption: focused developer scripts
remain present even though the Quality job no longer reruns them.

### Step 4: Protect the deduplicated workflow

Add one test to `scripts/deployment-workflows.test.mjs` that parses the Quality
job and asserts:

- exactly one step runs `pnpm test:unit`;
- one step named `Validate database migrations` runs `pnpm db:validate`;
- no step runs `pnpm test:ama`, `pnpm test:security`, or a command beginning
  with `pnpm test:media:`.

Follow the existing YAML parser and `stepIndex`/`assertOrdered` style in that
file. Do not test raw YAML strings.

**Verify**: `pnpm test:deployment` -> exactly 20 tests pass at this baseline,
including the new assertion.

### Step 5: Run the final scoped verification

Run typecheck and the patch check after the workflow test is green. Inspect the
clean-worktree diff rather than staging unrelated files.

**Verify**:

```bash
pnpm typecheck
git diff --check
git status --short
```

The first two commands exit 0. `git status --short` lists only
`vitest.config.ts`, `lib/rate-limit/repository.test.ts`,
`.github/workflows/security.yml`, `scripts/deployment-workflows.test.mjs`, and
the permitted `advisor-plans/README.md` status edit.

## Test plan

- Preserve all three concurrency assertions in
  `lib/rate-limit/repository.test.ts`.
- Add the workflow ownership test described above.
- Run the canonical suite three times because one passing run is insufficient
  evidence for the observed nondeterminism.
- Do not add snapshots, retries, or timeout-based assertions.

## Done criteria

- [ ] `pnpm exec vitest run lib/rate-limit/repository.test.ts` passes 3 tests.
- [ ] `pnpm test:unit` passes three consecutive times with two workers.
- [ ] `pnpm test:deployment` exits 0.
- [ ] `pnpm typecheck` exits 0.
- [ ] CI runs the canonical Vitest suite once and retains every non-duplicate
      release/security gate.
- [ ] Focused package scripts still exist.
- [ ] No timeout or retry value changed.
- [ ] `git diff --check` exits 0.
- [ ] Only in-scope paths and the plan status row are modified.

## STOP conditions

- Any canonical run still fails after the fixture conversion and two-worker
  cap.
- A failure passes only in isolation. Do not mask it with retries or timeouts.
- Stabilization requires production-source changes.
- A proposed removed CI command covers a file outside the canonical test glob
  or includes a live suite.
- The suite requires more than two workers to remain within the CI timeout.
- The package manager proposes reinstalling or purging `node_modules`; stop and
  report the toolchain mismatch instead of accepting it inside this plan.

## Maintenance notes

New PGlite repository tests should use `usePGliteTestClient`, one instance per
file. Focused scripts remain valid developer tools, but CI should not rerun
suites already owned by `test:unit`.
