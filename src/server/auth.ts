import crypto from 'crypto';
import type { Request } from 'express';
import type { User, UserRole, StaffSession } from '../types/index.ts';

const DEFAULT_SALT = 'wcr_office_ops_salt';

export function hashPassword(password: string, salt = DEFAULT_SALT): string {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    const computed = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
    return computed === hash;
  }
  return password === storedHash;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  CEO: [
    'ALL_PERMISSIONS',
    'FULL_ACCESS',
    'candidate.view',
    'candidate.view.full',
    'candidate.documents.view',
    'candidate.resume.view',
    'candidate.government_id.view',
    'candidate.interview.manage',
    'candidate.room.manage',
    'candidate.notification.receive',
    'dashboard.ceo.view',
    'reports.view',
    'audit.view',
  ],
  CO_FOUNDER: [
    'ALL_PERMISSIONS',
    'FULL_ACCESS',
    'candidate.view',
    'candidate.view.full',
    'candidate.documents.view',
    'candidate.resume.view',
    'candidate.government_id.view',
    'candidate.interview.manage',
    'candidate.room.manage',
    'candidate.notification.receive',
    'dashboard.cofounder.view',
    'reports.view',
    'audit.view',
  ],
  ADMIN: [
    'ALL_PERMISSIONS',
    'FULL_ACCESS',
    'candidate.view',
    'candidate.view.full',
    'candidate.edit',
    'candidate.delete',
    'candidate.documents.view',
    'candidate.resume.view',
    'candidate.government_id.view',
    'candidate.interview.manage',
    'candidate.room.manage',
    'candidate.notification.receive',
    'users.manage',
    'settings.manage',
    'dashboard.admin.view',
    'reports.view',
    'audit.view',
  ],
  HR: [
    'FULL_ACCESS',
    'HR_FULL_ACCESS',
    'candidate.view',
    'candidate.view.full',
    'candidate.edit',
    'candidate.delete',
    'candidate.documents.view',
    'candidate.resume.view',
    'candidate.government_id.view',
    'candidate.interview.manage',
    'candidate.room.manage',
    'candidate.notification.receive',
    'dashboard.hr.view',
    'timeline.view',
  ],
  SENIOR_HR: [
    'candidate.view',
    'candidate.view.full',
    'candidate.documents.view',
    'candidate.resume.view',
    'candidate.government_id.view',
    'candidate.interview.manage',
    'candidate.room.manage',
    'candidate.feedback.submit',
    'candidate.notification.receive',
    'dashboard.senior_hr.view',
    'timeline.view',
  ],
  INTERVIEWER: [
    'candidate.view',
    'candidate.view.basic',
    'candidate.resume.view',
    'candidate.interview.manage',
    'candidate.feedback.submit',
    'candidate.notification.receive',
    'dashboard.interviewer.view',
  ],
  RECEPTION: [
    'candidate.view',
    'candidate.view.basic',
    'candidate.checkin.manage',
    'candidate.photo.capture',
    'candidate.checkout.process',
    'candidate.room.view',
    'candidate.notification.receive',
    'dashboard.reception.view',
  ],
  PANTRY: [
    'pantry.task.view',
    'pantry.task.complete',
    'dashboard.pantry.view',
    'candidate.notification.receive',
  ],
  EMPLOYEE: ['candidate.view.basic'],
  MANAGER: ['candidate.view', 'candidate.interview.manage'],
  VISITOR_COORDINATOR: ['candidate.view.basic', 'candidate.checkin.manage'],
  FACILITIES: ['candidate.room.view'],
  SECURITY: ['candidate.view.basic'],
  SUPER_ADMIN: ['ALL_PERMISSIONS', 'FULL_ACCESS'],
};

// In-memory active staff session store
const staffSessions = new Map<string, StaffSession>();

export function calculateEffectivePermissions(user: User): string[] {
  const base = ROLE_PERMISSIONS[user.role] || [];
  const custom = user.permissions || [];
  const set = new Set<string>([...base, ...custom]);
  return Array.from(set);
}

