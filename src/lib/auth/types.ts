/**
 * Auth-related types. Nest-only after Phase 10; no Payload/better-auth dependency.
 */

import type { ApiUser } from './api-auth'

export type User = ApiUser

/** Placeholder for removed better-auth session; unused when using Nest only. */
export interface Session {
  user: User
  [key: string]: unknown
}

/** Placeholder for removed better-auth accounts list. */
export type Account = { id: string; providerId: string; [key: string]: unknown }

/** Placeholder for removed better-auth device sessions. */
export type DeviceSession = { id: string; [key: string]: unknown }
