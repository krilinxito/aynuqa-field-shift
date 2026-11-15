/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DATA_MODE?: 'mock' | 'api'
  readonly VITE_DEMO_DATA?: string
  readonly VITE_POWERSYNC_ENABLED?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
