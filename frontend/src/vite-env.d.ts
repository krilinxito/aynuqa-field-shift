/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DATA_MODE?: 'mock' | 'api'
  readonly VITE_DEMO_DATA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
