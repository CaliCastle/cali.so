import { ExternalLink } from '~/components/external-link'
import { HomeIntroReplay } from '~/components/home-intro-replay'
import {
  EmailCard,
  GitHubCard,
  type GitHubSnapshot,
  type SocialSnapshot,
  XCard,
  XiaohongshuCard,
} from '~/components/social-cards'
import { T } from '~/lib/i18n'
import { faviconUrl, getLinkPreview } from '~/lib/link-previews'

const ZOLPLAY_URL = 'https://zolplay.com'
const ZOLPLAY_FAVICON_SRC = faviconUrl(ZOLPLAY_URL)!

function DesignEngineerMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
      className="home-design-mark"
    >
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.82315 4.31111C5.82682 4.63284 8.45211 5.06784 11.179 4.32111C10.8668 2.85207 9.5621 1.75 8 1.75C6.44144 1.75 5.13912 2.84707 4.82315 4.31111Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="none"
        />
        <path
          className="home-design-laptop"
          d="M14.925 16.25H8.75L10.618 12.047C10.698 11.866 10.877 11.75 11.075 11.75H16.481C16.843 11.75 17.085 12.122 16.938 12.453L15.382 15.953C15.302 16.134 15.123 16.25 14.925 16.25Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="none"
        />
        <path d="M8 8.25C9.79493 8.25 11.25 6.79493 11.25 5C11.25 3.20507 9.79493 1.75 8 1.75C6.20507 1.75 4.75 3.20507 4.75 5C4.75 6.79493 6.20507 8.25 8 8.25Z" />
        <path d="M11.179 4.32401C10.166 4.60201 9.1 4.75001 8 4.75001C6.117 4.75001 4.336 4.31601 2.75 3.54401" />
        <path d="M1.953 14C3.251 12.042 5.475 10.75 8 10.75" />
        <path
          className="home-design-laptop"
          d="M14.925 16.25H8.75L10.618 12.047C10.698 11.866 10.877 11.75 11.075 11.75H16.481C16.843 11.75 17.085 12.122 16.938 12.453L15.382 15.953C15.302 16.134 15.123 16.25 14.925 16.25Z"
        />
        <path className="home-design-laptop" d="M8.75 16.25H5.75" />
      </g>
      <path
        className="home-design-sparkle home-design-sparkle-a"
        d="M3.49301 8.51903L2.54701 8.20403L2.23101 7.25703C2.12901 6.95103 1.62201 6.95103 1.52001 7.25703L1.20401 8.20403L0.258007 8.51903C0.105007 8.57003 0.00100708 8.71303 0.00100708 8.87503C0.00100708 9.03703 0.105007 9.18003 0.258007 9.23103L1.20401 9.54603L1.52001 10.493C1.57101 10.646 1.71401 10.749 1.87501 10.749C2.03601 10.749 2.18001 10.645 2.23001 10.493L2.54601 9.54603L3.49201 9.23103C3.64501 9.18003 3.74901 9.03703 3.74901 8.87503C3.74901 8.71303 3.64601 8.57003 3.49301 8.51903Z"
        fill="currentColor"
      />
      <path
        className="home-design-sparkle home-design-sparkle-b"
        d="M17.658 6.52601L16.395 6.10501L15.974 4.84201C15.837 4.43401 15.162 4.43401 15.025 4.84201L14.604 6.10501L13.341 6.52601C13.137 6.59401 12.999 6.78501 12.999 7.00001C12.999 7.21501 13.137 7.40601 13.341 7.47401L14.604 7.89501L15.025 9.15801C15.093 9.36201 15.285 9.50001 15.5 9.50001C15.715 9.50001 15.906 9.36201 15.975 9.15801L16.396 7.89501L17.659 7.47401C17.863 7.40601 18.001 7.21501 18.001 7.00001C18.001 6.78501 17.862 6.59401 17.658 6.52601Z"
        fill="currentColor"
      />
      <path
        className="home-design-sparkle home-design-sparkle-dot"
        d="M14.25 3C14.6642 3 15 2.66421 15 2.25C15 1.83579 14.6642 1.5 14.25 1.5C13.8358 1.5 13.5 1.83579 13.5 2.25C13.5 2.66421 13.8358 3 14.25 3Z"
        fill="currentColor"
      />
    </svg>
  )
}

function DetailsMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
      className="home-details-mark"
    >
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <ellipse
          cx="9"
          cy="9"
          rx="7.4439"
          ry="4.7786"
          transform="translate(-3.7279 9) rotate(-45)"
          fill="currentColor"
          opacity="0.3"
          strokeWidth="0"
        />
        <path
          d="m14.659,12.9899-1.263-.421-.421-1.2629c-.137-.408-.812-.408-.949,0l-.421,1.2629-1.263.421c-.204.068-.342.259-.342.474s.138.406.342.474l1.263.421.421,1.263c.068.204.26.342.475.342s.406-.138.475-.342l.421-1.263,1.263-.421c.204-.068.342-.259.342-.474s-.139-.406-.343-.474Z"
          strokeWidth="0"
          fill="currentColor"
        />
        <path d="m5.5,2.25.671,2.579,2.579.671-2.579.671-.671,2.579-.671-2.579-2.579-.671,2.579-.671.671-2.579Z" fill="currentColor" />
        <path d="m8.1994,14.9708c-1.7641.5243-3.419.3232-4.4562-.714-.9464-.9464-1.1967-2.4072-.8349-3.9959" />
        <path d="m10.261,2.9083c1.5887-.3618,3.0494-.1114,3.9958.8349,1.2963,1.2963,1.2866,3.5575.187,5.7907" />
        <path
          d="m9.75,10c.4142,0,.75-.3358.75-.75s-.3358-.75-.75-.75-.75.3358-.75.75.3358.75.75.75Z"
          strokeWidth="0"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

function DesignEngineerPhrase({ children }: { children: React.ReactNode }) {
  return (
    <HomeIntroReplay>
      <span className="home-design-label">{children}</span>
      <DesignEngineerMark />
    </HomeIntroReplay>
  )
}

function DetailsPhrase({ children }: { children: React.ReactNode }) {
  return (
    <HomeIntroReplay>
      <DetailsMark />
      {children}
    </HomeIntroReplay>
  )
}

function ZolplayLink({ children }: { children: React.ReactNode }) {
  return (
    <span className="home-zolplay-link">
      <ExternalLink
        href={ZOLPLAY_URL}
        favicon={ZOLPLAY_FAVICON_SRC}
        preview={getLinkPreview(ZOLPLAY_URL)}
      >
        {children}
      </ExternalLink>
    </span>
  )
}

function HomeContact({ social, github }: { social: SocialSnapshot; github: GitHubSnapshot }) {
  return (
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
      <T
        zh={
          <>
            可以在 <XCard data={social} trigger="@calicastle" triggerClassName="home-contact-link" />、
            <GitHubCard data={github} triggerClassName="home-contact-link" /> 和
            <XiaohongshuCard triggerClassName="home-contact-link" />找到我，也可以发邮件到{' '}
            <EmailCard address="hi@cali.so" trigger="hi@cali.so" triggerClassName="home-contact-link" />。
          </>
        }
        en={
          <>
            Find me at <XCard data={social} trigger="@calicastle" triggerClassName="home-contact-link" />,{' '}
            <GitHubCard data={github} triggerClassName="home-contact-link" /> and{' '}
            <EmailCard address="hi@cali.so" trigger="hi@cali.so" triggerClassName="home-contact-link" />
          </>
        }
      />
    </p>
  )
}

export function HomeIntroduction({ social, github }: { social: SocialSnapshot; github: GitHubSnapshot }) {
  return (
    <div className="home-introduction">
      <p className="text-sm leading-relaxed text-muted-foreground">
        <T
          zh={
            <>
              我是 陈纳兰，一名极简的辩证主义者，也是一名
              <DesignEngineerPhrase>全栈工程师</DesignEngineerPhrase>。我也是 lastwar 指挥官，热爱把细节做到
              <DetailsPhrase>
                <span className="home-detail-units">
                  <span className="home-detail-unit">刚</span>
                  <span className="home-detail-unit">刚</span>
                  <span className="home-detail-unit">好</span>
                </span>
              </DetailsPhrase>
              。
            </>
          }
          en={
            <>
              I’m Cali, a father of two and a <DesignEngineerPhrase>design engineer</DesignEngineerPhrase>. I’m also an
              agent orchestrator, and I love getting the{' '}
              <DetailsPhrase>
                <span className="home-detail-units home-detail-words">
                  <span className="home-detail-unit">details</span>
                  {' '}
                  <span className="home-detail-unit">just</span>
                  {' '}
                  <span className="home-detail-unit">right</span>
                  <span className="home-detail-period">.</span>
                </span>
              </DetailsPhrase>
            </>
          }
        />
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        <T
          zh={
            <>
              我创办了<ZolplayLink>佐玩</ZolplayLink>，一家打造产品、品牌与数字体验的 AI 原生设计工作室。
            </>
          }
          en={
            <>
              I founded <ZolplayLink>Zolplay</ZolplayLink>, an AI-native design studio creating products, brands, and
              digital experiences.
            </>
          }
        />
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        <T
          zh="我兴趣很杂，什么都爱试试。和团队一起做东西，我在意好点子、好细节，也在意玩得开心。"
          en="Being a generalist is kind of my thing. I bring curiosity, craft, and a little fun to whatever the team is making."
        />
      </p>
      <HomeContact social={social} github={github} />
    </div>
  )
}
