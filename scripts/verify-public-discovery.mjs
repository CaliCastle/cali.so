import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

import matter from 'gray-matter'
import { JSDOM } from 'jsdom'

import { openProductionServer } from './production-server.mjs'

const productionOrigin =
  process.env.PUBLIC_DISCOVERY_EXPECTED_ORIGIN ?? 'https://cali.so'

function localizedPages(pathname, zh, en, imageAlt) {
  const zhPath = pathname
  const enPath = pathname === '/' ? '/en' : `/en${pathname}`
  return [
    {
      path: zhPath,
      locale: 'zh-CN',
      title: zh.title,
      documentTitle: pathname === '/' ? zh.title : `${zh.title} | Cali Castle`,
      description: zh.description,
      imageAlt: imageAlt.zh,
    },
    {
      path: enPath,
      locale: 'en',
      title: en.title,
      documentTitle: pathname === '/' ? en.title : `${en.title} | Cali Castle`,
      description: en.description,
      imageAlt: imageAlt.en,
    },
  ]
}

function localizedCaliBabyPages(pathname, zh, en, indexable) {
  const enPath = `/en${pathname}`
  return [
    {
      path: pathname,
      locale: 'zh-CN',
      title: zh.title,
      documentTitle: zh.title,
      description: zh.description,
      imageAlt: 'Cali 宝宝应用图标与名称',
      smartAppBanner: true,
      indexable,
    },
    {
      path: enPath,
      locale: 'en',
      title: en.title,
      documentTitle: en.title,
      description: en.description,
      imageAlt: 'Cali Baby app icon and wordmark',
      smartAppBanner: true,
      indexable,
    },
  ]
}