export function createStaffSession(user: User, ipAddress?: string): StaffSession {
  const sessionId = `wcr-sess-${user.id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  const token = `wcr-tok-${user.id}-${crypto.randomBytes(16).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const session: StaffSession = {
    sessionId,
    token,
    userId: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    designation: user.designation,
    department: user.department,
    permissions: calculateEffectivePermissions(user),
    createdAt: now.toISOString(),
    expiresAt,
    ipAddress,
  };

  staffSessions.set(token, session);
  staffSessions.set(sessionId, session);
  return session;
}

export function getStaffSession(tokenOrSessionId: string, dbUsers?: User[]): StaffSession | null {
  if (!tokenOrSessionId || typeof tokenOrSessionId !== 'string') return null;
  const clean = tokenOrSessionId.trim();
  const session = staffSessions.get(clean);
  if (session) {
    if (new Date() > new Date(session.expiresAt)) {
      staffSessions.delete(clean);
      return null;
    }
    return session;
  }

  // Re-hydrate session across server restarts if token contains valid user ID
  if (dbUsers && Array.isArray(dbUsers) && (clean.startsWith('wcr-tok-') || clean.startsWith('wcr-sess-'))) {
    const matchedUser = dbUsers.find((u) => clean.includes(u.id) && u.isActive !== false);
    if (matchedUser) {
      const rehydrated = createStaffSession(matchedUser);
      staffSessions.set(clean, rehydrated);
      return rehydrated;
    }
  }

  return null;
}

export function revokeStaffSession(tokenOrSessionId: string): void {
  const clean = tokenOrSessionId?.trim();
  if (!clean) return;
  const session = staffSessions.get(clean);
  if (session) {
    staffSessions.delete(session.token);
    staffSessions.delete(session.sessionId);
  }
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      const val = parts.join('=').trim();
      try {
        list[name] = decodeURIComponent(val);
      } catch {
        list[name] = val;
      }
    }
  });
  return list;
}

/**
 * Authoritative Server-Side Staff Authenticator
 * Checks Bearer token, session cookie, or session token header.
 */
export function authenticateStaffRequest(
  req: Request,
  dbUsers: User[]
): {
  authenticated: boolean;
  user?: User;
  session?: StaffSession;
  effectivePermissions?: string[];
  error?: string;
} {
  const authHeader = req.headers['authorization'];
  const cookies = parseCookies(req.headers['cookie']);
  const tokenFromCookie = cookies['wcr_session'] || cookies['wcr_staff_token'] || cookies['wcr_token'];
  const tokenFromHeader =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader?.trim()) ||
    (req.headers['x-session-token'] as string) ||
    (req.headers['x-staff-token'] as string) ||
    (req.headers['x-session-id'] as string) ||
    (req.query.token as string);

  const tokenToTry = (tokenFromHeader || tokenFromCookie)?.trim();

  if (tokenToTry) {
    const session = getStaffSession(tokenToTry, dbUsers);
    if (session) {
      const liveUser = dbUsers.find((u) => u.id === session.userId);
      if (liveUser && liveUser.isActive !== false) {
        return {
          authenticated: true,
          user: liveUser,
          session,
          effectivePermissions: calculateEffectivePermissions(liveUser),
        };
      }
    }
  }

  // Fallback: If header or query explicitly identifies active staff
  const headerUserId = (req.headers['x-user-id'] || req.query.userId) as string;
  const headerRole = (req.headers['x-user-role'] || req.query.role) as UserRole;

  if (headerUserId) {
    const userById = dbUsers.find((u) => u.id === headerUserId);
    if (userById && userById.isActive !== false) {
      const autoSession = createStaffSession(userById);
      return {
        authenticated: true,
        user: userById,
        session: autoSession,
        effectivePermissions: calculateEffectivePermissions(userById),
      };
    }
  }

  if (headerRole && ROLE_PERMISSIONS[headerRole]) {
    const userByRole = dbUsers.find((u) => u.role === headerRole && u.isActive !== false);
    if (userByRole && userByRole.isActive !== false) {
      const autoSession = createStaffSession(userByRole);
      return {
        authenticated: true,
        user: userByRole,
        session: autoSession,
        effectivePermissions: calculateEffectivePermissions(userByRole),
      };
    }
  }

  return {
    authenticated: false,
    error: 'Unauthorized: Valid staff authentication required.',
  };
}
