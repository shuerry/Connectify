// Centralized API base for client requests
// Use Vite environment variable VITE_API_URL when provided; fall back to localhost in dev
export const API_BASE =
  (import.meta as ImportMeta).env?.VITE_API_URL ??
  ((import.meta as ImportMeta).env?.DEV
    ? 'http://localhost:8000'
    : 'https://fall25-project-fall25-509-backend.onrender.com');

export const apiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
