import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createTencentMeetingAdapter } from './tencent'
import { MeetingProviderError, type MeetingCreateInput } from './types'

const MCP_URL = 'https://mcp.internal.example/tencent'
const TOKEN = 'tencent-mcp-token-must-stay-private'

const CREATE_INPUT: MeetingCreateInput = {
  bookingId: 'booking-123',
  startsAt: new Date('2026-07-20T10:00:00.000Z'),
  endsAt: new Date('2026-07-20T11:00:00.000Z'),
  guestName: 'Ada Lovelace',
  subject: 'AMA Session with Ada Lovelace',
}

function jsonRpcResponse(
  id: number,
  result: unknown,
  headers?: Record<string, string>,
): Response {
  return Response.json({ jsonrpc: '2.0', id, result }, { headers })
}

function initializeResponse(headers?: Record<string, string>): Response {
  return jsonRpcResponse(
    1,
    {
      protocolVersion: '2025-03-26',
      capabilities: {},
      serverInfo: { name: 'tencent-meeting-mcp', version: '1.0.0' },
    },
    headers,
  )
}

function notificationAck(): Response {
  return new Response(null, { status: 202 })
}

function toolsListResponse(tools: unknown[]): Response {
  return jsonRpcResponse(2, { tools })
}

function createToolResponse(payload: unknown): Response {
  return jsonRpcResponse(3, {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
  })
}

const ISO_SCHEMA_TOOL = {
  name: 'create_meeting',
  inputSchema: {
    type: 'object',
    properties: {
      subject: { type: 'string' },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
    },
  },
}

const OFFICIAL_SKILL_TOOL = {
  name: 'schedule_meeting',
  inputSchema: {
    type: 'object',
    properties: {
      _client_info: { type: 'object' },
      subject: { type: 'string' },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
    },
  },
}

function adapterWithResponses(...responses: Array<Response | Error>) {
  const queue = [...responses]
  const fetchMock = vi.fn(async () => {
    const next = queue.shift()
    if (next === undefined) throw new Error('unexpected fetch call')
    if (next instanceof Error) throw next
    return next
  })
  const adapter = createTencentMeetingAdapter({
    url: MCP_URL,
    token: TOKEN,
    fetch: fetchMock as unknown as typeof fetch,
  })
  return { adapter, fetchMock }
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, index: number) {
  const [, init] = fetchMock.mock.calls[index] as unknown as [
    string,
    RequestInit,
  ]
  return JSON.parse(String(init.body)) as Record<string, unknown>
}

function requestHeaders(fetchMock: ReturnType<typeof vi.fn>, index: number) {
  const [, init] = fetchMock.mock.calls[index] as unknown as [
    string,
    RequestInit,
  ]
  return init.headers as Record<string, string>
}

