// Central backend URL configuration.
// An explicit VITE_API_URL can point to a dedicated API. By default, use the
// current origin so the Cloudflare Worker can proxy API and WebSocket traffic.
const DEFAULT_API_BASE = '';
const RAW_BASE = (import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE).trim();

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
