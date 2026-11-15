import { fileURLToPath } from 'node:url'

import { mergeConfig, defineConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        'virtual:pwa-register/react': fileURLToPath(new URL('./src/test/pwaRegisterMock.ts', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
    },
  }),
)