const publicPages = [
  ...localizedPages(
    '/',
    {
      title: 'Cali Castle',
      description: '设计工程师、Agent 指挥官、创意总监。',
    },
    {
      title: 'Cali Castle',
      description: 'Design Engineer. Agent Orchestrator. Creative Director.',
    },
    {
      zh: 'Cali Castle。设计工程师、Agent 指挥官、创意总监。',
      en: 'Cali Castle. Design Engineer. Agent Orchestrator. Creative Director.',
    },
  ),
  ...localizedPages(
    '/blog',
    {
      title: '写作',
      description: 'Cali 关于设计、工程、产品，以及一路上在意的人和事的文章。',
    },
    {
      title: 'Writing',
      description:
        'Essays by Cali about design, engineering, products, and the people and ideas that matter along the way.',
    },
    {
      zh: '写作 · Cali Castle。Cali 关于设计、工程、产品，以及一路上在意的人和事的文章。',
      en: 'Writing · Cali Castle. Essays by Cali about design, engineering, products, and the people and ideas that matter along the way.',
    },
  ),
  ...localizedPages(
    '/photos',
    { title: '照片', description: 'Cali 在工作、生活和旅途中留下的一些瞬间。' },
    {
      title: 'Photos',
      description: 'Moments Cali has kept from work, life, and everywhere in between.',
    },
    {
      zh: '照片 · Cali Castle。Cali 在工作、生活和旅途中留下的一些瞬间。',
      en: 'Photos · Cali Castle. Moments Cali has kept from work, life, and everywhere in between.',
    },
  ),
  ...localizedPages(
    '/projects',
    {
      title: '项目',
      description:
        '这些年做过的产品、开源工具和小实验。有些实用，有些只是好玩，但每一个我都认真做过。',
    },
    {
      title: 'Projects',
      description:
        'Products, open-source tools, and small experiments I have made over the years. Some useful, some playful, all made with care.',
    },
    {
      zh: '项目 · Cali Castle。这些年做过的产品、开源工具和小实验。有些实用，有些只是好玩，但每一个我都认真做过。',
      en: 'Projects · Cali Castle. Products, open-source tools, and small experiments I have made over the years. Some useful, some playful, all made with care.',
    },
  ),
  ...localizedPages(
    '/ama',
    {
      title: '一对一',
      description:
        '从产品设计、工程、职业到独立开发、创业、出海、英语学习与 AI 工作流，用一小时聊清楚怎么判断、怎么取舍、下一步做什么。',
    },
    {
      title: 'AMA',
      description:
        'A one-to-one conversation about AI-native work, product strategy, engineering, startups, career moves, and building products.',
    },
    {
      zh: '一对一 · Cali Castle。从产品设计、工程、职业到独立开发、创业、出海、英语学习与 AI 工作流，用一小时聊清楚怎么判断、怎么取舍、下一步做什么。',
      en: 'AMA · Cali Castle. A one-to-one conversation about AI-native work, product strategy, engineering, startups, career moves, and building products.',
    },
  ),
  ...localizedCaliBabyPages(
    '/calibaby',
    {
      title: 'Cali 宝宝｜喂奶、睡眠、尿布与胎动记录',
      description:
        '从孕期到宝宝出生后，记录胎动、宫缩、喂奶、睡眠、尿布、成长等日常，并通过家庭同步与授权照顾者共享近况。现已上线 App Store。',
    },
    {
      title: 'Cali Baby: Baby Tracker for Feeding, Sleep & Diapers',
      description:
        'Track kicks, contractions, feeding, sleep, diapers, growth, and more. Keep authorized caregivers in sync with Cali Baby for iPhone and Apple Watch.',
    },
    true,
  ),
  ...localizedCaliBabyPages(
    '/calibaby/help',
    {
      title: 'Cali 宝宝｜帮助与支持',
      description: '查找家庭同步、备份、语音记录和账号删除帮助，了解 Cali 宝宝，或联系我们。',
    },
    {
      title: 'Cali Baby | Help and Support',
      description:
        'Get help with Family Sync, backups, voice records, and deletion, learn about Cali Baby, or contact support.',
    },
    false,
  ),
  ...localizedCaliBabyPages(
    '/calibaby/privacy',
    {
      title: 'Cali 宝宝隐私政策',
      description: '了解 Cali 宝宝如何处理设备记录、家庭同步、语音、分析、诊断和删除请求。',
    },
    {
      title: 'Cali Baby Privacy Policy',
      description:
        'Learn how Cali Baby handles device records, Family Sync, voice processing, analytics, diagnostics, and deletion requests.',
    },
    false,
  ),
  ...localizedCaliBabyPages(
    '/calibaby/terms',
    {
      title: 'Cali 宝宝使用条款',
      description: '阅读 Cali 宝宝关于账号、家庭共享、Cali Baby Pro、医疗边界和服务区域的使用条款。',
    },
    {
      title: 'Cali Baby Terms of Use',
      description:
        "Read Cali Baby's terms for accounts, Family sharing, Cali Baby Pro, health boundaries, and service regions.",
    },
    false,
  ),
]

const blogDirectory = new URL('../content/blog/', import.meta.url)
for (const slug of (await readdir(blogDirectory)).sort()) {
  const zh = matter(await readFile(new URL(`${slug}/index.mdx`, blogDirectory), 'utf8')).data
  const en = matter(await readFile(new URL(`${slug}/index.en.mdx`, blogDirectory), 'utf8')).data
  publicPages.push(
    ...localizedPages(
      `/blog/${slug}`,
      zh,
      en,
      {
        zh: `${zh.title} · Cali Castle`,
        en: `${en.title} · Cali Castle`,
      },
    ),
  )
}

const newsletterDirectory = new URL('../content/newsletters/', import.meta.url)
for (const id of (await readdir(newsletterDirectory)).sort()) {
  const zh = matter(await readFile(new URL(`${id}/index.mdx`, newsletterDirectory), 'utf8')).data
  const en = matter(await readFile(new URL(`${id}/index.en.mdx`, newsletterDirectory), 'utf8')).data
  publicPages.push(
    ...localizedPages(
      `/newsletters/${id}`,
      zh,
      en,
      {
        zh: `${zh.title} · Cali Castle`,
        en: `${en.title} · Cali Castle`,
      },
    ),
  )
}

