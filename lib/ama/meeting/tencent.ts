import 'server-only'

import {
  MeetingProviderError,
  type MeetingCreateInput,
  type MeetingCreateResult,
  type MeetingProviderAdapter,
} from './types'

const MCP_PROTOCOL_VERSION = '2025-03-26'
const TENCENT_SKILL_VERSION = 'v1.0.11'
const DEFAULT_TIMEOUT_MS = 8000
const MAX_SEARCH_DEPTH = 4

const SCHEDULE_TOOL_PATTERN = /^schedule[-_]?meeting$/i
const CREATE_TOOL_PATTERN = /create/i
const CANCEL_TOOL_PATTERN = /cancel|delete|dismiss/i
const MEETING_TOOL_PATTERN = /meeting|room/i
const MEETING_URL_KEY_PATTERN = /join_?url|meeting_?url|url|link/i
const MEETING_ID_KEY_PATTERN = /meeting_?id|meeting_?code|room_?id/i
const FALLBACK_URL_PATTERN = /https:\/\/meeting\.tencent\.com\/[^\s"')]+/

type TencentMeetingAdapterDependencies = {
  url: string
  token: string
  fetch: typeof fetch
  clock?: { now(): Date }
  timeoutMs?: number
}

type DiscoveredTool = {
  name: string
  properties: Record<string, unknown>
  required: string[]
}

const CLIENT_INFO = { os: 'server', agent: 'cali.so', model: 'server' } as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function providerUnavailable(): never {
  throw new MeetingProviderError(
    'provider_unavailable',
    'Tencent Meeting is temporarily unavailable.',
  )
}

function invalidResponse(): never {
  throw new MeetingProviderError(
    'invalid_response',
    'Tencent Meeting returned an invalid response.',
  )
}

const TENCENT_MEETING_DOMAINS = ['meeting.tencent.com', 'voovmeeting.com']

function isTencentMeetingUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  return TENCENT_MEETING_DOMAINS.some(
    (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`),
  )
}

function findMeetingUrl(value: unknown, depth: number): string | null {
  if (depth > MAX_SEARCH_DEPTH) return null
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findMeetingUrl(entry, depth + 1)
      if (found) return found
    }
    return null
  }
  if (!isRecord(value)) return null
  for (const [key, entry] of Object.entries(value)) {
    if (
      MEETING_URL_KEY_PATTERN.test(key) &&
      typeof entry === 'string' &&
      isTencentMeetingUrl(entry)
    ) {
      return entry
    }
  }
  for (const entry of Object.values(value)) {
    const found = findMeetingUrl(entry, depth + 1)
    if (found) return found
  }
  return null
}

function findMeetingId(value: unknown, depth: number): string | null {
  if (depth > MAX_SEARCH_DEPTH) return null
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findMeetingId(entry, depth + 1)
      if (found) return found
    }
    return null
  }
  if (!isRecord(value)) return null
  for (const [key, entry] of Object.entries(value)) {
    if (!MEETING_ID_KEY_PATTERN.test(key)) continue
    if (typeof entry === 'string' && entry) return entry
    if (typeof entry === 'number' && Number.isFinite(entry))
      return String(entry)
  }
  for (const entry of Object.values(value)) {
    const found = findMeetingId(entry, depth + 1)
    if (found) return found
  }
  return null
}

function formatTimeArgument(schema: unknown, value: Date): number | string {
  if (isRecord(schema)) {
    if (schema.type === 'integer' || schema.type === 'number') {
      return Math.floor(value.getTime() / 1000)
    }
  }
  const shifted = new Date(value.getTime() + 8 * 60 * 60 * 1000)
  const pad = (part: number) => String(part).padStart(2, '0')
  return (
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-` +
    `${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:` +
    `${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}+08:00`
  )
}

function buildCreateArguments(
  properties: Record<string, unknown>,
  input: MeetingCreateInput,
): Record<string, unknown> {
  const keys = Object.keys(properties)
  const args: Record<string, unknown> = { _client_info: CLIENT_INFO }
  const subjectKey = keys.find((key) => /subject|topic|title|name/i.test(key))
  if (subjectKey) args[subjectKey] = input.subject
  const startKey = keys.find((key) => /start/i.test(key))
  if (startKey)
    args[startKey] = formatTimeArgument(properties[startKey], input.startsAt)
  const endKey = keys.find((key) => /end/i.test(key))
  if (endKey) {
    args[endKey] = formatTimeArgument(properties[endKey], input.endsAt)
  } else {
    const durationKey = keys.find((key) => /duration|length/i.test(key))
    if (durationKey) {
      args[durationKey] = Math.round(
        (input.endsAt.getTime() - input.startsAt.getTime()) / 60_000,
      )
    }
  }
  return args
}

function hasSupportedRequiredArguments(tool: DiscoveredTool) {
  return tool.required.every(
    (key) =>
      key === '_client_info' ||
      /subject|topic|title|name/i.test(key) ||
      /start|end|duration|length/i.test(key),
  )
}

function buildCancelArguments(
  properties: Record<string, unknown>,
  providerMeetingId: string,
): Record<string, unknown> {
  const idKey =
    Object.keys(properties).find((key) =>
      /meeting_?id|meeting_?code|room_?id|^id$/i.test(key),
    ) ?? 'meeting_id'
  return { _client_info: CLIENT_INFO, [idKey]: providerMeetingId }
}

function parseSseMessage(body: string, id: number): Record<string, unknown> {
  const candidates: Record<string, unknown>[] = []
  for (const line of body.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(line.slice('data:'.length).trim())
    } catch {
      continue
    }
    if (isRecord(parsed)) candidates.push(parsed)
  }
  const message =
    candidates.find((candidate) => candidate.id === id) ??
    candidates.find(
      (candidate) => 'result' in candidate || 'error' in candidate,
    )
  if (!message) invalidResponse()
  return message
}

