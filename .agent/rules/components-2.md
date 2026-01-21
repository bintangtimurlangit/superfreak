---
trigger: always_on
---

# Custom Components in Payload CMS

Custom Components allow you to fully customize the Admin Panel by swapping in your own React components. You can replace nearly every part of the interface or add entirely new functionality.

## Accessing Payload Config

**In Server Components:**

```tsx
async function MyServerComponent({ payload }) {
  const { config } = payload
  return <div>{config.serverURL}</div>
}
```

**In Client Components:**

```tsx
'use client'
import { useConfig } from '@payloadcms/ui'

export function MyClientComponent() {
  const { config } = useConfig() // Client-safe config
  return <div>{config.serverURL}</div>
}
```

**Important:** Client Components receive a serializable version of the config (functions, validation, etc. are stripped).

## Field Config Access

**Server Component:**

```tsx
import type { TextFieldServerComponent } from 'payload'

export const MyFieldComponent: TextFieldServerComponent = ({ field }) => {
  return <div>Field name: {field.name}</div>
}
```

**Client Component:**

```tsx
'use client'
import type { TextFieldClientComponent } from 'payload'

export const MyFieldComponent: TextFieldClientComponent = ({ clientField }) => {
  // clientField has non-serializable props removed
  return <div>Field name: {clientField.name}</div>
}
```

## Translations (i18n)

**Server Component:**

```tsx
import { getTranslation } from '@payloadcms/translations'

async function MyServerComponent({ i18n }) {
  const translatedTitle = getTranslation(myTranslation, i18n)
  return <p>{translatedTitle}</p>
}
```

**Client Component:**

```tsx
'use client'
import { useTranslation } from '@payloadcms/ui'

export function MyClientComponent() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <p>{t('namespace:key', { variable: 'value' })}</p>
      <p>Language: {i18n.language}</p>
    </div>
  )
}
```

## Styling Components

### Using CSS Variables

```tsx
import './styles.scss'

export function MyComponent() {
  return <div className="my-component">Custom Component</div>
}
```

```scss
// styles.scss
.my-component {
  background-color: var(--theme-elevation-500);
  color: var(--theme-text);
  padding: var(--base);
  border-radius: var(--border-radius-m);
}
```

### Importing Payload SCSS

```scss
@import '~@payloadcms/ui/scss';

.my-component {
  @include mid-break {
    background-color: var(--theme-elevation-900);
  }
}
```

## Common Patterns

### Conditional Field Visibility

```tsx
'use client'
import { useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

export const ConditionalField: TextFieldClientComponent = ({ path }) => {
  const showField = useFormFields(([fields]) => fields.enableFeature?.value)

  if (!showField) return null

  return <input type="text" />
}
```

### Loading Data from API

```tsx
'use client'
import { useState, useEffect } from 'react'

export function DataLoader() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/custom-data')
      .then((res) => res.json())
      .then(setData)
  }, [])

  return <div>{JSON.stringify(data)}</div>
}
```

### Using Local API in Server Components

```tsx
import type { Payload } from 'payload'

async function RelatedPosts({ payload, id }: { payload: Payload; id: string }) {
  const post = await payload.findByID({
    collection: 'posts',
    id,
    depth: 0,
  })

  const related = await payload.find({
    collection: 'posts',
    where: {
      category: { equals: post.category },
      id: { not_equals: id },
    },
    limit: 5,
  })

  return (
    <div>
      <h3>Related Posts</h3>
      <ul>
        {related.docs.map((doc) => (
          <li key={doc.id}>{doc.title}</li>
        ))}
      </ul>
    </div>
  )
}

export default RelatedPosts
```

## Performance Best Practices

### 1. Minimize Client Bundle Size

```tsx
// ❌ BAD: Imports entire package
'use client'
import { Button } from '@payloadcms/ui'

// ✅ GOOD: Tree-shakeable import for frontend
import { Button } from '@payloadcms/ui/elements/Button'
```

**Rule:** In Admin Panel UI, import from `@payloadcms/ui`. In frontend code, use specific paths.

### 2. Optimize Re-renders

```tsx
// ❌ BAD: Re-renders on every form change
'use client'
import { useForm } from '@payloadcms/ui'

export function MyComponent() {
  const { fields } = useForm()
  // Re-renders on ANY field change
}

// ✅ GOOD: Only re-renders when specific field changes
;('use client')
import { useFormFields } from '@payloadcms/ui'

export function MyComponent({ path }) {
  const value = useFormFields(([fields]) => fields[path])
  // Only re-renders when this field changes
}
```

### 3. Use Server Components When Possible

```tsx
// ✅ GOOD: No JavaScript sent to client
async function PostCount({ payload }) {
  const { totalDocs } = await payload.find({
    collection: 'posts',
    limit: 0,
  })

  return <p>{totalDocs} posts</p>
}

// Only use client components when you need:
// - State (useState, useReducer)
// - Effects (useEffect)
// - Event handlers (onClick, onChange)
// - Browser APIs (localStorage, window)
```

### 4. React Best Practices

- Use React.memo() for expensive components
- Implement proper key props in lists
- Avoid inline function definitions in renders
- Use Suspense boundaries for async operations

## Import Map

Payload generates an import map at `app/(payload)/admin/importMap.js` that resolves all component paths.

**Regenerate manually:**

```bash
payload generate:importmap
```

**Override location:**

```typescript
export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, 'src'),
      importMapFile: path.resolve(dirname, 'app', 'custom-import-map.js'),
    },
  },
})
```

## Type Safety

Use Payload's TypeScript types for components:

```tsx
import type {
  TextFieldServerComponent,
  TextFieldClientComponent,
  TextFieldCellComponent,
} from 'payload'

export const MyFieldComponent: TextFieldServerComponent = (props) => {
  // Fully typed props
}
```

## Troubleshooting

### "useConfig is undefined" or similar hook errors

**Cause:** Dependency version mismatch between Payload packages.

**Solution:** Pin all `@payloadcms/*` packages to the exact same version:

```json
{
  "dependencies": {
    "payload": "3.0.0",
    "@payloadcms/ui": "3.0.0",
    "@payloadcms/richtext-lexical": "3.0.0"
  }
}
```

### Component not loading

1. Check file path is correct (relative to baseDir)
2. Verify named export syntax: `/path/to/file#ExportName`
3. Run `payload generate:importmap` to regenerate
4. Check for TypeScript errors in component file

## Resources

- [Custom Components Docs](https://payloadcms.com/docs/custom-components/overview)
- [Root Components](https://payloadcms.com/docs/custom-components/root-components)
- [Custom Views](https://payloadcms.com/docs/custom-components/custom-views)
- [React Hooks](https://payloadcms.com/docs/admin/react-hooks)
- [Custom CSS](https://payloadcms.com/docs/admin/customizing-css)
