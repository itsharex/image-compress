import { defineConfig } from 'unocss'

export default defineConfig({
  content: {
    filesystem: ['src/**/*.{ts,tsx,html}'],
  },
  shortcuts: {
    'cell': 'px-2 py-1 text-sm text-#333'
  }
})
