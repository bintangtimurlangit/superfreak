import type { Config } from 'tailwindcss'

/**
 * Disable automatic dark mode (prefers-color-scheme) until we explicitly
 * implement a theme switcher. With `darkMode: 'class'`, `dark:*` styles only
 * apply when `.dark` is present on a parent element.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.html',
  ],
}

export default config

