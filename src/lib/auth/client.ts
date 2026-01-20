'use client'

import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { betterAuthOptions } from './options'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        phoneNumber: {
          type: 'string'
        },
        image: {
          type: 'string'
        }
      }
    })
  ],
  fetchOptions: {
    onError(e: { error?: { status?: number; message?: string } }) {
      console.error('Auth error:', e)
      // You can add toast notifications here if needed
    }
  },
  $InferAuth: betterAuthOptions
})

export const { signUp, signIn, signOut, useSession, updateUser } = authClient

authClient.$store.listen('$sessionSignal', async () => {
  // Handle session changes
})
