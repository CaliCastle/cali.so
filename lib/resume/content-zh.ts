import 'server-only'

import { z } from 'zod'

const text = z.string().trim().min(1).max(4000)
const bullets = z.array(text).max(20)

// Separate from the English schema: this edition has multiple employment
// periods, paragraph-only roles, open-source work, and education notes.
const chineseResumeSchema = z.object({
  name: text,
  title: text,
  summary: text,
  experience: z.array(z.object({
    company: text,
    role: text,
    periods: z.array(text).min(1).max(5),
    description: text.optional(),
    bullets,
    engagements: z.array(z.object({
      name: text,
      role: text,
      note: text.optional(),
      bullets: bullets.min(1),
    })).max(20).optional(),
  }).refine((job) => Boolean(job.description) || job.bullets.length > 0)).min(1).max(20),
  openSource: z.array(z.object({
    name: text,
    technology: text,
    description: text,
    url: z.url({ protocol: /^https$/ }).max(2048).optional(),
  })).max(20),
  capabilities: z.array(z.object({ label: text, description: text })).max(12),
  education: z.array(z.object({
    institution: text,
    qualification: text,
    notes: z.array(text).max(10),
  })).max(10),
  educationNote: text.optional(),
})

export type ChineseResumeContentData = z.infer<typeof chineseResumeSchema>

export function parseChineseResumeContent(encoded: string | undefined): ChineseResumeContentData | null {
  if (!encoded?.trim()) return null
  try {
    if (encoded.length > 60_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error()
    const decoded = Buffer.from(encoded, 'base64')
    if (decoded.toString('base64') !== encoded) throw new Error()
    return chineseResumeSchema.parse(JSON.parse(decoded.toString('utf8')))
  } catch {
    // Never expose private content through schema errors or malformed JSON.
    throw new Error('Invalid private Chinese resume content configuration')
  }
}

export function getChineseResumeContent() {
  return parseChineseResumeContent(process.env.RESUME_ZH_CONTENT_BASE64)
}
