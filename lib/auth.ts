import type { AuthSession, CurrentUser } from '@/types/auth';

const TOKEN_KEY = 'token';
const USER_KEY = 'currentUser';

/**
 * Reads the bearer token stored by the login flow. Returns `''`
 * during SSR (no `sessionStorage`) so callers can use it directly
 * in `Authorization: Bearer ${...}` without extra guards.
 */
export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(TOKEN_KEY) ?? '';
}

/**
 * Returns the logged-in user, or `null` if no session is stored
 * or the stored value is malformed. Safe to call during SSR.
 */
export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

/** Persists the session from a successful login response. */
export function setAuthSession(session: AuthSession): void {
  sessionStorage.setItem(TOKEN_KEY, session.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

/** Clears the session — call on logout or auth errors. */
export function clearAuthSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
