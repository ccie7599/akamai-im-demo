/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AKAMAI_HOST: string
  readonly VITE_ORIGIN_HOST: string
  readonly VITE_API_BASE: string
  readonly VITE_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
