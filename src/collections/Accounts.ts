import type { CollectionConfig } from 'payload'
import { withAccountCollection } from 'payload-auth-plugin/collection'
import { Users } from './Users'

export const Accounts: CollectionConfig = withAccountCollection(
  {
    slug: 'accounts',
  },
  Users.slug
)
