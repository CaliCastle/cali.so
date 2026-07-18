import { pathToFileURL } from 'node:url'

const apiVersion = '2022-11-28'

function required(name, value) {
  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function repositoryParts(repository) {
  const [owner, name, ...rest] = repository.split('/')

  if (!owner || !name || rest.length > 0) {
    throw new Error('GITHUB_REPOSITORY must use the owner/repository format')
  }

  return { name, owner }
}

function deploymentUrl(value) {
  const url = new URL(value)

  if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app')) {
    throw new Error('DEPLOYMENT_URL must be an HTTPS vercel.app URL')
  }

  return url.toString()
}

function commitSha(value) {
  if (!/^[0-9a-f]{40}$/i.test(value)) {
    throw new Error('COMMIT_SHA must be a 40-character Git commit SHA')
  }

  return value.toLowerCase()
}

function inlineCode(value) {
  return value.replaceAll('`', '\u02cb')
}

export function previewComment({
  branch,
  commit,
  repository,
  runId,
  serverUrl,
  url,
}) {
  const commitUrl = `${serverUrl}/${repository}/commit/${commit}`
  const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`

  return [
    '<!-- cali-so-preview-deployment -->',
    '## Preview deployment ready',
    '',
    '| Environment | Deployment | Commit |',
    '| :-- | :-- | :-- |',
    `| Preview | [Visit Preview](${url}) | [\`${commit.slice(0, 7)}\`](${commitUrl}) |`,
    '',
    `Branch: \`${inlineCode(branch)}\` · [View deployment logs](${runUrl})`,
  ].join('\n')
}

async function githubRequest({ apiUrl, fetchImpl, path, token }, options = {}) {
  const response = await fetchImpl(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'cali-so-preview-deployment',
      'X-GitHub-Api-Version': apiVersion,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `GitHub API ${response.status} for ${path}: ${details || response.statusText}`,
    )
  }

  if (response.status === 204) {
    return undefined
  }

  return response.json()
}

export async function commentOnPreviewPullRequests(
  {
    apiUrl = 'https://api.github.com',
    branch,
    commit,
    deployment,
    repository,
    runId,
    serverUrl = 'https://github.com',
    token,
  },
  fetchImpl = fetch,
) {
  required('GITHUB_TOKEN', token)
  required('GITHUB_RUN_ID', runId)
  required('GIT_BRANCH', branch)

  const { owner } = repositoryParts(
    required('GITHUB_REPOSITORY', repository),
  )
  const normalizedCommit = commitSha(required('COMMIT_SHA', commit))
  const normalizedDeployment = deploymentUrl(
    required('DEPLOYMENT_URL', deployment),
  )
  const request = (path, options) =>
    githubRequest({ apiUrl, fetchImpl, path, token }, options)
  const query = new URLSearchParams({
    head: `${owner}:${branch}`,
    per_page: '100',
    state: 'open',
  })
  const pullRequests = await request(
    `/repos/${repository}/pulls?${query.toString()}`,
  )

  if (pullRequests.length === 0) {
    console.log(`No open pull request found for ${branch}; skipping comment.`)
    return []
  }

  const body = previewComment({
    branch,
    commit: normalizedCommit,
    repository,
    runId,
    serverUrl,
    url: normalizedDeployment,
  })

  for (const pullRequest of pullRequests) {
    await request(`/repos/${repository}/issues/${pullRequest.number}/comments`, {
      body: JSON.stringify({ body }),
      method: 'POST',
    })
    console.log(
      `Commented on pull request #${pullRequest.number}: ${normalizedDeployment}`,
    )
  }

  return pullRequests.map((pullRequest) => pullRequest.number)
}

async function main() {
  await commentOnPreviewPullRequests({
    apiUrl: process.env.GITHUB_API_URL,
    branch: process.env.GIT_BRANCH,
    commit: process.env.COMMIT_SHA,
    deployment: process.env.DEPLOYMENT_URL,
    repository: process.env.GITHUB_REPOSITORY,
    runId: process.env.GITHUB_RUN_ID,
    serverUrl: process.env.GITHUB_SERVER_URL,
    token: process.env.GITHUB_TOKEN,
  })
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
