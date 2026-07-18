import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { parse } from 'yaml'

const root = new URL('../', import.meta.url)

async function text(path) {
  return readFile(new URL(path, root), 'utf8')
}

async function workflow(name) {
  return parse(await text(`.github/workflows/${name}.yml`))
}

async function action(name) {
  return parse(await text(`.github/actions/${name}/action.yml`))
}

function stepIndex(steps, name) {
  return steps.findIndex((step) => step.name === name)
}

function assertOrdered(steps, before, after) {
  const beforeIndex = stepIndex(steps, before)
  const afterIndex = stepIndex(steps, after)
  assert.notEqual(beforeIndex, -1, `Missing workflow step: ${before}`)
  assert.notEqual(afterIndex, -1, `Missing workflow step: ${after}`)
  assert.ok(beforeIndex < afterIndex, `${before} must run before ${after}`)
}

test('Vercel Git integration cannot race the deployment workflows', async () => {
  const config = JSON.parse(await text('vercel.json'))
  assert.equal(config.git?.deploymentEnabled, false)
})

test('feature pushes branch from Staging, migrate, then deploy Preview', async () => {
  const config = await workflow('deploy-preview')
  assert.deepEqual(config.on.push['branches-ignore'], ['main', 'dev'])
  assert.equal(config.on.pull_request, undefined)
  assert.equal(config.on.pull_request_target, undefined)
  assert.equal(config.concurrency['cancel-in-progress'], false)

  const job = config.jobs.deploy
  assert.equal(job.environment, 'preview')
  assert.match(job.if, /CaliCastle\/cali\.so/)
  assert.match(job.if, /dependabot/)
  assert.equal(config.concurrency.group, 'preview-${{ github.ref_name }}')

  const deploy = job.steps.find((step) => step.name === 'Deploy Preview')
  assert.equal(config.permissions['pull-requests'], 'write')
  assert.equal(deploy.id, 'deployment')
  assert.equal(deploy.uses, './.github/actions/deploy-neon-vercel')
  assert.equal(deploy.with['parent-branch'], 'staging')
  assert.match(deploy.with['branch-name'], /^preview\//)
  assert.equal(deploy.with.target, 'preview')
  const comment = job.steps.find(
    (step) => step.name === 'Comment Preview URL on pull request',
  )
  assert.equal(
    comment.env.DEPLOYMENT_URL,
    '${{ steps.deployment.outputs.deployment-url }}',
  )
  assert.equal(comment.env.GIT_BRANCH, '${{ github.ref_name }}')
  assert.equal(comment.env.COMMIT_SHA, '${{ github.sha }}')
  assert.match(comment.run, /comment-preview-deployment\.mjs/)
  assertOrdered(
    job.steps,
    'Deploy Preview',
    'Comment Preview URL on pull request',
  )
})

test('dev continuously migrates and deploys the persistent Staging environment', async () => {
  const config = await workflow('deploy-staging')
  assert.deepEqual(config.on.push.branches, ['dev'])

  const job = config.jobs.deploy
  assert.equal(job.environment, 'staging')
  assert.equal(job.if, "github.ref == 'refs/heads/dev'")
  const deploy = job.steps.find((step) => step.name === 'Deploy Staging')
  assert.equal(deploy.uses, './.github/actions/deploy-neon-vercel')
  assert.equal(deploy.with['branch-name'], 'staging')
  assert.equal(deploy.with.target, 'staging')
})

test('main uses protected Production credentials and deploys only after migration', async () => {
  const config = await workflow('deploy-production')
  assert.deepEqual(config.on.push.branches, ['main'])

  const review = config.jobs['migration-review']
  assert.equal(review.environment, 'production-migration-review')
  assert.equal(review.env, undefined)

  const job = config.jobs.deploy
  assert.equal(job.needs, 'migration-review')
  assert.equal(job.environment, 'production')
  assert.equal(job.env, undefined)
  assertOrdered(
    job.steps,
    'Enforce expand-only database migrations',
    'Run database migrations',
  )
  assertOrdered(
    job.steps,
    'Run database migrations',
    'Deploy Vercel Production',
  )
  const compatibility = job.steps.find(
    (step) => step.name === 'Enforce expand-only database migrations',
  )
  assert.equal(compatibility.env.BASE_SHA, '${{ github.event.before }}')
  assert.equal(compatibility.env.HEAD_SHA, '${{ github.sha }}')
  assert.match(compatibility.run, /"\$BASE_SHA" "\$HEAD_SHA"/)
  assert.doesNotMatch(compatibility.run, /\$\{\{/)
  const migrate = job.steps.find(
    (step) => step.name === 'Run database migrations',
  )
  assert.equal(
    migrate.env.MIGRATION_DATABASE_URL,
    '${{ secrets.MIGRATION_DATABASE_URL }}',
  )
  const deploy = job.steps.find(
    (step) => step.name === 'Deploy Vercel Production',
  )
  assert.match(deploy.run, /vercel@56\.3\.1 deploy --prod/)
  assert.match(deploy.run, /GITHUB_STEP_SUMMARY/)
  assert.equal(deploy.env.MIGRATION_DATABASE_URL, undefined)
  assert.equal(deploy.env.DATABASE_URL, undefined)
  assert.equal(deploy.env.NEON_API_KEY, undefined)
})

test('release pull requests reject unsafe migrations before merging to main', async () => {
  const config = await workflow('security')
  const job = config.jobs.quality
  const checkout = job.steps.find((step) => step.name === 'Check out repository')
  assert.equal(checkout.with['fetch-depth'], 0)

  const check = job.steps.find(
    (step) => step.name === 'Check Production migration compatibility',
  )
  assert.match(check.if, /github\.base_ref == 'main'/)
  assert.match(check.run, /check-production-migrations\.mjs/)
  assert.equal(check.env.BASE_SHA, '${{ github.event.pull_request.base.sha }}')
  assert.equal(check.env.HEAD_SHA, '${{ github.event.pull_request.head.sha }}')
})

test('branch deletion cleans only ephemeral Neon and Vercel Previews', async () => {
  const config = await workflow('cleanup-preview')
  assert.ok(Object.hasOwn(config.on, 'delete'))
  assert.equal(config.on.pull_request_target, undefined)

  const job = config.jobs.cleanup
  assert.equal(config.concurrency.group, 'preview-${{ github.event.ref }}')
  assert.equal(config.concurrency['cancel-in-progress'], false)
  assert.equal(job.environment, 'preview')
  assert.match(job.if, /ref_type == 'branch'/)
  assert.match(job.if, /github\.event\.ref != 'dev'/)
  assert.match(job.if, /github\.event\.ref != 'main'/)

  const removeNeon = job.steps.find(
    (step) => step.name === 'Delete Neon Preview branch',
  )
  assert.equal(
    removeNeon.uses,
    'neondatabase/delete-branch-action@4468d825d5a88ef4012f1705a82f02ec3072f776',
  )
  assert.match(removeNeon.with.branch, /^preview\//)
  const setupNode = job.steps.find((step) => step.name === 'Set up Node.js')
  assert.equal(
    setupNode.uses,
    'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
  )
  assert.equal(setupNode.with['node-version'], 24)
  assertOrdered(
    job.steps,
    'Set up Node.js',
    'Delete Vercel Preview deployments',
  )
  assert.ok(
    job.steps.some((step) => {
      return (
        step.name === 'Delete Vercel Preview deployments' &&
        step.if === 'always()'
      )
    }),
  )
})

test('manual refresh resets a feature database from Staging before redeploying', async () => {
  const config = await workflow('refresh-preview')
  assert.ok(config.on.workflow_dispatch.inputs.git_branch.required)

  const job = config.jobs.refresh
  assert.equal(config.concurrency.group, 'preview-${{ inputs.git_branch }}')
  assert.equal(config.concurrency['cancel-in-progress'], false)
  assert.equal(job.environment, 'preview')
  const trustedCheckout = job.steps.find(
    (step) => step.name === 'Check out trusted deployment action',
  )
  assert.equal(trustedCheckout.with.ref, 'dev')
  assert.equal(trustedCheckout.with.path, undefined)

  const targetCheckout = job.steps.find(
    (step) => step.name === 'Check out target branch',
  )
  assert.match(targetCheckout.with.ref, /refs\/heads/)
  assert.equal(targetCheckout.with.path, 'target')

  const resolve = job.steps.find((step) => step.name === 'Resolve target commit')
  assert.equal(resolve['working-directory'], 'target')
  const reset = job.steps.find((step) => step.name === 'Refresh Preview')
  assert.equal(config.permissions['pull-requests'], 'write')
  assert.equal(reset.id, 'deployment')
  assert.equal(reset.uses, './.github/actions/deploy-neon-vercel')
  assert.equal(reset.with.reset, true)
  assert.equal(reset.with['working-directory'], 'target')
  assert.match(reset.with['branch-name'], /^preview\//)
  assert.equal(reset.with.target, 'preview')
  const comment = job.steps.find(
    (step) => step.name === 'Comment Preview URL on pull request',
  )
  assert.equal(
    comment.env.DEPLOYMENT_URL,
    '${{ steps.deployment.outputs.deployment-url }}',
  )
  assert.equal(comment.env.GIT_BRANCH, '${{ inputs.git_branch }}')
  assert.equal(comment.env.COMMIT_SHA, '${{ steps.target.outputs.sha }}')
  assert.match(comment.run, /comment-preview-deployment\.mjs/)
  assertOrdered(
    job.steps,
    'Refresh Preview',
    'Comment Preview URL on pull request',
  )
})

test('shared non-production action keeps migration credentials out of Vercel', async () => {
  const config = await action('deploy-neon-vercel')
  const steps = config.runs.steps
  assert.equal(
    config.outputs['deployment-url'].value,
    '${{ steps.vercel.outputs.url }}',
  )
  assert.equal(config.inputs['working-directory'].default, '.')

  const create = steps.find((step) => step.id === 'migration-branch')
  assert.equal(
    create.uses,
    'neondatabase/create-branch-action@fb620d43d4c565abaf088b848a4e28e5c4ea4d9c',
  )
  assert.match(create.with.role, /migration-role/)

  const reset = steps.find((step) => step.id === 'reset-branch')
  assert.equal(
    reset.uses,
    'neondatabase/reset-branch-action@470ab8101095ea33737c294d17364a72fd80761b',
  )
  assert.equal(reset.with.parent, true)

  const runtime = steps.find((step) => step.id === 'runtime-branch')
  assert.match(runtime.with.role, /runtime-role/)
  assertOrdered(steps, 'Run database migrations', 'Deploy to Vercel')

  const deploy = steps.find((step) => step.name === 'Deploy to Vercel')
  assert.equal(deploy.id, 'vercel')
  assert.match(deploy.run, /vercel@56\.3\.1 deploy/)
  assert.match(deploy.run, /--target=/)
  assert.match(deploy.run, /--build-env DATABASE_URL=/)
  assert.match(deploy.run, /--env DATABASE_URL=/)
  assert.doesNotMatch(deploy.run, /MIGRATION_DATABASE_URL/)
  assert.doesNotMatch(deploy.run, /\$\{\{ inputs\.(?:git-ref|target) \}\}/)
  assert.equal(deploy.env.DEPLOY_GIT_REF, '${{ inputs.git-ref }}')
  assert.equal(deploy.env.DEPLOY_TARGET, '${{ inputs.target }}')
  assert.match(deploy.run, /GITHUB_STEP_SUMMARY/)
  for (const stepName of [
    'Install dependencies',
    'Run database migrations',
    'Deploy to Vercel',
  ]) {
    const step = steps.find((candidate) => candidate.name === stepName)
    assert.equal(step['working-directory'], '${{ inputs.working-directory }}')
  }
})
