'use client'

import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { betterAuthOptions } from './options'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        phoneNumber: {
          type: 'string',
        },
        image: {
          type: 'string',
        },
      },
    }),
  ],
  fetchOptions: {
    onError(e: { error?: { status?: number; message?: string } }) {
      console.error('Auth error:', e)
    },
  },
  $InferAuth: betterAuthOptions,
})

export const { signUp, signIn, signOut, useSession, updateUser, changePassword } = authClient

authClient.$store.listen('$sessionSignal', async () => {})
