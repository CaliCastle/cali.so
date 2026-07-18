import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  commentOnPreviewPullRequests,
  previewComment,
} from './comment-preview-deployment.mjs'

const deployment = {
  branch: 'cali/preview-comments',
  commit: '0123456789abcdef0123456789abcdef01234567',
  deployment: 'https://cali-so-example.vercel.app',
  repository: 'CaliCastle/cali.so',
  runId: '123456',
  token: 'test-token',
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

test('Preview comment links the deployment, commit, and workflow run', () => {
  const body = previewComment({
    branch: deployment.branch,
    commit: deployment.commit,
    repository: deployment.repository,
    runId: deployment.runId,
    serverUrl: 'https://github.com',
    url: `${deployment.deployment}/`,
  })

  assert.match(body, /Preview deployment ready/)
  assert.match(body, /\[Visit Preview\]\(https:\/\/cali-so-example\.vercel\.app\/\)/)
  assert.match(
    body,
    /\[`0123456`\]\(https:\/\/github\.com\/CaliCastle\/cali\.so\/commit\//,
  )
  assert.match(
    body,
    /\[View deployment logs\]\(https:\/\/github\.com\/CaliCastle\/cali\.so\/actions\/runs\/123456\)/,
  )
})

test('Successful Preview updates or creates one comment per pull request', async () => {
  const requests = []
  const fetchImpl = async (url, options) => {
    requests.push({ options, url })

    if (options.method === 'PATCH' || options.method === 'POST') {
      return jsonResponse({ id: requests.length }, 201)
    }

    if (url.includes('/pulls?')) {
      return jsonResponse([{ number: 174 }, { number: 175 }])
    }

    if (url.includes('/issues/174/comments?')) {
      return jsonResponse([
        {
          body: '<!-- cali-so-preview-deployment -->\nOld deployment',
          id: 5011960335,
          user: { login: 'github-actions[bot]' },
        },
      ])
    }

    return jsonResponse([])
  }

  const numbers = await commentOnPreviewPullRequests(deployment, fetchImpl)

  assert.deepEqual(numbers, [174, 175])
  assert.equal(requests.length, 5)
  assert.match(
    requests[0].url,
    /head=CaliCastle%3Acali%2Fpreview-comments/,
  )
  assert.equal(
    requests[2].url,
    'https://api.github.com/repos/CaliCastle/cali.so/issues/comments/5011960335',
  )
  assert.equal(requests[2].options.method, 'PATCH')
  assert.match(JSON.parse(requests[2].options.body).body, /Visit Preview/)
  assert.equal(
    requests[2].options.headers.Authorization,
    'Bearer test-token',
  )
  assert.match(requests[3].url, /issues\/175\/comments\?/)
  assert.match(requests[4].url, /issues\/175\/comments$/)
  assert.equal(requests[4].options.method, 'POST')
})

test('Successful Preview without an open pull request does not post', async () => {
  const requests = []
  const fetchImpl = async (url, options) => {
    requests.push({ options, url })
    return jsonResponse([])
  }

  const numbers = await commentOnPreviewPullRequests(deployment, fetchImpl)

  assert.deepEqual(numbers, [])
  assert.equal(requests.length, 1)
})

test('Preview comment rejects a non-Vercel deployment URL', async () => {
  await assert.rejects(
    commentOnPreviewPullRequests(
      { ...deployment, deployment: 'https://example.com' },
      () => {
        throw new Error('GitHub should not be called')
      },
    ),
    /DEPLOYMENT_URL must be an HTTPS vercel\.app URL/,
  )
})

test('GitHub API failures fail the comment step with context', async () => {
  await assert.rejects(
    commentOnPreviewPullRequests(deployment, () =>
      Promise.resolve(new Response('permission denied', { status: 403 })),
    ),
    /GitHub API 403.*permission denied/,
  )
})
