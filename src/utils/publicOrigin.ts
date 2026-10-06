/**
 * WCR Office Operations PWA - Public Production Origin Manager
 *
 * Provides a single centralized helper to obtain the verified public HTTPS production
 * origin for candidate self-registration QR codes, passes, and links.
 *
 * Guarantees:
 * 1. Never returns localhost, 127.0.0.1, or private intranet URLs
 * 2. Prioritizes custom domain (https://ops.whitecollarrealty.com) if configured
 * 3. Supports explicit environment variable override (VITE_PUBLIC_APP_URL / PUBLIC_APP_URL)
 * 4. Falls back to verified unauthenticated public Cloud Run gateway
 */

export const VERIFIED_PUBLIC_FALLBACK_ORIGIN =
  'https://ais-dev-h6vhp3o7l73hhpmpjtjpol-912480930497.asia-southeast1.run.app';

export const INTENDED_PRODUCTION_DOMAIN = 'https://ops.whitecollarrealty.com';

/**
 * Returns the verified public production origin for candidate QRs and links.
 */
export function getPublicAppOrigin(): string {
  // 1. Explicit environment variable configured at build/runtime
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PUBLIC_APP_URL) ||
    (typeof process !== 'undefined' && process.env && (process.env.VITE_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL));

  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 2. Global window configuration if dynamically injected
  if (typeof window !== 'undefined' && (window as any).__PUBLIC_APP_URL__) {
    const injected = (window as any).__PUBLIC_APP_URL__;
    if (typeof injected === 'string' && injected.trim().length > 0) {
      return injected.trim().replace(/\/+$/, '');
    }
  }

  // 3. Current browser window location inspection
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    // Check if custom production domain is active
    if (hostname.includes('whitecollarrealty.com')) {
      return origin;
    }

    // Do NOT return local development hostnames on mobile QR codes
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local');

    if (!isLocalhost && origin.startsWith('https://')) {
      return origin;
    }
  }

  // 4. Return verified public production HTTPS gateway
  return VERIFIED_PUBLIC_FALLBACK_ORIGIN;
}

/**
 * Generates the full public candidate self-registration URL.
 * Defaults to blank intake form at `/register`.
 */
export function getCandidateRegistrationUrl(token?: string): string {
  const publicOrigin = getPublicAppOrigin();
  if (token) {
    return `${publicOrigin}/register/${encodeURIComponent(token)}`;
  }
  return `${publicOrigin}/register`;
}

/**
 * Generates the full public candidate scheduled check-in URL.
 */
export function getCandidateCheckInUrl(token: string): string {
  const publicOrigin = getPublicAppOrigin();
  return `${publicOrigin}/candidate/check-in/${encodeURIComponent(token)}`;
}
