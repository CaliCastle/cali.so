import type { ChineseResumeContentData } from './content-zh'

// Synthetic copy only. Keep private career details out of the public repo.
export const chineseResumeContentFixture: ChineseResumeContentData = {
  name: '示例姓名',
  title: '示例职位',
  summary: '仅供已解锁中文简历测试的示例简介。',
  experience: [{
    company: '示例工作室',
    role: '示例工程师',
    periods: ['第一阶段：示例日期', '第二阶段：示例日期与地点'],
    bullets: ['**示例成果**及其背景。'],
    engagements: [{
      name: '示例产品',
      role: '示例产品职责',
      note: '示例项目背景。',
      bullets: ['**交付示例产品**并持续维护。'],
    }],
  }, {
    company: '示例教育公司',
    role: '示例负责人',
    periods: ['示例任职时间'],
    description: '负责示例平台开发与团队协作。',
    bullets: [],
  }],
  openSource: [{ name: '示例开源组件', technology: '示例技术', description: '面向示例场景的开源组件。' }],
  capabilities: [{ label: '示例能力', description: '示例工具与交付方式。' }],
  education: [{ institution: '示例大学', qualification: '示例学位', notes: ['示例学习成果。'] }],
  educationNote: '示例合作培养项目说明。',
}
