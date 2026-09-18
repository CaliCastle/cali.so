import { defineConfig, devices } from '@playwright/test'

const hostedBaseUrl = process.env.PLAYWRIGHT_BASE_URL
const baseURL = hostedBaseUrl ?? 'http://127.0.0.1:3210'
const localServerEnv = {
  ...process.env,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'owner@example.com',
  AMA_ENCRYPTION_KEY:
    process.env.AMA_ENCRYPTION_KEY ?? 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  BUNNY_CDN_API_KEY: process.env.BUNNY_CDN_API_KEY ?? 'ci-cdn-api-key',
  BUNNY_MEDIA_REGION: process.env.BUNNY_MEDIA_REGION ?? 'ny',
  BUNNY_MEDIA_CDN_URL:
    process.env.BUNNY_MEDIA_CDN_URL ?? 'https://media-ci.example.com',
  BUNNY_MEDIA_PASSWORD:
    process.env.BUNNY_MEDIA_PASSWORD ?? 'ci-media-password',
  BUNNY_MEDIA_ZONE: process.env.BUNNY_MEDIA_ZONE ?? 'ci-media',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? 'sk_live_ci_secret_not_real',
  DATABASE_URL:
    process.env.DATABASE_URL ?? 'postgresql://runtime:runtime@127.0.0.1:5432/cali',
  MEDIA_ENCRYPTION_KEY:
    process.env.MEDIA_ENCRYPTION_KEY ?? 'BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU=',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'pk_live_Y2xlcmsuY2FsaS5zbyQ',
  RATE_LIMIT_HASH_KEY:
    process.env.RATE_LIMIT_HASH_KEY ?? 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=',
  RESUME_PASSPHRASE: 'local-resume-preview-only',
  RESUME_SESSION_SECRET: 'local-resume-test-secret-not-for-deployment-1234567890',
  // Native same-origin forms must use the local test server's origin.
  // Public canonical URLs remain controlled by PUBLIC_SITE_URL.
  SITE_URL: baseURL,
}

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: hostedBaseUrl
    ? undefined
    : {
        command: 'pnpm start --hostname 127.0.0.1 --port 3210',
        env: localServerEnv,
        reuseExistingServer: false,
        timeout: 120_000,
        url: baseURL,
      },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'webkit-smoke',
      grep: /@smoke/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
})