function expectedCanonical(page) {
  return new URL(page.canonical ?? page.path, productionOrigin).href
}

function requiredElement(document, selector, description) {
  const element = document.querySelector(selector)
  assert.ok(element, `missing ${description}`)
  return element
}

async function verifyMetadata(baseUrl, page) {
  const response = await fetch(new URL(page.path, baseUrl))
  assert.equal(response.status, 200, `${page.path} status`)
  const dom = new JSDOM(await response.text())
  const { document } = dom.window

  assert.equal(document.documentElement.lang, page.locale, `${page.path} lang`)
  const robots =
    document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''
  if (page.indexable === false) {
    assert.match(robots, /noindex/, `${page.path} indexing`)
    assert.doesNotMatch(robots, /nofollow/, `${page.path} links`)
  } else {
    assert.doesNotMatch(robots, /noindex|nofollow/, `${page.path} indexing`)
  }
  assert.equal(document.title, page.documentTitle, `${page.path} title`)
  assert.equal(
    requiredElement(
      document,
      'meta[name="description"]',
      `${page.path} description`,
    ).getAttribute('content'),
    page.description,
  )
  const canonical = requiredElement(
    document,
    'link[rel="canonical"]',
    `${page.path} canonical`,
  ).getAttribute('href')
  assert.ok(canonical)
  assert.equal(
    new URL(canonical).href,
    expectedCanonical(page),
    `${page.path} canonical`,
  )

  const unlocalized = page.path.replace(/^\/en(?=\/|$)/, '') || '/'
  const zh = new URL(unlocalized, productionOrigin).href
  const enPath = unlocalized === '/' ? '/en' : `/en${unlocalized}`
  const en = new URL(enPath, productionOrigin).href
  for (const [language, expected] of [
    ['zh-CN', zh],
    ['en', en],
    ['x-default', zh],
  ]) {
    const alternate = requiredElement(
      document,
      `link[rel="alternate"][hreflang="${language}"]`,
      `${page.path} ${language} alternate`,
    ).getAttribute('href')
    assert.ok(alternate)
    assert.equal(new URL(alternate).href, expected)
  }

  assert.equal(
    requiredElement(
      document,
      'meta[property="og:locale"]',
      `${page.path} OG locale`,
    ).getAttribute('content'),
    page.locale === 'en' ? 'en_US' : 'zh_CN',
  )
  for (const [selector, expected, description] of [
    ['meta[property="og:title"]', page.title, 'OG title'],
    ['meta[property="og:description"]', page.description, 'OG description'],
    ['meta[name="twitter:title"]', page.title, 'Twitter title'],
    ['meta[name="twitter:description"]', page.description, 'Twitter description'],
    ['meta[property="og:image:alt"]', page.imageAlt, 'OG image alt'],
    ['meta[name="twitter:image:alt"]', page.imageAlt, 'Twitter image alt'],
  ]) {
    const element = requiredElement(
      document,
      selector,
      `${page.path} ${description}`,
    )
    assert.equal(
      element.getAttribute('content'),
      expected,
    )
  }
  assert.equal(
    requiredElement(
      document,
      'meta[property="og:image:width"]',
      `${page.path} OG image width`,
    ).getAttribute('content'),
    '1200',
  )
  assert.equal(
    requiredElement(
      document,
      'meta[property="og:image:height"]',
      `${page.path} OG image height`,
    ).getAttribute('content'),
    '630',
  )
  if (page.smartAppBanner) {
    assert.equal(
      requiredElement(
        document,
        'meta[name="apple-itunes-app"]',
        `${page.path} App Store smart banner`,
      ).getAttribute('content'),
      'app-id=6769728441',
    )
  }
  const ogImage = requiredElement(
    document,
    'meta[property="og:image"]',
    `${page.path} OG image`,
  ).getAttribute('content')
  assert.ok(ogImage)
  assert.equal(new URL(ogImage).origin, productionOrigin)
  const remoteImage = new URL(ogImage)
  const localImage = new URL(
    `${remoteImage.pathname}${remoteImage.search}`,
    baseUrl,
  )
  const imageResponse = await fetch(localImage)
  assert.equal(imageResponse.status, 200, `${page.path} OG image status`)
  assert.match(imageResponse.headers.get('content-type') ?? '', /^image\/png/)
  const imageBytes = Buffer.from(await imageResponse.arrayBuffer())
  assert.deepEqual([...imageBytes.subarray(1, 4)], [0x50, 0x4e, 0x47])
  assert.equal(imageBytes.readUInt32BE(16), 1200, `${page.path} PNG width`)
  assert.equal(imageBytes.readUInt32BE(20), 630, `${page.path} PNG height`)
}

