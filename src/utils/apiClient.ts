/**
 * Centralized Authenticated Staff API Client
 * Ensures consistent session token propagation, Bearer authorization,
 * credentials inclusion, and cookie synchronization across all staff endpoints.
 */

export function getStoredStaffToken(): string {
  try {
    const local = localStorage.getItem('wcr_staff_token');
    if (local && local.trim()) return local.trim();
    const session = sessionStorage.getItem('wcr_staff_token');
    if (session && session.trim()) return session.trim();

    // Check cookie fallback
    const match = document.cookie.match(/(?:^|;\s*)(?:wcr_session|wcr_staff_token)=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    // ignore local storage restrictions in sandboxes
  }
  return '';
}

export function setStoredStaffToken(token: string): void {
  try {
    if (token && token.trim()) {
      const cleanToken = token.trim();
      localStorage.setItem('wcr_staff_token', cleanToken);
      sessionStorage.setItem('wcr_staff_token', cleanToken);
      document.cookie = `wcr_session=${encodeURIComponent(cleanToken)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `wcr_staff_token=${encodeURIComponent(cleanToken)}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      clearStoredStaffToken();
    }
  } catch {
    // ignore
  }
}

export function clearStoredStaffToken(): void {
  try {
    localStorage.removeItem('wcr_staff_token');
    sessionStorage.removeItem('wcr_staff_token');
    document.cookie = 'wcr_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'wcr_staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } catch {
    // ignore
  }
}

export function getStoredStaffRole(): string {
  try {
    return localStorage.getItem('wcr_staff_role') || sessionStorage.getItem('wcr_staff_role') || 'HR';
  } catch {
    return 'HR';
  }
}

export function setStoredStaffRole(role: string): void {
  try {
    localStorage.setItem('wcr_staff_role', role);
    sessionStorage.setItem('wcr_staff_role', role);
  } catch {
    // ignore
  }
}

/**
 * Standard authenticated fetch wrapper for all staff requests.
 * Automatically injects:
 * - credentials: 'include'
 * - Authorization: Bearer <token>
 * - x-session-token: <token>
 * - x-staff-token: <token>
 * - x-user-role: <role>
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getStoredStaffToken();
  const role = getStoredStaffRole();

  const headers = new Headers(init.headers || {});

  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('x-session-token')) {
      headers.set('x-session-token', token);
    }
    if (!headers.has('x-staff-token')) {
      headers.set('x-staff-token', token);
    }
  }

  if (role && !headers.has('x-user-role')) {
    headers.set('x-user-role', role);
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}

/**
 * Safely parses JSON response from fetch.
 * Protects against HTML error pages, <!doctype ... unexpected tokens, and empty bodies.
 */
export async function safeJson<T = any>(
  response: Response,
  fallback: any = { success: false }
): Promise<T> {
  try {
    const contentType = response.headers?.get?.('content-type') || '';
    if (!response.ok && contentType.includes('text/html')) {
      return fallback as T;
    }
    const text = await response.text();
    if (!text || !text.trim()) {
      return fallback as T;
    }
    const trimmed = text.trim();
    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
      return fallback as T;
    }
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback as T;
  }
}