describe('Tencent Meeting adapter', () => {
  it('rejects lookalike hosts that only contain a Tencent domain as a substring', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
      createToolResponse({
        meeting_id: 'tm-spoof',
        join_url: 'https://meeting.tencent.com.evil.example/dm/abc',
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('accepts subdomains of the real Tencent Meeting domains', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
      createToolResponse({
        meeting_id: 'tm-sub',
        join_url: 'https://intl.voovmeeting.com/dm/abc',
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).resolves.toMatchObject({
      meetingUrl: 'https://intl.voovmeeting.com/dm/abc',
    })
  })

  it('creates a meeting end-to-end over JSON responses with an ISO time schema', async () => {
    const { adapter, fetchMock } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
      createToolResponse({
        meeting_id: 'tm-123',
        join_url: 'https://meeting.tencent.com/dm/abc',
      }),
    )

    const result = await adapter.createMeeting(CREATE_INPUT)

    expect(result).toEqual({
      meetingUrl: 'https://meeting.tencent.com/dm/abc',
      providerMeetingId: 'tm-123',
    })
    expect(fetchMock).toHaveBeenCalledTimes(4)
    for (const [url, init] of fetchMock.mock.calls as unknown as Array<
      [string, RequestInit]
    >) {
      expect(url).toBe(MCP_URL)
      expect(init.method).toBe('POST')
      expect(init.signal).toBeInstanceOf(AbortSignal)
      expect(init.headers).toMatchObject({
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'X-Tencent-Meeting-Token': TOKEN,
        'X-Skill-Version': 'v1.0.11',
        'MCP-Protocol-Version': '2025-03-26',
      })
    }
    expect(requestBody(fetchMock, 0)).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'cali.so', version: '3.0.0' },
      },
    })
    expect(requestBody(fetchMock, 1)).toEqual({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    })
    expect(requestBody(fetchMock, 2)).toMatchObject({
      id: 2,
      method: 'tools/list',
    })
    expect(requestBody(fetchMock, 3)).toEqual({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create_meeting',
        arguments: {
          _client_info: { os: 'server', agent: 'cali.so', model: 'server' },
          subject: 'AMA Session with Ada Lovelace',
          start_time: '2026-07-20T18:00:00+08:00',
          end_time: '2026-07-20T19:00:00+08:00',
        },
      },
    })
  })

  it('uses the official Tencent skill contract for schedule_meeting', async () => {
    const { adapter, fetchMock } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([OFFICIAL_SKILL_TOOL]),
      createToolResponse({
        meeting_id: 'tm-official',
        join_url: 'https://meeting.tencent.com/dm/official',
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).resolves.toEqual({
      meetingUrl: 'https://meeting.tencent.com/dm/official',
      providerMeetingId: 'tm-official',
    })

    for (const [, init] of fetchMock.mock.calls as unknown as Array<
      [string, RequestInit]
    >) {
      expect(init.headers).toMatchObject({
        'MCP-Protocol-Version': '2025-03-26',
        'X-Skill-Version': 'v1.0.11',
      })
    }
    expect(requestBody(fetchMock, 0)).toMatchObject({
      method: 'initialize',
      params: { protocolVersion: '2025-03-26' },
    })
    expect(requestBody(fetchMock, 3)).toEqual({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'schedule_meeting',
        arguments: {
          _client_info: { os: 'server', agent: 'cali.so', model: 'server' },
          subject: 'AMA Session with Ada Lovelace',
          start_time: '2026-07-20T18:00:00+08:00',
          end_time: '2026-07-20T19:00:00+08:00',
        },
      },
    })
  })

  it.each(['integer', 'number'] as const)(
    'sends epoch seconds when the schema declares %s start and end times',
    async (timeType) => {
      const { adapter, fetchMock } = adapterWithResponses(
        initializeResponse(),
        notificationAck(),
        toolsListResponse([
          {
            name: 'create_meeting_room',
            inputSchema: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                start_time: { type: timeType },
                end_time: { type: timeType },
              },
            },
          },
        ]),
        createToolResponse({ join_url: 'https://meeting.tencent.com/dm/epoch' }),
      )

      await adapter.createMeeting(CREATE_INPUT)

      const call = requestBody(fetchMock, 3) as {
        params: { arguments: Record<string, unknown> }
      }
      expect(call.params.arguments).toEqual({
        _client_info: { os: 'server', agent: 'cali.so', model: 'server' },
        topic: 'AMA Session with Ada Lovelace',
        start_time: Math.floor(CREATE_INPUT.startsAt.getTime() / 1000),
        end_time: Math.floor(CREATE_INPUT.endsAt.getTime() / 1000),
      })
    },
  )

  it('sends duration minutes when the schema has no end-time property', async () => {
    const { adapter, fetchMock } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([
        {
          name: 'create_meeting',
          inputSchema: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              start_time: { type: 'string' },
              duration: { type: 'integer' },
            },
          },
        },
      ]),
      createToolResponse({
        join_url: 'https://meeting.tencent.com/dm/duration',
      }),
    )

    await adapter.createMeeting(CREATE_INPUT)

    const call = requestBody(fetchMock, 3) as {
      params: { arguments: Record<string, unknown> }
    }
    expect(call.params.arguments).toEqual({
      _client_info: { os: 'server', agent: 'cali.so', model: 'server' },
      subject: 'AMA Session with Ada Lovelace',
      start_time: '2026-07-20T18:00:00+08:00',
      duration: 60,
    })
  })

  it('parses an SSE tools/call response by matching the request id', async () => {
    const sseBody = [
      'event: message',
      'data: {"jsonrpc":"2.0","id":99,"result":{"content":[{"type":"text","text":"wrong message"}]}}',
      '',
      'event: message',
      `data: ${JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                join_url: 'https://meeting.tencent.com/dm/sse',
                meeting_id: 'tm-sse',
              }),
            },
          ],
        },
      })}`,
      '',
    ].join('\n')
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
      new Response(sseBody, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).resolves.toEqual({
      meetingUrl: 'https://meeting.tencent.com/dm/sse',
      providerMeetingId: 'tm-sse',
    })
  })

  it('captures the Mcp-Session-Id from initialize and echoes it afterwards', async () => {
    const { adapter, fetchMock } = adapterWithResponses(
      initializeResponse({ 'Mcp-Session-Id': 'session-abc' }),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
      createToolResponse({
        join_url: 'https://meeting.tencent.com/dm/session',
      }),
    )

    await adapter.createMeeting(CREATE_INPUT)

    expect(requestHeaders(fetchMock, 0)['Mcp-Session-Id']).toBeUndefined()
    expect(requestHeaders(fetchMock, 1)['Mcp-Session-Id']).toBe('session-abc')
    expect(requestHeaders(fetchMock, 2)['Mcp-Session-Id']).toBe('session-abc')
    expect(requestHeaders(fetchMock, 3)['Mcp-Session-Id']).toBe('session-abc')
  })

  it('finds the meeting URL and id in deeply nested result JSON', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
      jsonRpcResponse(3, {
        content: [
          {
            type: 'text',
            text: '{"data":{"meeting":{"join_url":"https://meeting.tencent.com/dm/abc","meeting_id":123}}}',
          },
        ],
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).resolves.toEqual({
      meetingUrl: 'https://meeting.tencent.com/dm/abc',
      providerMeetingId: '123',
    })
  })

  it('prefers structuredContent from the official Tencent skill', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([OFFICIAL_SKILL_TOOL]),
      jsonRpcResponse(3, {
        structuredContent: {
          meeting: {
            join_url: 'https://meeting.tencent.com/dm/structured',
            meeting_id: 'tm-structured',
          },
        },
        content: [],
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).resolves.toEqual({
      meetingUrl: 'https://meeting.tencent.com/dm/structured',
      providerMeetingId: 'tm-structured',
    })
  })

  it('falls back to a plain-text URL scan when the result is not JSON', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
      jsonRpcResponse(3, {
        content: [
          {
            type: 'text',
            text: 'Meeting created! Join at https://meeting.tencent.com/dm/xyz789 before it starts.',
          },
        ],
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).resolves.toEqual({
      meetingUrl: 'https://meeting.tencent.com/dm/xyz789',
      providerMeetingId: null,
    })
  })

  it('treats an isError tool result as provider unavailable', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
      jsonRpcResponse(3, {
        content: [{ type: 'text', text: 'quota exceeded for this account' }],
        isError: true,
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).rejects.toMatchObject({
      code: 'provider_unavailable',
      message: 'Tencent Meeting is temporarily unavailable.',
    })
  })

  it('reports unsupported when the server exposes no meeting creation tool', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([{ name: 'list_rooms' }, { name: 'create_user' }]),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).rejects.toMatchObject({
      code: 'unsupported',
    })
  })

  it('rejects a meeting tool with required arguments it cannot construct', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([
        {
          ...OFFICIAL_SKILL_TOOL,
          inputSchema: {
            ...OFFICIAL_SKILL_TOOL.inputSchema,
            required: ['subject', 'tenant_secret'],
          },
        },
      ]),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).rejects.toMatchObject({
      code: 'unsupported',
    })
  })

  it('maps a JSON-RPC error member to invalid_response with only the numeric code', async () => {
    const { adapter } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      Response.json({
        jsonrpc: '2.0',
        id: 2,
        error: { code: -32601, message: `method not found for ${TOKEN}` },
      }),
    )

    const error = await adapter
      .createMeeting(CREATE_INPUT)
      .catch((caught: unknown) => caught)
    expect(error).toMatchObject({
      code: 'invalid_response',
      message: 'Tencent Meeting returned a provider error (code -32601).',
    })
  })

  it('normalizes a network failure as provider unavailable', async () => {
    const { adapter } = adapterWithResponses(new Error('socket hang up'))

    await expect(adapter.createMeeting(CREATE_INPUT)).rejects.toMatchObject({
      code: 'provider_unavailable',
    })
  })

  it('normalizes a non-2xx response as provider unavailable', async () => {
    const { adapter } = adapterWithResponses(
      new Response('bad gateway', {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
      }),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).rejects.toMatchObject({
      code: 'provider_unavailable',
    })
  })

  it('normalizes a fetch timeout abort as provider unavailable', async () => {
    const { adapter } = adapterWithResponses(
      new DOMException('The operation timed out.', 'TimeoutError'),
    )

    await expect(adapter.createMeeting(CREATE_INPUT)).rejects.toMatchObject({
      code: 'provider_unavailable',
    })
  })

  it('advertises no cancellation capability while probing for a cancel tool at call time', async () => {
    const { adapter, fetchMock } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([
        ISO_SCHEMA_TOOL,
        {
          name: 'cancel_meeting',
          inputSchema: {
            type: 'object',
            properties: { meeting_id: { type: 'string' } },
          },
        },
      ]),
      jsonRpcResponse(3, { content: [{ type: 'text', text: 'cancelled' }] }),
    )

    expect(adapter.capabilities).toEqual({ cancellation: false })
    await expect(adapter.cancelMeeting('tm-123')).resolves.toBe('cancelled')
    expect(requestBody(fetchMock, 3)).toMatchObject({
      method: 'tools/call',
      params: {
        name: 'cancel_meeting',
        arguments: {
          _client_info: { os: 'server', agent: 'cali.so', model: 'server' },
          meeting_id: 'tm-123',
        },
      },
    })
  })

  it('returns unsupported without throwing when no cancel tool exists', async () => {
    const { adapter, fetchMock } = adapterWithResponses(
      initializeResponse(),
      notificationAck(),
      toolsListResponse([ISO_SCHEMA_TOOL]),
    )

    await expect(adapter.cancelMeeting('tm-123')).resolves.toBe('unsupported')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('never leaks the token in any failure mode', async () => {
    const failureModes: Array<{
      label: string
      responses: Array<Response | Error>
    }> = [
      {
        label: 'network throw echoing credentials',
        responses: [new Error(`connection refused with header ${TOKEN}`)],
      },
      {
        label: 'non-2xx body echoing credentials',
        responses: [
          new Response(`unauthorized: ${TOKEN}`, {
            status: 401,
            headers: { 'Content-Type': 'text/plain' },
          }),
        ],
      },
      {
        label: 'JSON-RPC error echoing credentials',
        responses: [
          initializeResponse(),
          notificationAck(),
          Response.json({
            jsonrpc: '2.0',
            id: 2,
            error: {
              code: -32000,
              message: `rejected token ${TOKEN}`,
              data: { token: TOKEN },
            },
          }),
        ],
      },
      {
        label: 'unparseable body echoing credentials',
        responses: [
          initializeResponse(),
          notificationAck(),
          new Response(`<html>${TOKEN}</html>`, {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        ],
      },
      {
        label: 'isError tool result echoing credentials',
        responses: [
          initializeResponse(),
          notificationAck(),
          toolsListResponse([ISO_SCHEMA_TOOL]),
          jsonRpcResponse(3, {
            content: [{ type: 'text', text: `token ${TOKEN} is invalid` }],
            isError: true,
          }),
        ],
      },
      {
        label: 'result without any meeting URL',
        responses: [
          initializeResponse(),
          notificationAck(),
          toolsListResponse([ISO_SCHEMA_TOOL]),
          jsonRpcResponse(3, {
            content: [{ type: 'text', text: `debug ${TOKEN} but no url here` }],
          }),
        ],
      },
    ]

    for (const mode of failureModes) {
      const { adapter } = adapterWithResponses(...mode.responses)
      const error = await adapter
        .createMeeting(CREATE_INPUT)
        .catch((caught: unknown) => caught)
      expect(error, mode.label).toBeInstanceOf(MeetingProviderError)
      const provider = error as MeetingProviderError
      expect(String(provider), mode.label).not.toContain(TOKEN)
      expect(provider.message, mode.label).not.toContain(TOKEN)
      expect(JSON.stringify(provider), mode.label).not.toContain(TOKEN)
    }
  })
})