async function readJsonRpcMessage(
  response: Response,
  id: number,
): Promise<Record<string, unknown>> {
  const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
  let body: string
  try {
    body = await response.text()
  } catch {
    invalidResponse()
  }
  if (contentType.includes('application/json')) {
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      invalidResponse()
    }
    if (!isRecord(parsed)) invalidResponse()
    return parsed
  }
  if (contentType.includes('text/event-stream')) {
    return parseSseMessage(body, id)
  }
  invalidResponse()
}

function unwrapResult(message: Record<string, unknown>): unknown {
  if (message.error !== undefined) {
    const code = isRecord(message.error) ? message.error.code : undefined
    throw new MeetingProviderError(
      'invalid_response',
      typeof code === 'number'
        ? `Tencent Meeting returned a provider error (code ${code}).`
        : 'Tencent Meeting returned a provider error.',
    )
  }
  return message.result
}

export function createTencentMeetingAdapter(
  dependencies: TencentMeetingAdapterDependencies,
): MeetingProviderAdapter {
  const timeoutMs = dependencies.timeoutMs ?? DEFAULT_TIMEOUT_MS
  let nextId = 1
  let sessionId: string | null = null
  let sessionPromise: Promise<void> | null = null
  let toolsPromise: Promise<DiscoveredTool[]> | null = null

  async function post(body: Record<string, unknown>): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'X-Tencent-Meeting-Token': dependencies.token,
      'X-Skill-Version': TENCENT_SKILL_VERSION,
      'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
    }
    if (sessionId) headers['Mcp-Session-Id'] = sessionId
    try {
      return await dependencies.fetch(dependencies.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch {
      providerUnavailable()
    }
  }

  async function call(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    const id = nextId++
    const response = await post({ jsonrpc: '2.0', id, method, params })
    if (!response.ok) providerUnavailable()
    return unwrapResult(await readJsonRpcMessage(response, id))
  }

  async function initializeSession(): Promise<void> {
    const id = nextId++
    const response = await post({
      jsonrpc: '2.0',
      id,
      method: 'initialize',
      params: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'cali.so', version: '3.0.0' },
      },
    })
    if (!response.ok) providerUnavailable()
    const session = response.headers.get('mcp-session-id')
    if (session) sessionId = session
    let message: Record<string, unknown>
    try {
      message = await readJsonRpcMessage(response, id)
    } catch {
      providerUnavailable()
    }
    if (message.error !== undefined) providerUnavailable()
    try {
      await post({ jsonrpc: '2.0', method: 'notifications/initialized' })
    } catch {
      // Notification delivery is best-effort; the session is already usable.
    }
  }

  function ensureSession(): Promise<void> {
    sessionPromise ??= initializeSession().catch((error: unknown) => {
      sessionPromise = null
      throw error
    })
    return sessionPromise
  }

  async function listTools(): Promise<DiscoveredTool[]> {
    const result = await call('tools/list')
    if (!isRecord(result) || !Array.isArray(result.tools)) invalidResponse()
    return result.tools.flatMap((tool): DiscoveredTool[] => {
      if (!isRecord(tool) || typeof tool.name !== 'string' || !tool.name)
        return []
      const inputSchema = isRecord(tool.inputSchema) ? tool.inputSchema : {}
      const properties = isRecord(inputSchema.properties)
        ? inputSchema.properties
        : {}
      const required = Array.isArray(inputSchema.required)
        ? inputSchema.required.filter(
            (entry): entry is string => typeof entry === 'string',
          )
        : []
      return [{ name: tool.name, properties, required }]
    })
  }

  async function discoverTools(): Promise<DiscoveredTool[]> {
    await ensureSession()
    toolsPromise ??= listTools().catch((error: unknown) => {
      toolsPromise = null
      throw error
    })
    return toolsPromise
  }

  function parseCreateResult(result: unknown): MeetingCreateResult {
    if (!isRecord(result)) invalidResponse()
    if (result.isError === true) providerUnavailable()
    const content = Array.isArray(result.content) ? result.content : []
    const texts = content.flatMap((block) =>
      isRecord(block) && block.type === 'text' && typeof block.text === 'string'
        ? [block.text]
        : [],
    )
    const parsedBlocks = texts.flatMap((text): unknown[] => {
      try {
        return [JSON.parse(text)]
      } catch {
        return []
      }
    })
    const structured =
      isRecord(result.structuredContent) || Array.isArray(result.structuredContent)
        ? [result.structuredContent]
        : []
    let meetingUrl: string | null = null
    let providerMeetingId: string | null = null
    for (const parsed of [...structured, ...parsedBlocks]) {
      meetingUrl ??= findMeetingUrl(parsed, 0)
      providerMeetingId ??= findMeetingId(parsed, 0)
    }
    if (!meetingUrl) {
      meetingUrl = texts.join('\n').match(FALLBACK_URL_PATTERN)?.[0] ?? null
    }
    if (!meetingUrl) invalidResponse()
    return { meetingUrl, providerMeetingId }
  }

  return {
    name: 'tencent-meeting',

    /**
     * Tencent Meeting exposes no guaranteed room deletion; cancellation stays
     * a visible provider constraint even though cancelMeeting still probes for
     * a cancel tool at call time.
     */
    capabilities: { cancellation: false },

    async createMeeting(
      input: MeetingCreateInput,
    ): Promise<MeetingCreateResult> {
      const tools = await discoverTools()
      const createTool =
        tools.find((tool) => SCHEDULE_TOOL_PATTERN.test(tool.name)) ??
        tools.find(
          (tool) =>
            CREATE_TOOL_PATTERN.test(tool.name) &&
            MEETING_TOOL_PATTERN.test(tool.name),
        )
      if (!createTool || !hasSupportedRequiredArguments(createTool)) {
        throw new MeetingProviderError(
          'unsupported',
          'Tencent Meeting does not expose a meeting creation tool.',
        )
      }
      const result = await call('tools/call', {
        name: createTool.name,
        arguments: buildCreateArguments(createTool.properties, input),
      })
      return parseCreateResult(result)
    },

    async cancelMeeting(
      providerMeetingId: string,
    ): Promise<'cancelled' | 'unsupported'> {
      const tools = await discoverTools()
      const cancelTool = tools.find(
        (tool) =>
          CANCEL_TOOL_PATTERN.test(tool.name) &&
          MEETING_TOOL_PATTERN.test(tool.name),
      )
      if (!cancelTool) return 'unsupported'
      const result = await call('tools/call', {
        name: cancelTool.name,
        arguments: buildCancelArguments(
          cancelTool.properties,
          providerMeetingId,
        ),
      })
      if (isRecord(result) && result.isError === true) providerUnavailable()
      return 'cancelled'
    },
  }
}
