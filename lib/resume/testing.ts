import type { ResumeContentData } from './content'

// Synthetic copy only. Browser tests must never depend on a private CV.
export const resumeContentFixture: ResumeContentData = {
  name: 'Cali Castle',
  title: 'Example role',
  summary: 'Private résumé fixture for the authenticated document.',
  experience: [{
    company: 'very very spaceship',
    role: 'Example engineer',
    period: 'Example period',
    bullets: ['**Synthetic achievement** with supporting context.'],
    engagements: [{
      name: 'Example internal product',
      role: 'Product & engineering',
      note: 'Synthetic project context.',
      bullets: ['**Shipped an example tool** with a small team.'],
    }],
  }],
  capabilities: [{ label: 'Example capability', description: 'Example tools.' }],
  education: [{ institution: 'Example university', qualification: 'Example degree.' }],
}
