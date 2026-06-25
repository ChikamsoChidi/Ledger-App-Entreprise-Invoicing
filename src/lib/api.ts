// =============================================================================
// API CLIENT
// -----------------------------------------------------------------------------
// The backend host lives in ONE place. To change the IP/port for the whole app:
//   • Edit `VITE_API_BASE_URL` in `.env` (build-time default), OR
//   • Change it at runtime via the Settings page (stored in localStorage).
// No component imports a hard-coded URL — they all go through `api()`.
// =============================================================================

const STORAGE_KEY = "api_base_url_override";
const TOKEN_KEY = "auth_token";
const TENANT_KEY = "tenant_id";
const USER_KEY = "user_id";

export const DEFAULT_API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const override = window.localStorage.getItem(STORAGE_KEY);
    if (override && override.trim()) return override.replace(/\/+$/, "");
  }
  return DEFAULT_API_BASE_URL.replace(/\/+$/, "");
}

export function setApiBaseUrl(url: string) {
  if (typeof window === "undefined") return;
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) window.localStorage.removeItem(STORAGE_KEY);
  else window.localStorage.setItem(STORAGE_KEY, trimmed);
}

export function getToken() {
  return typeof window !== "undefined"
    ? window.localStorage.getItem(TOKEN_KEY)
    : null;
}

export function setAuth(token: string, tenantId: string, userId: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(TENANT_KEY, tenantId);
  window.localStorage.setItem(USER_KEY, userId);
}

export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TENANT_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getTenantId() {
  return typeof window !== "undefined"
    ? window.localStorage.getItem(TENANT_KEY)
    : null;
}

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown, message: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (err) {
    throw new ApiError(
      0,
      null,
      `Cannot reach backend at ${base}. Is the server running?`,
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      (data && typeof data === "object" && "detail" in data
        ? (data as { detail: unknown }).detail
        : data) ?? res.statusText;
    const message =
      typeof detail === "string" ? detail : `Request failed (${res.status})`;
    throw new ApiError(res.status, detail, message);
  }

  return data as T;
}
