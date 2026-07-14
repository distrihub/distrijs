/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the frontend fetches its short-lived Distri token from. */
  readonly VITE_DISTRI_TOKEN_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
