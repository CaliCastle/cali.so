'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeMinimal } from '@supabase/auth-ui-shared'

import { url } from '~/lib'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  return (
    <div>
      <h1>Login</h1>
      <Auth
        supabaseClient={supabase}
        onlyThirdPartyProviders
        appearance={{ theme: ThemeMinimal }}
        providers={['google', 'github']}
        redirectTo={url('/').href}
      />
    </div>
  )
}
