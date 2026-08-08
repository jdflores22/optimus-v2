import { canAccessRoute } from './routeAccess';
import { postAuthHomePath } from './postAuthHomePath';

const LAST_ACTIVITY_PATH_KEY = 'optimus.v2.lastActivityPath';

const PUBLIC_AUTH_PATH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/role-acceptance',
  '/verify/',
] as const;

const DEFAULT_IDLE_MINUTES = 30;

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

/** Persist the last in-app route (for return after session expiry / re-login). */
export function saveLastActivityPath(pathname: string, search = ''): void {
  if (!pathname || isPublicAuthPath(pathname)) return;
  const fullPath = `${pathname}${search}`;
  try {
    localStorage.setItem(LAST_ACTIVITY_PATH_KEY, fullPath);
  } catch {
    /* ignore quota errors */
  }
}

export function getLastActivityPath(): string | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_PATH_KEY);
    if (!raw) return null;
    const pathname = raw.split('?')[0] ?? raw;
    if (isPublicAuthPath(pathname)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function clearLastActivityPath(): void {
  try {
    localStorage.removeItem(LAST_ACTIVITY_PATH_KEY);
  } catch {
    /* ignore */
  }
}

/** After login: restore last page when allowed, otherwise role home. */
export function resolvePostLoginPath(role?: string | null): string {
  const saved = getLastActivityPath();
  if (saved) {
    const pathname = saved.split('?')[0] ?? saved;
    if (!isPublicAuthPath(pathname) && canAccessRoute(pathname, role)) {
      clearLastActivityPath();
      return saved;
    }
  }
  clearLastActivityPath();
  return postAuthHomePath(role);
}

export function getSessionIdleMinutes(): number {
  const fromEnv = import.meta.env.VITE_SESSION_IDLE_MINUTES;
  if (fromEnv) {
    const parsed = Number.parseInt(String(fromEnv), 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_IDLE_MINUTES;
}
