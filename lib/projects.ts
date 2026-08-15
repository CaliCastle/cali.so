// Project registry ported from v1's Sanity data. Edit freely.
export interface Project {
  name: string
  nameEn: string
  description: string
  descriptionEn?: string
  url: string
  icon: string
  domain: string
}

export const projects: Project[] = [
  {
    name: 'Cali 宝宝',
    nameEn: 'Cali Baby',
    description: '宝宝的事很多，不必都靠脑子记。',
    descriptionEn: 'You don’t have to remember every feed.',
    url: '/calibaby',
    icon: '/images/calibaby-app-icon.png',
    domain: 'cali.so',
  },
  {
    name: '佐玩官网',
    nameEn: 'Zolplay Website',
    description: '为自己的公司佐玩设计开发的官网，简约的设计结合噪点材质感。',
    descriptionEn: "I designed and built Zolplay's company site with a simple layout and grain texture.",
    url: 'https://zolplay.com',
    icon: '/images/projects/zolplay.png',
    domain: 'zolplay.com',
  },
  {
    name: 'Well Word',
    nameEn: 'Well Word',
    description: '5×5 英语拼字游戏。',
    descriptionEn: 'A 5×5 English word game.',
    url: 'https://wellwordgame.com/zh-CN',
    icon: '/images/projects/well-word.png',
    domain: 'wellwordgame.com',
  },
  {
    name: 'ChatGPT Slack 机器人',
    nameEn: 'ChatGPT Slack Bot',
    description: '公司内部 Slack 的雏形版 ChatGPT 机器人。',
    descriptionEn: "An early ChatGPT bot built for Zolplay's Slack.",
    url: 'https://github.com/zolplay-cn/chatgpt-slack',
    icon: '/images/projects/chatgpt-slack.png',
    domain: 'github.com',
  },
  {
    name: 'Raycast · 苹果开发者文档',
    nameEn: 'Raycast · Apple Developer Docs',
    description: '在 Raycast 里快速搜索 Apple Developer 文档。',
    descriptionEn: 'Search Apple Developer docs from Raycast.',
    url: 'https://www.raycast.com/cali/apple-developer-docs',
    icon: '/images/projects/apple-developer-docs.png',
    domain: 'raycast.com',
  },
  {
    name: 'Raycast · 亮度调节',
    nameEn: 'Raycast · Brightness Control',
    description: '第一款 Raycast 插件，调节屏幕亮度。',
    descriptionEn: 'My first Raycast extension, built to control screen brightness.',
    url: 'https://www.raycast.com/cali/brightness-control',
    icon: '/images/projects/brightness-control.png',
    domain: 'raycast.com',
  },
  {
    name: 'BuckBank 元钞银行',
    nameEn: 'BuckBank',
    description: 'Slack 里的虚拟经济系统：买 emoji 股份、幸运大转盘、转账。',
    descriptionEn: 'A Slack economy where people traded emoji stocks, sent money, and spun a lucky wheel.',
    url: 'https://twitter.com/thecalicastle/status/1663601110916149251',
    icon: '/images/projects/buckbank.png',
    domain: 'twitter.com',
  },
  {
    name: 'PopMenu',
    nameEn: 'PopMenu',
    description: '大学期间写的 iOS 弹出菜单开源库。',
    descriptionEn: 'An open-source iOS pop-up menu library from my college days.',
    url: 'https://github.com/CaliCastle/PopMenu',
    icon: '/images/projects/popmenu.png',
    domain: 'github.com',
  },
]
