import { resumeHeaders } from '~/lib/resume/access'
import { getResumeHandlers } from '~/lib/resume/server'

export async function POST(request: Request) {
  try {
    return await getResumeHandlers().unlock(request)
  } catch {
    return new Response('Access is temporarily unavailable. Please try again later.', {
      status: 503,
      headers: resumeHeaders,
    })
  }
}
