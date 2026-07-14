/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISTRI_API_URL?: string;
  readonly VITE_DISTRI_CLIENT_ID?: string;
  readonly VITE_DISTRI_WORKSPACE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
