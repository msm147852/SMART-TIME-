// Central backend URL configuration.
// An explicit VITE_API_URL always wins. Otherwise use the deployed Railway API,
// because the Vercel deployment serves the frontend and does not host Express routes.
const DEFAULT_API_BASE = 'https://smart-time-production-661f.up.railway.app';
const RAW_BASE = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).trim();

// Remove trailing slashes to avoid double slashes in generated URLs.
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

/** Build a complete backend API URL. */
export function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

/** Build a WebSocket URL using the same backend base. */
export function wsUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  if (API_BASE_URL) {
    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    return `${wsBase}${path}`;
  }
  if (typeof window === 'undefined') return path;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}
