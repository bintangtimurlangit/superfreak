import { withAccountCollection } from 'payload-auth-plugin/collection'

export const AppUsersAccounts = withAccountCollection(
  {
    slug: 'app-user-accounts',
  },
  'app-users' // Links to AppUsers collection
)

// Hide from admin panel - only used internally for OAuth
if (AppUsersAccounts.admin) {
  AppUsersAccounts.admin.hidden = true
} else {
  AppUsersAccounts.admin = { hidden: true }
}
