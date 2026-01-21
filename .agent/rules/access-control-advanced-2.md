---
trigger: always_on
description: Context-aware, time-based, subscription-based access, factory functions, templates
---

# Advanced Access Control Patterns

Advanced access control patterns including context-aware access, time-based restrictions, factory functions, and production templates.

## Configuration Templates

### Public + Authenticated Collection

```typescript
export const PublicAuthCollection: CollectionConfig = {
  slug: 'posts',
  access: {
    // Only admins/editors can create
    create: ({ req: { user } }) => {
      return user?.roles?.some((role) => ['admin', 'editor'].includes(role)) || false
    },

    // Authenticated users see all, public sees only published
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },

    // Only admins/editors can update
    update: ({ req: { user } }) => {
      return user?.roles?.some((role) => ['admin', 'editor'].includes(role)) || false
    },

    // Only admins can delete
    delete: ({ req: { user } }) => {
      return user?.roles?.includes('admin') || false
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText', required: true },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
}
```

### Self-Service Collection

```typescript
export const SelfServiceCollection: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    // Admins can create users
    create: ({ req: { user } }) => user?.roles?.includes('admin') || false,

    // Anyone can read user profiles
    read: () => true,

    // Users can update self, admins can update anyone
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return user.id === id
    },

    // Only admins can delete
    delete: ({ req: { user } }) => user?.roles?.includes('admin') || false,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      access: {
        // Only admins can read/update roles
        read: ({ req: { user } }) => user?.roles?.includes('admin') || false,
        update: ({ req: { user } }) => user?.roles?.includes('admin') || false,
      },
    },
  ],
}
```

## Performance Considerations

### Avoid Async Operations in Hot Paths

```typescript
// ❌ Slow: Multiple sequential async calls
export const slowAccess: Access = async ({ req: { user } }) => {
  const org = await req.payload.findByID({ collection: 'orgs', id: user.orgId })
  const team = await req.payload.findByID({ collection: 'teams', id: user.teamId })
  const subscription = await req.payload.findByID({ collection: 'subs', id: user.subId })

  return org.active && team.active && subscription.active
}

// ✅ Fast: Use query constraints or cache in context
export const fastAccess: Access = ({ req: { user, context } }) => {
  // Cache expensive lookups
  if (!context.orgStatus) {
    context.orgStatus = checkOrgStatus(user.orgId)
  }

  return context.orgStatus
}
```

### Query Constraint Optimization

```typescript
// ❌ Avoid: Non-indexed fields in constraints
export const slowQuery: Access = () => ({
  'metadata.internalCode': { equals: 'ABC123' }, // Slow if not indexed
})

// ✅ Better: Use indexed fields
export const fastQuery: Access = () => ({
  status: { equals: 'active' }, // Indexed field
  organizationId: { in: ['org1', 'org2'] }, // Indexed field
})
```

### Field Access on Large Arrays

```typescript
// ❌ Slow: Complex access on array fields
{
  name: 'items',
  type: 'array',
  fields: [
    {
      name: 'secretData',
      type: 'text',
      access: {
        read: async ({ req }) => {
          // Async call runs for EVERY array item
          const result = await expensiveCheck()
          return result
        },
      },
    },
  ],
}

// ✅ Fast: Simple checks or cache result
{
  name: 'items',
  type: 'array',
  fields: [
    {
      name: 'secretData',
      type: 'text',
      access: {
        read: ({ req: { user }, context }) => {
          // Cache once, reuse for all items
          if (context.canReadSecret === undefined) {
            context.canReadSecret = user?.roles?.includes('admin')
          }
          return context.canReadSecret
        },
      },
    },
  ],
}
```

### Avoid N+1 Queries

```typescript
// ❌ N+1 Problem: Query per access check
export const n1Access: Access = async ({ req, id }) => {
  // Runs for EACH document in list
  const doc = await req.payload.findByID({ collection: 'docs', id })
  return doc.isPublic
}

// ✅ Better: Use query constraint to filter at DB level
export const efficientAccess: Access = () => {
  return { isPublic: { equals: true } }
}
```

## Debugging Tips

### Log Access Check Execution

```typescript
export const debugAccess: Access = ({ req: { user }, id }) => {
  console.log('Access check:', {
    userId: user?.id,
    userRoles: user?.roles,
    docId: id,
    timestamp: new Date().toISOString(),
  })
  return true
}
```

### Verify Arguments Availability

```typescript
export const checkArgsAccess: Access = (args) => {
  console.log('Available arguments:', {
    hasReq: 'req' in args,
    hasUser: args.req?.user ? 'yes' : 'no',
    hasId: args.id ? 'provided' : 'undefined',
    hasData: args.data ? 'provided' : 'undefined',
  })
  return true
}
```

### Test Access Without User

```typescript
// In test/development
const testAccess = await payload.find({
  collection: 'posts',
  overrideAccess: false, // Enforce access control
  user: undefined, // Simulate no user
})

console.log('Public access result:', testAccess.docs.length)
```

## Best Practices

1. **Default Deny**: Start with restrictive access, gradually add permissions
2. **Type Guards**: Use TypeScript for user type safety
3. **Validate Data**: Never trust frontend-provided IDs or data
4. **Async for Critical Checks**: Use async operations for important security decisions
5. **Consistent Logic**: Apply same rules at field and collection levels
6. **Test Edge Cases**: Test with no user, wrong user, admin user scenarios
7. **Monitor Access**: Log failed access attempts for security review
8. **Regular Audit**: Review access rules quarterly or after major changes
9. **Cache Wisely**: Use `req.context` for expensive operations
10. **Document Intent**: Add comments explaining complex access rules
11. **Avoid Secrets in Client**: Never expose sensitive logic to client-side
12. **Handle Errors Gracefully**: Access functions should return `false` on error, not throw
13. **Test Local API**: Remember to set `overrideAccess: false` when testing
14. **Consider Performance**: Measure impact of async operations
15. **Principle of Least Privilege**: Grant minimum access required

## Performance Summary

**Minimize Async Operations**: Use query constraints over async lookups when possible

**Cache Expensive Checks**: Store results in `req.context` for reuse

**Index Query Fields**: Ensure fields in query constraints are indexed

**Avoid Complex Logic in Array Fields**: Simple boolean checks preferred

**Use Query Constraints**: Let database filter rather than loading all records