import { defineConfig } from 'unocss'

export default defineConfig({
  content: {
    filesystem: ['src/**/*.{ts,tsx,html}']
  },
  shortcuts: {
    cell: 'px-2 py-1 text-sm text-main',
    'text-main': 'text-#333 dark:text-#ccc',
    'text-sub': 'text-#666 dark:text-#888'
  }
})
