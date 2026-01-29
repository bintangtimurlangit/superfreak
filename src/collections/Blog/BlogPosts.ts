import type { CollectionConfig } from 'payload'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categories', 'createdAt', 'updatedAt'],
    group: 'Content',
  },
  access: {
    // Public can read published posts
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },
    // Only admins can create/update/delete
    create: ({ req: { user } }) => {
      return user?.role?.includes('admin') || false
    },
    update: ({ req: { user } }) => {
      return user?.role?.includes('admin') || false
    },
    delete: ({ req: { user } }) => {
      return user?.role?.includes('admin') || false
    },
  },
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: {
        description: 'The title of the blog post',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly version of the title (auto-generated)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Main image for the blog post (WebP recommended)',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 300,
      admin: {
        description: 'Short summary shown in blog list (auto-generated from content if empty)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Full article content',
      },
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'News', value: 'news' },
        { label: 'Military', value: 'military' },
        { label: 'Technology', value: 'technology' },
        { label: 'Materials', value: 'materials' },
        { label: 'Design', value: 'design' },
        { label: 'Industry News', value: 'industry-news' },
        { label: 'Tutorials', value: 'tutorials' },
        { label: 'Tips & Tricks', value: 'tips-tricks' },
        { label: 'Business', value: 'business' },
      ],
      admin: {
        description: 'Categories for filtering and organization',
      },
    },
    {
      name: 'author',
      type: 'text',
      defaultValue: 'Superfreak Team',
      admin: {
        description: 'Author name',
      },
    },
    {
      name: 'readTime',
      type: 'text',
      admin: {
        description: 'Estimated reading time (auto-calculated if empty)',
      },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) => {
            if (!value && siblingData?.content) {
              // Calculate read time based on content
              // Average reading speed: 200 words per minute
              const text =
                typeof siblingData.content === 'string'
                  ? siblingData.content
                  : JSON.stringify(siblingData.content)
              const wordCount = text.split(/\s+/).length
              const minutes = Math.ceil(wordCount / 200)
              return `${minutes} min read`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Source URL or attribution (optional)',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        description: 'Publication date (defaults to creation date)',
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ value, operation }) => {
            if (operation === 'create' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
  ],
  timestamps: true,
}