async function verifyDiscoveryFiles(baseUrl) {
  const sitemap = await fetch(new URL('/sitemap.xml', baseUrl))
  assert.equal(sitemap.status, 200)
  assert.match(
    sitemap.headers.get('content-type') ?? '',
    /(?:application|text)\/xml/,
  )
  const sitemapXml = await sitemap.text()
  const sitemapPaths = publicPages
    .filter((page) => page.indexable !== false)
    .map((page) => page.path)
  for (const path of new Set(sitemapPaths)) {
    assert.ok(
      sitemapXml.includes(new URL(path, productionOrigin).href),
      `sitemap ${path}`,
    )
  }
  for (const page of publicPages.filter((candidate) => candidate.indexable === false)) {
    assert.ok(
      !sitemapXml.includes(new URL(page.path, productionOrigin).href),
      `sitemap excludes ${page.path}`,
    )
  }

  const robots = await fetch(new URL('/robots.txt', baseUrl))
  assert.equal(robots.status, 200)
  const robotsText = await robots.text()
  assert.match(robotsText, /User-Agent: \*/)
  assert.match(robotsText, /Allow: \//)
  assert.match(robotsText, /Disallow: \/admin/)
  assert.match(robotsText, /Disallow: \/api\/admin/)
  assert.match(
    robotsText,
    new RegExp(`Sitemap: ${new URL('/sitemap.xml', productionOrigin).href}`),
  )

  const icon = await fetch(new URL('/icon.png', baseUrl))
  assert.equal(icon.status, 200)
  assert.match(icon.headers.get('content-type') ?? '', /^image\/png/)
  const iconBytes = new Uint8Array(await icon.arrayBuffer())
  assert.deepEqual([...iconBytes.slice(1, 4)], [0x50, 0x4e, 0x47])

  const llms = await fetch(new URL('/llms.txt', baseUrl))
  assert.equal(llms.status, 200)
  assert.match(llms.headers.get('content-type') ?? '', /^text\/markdown/)
  const llmsText = await llms.text()
  assert.match(llmsText, /^# Cali Castle and Cali Baby\n\n>/)
  assert.ok(
    llmsText.includes('https://apps.apple.com/app/id6769728441'),
    'llms.txt App Store listing',
  )
  for (const path of new Set(publicPages.map((page) => page.path))) {
    assert.ok(
      llmsText.includes(new URL(path, productionOrigin).href),
      `llms.txt ${path}`,
    )
  }
}

async function verifyCaliBabyProductData(baseUrl) {
  for (const [path, name, heading] of [
    ['/calibaby', 'Cali 宝宝', '从孕期到宝宝出生后的每一天'],
    ['/en/calibaby', 'Cali Baby: Baby Tracker', 'From pregnancy through everyday care'],
  ]) {
    const response = await fetch(new URL(path, baseUrl))
    assert.equal(response.status, 200, `${path} status`)
    assert.match(
      response.headers.get('link') ?? '',
      /<\/llms\.txt>; rel="describedby"/,
      `${path} llms.txt discovery header`,
    )
    const document = new JSDOM(await response.text()).window.document
    assert.match(document.body.textContent ?? '', new RegExp(heading))
    assert.match(document.body.textContent ?? '', /iOS 18/)

    const data = JSON.parse(
      requiredElement(
        document,
        'script[type="application/ld+json"]',
        `${path} structured data`,
      ).textContent ?? '{}',
    )
    assert.equal(data['@context'], 'https://schema.org')
    assert.equal(data['@type'], 'MobileApplication')
    assert.equal(data.name, name)
    assert.equal(data.url, new URL(path, productionOrigin).href)
    assert.equal(data.downloadUrl, 'https://apps.apple.com/app/id6769728441')
    assert.equal(data.applicationCategory, 'HealthApplication')
    assert.equal(data.offers?.price, 0)
    assert.equal(data.publisher?.name, 'Zolplay')
    assert.equal(data.featureList?.length, 4)
  }
}

async function verifyNotFound(baseUrl) {
  for (const pathname of [
    '/release-check-missing',
    '/blog/not-a-published-post',
    '/en/blog/not-a-published-post',
    '/newsletters/not-an-id',
    '/en/newsletters/not-an-id',
  ]) {
    const response = await fetch(new URL(pathname, baseUrl))
    assert.equal(response.status, 404, `${pathname} status`)
    const body = await response.text()
    const document = new JSDOM(body).window.document
    assert.match(
      requiredElement(
        document,
        'meta[name="robots"]',
        `${pathname} robots`,
      ).getAttribute('content') ?? '',
      /noindex/,
    )
    for (const element of document.querySelectorAll(
      'script, style, template, noscript',
    )) {
      element.remove()
    }
    const visibleText = document.body?.textContent ?? ''
    assert.match(visibleText, /This page slipped off the grid/)
    assert.match(visibleText, /Go home/)
    assert.doesNotMatch(
      visibleText,
      /(?:node_modules|\/Users\/|Error:|at\s+\w+\s*\()/,
    )
  }
}

async function verifyNoIndexUtilities(baseUrl) {
  const pages = [
    {
      path: '/confirm/legacy-token',
      title: 'Newsletter 确认链接已停用 | Cali Castle',
      description:
        '这个旧链接不会再读取或更新任何订阅信息。Newsletter 服务已经停止，你仍然可以通过 RSS 阅读网站更新。',
    },
    {
      path: '/en/confirm/legacy-token',
      title: 'Newsletter confirmation is retired | Cali Castle',
      description:
        'This old link no longer reads or updates subscriber information. The newsletter service has ended, but site updates remain available through RSS.',
    },
  ]

  for (const page of pages) {
    const response = await fetch(new URL(page.path, baseUrl))
    assert.equal(response.status, 200, `${page.path} status`)
    const document = new JSDOM(await response.text()).window.document
    assert.equal(document.title, page.title, `${page.path} title`)
    assert.equal(
      requiredElement(
        document,
        'meta[name="description"]',
        `${page.path} description`,
      ).getAttribute('content'),
      page.description,
    )
    const robots = requiredElement(
      document,
      'meta[name="robots"]',
      `${page.path} robots`,
    ).getAttribute('content') ?? ''
    assert.match(robots, /noindex/)
    assert.match(robots, /nofollow/)
  }
}

const server = await openProductionServer(process.env.PUBLIC_DISCOVERY_BASE_URL)
try {
  await verifyDiscoveryFiles(server.baseUrl)
  for (const page of publicPages) {
    await verifyMetadata(server.baseUrl, page)
  }
  await verifyCaliBabyProductData(server.baseUrl)
  await verifyNoIndexUtilities(server.baseUrl)
  await verifyNotFound(server.baseUrl)
  console.log(
    `Verified ${publicPages.length} public pages, discovery files, and failure handling against ${server.baseUrl}`,
  )
} finally {
  await server.stop()
}
