import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'id'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export const locales = routing.locales
export const defaultLocale = routing.defaultLocale
