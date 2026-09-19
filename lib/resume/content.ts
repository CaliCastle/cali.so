import 'server-only'

import { z } from 'zod'

const text = z.string().trim().min(1).max(4000)
const bullets = z.array(text).min(1).max(20)
const engagement = z.object({
  name: text,
  role: text,
  note: text.optional(),
  bullets,
})

const resumeContentSchema = z.object({
  name: text,
  title: text,
  summary: text,
  experience: z.array(z.object({
    company: text,
    role: text,
    period: z.union([text, z.array(text).min(1).max(5)]),
    bullets,
    engagements: z.array(engagement).max(20).optional(),
  })).min(1).max(20),
  openSource: z.array(z.object({ name: text, technology: text, description: text })).max(20).optional(),
  capabilities: z.array(z.object({ label: text, description: text })).max(12),
  education: z.array(z.object({
    institution: text,
    qualification: text,
    notes: z.array(text).max(10).optional(),
  })).max(10),
  educationNote: text.optional(),
})

export type ResumeContentData = z.infer<typeof resumeContentSchema>

export function parseResumeContent(encoded: string | undefined): ResumeContentData | null {
  if (!encoded?.trim()) return null
  try {
    // Bound decoded data and accept canonical base64 only. Never report the
    // parser's input or detailed validation errors, which contain private copy.
    if (encoded.length > 60_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error()
    const decoded = Buffer.from(encoded, 'base64')
    if (decoded.toString('base64') !== encoded) throw new Error()
    return resumeContentSchema.parse(JSON.parse(decoded.toString('utf8')))
  } catch {
    throw new Error('Invalid private resume content configuration')
  }
}

export function getEnglishResumeContent() {
  return parseResumeContent(process.env.RESUME_EN_CONTENT_BASE64)
}
