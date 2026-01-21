import type { User } from '@/lib/auth/types'

import type { AccessArgs } from 'payload'

import { userHasRole, type UserRole } from './userHasRole'

export const hasRole =
  (roles: NonNullable<User['role']>) =>
  ({ req: { user } }: Pick<AccessArgs, 'req'>): boolean => {
    return userHasRole(user as UserRole | null, roles)
  }