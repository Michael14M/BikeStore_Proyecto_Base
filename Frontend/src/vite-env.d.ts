/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API del backend, ej. http://localhost:3000/api */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
