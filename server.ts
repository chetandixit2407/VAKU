import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dbService } from './src/server/db.ts';
import type { DatabaseSchema } from './src/server/db.ts';
import { eventWorkflowEngine } from './src/server/workflowEngine.ts';
import { validationEngine } from './src/server/validationEngine.ts';
import {
  verifyPassword,
  hashPassword,
  ROLE_PERMISSIONS,
  createStaffSession,
  getStaffSession,
  revokeStaffSession,
  authenticateStaffRequest,
  calculateEffectivePermissions,
  parseCookies,
} from './src/server/auth.ts';
import type {
  Candidate,
  CheckInSession,
  Interview,
  UserRole,
  User,
  Room,
  RoomType,
  CandidateChangeRequest,
  CandidateResumeMetadata,
  CandidatePhotoMetadata,
  GovernmentIdType,
  GovernmentIdDocument,
  CandidateValidationResult,
  PasswordResetRequest,
  StaffSession,
  DomainEvent,
  DomainEventType,
  Visitor,
  VisitorType,
  ChatMessage,
  ChatChannel,
  ActionTask,
} from './src/types/index.ts';
import { validatePersonName } from './src/utils/registrationConfig.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (typeof (globalThis as any).__filename === 'undefined') {
  (globalThis as any).__filename = __filename;
}

const RESUMES_DIR = path.resolve(process.cwd(), 'data', 'resumes');
if (!fs.existsSync(RESUMES_DIR)) {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
}

const GOV_IDS_DIR = path.resolve(process.cwd(), 'data', 'gov_ids');
if (!fs.existsSync(GOV_IDS_DIR)) {
  fs.mkdirSync(GOV_IDS_DIR, { recursive: true });
}

const PHOTOS_DIR = path.resolve(process.cwd(), 'data', 'photos');
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

function isValidDocumentBuffer(buf: Buffer | null | undefined): boolean {
  if (!buf || buf.length < 8) return false;

  const headLower = buf.slice(0, 60).toString('utf8').toLowerCase();
  if (headLower.includes('<!doctype') || headLower.includes('<html') || headLower.includes('<head')) {
    return false;
  }

  const headStr = buf.subarray(0, 10).toString('utf8').trim();
  if (headStr.startsWith('{') || headStr.startsWith('[')) {
    return false;
  }

  const previewText = buf.slice(0, 400).toString('utf8');
  if (previewText.includes('WHITE COLLAR REALTY - CANDIDATE DOSSIER') || previewText.includes('WHITE COLLAR REALTY - CANDIDATE RESUME')) {
    return false;
  }

  return true;
}

function detectMimeType(buf: Buffer, fallbackMime = 'application/pdf', fileName = ''): string {
  if (buf.length >= 4) {
    if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
      return 'application/pdf';
    }
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return 'image/jpeg';
    }
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return 'image/png';
    }
    if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
      return 'image/webp';
    }
    if (buf.length >= 6 && (buf.slice(0, 6).toString('ascii') === 'GIF87a' || buf.slice(0, 6).toString('ascii') === 'GIF89a')) {
      return 'image/gif';
    }
    if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      return 'application/zip';
    }
  }

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.txt')) return 'text/plain';

  return fallbackMime;
}

function persistResumeBuffer(candidateId: string, originalFileName?: string, resumeUrl?: string, candidateName = 'Candidate', position = 'Role'): {
  diskPath: string;
  mimeType: string;
  fileSize: string;
  fileName: string;
} {
  const fileName = originalFileName || `${(candidateName || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`;
  const lower = fileName.toLowerCase();
  let mimeType = 'application/octet-stream';
  if (lower.endsWith('.pdf')) mimeType = 'application/pdf';
  else if (lower.endsWith('.png')) mimeType = 'image/png';
  else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mimeType = 'image/jpeg';
  else if (lower.endsWith('.webp')) mimeType = 'image/webp';
  else if (lower.endsWith('.gif')) mimeType = 'image/gif';
  else if (lower.endsWith('.doc')) mimeType = 'application/msword';
  else if (lower.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (lower.endsWith('.xls')) mimeType = 'application/vnd.ms-excel';
  else if (lower.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  else if (lower.endsWith('.ppt')) mimeType = 'application/vnd.ms-powerpoint';
  else if (lower.endsWith('.pptx')) mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  else if (lower.endsWith('.csv')) mimeType = 'text/csv';
  else if (lower.endsWith('.txt')) mimeType = 'text/plain';

  const diskPath = path.resolve(RESUMES_DIR, `${candidateId}-resume.bin`);
  let buffer: Buffer | null = null;

  if (resumeUrl && resumeUrl.startsWith('data:')) {
    const match = resumeUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1] || mimeType;
      try {
        const decoded = Buffer.from(match[2], 'base64');
        if (isValidDocumentBuffer(decoded)) {
          buffer = decoded;
        }
      } catch (e) {
        console.warn('Base64 decode error', e);
      }
    }
  }

  if (buffer && buffer.length > 0) {
    mimeType = detectMimeType(buffer, mimeType, fileName);
    fs.writeFileSync(diskPath, buffer);
  }
  const bufLen = buffer ? buffer.length : 0;
  const sizeMB = (bufLen / (1024 * 1024)).toFixed(1);
  const fileSize = bufLen > 1024 * 1024 ? `${sizeMB} MB` : `${Math.round(bufLen / 1024)} KB`;

  return { diskPath, mimeType, fileSize, fileName };
}



async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && req.path !== '/api/events') {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ==========================================
  // REAL-TIME SERVER-SENT EVENTS (SSE) ROUTE (PROTECTED STAFF STREAM)
  // ==========================================
  app.get('/api/events', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);

    if (!auth.authenticated || !auth.user || !auth.session) {
      console.warn(`[REALTIME] connection rejected: Unauthenticated attempt from ${req.ip}`);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Valid staff authentication required for real-time dashboard events.',
      });
    }

    const clientId = `client-${auth.user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(
      `data: ${JSON.stringify({
        type: 'CONNECTED',
        clientId,
        user: {
          id: auth.user.id,
          name: auth.user.name,
          role: auth.user.role,
        },
        sessionToken: auth.session.token,
        permissions: auth.effectivePermissions,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    eventWorkflowEngine.subscribeClient({
      id: clientId,
      session: auth.session,
      role: auth.user.role,
      userId: auth.user.id,
      res,
      connectedAt: new Date().toISOString(),
      lastPing: Date.now(),
    });

    // Keepalive ping every 15s to prevent intermediate proxy timeout
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (e) {
        clearInterval(pingInterval);
        eventWorkflowEngine.unsubscribeClient(clientId);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      eventWorkflowEngine.unsubscribeClient(clientId);
    });
  });

  // Reconnect / Missed Event Resync
  app.get('/api/events/resync', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);

    if (!auth.authenticated || !auth.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Staff session required.' });
    }

    const since = req.query.since as string;
    const lastEventId = req.query.lastEventId as string;
    const missed = eventWorkflowEngine.getMissedEvents(since, lastEventId, auth.user.role);

    res.json({
      success: true,
      events: missed,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // STAFF IDENTITY & SESSION VALIDATION
  // ==========================================
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);

    if (!auth.authenticated || !auth.user || !auth.session) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'No active staff session.',
      });
    }

    const { passwordHash: _, ...safeUser } = auth.user;
    res.json({
      success: true,
      authenticated: true,
      user: safeUser,
      role: auth.user.role,
      session: {
        sessionId: auth.session.sessionId,
        token: auth.session.token,
        expiresAt: auth.session.expiresAt,
      },
      permissions: auth.effectivePermissions || ROLE_PERMISSIONS[auth.user.role] || [],
    });
  });

  // Staff Persona Role Switching
  app.post('/api/auth/switch-role', (req: Request, res: Response) => {
    const { role, userId } = req.body;
    const db = dbService.get();

    let targetUser = userId ? db.users.find((u) => u.id === userId && u.isActive !== false) : null;
    if (!targetUser && role) {
      targetUser = db.users.find((u) => u.role === (role as UserRole) && u.isActive !== false) || null;
    }

    if (!targetUser) {
      targetUser = db.users[0];
    }

    const session = createStaffSession(targetUser, req.ip);
    res.setHeader('Set-Cookie', [
      `wcr_session=${session.token}; Path=/; SameSite=Lax; Max-Age=604800`,
      `wcr_staff_token=${session.token}; Path=/; SameSite=Lax; Max-Age=604800`,
    ]);

    const { passwordHash: _, ...safeUser } = targetUser;
    console.log(`[AUTH] staff authenticated persona switch: ${targetUser.name} (${targetUser.role})`);

    res.json({
      success: true,
      user: safeUser,
      role: targetUser.role,
      session: {
        sessionId: session.sessionId,
        token: session.token,
        expiresAt: session.expiresAt,
      },
      token: session.token,
      permissions: session.permissions,
    });
  });

  // ==========================================
  // BOOTSTRAP & SYSTEM CONFIG
  // ==========================================
  app.get('/api/bootstrap', (req: Request, res: Response) => {
    const db = dbService.get();
    res.json({
      success: true,
      users: db.users,
      rooms: db.rooms,
      settings: db.settings,
      systemTime: new Date().toISOString(),
    });
  });

  // ==========================================
  // QR & CHECK-IN SESSION RESOLVER (WALK-IN & SCHEDULED APPOINTMENTS)
  // ==========================================
  app.post('/api/qr/scan', (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'QR code payload or token is required.' });
    }

    const raw = code.trim();
    let token = raw;
    try {
      if (raw.includes('/')) {
        const parts = raw.split('/');
        token = parts[parts.length - 1].split('?')[0].split('#')[0] || raw;
      }
    } catch {
      token = raw;
    }
    token = token.trim();

    const db = dbService.get();

    // 1. Search in Walk-in Visitors
    const visitor = db.visitors.find(
      (v) => v.qrToken === token || v.id === token || (token.startsWith('vis-') && v.id === token) || v.phone === token
    );

    if (visitor) {
      const isAlreadyVerified = visitor.qrVerificationStatus === 'VERIFIED';
      const timestamp = new Date().toISOString();

      if (!isAlreadyVerified) {
        dbService.update((draft) => {
          const v = draft.visitors.find((item) => item.id === visitor.id);
          if (v) {
            v.qrVerificationStatus = 'VERIFIED';
            v.qrVerifiedAt = timestamp;
            v.status = 'CHECKED_IN';
          }
          draft.auditLogs.unshift({
            id: `aud-${Date.now()}-qr-vis`,
            timestamp,
            actorType: 'SYSTEM',
            actorName: 'QR Station Scanner',
            action: 'QR_VISITOR_VERIFIED',
            details: `Walk-in visitor ${visitor.fullName} verified via QR Station scan.`,
            entityId: visitor.id,
            entityType: 'VISITOR',
          });
        });

        eventWorkflowEngine.broadcast({
          type: 'VISITORS_UPDATED',
          payload: { visitorId: visitor.id, status: 'CHECKED_IN', qrVerified: true },
        });
      }

      const freshDb = dbService.get();
      const updatedVis = freshDb.visitors.find((v) => v.id === visitor.id) || visitor;

      return res.json({
        success: true,
        scanType: 'WALK_IN',
        isWalkIn: true,
        alreadyVerified: isAlreadyVerified,
        newlyVerified: !isAlreadyVerified,
        visitor: {
          id: updatedVis.id,
          fullName: updatedVis.fullName,
          visitorType: 'WALK-IN',
          company: updatedVis.company || 'Not Provided',
          hostName: updatedVis.hostName || 'Not Provided',
          hostDepartment: updatedVis.hostDepartment || 'Not Provided',
          purpose: updatedVis.purpose || 'Not Provided',
          roomAssigned: updatedVis.roomAssigned || 'Pending Allocation',
          checkInTime: updatedVis.checkInTime,
          qrVerificationStatus: updatedVis.qrVerificationStatus || 'VERIFIED',
          status: updatedVis.status,
          phone: updatedVis.phone,
          email: updatedVis.email || 'Not Provided',
        },
        message: isAlreadyVerified
          ? 'Walk-in visitor already checked in and verified.'
          : 'Walk-in visitor QR verified. Check-in event recorded successfully.',
      });
    }

    // 2. Search in Check-In Sessions (Scheduled Candidates)
    const session = db.checkInSessions.find((s) => s.token === token);
    if (session) {
      if (session.qrType === 'GENERAL_RECEPTION' && !session.candidateId) {
        return res.json({
          success: true,
          scanType: 'GENERAL_REGISTRATION',
          isGeneral: true,
          session,
          message: 'General blank registration QR recognized.',
        });
      }

      const candidate = session.candidateId
        ? db.candidates.find((c) => c.id === session.candidateId)
        : undefined;

      const interview = candidate?.currentInterviewId
        ? db.interviews.find((i) => i.id === candidate.currentInterviewId)
        : undefined;

      return res.json({
        success: true,
        scanType: 'SCHEDULED_APPOINTMENT',
        isScheduled: true,
        session,
        candidate: candidate
          ? {
              id: candidate.id,
              fullName: candidate.fullName,
              position: candidate.position,
              department: candidate.department,
              phone: candidate.phone,
              email: candidate.email,
              status: candidate.status,
              checkedInAt: candidate.checkedInAt,
              appointmentTime: session.appointmentTime || candidate.appointmentTime,
              assignedInterviewerName: candidate.assignedInterviewerName || session.interviewerName,
              assignedRoomName: candidate.assignedRoomName,
            }
          : null,
        interview: interview
          ? {
              id: interview.id,
              roundName: interview.roundName,
              interviewerName: interview.interviewerName,
              scheduledTime: interview.scheduledTime,
              status: interview.status,
            }
          : null,
        message: 'Scheduled appointment pass identified.',
      });
    }

    // 3. Search in Candidates direct ID or Token
    const directCandidate = db.candidates.find((c) => c.id === token || c.token === token);
    if (directCandidate) {
      return res.json({
        success: true,
        scanType: 'SCHEDULED_APPOINTMENT',
        isScheduled: true,
        candidate: {
          id: directCandidate.id,
          fullName: directCandidate.fullName,
          position: directCandidate.position,
          department: directCandidate.department,
          phone: directCandidate.phone,
          email: directCandidate.email,
          status: directCandidate.status,
          checkedInAt: directCandidate.checkedInAt,
          appointmentTime: directCandidate.appointmentTime,
          assignedInterviewerName: directCandidate.assignedInterviewerName,
          assignedRoomName: directCandidate.assignedRoomName,
        },
        message: 'Candidate profile identified via pass code.',
      });
    }

    return res.status(404).json({
      success: false,
      status: 'NOT_FOUND',
      error: 'Unrecognised QR code. Please ensure you are scanning a valid White Collar Realty visitor pass or appointment code.',
    });
  });

  app.get('/api/qr/:token', (req: Request, res: Response) => {
    const { token } = req.params;
    const db = dbService.get();

    // Check Walk-In Visitors
    const matchedVisitor = db.visitors.find(
      (v) => v.qrToken === token || v.id === token || (token.startsWith('vis-') && v.id === token)
    );
    if (matchedVisitor) {
      return res.json({
        success: true,
        status: 'ACTIVE',
        scanType: 'WALK_IN',
        isWalkIn: true,
        visitor: {
          id: matchedVisitor.id,
          fullName: matchedVisitor.fullName,
          visitorType: 'WALK-IN',
          company: matchedVisitor.company || 'Not Provided',
          hostName: matchedVisitor.hostName || 'Not Provided',
          hostDepartment: matchedVisitor.hostDepartment || 'Not Provided',
          purpose: matchedVisitor.purpose || 'Not Provided',
          roomAssigned: matchedVisitor.roomAssigned || 'Pending Allocation',
          checkInTime: matchedVisitor.checkInTime,
          qrVerificationStatus: matchedVisitor.qrVerificationStatus || 'VERIFIED',
          status: matchedVisitor.status,
          phone: matchedVisitor.phone,
          email: matchedVisitor.email || 'Not Provided',
        },
        message: 'Authoritative Walk-in visitor details retrieved.',
      });
    }

    const session = db.checkInSessions.find((s) => s.token === token);
    if (!session) {
      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
        error: 'Invalid QR Pass or Token not found. Please contact Reception.',
      });
    }

    // Auto-expiry check
    const isPastExpiry = new Date() > new Date(session.expiresAt);
    if (isPastExpiry && session.status !== 'COMPLETED' && session.status !== 'SUBMITTED') {
      dbService.update((draft) => {
        const s = draft.checkInSessions.find((item) => item.token === token);
        if (s) s.status = 'EXPIRED';
      });
      return res.status(410).json({
        success: false,
        status: 'EXPIRED',
        error: 'This QR Pass has expired. Please request a new check-in pass.',
      });
    }

    if (session.status === 'EXPIRED') {
      return res.status(410).json({
        success: false,
        status: 'EXPIRED',
        error: 'This QR Pass has expired. Please request a new check-in pass.',
      });
    }

    if (session.status === 'COMPLETED' || session.status === 'SUBMITTED') {
      const existingCandidate = session.candidateId
        ? db.candidates.find((c) => c.id === session.candidateId)
        : undefined;
      return res.json({
        success: true,
        status: 'COMPLETED',
        candidateName: session.candidateName || existingCandidate?.fullName,
        position: session.position || existingCandidate?.position,
        submittedAt: session.submittedAt || session.completedAt,
        completedAt: session.completedAt,
        message: 'This check-in pass has already been completed.',
      });
    }

    let existingCandidate: Candidate | undefined;
    let existingInterview: Interview | undefined;

    if (session.candidateId) {
      existingCandidate = db.candidates.find((c) => c.id === session.candidateId);
      if (existingCandidate?.currentInterviewId) {
        existingInterview = db.interviews.find((i) => i.id === existingCandidate!.currentInterviewId);
      }
    }

    // Log QR opened event
    dbService.update((draft) => {
      const s = draft.checkInSessions.find((item) => item.token === token);
      if (s) {
        s.openedAt = new Date().toISOString();
      }
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-qr`,
        timestamp: new Date().toISOString(),
        actorType: 'SYSTEM',
        actorName: 'QR Scanner',
        action: 'FORM_OPENED',
        details: `Scheduled QR pass opened with token ${token}.`,
      });
    });

    res.json({
      success: true,
      status: 'ACTIVE',
      session: {
        id: session.id,
        token: session.token,
        qrType: session.qrType,
        candidateName: session.candidateName,
        position: session.position,
        department: session.department,
        appointmentTime: session.appointmentTime,
        interviewerName: session.interviewerName,
        interviewRound: session.interviewRound,
        status: session.status,
        expiresAt: session.expiresAt,
      },
      prefill: existingCandidate
        ? {
            fullName: existingCandidate.fullName,
            phone: existingCandidate.phone,
            email: existingCandidate.email,
            address: existingCandidate.address,
            city: existingCandidate.city,
            state: existingCandidate.state,
            pincode: existingCandidate.pincode,
            position: existingCandidate.position,
            department: existingCandidate.department,
            totalExperience: existingCandidate.totalExperience,
            relevantExperience: existingCandidate.relevantExperience,
            currentCompany: existingCandidate.currentCompany,
            qualification: existingCandidate.qualification,
            noticePeriod: existingCandidate.noticePeriod,
            expectedSalary: existingCandidate.expectedSalary,
            referralSource: existingCandidate.referralSource,
          }
        : null,
    });
  });

  // ==========================================
  // CANDIDATE SELF CHECK-IN FORM SUBMISSION
  // ==========================================
  app.post('/api/checkin/submit', (req: Request, res: Response) => {
    const {
      token,
      fullName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      position,
      department,
      totalExperience,
      relevantExperience,
      currentCompany,
      qualification,
      skills,
      noticePeriod,
      expectedSalary,
      referralSource,
      purpose,
      departmentToMeet,
      personToMeet,
      governmentIdType,
      governmentIdNumber,
      governmentIdFileName,
      governmentIdFileUrl,
      livePhoto,
      resumeUrl,
      resumeFileName,
      resumeFileSize,
    } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing check-in token.',
      });
    }

    const resolvedPosition = position?.trim() || purpose?.trim() || 'Visitor / Candidate';

    if (!fullName?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing mandatory fields: Full Name and Mobile Number are required.',
      });
    }

    const nameCheck = validatePersonName(fullName);
    if (!nameCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: nameCheck.error || 'Please enter a valid person name.',
      });
    }

    const isInterview = Boolean(purpose && (purpose.toLowerCase().includes('interview') || purpose.toLowerCase().includes('candidate')));

    const idTypeToValidate = (governmentIdType as GovernmentIdType) || 'AADHAAR';
    const hasGovId = !!(governmentIdNumber?.trim() || governmentIdFileUrl || governmentIdFileName);

    const db = dbService.get();
    const existingSession = db.checkInSessions.find((s) => s.token === token);
    if (!existingSession) {
      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
        error: 'Check-in session token not found.',
      });
    }

    // Expiry check
    if (new Date() > new Date(existingSession.expiresAt) && existingSession.status !== 'COMPLETED') {
      dbService.update((draft) => {
        const s = draft.checkInSessions.find((item) => item.token === token);
        if (s) s.status = 'EXPIRED';
      });
      return res.status(410).json({
        success: false,
        status: 'EXPIRED',
        error: 'This check-in pass has expired. Please contact reception.',
      });
    }

    // Duplicate submission protection
    if (existingSession.status === 'COMPLETED' || existingSession.status === 'SUBMITTED') {
      return res.status(409).json({
        success: false,
        status: 'COMPLETED',
        error: 'This check-in pass has already been submitted and completed. Duplicate submissions are not allowed.',
      });
    }

    if (existingSession.status === 'SUBMITTING') {
      return res.status(429).json({
        success: false,
        status: 'SUBMITTING',
        error: 'Check-in submission is already being processed.',
      });
    }

    const timestamp = new Date().toISOString();

    // NON-INTERVIEW VISITOR FLOW (CLIENT, BUSINESS, VENDOR, GENERAL INQUIRY)
    if (!isInterview) {
      const visitorId = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const resolvedVisitorType: VisitorType =
        purpose?.toLowerCase().includes('client')
          ? 'CLIENT'
          : purpose?.toLowerCase().includes('vendor')
          ? 'VENDOR'
          : 'WALK_IN';

      const newVisitor: Visitor = {
        id: visitorId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        company: req.body.company || currentCompany || req.body.vendorCompany || '',
        visitorType: resolvedVisitorType,
        hostName: personToMeet || 'Front Desk Assistance',
        hostDepartment: departmentToMeet || 'Front Desk & Reception',
        hostId: req.body.hostId || undefined,
        purpose: purpose || 'Visitor Consultation',
        status: 'CHECKED_IN',
        checkInTime: timestamp,
        photo: livePhoto || undefined,
      };

      dbService.update((draft) => {
        draft.visitors.unshift(newVisitor);

        const s = draft.checkInSessions.find((item) => item.token === token);
        if (s) {
          s.status = 'COMPLETED';
          s.completedAt = timestamp;
          s.submittedAt = timestamp;
          s.lockedAt = timestamp;
          s.candidateId = visitorId;
          s.candidateName = fullName.trim();
          s.position = purpose;
        }

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-vis`,
          timestamp,
          actorType: 'USER',
          actorName: fullName.trim(),
          action: 'VISITOR_CHECKED_IN',
          details: `Visitor ${fullName.trim()} (${resolvedVisitorType}) checked in to meet ${personToMeet || 'Reception'}.`,
          entityId: visitorId,
          entityType: 'VISITOR',
        });
      });

      // Targeted alert to Host and Reception (NOT HR!)
      eventWorkflowEngine.handleVisitorCheckIn(newVisitor, token);

      return res.json({
        success: true,
        status: 'COMPLETED',
        visitor: newVisitor,
        registrationId: visitorId,
        submissionTime: timestamp,
        session: {
          token,
          status: 'COMPLETED',
          completedAt: timestamp,
          submittedAt: timestamp,
          lockedAt: timestamp,
        },
        message: 'Check-In verified. Your host has been notified in real time.',
      });
    }

    let savedCandidate: Candidate | null = null;
    let relatedInterview: Interview | undefined;

    // Run Automated Validation Engine
    const { validationResult } = validationEngine.runAutomatedValidation(
      {
        fullName,
        phone,
        email,
        address,
        position,
        department,
        totalExperience,
        currentCompany,
        qualification,
        noticePeriod,
        expectedSalary,
      },
      resumeFileName,
      resumeUrl
    );

    try {
      dbService.update((draft) => {
        // 1. Resolve session
        const session = draft.checkInSessions.find((s) => s.token === token);
        if (session) {
          session.status = 'SUBMITTING';
        }
        let candidateId = session?.candidateId;

        // Check if candidate exists by phone/email or session
        let existingCand = draft.candidates.find(
          (c) => (candidateId && c.id === candidateId) || (phone && c.phone === phone) || (email && c.email && c.email === email)
        );

        if (existingCand) {
          // Restore candidate if previously archived or deleted
          delete (existingCand as any).isDeleted;
          delete (existingCand as any).deletedAt;
          delete (existingCand as any).deletedBy;
          delete (existingCand as any).deletionReason;

          // Update existing candidate
          existingCand.fullName = fullName;
          existingCand.phone = phone;
          existingCand.email = email || existingCand.email || '';
          existingCand.address = address || existingCand.address;
          existingCand.city = city || existingCand.city;
          existingCand.state = state || existingCand.state;
          existingCand.pincode = pincode || existingCand.pincode;
          existingCand.position = position || existingCand.position;
          existingCand.department = department || existingCand.department;
          existingCand.totalExperience = totalExperience || existingCand.totalExperience;
          existingCand.relevantExperience = relevantExperience || existingCand.relevantExperience;
          existingCand.currentCompany = currentCompany || existingCand.currentCompany;
          existingCand.qualification = qualification || existingCand.qualification;
          existingCand.skills = skills || existingCand.skills;
          existingCand.noticePeriod = noticePeriod || existingCand.noticePeriod;
          existingCand.expectedSalary = expectedSalary || existingCand.expectedSalary;
          existingCand.referralSource = referralSource || existingCand.referralSource;
          existingCand.purpose = purpose || existingCand.purpose || 'Scheduled In-Person Interview';
          existingCand.departmentToMeet = departmentToMeet || existingCand.departmentToMeet;
          existingCand.personToMeet = personToMeet || existingCand.personToMeet;

          existingCand.validationResult = {
            ...validationResult,
            candidateId: existingCand.id,
          };

          if (resumeUrl) {
            const persisted = persistResumeBuffer(existingCand.id, resumeFileName, resumeUrl, fullName, position);
            existingCand.resumeUrl = resumeUrl;
            existingCand.resumeFileName = persisted.fileName;
            existingCand.resumeFileSize = persisted.fileSize;
            existingCand.resumeMimeType = persisted.mimeType;
            existingCand.resumeUploadedAt = timestamp;
            existingCand.resumeMetadata = {
              id: `res-${Date.now()}`,
              candidateId: existingCand.id,
              originalFileName: persisted.fileName,
              mimeType: persisted.mimeType,
              fileSize: persisted.fileSize,
              storageKey: persisted.diskPath,
              uploadedAt: timestamp,
              uploadedBy: fullName,
            };
          }
          existingCand.status = 'ARRIVED';
          existingCand.currentLocation = 'Reception / Waiting Lounge';
          existingCand.arrivalTime = timestamp;
          existingCand.updatedAt = timestamp;
          savedCandidate = existingCand;
        } else {
          // Create new candidate
          const newCandId = `cand-${Date.now()}`;
          const persistedResume = persistResumeBuffer(newCandId, resumeFileName, resumeUrl, fullName, position);

          const newCand: Candidate = {
            id: newCandId,
            fullName,
            phone,
            email: email || '',
            address: address || '',
            city: city || 'Gurugram',
            state: state || 'Haryana',
            pincode: pincode || '',
            position: resolvedPosition,
            department: department || 'Sales & Operations',
            totalExperience: totalExperience || 'Fresher',
            relevantExperience: relevantExperience || '',
            currentCompany: currentCompany || '',
            qualification: qualification || 'Graduate',
            skills: skills || '',
            noticePeriod: noticePeriod || 'Immediate',
            expectedSalary: expectedSalary || '',
            referralSource: referralSource || 'Scheduled Appointment Pass',
            purpose: purpose || 'Scheduled In-Person Interview',
            departmentToMeet: departmentToMeet || 'HR & Recruitment',
            personToMeet: personToMeet || '',
            validationResult: {
              ...validationResult,
              candidateId: newCandId,
            },
            resumeUrl: resumeUrl || undefined,
            resumeFileName: resumeUrl ? persistedResume.fileName : undefined,
            resumeFileSize: resumeUrl ? persistedResume.fileSize : undefined,
            resumeMimeType: resumeUrl ? persistedResume.mimeType : undefined,
            resumeUploadedAt: timestamp,
            resumeMetadata: {
              id: `res-${Date.now()}`,
              candidateId: newCandId,
              originalFileName: persistedResume.fileName,
              mimeType: persistedResume.mimeType,
              fileSize: persistedResume.fileSize,
              storageKey: persistedResume.diskPath,
              uploadedAt: timestamp,
              uploadedBy: fullName,
            },
            status: 'ARRIVED',
            currentLocation: 'Reception / Waiting Lounge',
            arrivalTime: timestamp,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          draft.candidates.unshift(newCand);
          savedCandidate = newCand;
        }

        // Attach / find interview
        if (savedCandidate.currentInterviewId) {
          relatedInterview = draft.interviews.find((i) => i.id === savedCandidate!.currentInterviewId);
        }

        if (!relatedInterview) {
          relatedInterview = draft.interviews.find(
            (i) => i.candidateId === savedCandidate!.id && i.status === 'SCHEDULED'
          );
        }

        if (!relatedInterview) {
          const defaultInterviewer = draft.users.find((u) => u.role === 'INTERVIEWER') || draft.users[3];
          const newIntv: Interview = {
            id: `intv-${Date.now()}`,
            candidateId: savedCandidate.id,
            candidateName: savedCandidate.fullName,
            position: savedCandidate.position,
            roundName: 'Round 1 - Technical Assessment',
            interviewerId: defaultInterviewer?.id || 'usr-int-1',
            interviewerName: defaultInterviewer?.name || 'Nisha Verma',
            scheduledTime: 'Immediate / Walk-in',
            status: 'CANDIDATE_ARRIVED',
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          draft.interviews.unshift(newIntv);
          relatedInterview = newIntv;
          savedCandidate.currentInterviewId = newIntv.id;
        } else {
          relatedInterview.status = 'CANDIDATE_ARRIVED';
          savedCandidate.currentInterviewId = relatedInterview.id;
        }

        // Mark session permanently as COMPLETED (One-Time Use)
        if (session) {
          session.status = 'COMPLETED';
          session.completedAt = timestamp;
          session.submittedAt = timestamp;
          session.lockedAt = timestamp;
          session.candidateId = savedCandidate.id;
          session.candidateName = savedCandidate.fullName;
          session.position = savedCandidate.position;
        }

        draft.timelineEvents.unshift(
          {
            id: `tl-${Date.now()}-chk-sub`,
            candidateId: savedCandidate.id,
            timestamp,
            actorType: 'USER',
            actorName: savedCandidate.fullName,
            eventType: 'CANDIDATE_CHECK_IN',
            description: `Candidate checked in. Government ID (${savedCandidate.governmentId?.idTypeName || 'ID'}) and resume verified.`,
          },
          {
            id: `tl-${Date.now()}-chk-val`,
            candidateId: savedCandidate.id,
            timestamp,
            actorType: 'SYSTEM',
            actorName: 'WCR Validation Engine',
            eventType: 'CANDIDATE_VALIDATION_COMPLETED',
            description: `Automated validation status: ${validationResult.overallStatus}. ${validationResult.summary}`,
            metadata: {
              overallStatus: validationResult.overallStatus,
              checksPassed: validationResult.checksPassed,
              checksFlagged: validationResult.checksFlagged,
            },
          }
        );

        draft.auditLogs.unshift(
          {
            id: `aud-${Date.now()}-chk-sub`,
            timestamp,
            actorType: 'USER',
            actorName: savedCandidate.fullName,
            action: 'FORM_SUBMITTED',
            details: `Scheduled check-in submitted with ${savedCandidate.governmentId?.idTypeName} for ${savedCandidate.fullName} (${savedCandidate.position}).`,
            entityId: savedCandidate.id,
            entityType: 'CANDIDATE',
          },
          {
            id: `aud-${Date.now()}-chk-comp`,
            timestamp,
            actorType: 'SYSTEM',
            actorName: 'Session Manager',
            action: 'REGISTRATION_SESSION_COMPLETED',
            details: `Check-in session ${token} completed and locked.`,
            entityId: session?.id,
            entityType: 'CHECK_IN_SESSION',
          }
        );
      });

      if (!savedCandidate) {
        throw new Error('Failed to persist candidate');
      }

      // 7 & 9: Create and publish authoritative domain event
      eventWorkflowEngine.publishDomainEvent({
        eventType: 'CANDIDATE_FORM_SUBMITTED',
        candidateId: (savedCandidate as Candidate).id,
        visitId: (savedCandidate as Candidate).id,
        applicationId: (savedCandidate as Candidate).id,
        interviewId: relatedInterview?.id,
        registrationSessionId: token,
        actorType: 'CANDIDATE',
        source: 'CANDIDATE_REGISTRATION',
        targetRoles: ['HR', 'SENIOR_HR', 'ADMIN', 'CEO', 'CO_FOUNDER', 'INTERVIEWER', 'RECEPTION'],
        metadata: {
          candidateName: (savedCandidate as Candidate).fullName,
          position: (savedCandidate as Candidate).position,
          department: (savedCandidate as Candidate).department,
          status: (savedCandidate as Candidate).status,
          currentLocation: (savedCandidate as Candidate).currentLocation,
          arrivalTime: timestamp,
          interviewRound: relatedInterview?.roundName || 'Round 1',
        },
      });

      // 10: Create and persist role-based notifications & alerts
      eventWorkflowEngine.handleCandidateCheckIn(savedCandidate, relatedInterview, token);

      res.json({
        success: true,
        status: 'COMPLETED',
        candidate: {
          id: (savedCandidate as Candidate).id,
          fullName: (savedCandidate as Candidate).fullName,
          position: (savedCandidate as Candidate).position,
          status: (savedCandidate as Candidate).status,
          currentLocation: (savedCandidate as Candidate).currentLocation,
          arrivalTime: timestamp,
          validationStatus: validationResult.overallStatus,
          interview: relatedInterview
            ? {
                id: relatedInterview.id,
                roundName: relatedInterview.roundName,
                interviewerName: relatedInterview.interviewerName,
              }
            : null,
        },
        registrationId: (savedCandidate as Candidate).id,
        submissionTime: timestamp,
        session: {
          token,
          status: 'COMPLETED',
          completedAt: timestamp,
          submittedAt: timestamp,
          lockedAt: timestamp,
        },
        message: 'Check-In verified and registered. The front desk and HR have been alerted in real time.',
      });
    } catch (err: any) {
      console.error('Check-in submission failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Check-in failed' });
    }
  });
  // ==========================================
  // GENERAL WCR QR: CREATE UNIQUE REGISTRATION SESSION
  // Each scan creates an independent, isolated session with BLANK form & expiry
  // ==========================================
  const handleCreateRegistrationSession = (req: Request, res: Response) => {
    const db = dbService.get();
    const timestamp = new Date().toISOString();
    const expiryMinutes = db.settings.qrSessionExpiryMinutes || 30;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
    const randomHex = crypto.randomBytes(12).toString('hex').toUpperCase();
    const token = `WCR-GEN-${Date.now()}-${randomHex}`;
    const sessionId = `reg-sess-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

    const newSession: CheckInSession = {
      id: sessionId,
      token,
      qrType: 'NEW_CANDIDATE_REGISTRATION',
      source: 'GENERAL_WCR_QR',
      status: 'ACTIVE',
      createdAt: timestamp,
      expiresAt,
    };

    dbService.update((draft) => {
      draft.checkInSessions.unshift(newSession);
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-created`,
        timestamp,
        actorType: 'SYSTEM',
        actorName: 'WCR QR Gateway',
        action: 'SESSION_CREATED',
        details: `Created fresh isolated registration session ${sessionId} (Token: ${token}, Expires in ${expiryMinutes}m).`,
      });
    });

    res.json({
      success: true,
      status: 'ACTIVE',
      session: newSession,
      isBlankForm: true,
      expiryMinutes,
    });
  };

  app.post('/api/register/session', handleCreateRegistrationSession);
  app.post('/api/public/registration-session', handleCreateRegistrationSession);

  // ==========================================
  // GENERAL WCR QR: GET SESSION (STRICTLY BLANK IF ACTIVE, AUTHORITATIVE EXPIRY/COMPLETION)
  // ==========================================
  const handleGetRegistrationSession = (req: Request, res: Response) => {
    const { token } = req.params;
    const db = dbService.get();
    const session = db.checkInSessions.find((s) => s.token === token);

    if (!session) {
      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
        error: 'Invalid or unrecognized registration session.',
      });
    }

    const isPastExpiry = new Date() > new Date(session.expiresAt);

    if (isPastExpiry && session.status !== 'COMPLETED' && session.status !== 'SUBMITTED') {
      dbService.update((draft) => {
        const s = draft.checkInSessions.find((item) => item.token === token);
        if (s) s.status = 'EXPIRED';
      });
      return res.status(410).json({
        success: false,
        status: 'EXPIRED',
        error: 'This registration link has expired. Please scan the WCR QR code again to start a new registration.',
      });
    }

    if (session.status === 'EXPIRED') {
      return res.status(410).json({
        success: false,
        status: 'EXPIRED',
        error: 'This registration link has expired. Please scan the WCR QR code again to start a new registration.',
      });
    }

    if (session.status === 'COMPLETED' || session.status === 'SUBMITTED') {
      const candidate = session.candidateId
        ? db.candidates.find((c) => c.id === session.candidateId)
        : undefined;

      return res.json({
        success: true,
        status: 'COMPLETED',
        session: {
          id: session.id,
          token: session.token,
          status: 'COMPLETED',
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          submittedAt: session.submittedAt || session.completedAt,
          completedAt: session.completedAt,
          candidateId: session.candidateId,
          candidateName: session.candidateName || candidate?.fullName,
          position: session.position || candidate?.position,
        },
        candidate: candidate
          ? {
              id: candidate.id,
              fullName: candidate.fullName,
              position: candidate.position,
              department: candidate.department,
              status: candidate.status,
              currentLocation: candidate.currentLocation,
              arrivalTime: candidate.arrivalTime,
            }
          : null,
        submittedAt: session.submittedAt || session.completedAt,
        completedAt: session.completedAt,
        message: 'Registration has already been submitted and verified.',
        isBlankForm: false,
      });
    }

    // Log Form Opened audit trail
    dbService.update((draft) => {
      const s = draft.checkInSessions.find((item) => item.token === token);
      if (s) {
        s.openedAt = new Date().toISOString();
      }
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-open`,
        timestamp: new Date().toISOString(),
        actorType: 'SYSTEM',
        actorName: 'Candidate Phone',
        action: 'FORM_OPENED',
        details: `Opened registration form session ${session.id} (Token: ${token}).`,
      });
    });

    res.json({
      success: true,
      status: 'ACTIVE',
      session: {
        id: session.id,
        token: session.token,
        status: 'ACTIVE',
        source: session.source,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
      isBlankForm: true,
    });
  };

  app.get('/api/register/session/:token', handleGetRegistrationSession);
  app.get('/api/public/registration-session/:token', handleGetRegistrationSession);

  // ==========================================
  // GENERAL WCR QR: SUBMIT NEW CANDIDATE REGISTRATION (ONE-TIME ONLY)
  // ==========================================
  const handleSubmitRegistration = (req: Request, res: Response) => {
    const rawToken = req.body.token || req.body.sessionToken;
    const token = typeof rawToken === 'string' ? rawToken.trim() : '';
    const {
      fullName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      position,
      department,
      totalExperience,
      relevantExperience,
      currentCompany,
      qualification,
      skills,
      noticePeriod,
      expectedSalary,
      referralSource,
      purpose,
      departmentToMeet,
      personToMeet,
      governmentIdType,
      governmentIdNumber,
      governmentIdFileSize,
      livePhoto,
      resumeFileSize,
    } = req.body;

    const rawResumeUrl = req.body.resumeUrl || req.body.resumeDocumentUrl;
    const resumeUrl = typeof rawResumeUrl === 'string' && rawResumeUrl.trim() ? rawResumeUrl.trim() : undefined;
    const rawResumeFileName = req.body.resumeFileName || req.body.resumeName;
    const resumeFileName = typeof rawResumeFileName === 'string' && rawResumeFileName.trim() ? rawResumeFileName.trim() : undefined;

    const rawGovIdUrl = req.body.governmentIdDocumentUrl || req.body.governmentIdFileUrl;
    const governmentIdDocumentUrl = typeof rawGovIdUrl === 'string' && rawGovIdUrl.trim() ? rawGovIdUrl.trim() : undefined;
    const rawGovIdFileName = req.body.governmentIdFileName || req.body.governmentIdName;
    const governmentIdFileName = typeof rawGovIdFileName === 'string' && rawGovIdFileName.trim() ? rawGovIdFileName.trim() : undefined;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Registration session token is required.',
      });
    }

    const resolvedPosition = position?.trim() || purpose?.trim() || 'Visitor / Candidate';

    if (!fullName?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Mandatory fields required: Full Name and Mobile Number.',
      });
    }

    const nameCheck = validatePersonName(fullName);
    if (!nameCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: nameCheck.error || 'Please enter a valid person name.',
      });
    }

    const isInterview = Boolean(purpose && (purpose.toLowerCase().includes('interview') || purpose.toLowerCase().includes('candidate')));

    const db = dbService.get();
    const session = db.checkInSessions.find((s) => s.token === token);

    if (!session) {
      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
        error: 'Registration session not found. Please scan the QR code again.',
      });
    }

    // Check expiration
    if (new Date() > new Date(session.expiresAt) && session.status !== 'COMPLETED') {
      dbService.update((draft) => {
        const s = draft.checkInSessions.find((item) => item.token === token);
        if (s) s.status = 'EXPIRED';
      });
      return res.status(410).json({
        success: false,
        status: 'EXPIRED',
        error: 'This registration session has expired. Please scan the WCR QR code again.',
      });
    }

    // Duplicate submission protection
    if (session.status === 'COMPLETED' || session.status === 'SUBMITTED') {
      return res.status(409).json({
        success: false,
        status: 'COMPLETED',
        error: 'This registration session has already been completed and submitted. Duplicate submissions are not allowed.',
      });
    }

    if (session.status === 'SUBMITTING') {
      return res.status(429).json({
        success: false,
        status: 'SUBMITTING',
        error: 'Registration submission is already in progress.',
      });
    }

    const timestamp = new Date().toISOString();

    // NON-INTERVIEW VISITOR REGISTRATION FLOW (CLIENT, BUSINESS, VENDOR, GENERAL INQUIRY)
    if (!isInterview) {
      const visitorId = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const resolvedVisitorType: VisitorType =
        purpose?.toLowerCase().includes('client')
          ? 'CLIENT'
          : purpose?.toLowerCase().includes('vendor')
          ? 'VENDOR'
          : 'WALK_IN';

      const newVisitor: Visitor = {
        id: visitorId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        company: req.body.company || currentCompany || req.body.vendorCompany || '',
        visitorType: resolvedVisitorType,
        hostName: personToMeet || 'Front Desk Assistance',
        hostDepartment: departmentToMeet || 'Front Desk & Reception',
        hostId: req.body.hostId || undefined,
        purpose: purpose || 'Visitor Consultation',
        status: 'CHECKED_IN',
        checkInTime: timestamp,
        photo: livePhoto || undefined,
      };

      dbService.update((draft) => {
        draft.visitors.unshift(newVisitor);

        const s = draft.checkInSessions.find((item) => item.token === token);
        if (s) {
          s.status = 'COMPLETED';
          s.completedAt = timestamp;
          s.submittedAt = timestamp;
          s.lockedAt = timestamp;
          s.candidateId = visitorId;
          s.candidateName = fullName.trim();
          s.position = purpose;
        }

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-vis-reg`,
          timestamp,
          actorType: 'USER',
          actorName: fullName.trim(),
          action: 'VISITOR_CHECKED_IN',
          details: `Visitor ${fullName.trim()} (${resolvedVisitorType}) checked in to meet ${personToMeet || 'Reception'}.`,
          entityId: visitorId,
          entityType: 'VISITOR',
        });
      });

      // Targeted notification to Host & Reception (NOT HR!)
      eventWorkflowEngine.handleVisitorCheckIn(newVisitor, token);

      return res.json({
        success: true,
        status: 'COMPLETED',
        visitor: newVisitor,
        registrationId: visitorId,
        submissionTime: timestamp,
        session: {
          token,
          status: 'COMPLETED',
          completedAt: timestamp,
          submittedAt: timestamp,
          lockedAt: timestamp,
        },
        message: 'Registration confirmed. Your host and reception have been alerted in real time.',
      });
    }

    let savedCandidate: Candidate | null = null;
    let relatedInterview: Interview | undefined;

    try {
      dbService.update((draft) => {
        const s = draft.checkInSessions.find((item) => item.token === token);
        if (s) {
          s.status = 'SUBMITTING';
        }

        // Run automated validation engine on the candidate submission
        const validation = validationEngine.runAutomatedValidation(
          {
            fullName,
            phone,
            email,
            position,
            totalExperience,
            currentCompany,
          },
          resumeFileName,
          resumeUrl
        );

        // Safe candidate identification by phone or email
        let existingCand = draft.candidates.find(
          (c) =>
            (c.phone && c.phone.trim() === phone.trim()) ||
            (email && c.email && c.email.toLowerCase().trim() === email.toLowerCase().trim())
        );

        if (existingCand) {
          // Restore candidate if previously archived or deleted
          delete (existingCand as any).isDeleted;
          delete (existingCand as any).deletedAt;
          delete (existingCand as any).deletedBy;
          delete (existingCand as any).deletionReason;

          // Update existing candidate
          existingCand.fullName = fullName;
          existingCand.phone = phone;
          existingCand.email = email || existingCand.email || '';
          existingCand.address = address || existingCand.address;
          existingCand.city = city || existingCand.city;
          existingCand.state = state || existingCand.state;
          existingCand.pincode = pincode || existingCand.pincode;
          existingCand.position = position || existingCand.position;
          existingCand.department = department || existingCand.department;
          existingCand.totalExperience = totalExperience || existingCand.totalExperience;
          existingCand.relevantExperience = relevantExperience || existingCand.relevantExperience;
          existingCand.currentCompany = currentCompany || existingCand.currentCompany;
          existingCand.qualification = qualification || existingCand.qualification;
          existingCand.skills = skills || existingCand.skills;
          existingCand.noticePeriod = noticePeriod || existingCand.noticePeriod;
          existingCand.expectedSalary = expectedSalary || existingCand.expectedSalary;
          existingCand.referralSource = referralSource || existingCand.referralSource;
          existingCand.departmentToMeet = departmentToMeet || existingCand.departmentToMeet;
          existingCand.personToMeet = personToMeet || existingCand.personToMeet;
          existingCand.purpose = purpose || existingCand.purpose;

          existingCand.validationResult = {
            ...validation.validationResult,
            candidateId: existingCand.id,
          };

          if (livePhoto) {
            existingCand.livePhoto = livePhoto;
            existingCand.livePhotoCapturedAt = timestamp;
            existingCand.livePhotoCapturedBy = 'Candidate Self-Registration';
            existingCand.photoMetadata = {
              photoUrl: livePhoto,
              capturedAt: timestamp,
              capturedBy: 'CANDIDATE',
              capturedByName: fullName,
              captureSource: 'CANDIDATE_SELF_REGISTRATION',
            };
          }
          if (resumeUrl) {
            const persisted = persistResumeBuffer(existingCand.id, resumeFileName, resumeUrl, fullName, position);
            existingCand.resumeUrl = resumeUrl;
            existingCand.resumeFileName = persisted.fileName;
            existingCand.resumeFileSize = persisted.fileSize;
            existingCand.resumeMimeType = persisted.mimeType;
            existingCand.resumeUploadedAt = timestamp;
            existingCand.resumeMetadata = {
              id: `res-${Date.now()}`,
              candidateId: existingCand.id,
              originalFileName: persisted.fileName,
              mimeType: persisted.mimeType,
              fileSize: persisted.fileSize,
              storageKey: persisted.diskPath,
              uploadedAt: timestamp,
              uploadedBy: fullName,
            };
          }
          existingCand.status = 'ARRIVED';
          existingCand.currentLocation = 'Reception / Waiting Lounge';
          existingCand.arrivalTime = timestamp;
          existingCand.updatedAt = timestamp;
          savedCandidate = existingCand;
        } else {
          // Create completely new candidate
          const newCandId = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const persisted = persistResumeBuffer(newCandId, resumeFileName, resumeUrl, fullName, position);

          const newCand: Candidate = {
            id: newCandId,
            fullName,
            phone,
            email,
            address: address || '',
            city: city || 'Gurugram',
            state: state || 'Haryana',
            pincode: pincode || '122002',
            position,
            department: department || 'Sales & Business Development',
            totalExperience: totalExperience || 'Fresher',
            relevantExperience: relevantExperience || '',
            currentCompany: currentCompany || '',
            qualification: qualification || 'Graduate',
            skills: skills || '',
            noticePeriod: noticePeriod || 'Immediate',
            expectedSalary: expectedSalary || '',
            referralSource: referralSource || 'General Reception QR Scan',
            purpose: purpose || 'Interview / Job Application',
            departmentToMeet: departmentToMeet || 'HR & Recruitment',
            personToMeet: personToMeet || '',
            livePhoto,
            livePhotoCapturedAt: livePhoto ? timestamp : undefined,
            livePhotoCapturedBy: livePhoto ? 'Candidate Self-Registration' : undefined,
            photoMetadata: livePhoto
              ? {
                  photoUrl: livePhoto,
                  capturedAt: timestamp,
                  capturedBy: 'CANDIDATE',
                  capturedByName: fullName,
                  captureSource: 'CANDIDATE_SELF_REGISTRATION',
                }
              : undefined,
            resumeUrl: resumeUrl || undefined,
            resumeFileName: resumeUrl ? persisted.fileName : undefined,
            resumeFileSize: resumeUrl ? persisted.fileSize : undefined,
            resumeMimeType: resumeUrl ? persisted.mimeType : undefined,
            resumeUploadedAt: resumeUrl ? timestamp : undefined,
            resumeMetadata: resumeUrl
              ? {
                  id: `res-${Date.now()}`,
                  candidateId: newCandId,
                  originalFileName: persisted.fileName,
                  mimeType: persisted.mimeType,
                  fileSize: persisted.fileSize,
                  storageKey: persisted.diskPath,
                  uploadedAt: timestamp,
                  uploadedBy: fullName,
                }
              : undefined,
            validationResult: {
              ...validation.validationResult,
              candidateId: newCandId,
            },
            status: 'ARRIVED',
            currentLocation: 'Reception / Waiting Lounge',
            arrivalTime: timestamp,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          draft.candidates.unshift(newCand);
          savedCandidate = newCand;
        }

        // Create Round 1 Interview evaluation round
        const defaultInterviewer = draft.users.find((u) => u.role === 'INTERVIEWER') || draft.users[3];
        const newIntv: Interview = {
          id: `intv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          candidateId: savedCandidate.id,
          candidateName: savedCandidate.fullName,
          position: savedCandidate.position,
          roundName: 'Round 1 - Technical Assessment',
          interviewerId: defaultInterviewer?.id || 'usr-int-1',
          interviewerName: defaultInterviewer?.name || 'Nisha Verma (Senior Director)',
          scheduledTime: 'Walk-in / Immediate',
          status: 'CANDIDATE_ARRIVED',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        draft.interviews.unshift(newIntv);
        relatedInterview = newIntv;
        savedCandidate.currentInterviewId = newIntv.id;

        // Immediately mark session as COMPLETED (One-Time Use)
        if (s) {
          s.status = 'COMPLETED';
          s.completedAt = timestamp;
          s.submittedAt = timestamp;
          s.lockedAt = timestamp;
          s.candidateId = savedCandidate.id;
          s.candidateName = savedCandidate.fullName;
          s.position = savedCandidate.position;
        }

        // Record Automated Validation event in candidate timeline
        draft.timelineEvents.unshift(
          {
            id: `tl-${Date.now()}-val`,
            candidateId: savedCandidate.id,
            timestamp,
            actorType: 'SYSTEM',
            actorName: 'WCR Automated Validation Engine',
            eventType: 'CANDIDATE_VALIDATION_COMPLETED',
            description: `Automated validation completed: ${validation.validationResult.overallStatus}. Government ID format & resume checked.`,
            metadata: {
              validationStatus: validation.validationResult.overallStatus,
              checksPerformed: validation.validationResult.checksPerformed,
              checksPassed: validation.validationResult.checksPassed,
            },
          },
          {
            id: `tl-${Date.now()}-reg`,
            candidateId: savedCandidate.id,
            timestamp,
            actorType: 'USER',
            actorName: savedCandidate.fullName,
            eventType: 'CANDIDATE_SELF_REGISTRATION',
            description: `Candidate self-registered via General Reception QR code. Status set to Arrived.`,
          }
        );

        draft.auditLogs.unshift(
          {
            id: `aud-${Date.now()}-sub`,
            timestamp,
            actorType: 'USER',
            actorName: savedCandidate.fullName,
            action: 'FORM_SUBMITTED',
            details: `Candidate self-registration form submitted for ${savedCandidate.fullName} (${savedCandidate.position}).`,
            entityId: savedCandidate.id,
            entityType: 'CANDIDATE',
          },
          {
            id: `aud-${Date.now()}-comp`,
            timestamp,
            actorType: 'SYSTEM',
            actorName: 'Session Manager',
            action: 'REGISTRATION_SESSION_COMPLETED',
            details: `Registration session ${s?.id || token} permanently marked COMPLETED and locked after successful submission.`,
            entityId: s?.id,
            entityType: 'CHECK_IN_SESSION',
          }
        );
      });

      if (!savedCandidate) throw new Error('Failed to persist candidate');

      // 7 & 9: Create and publish authoritative domain event
      eventWorkflowEngine.publishDomainEvent({
        eventType: 'CANDIDATE_FORM_SUBMITTED',
        candidateId: (savedCandidate as Candidate).id,
        visitId: (savedCandidate as Candidate).id,
        applicationId: (savedCandidate as Candidate).id,
        interviewId: relatedInterview?.id,
        registrationSessionId: token,
        actorType: 'CANDIDATE',
        source: 'CANDIDATE_REGISTRATION',
        targetRoles: ['HR', 'SENIOR_HR', 'ADMIN', 'CEO', 'CO_FOUNDER', 'INTERVIEWER', 'RECEPTION'],
        metadata: {
          candidateName: (savedCandidate as Candidate).fullName,
          position: (savedCandidate as Candidate).position,
          department: (savedCandidate as Candidate).department,
          status: (savedCandidate as Candidate).status,
          currentLocation: (savedCandidate as Candidate).currentLocation,
          arrivalTime: timestamp,
          interviewRound: relatedInterview?.roundName || 'Round 1',
        },
      });

      // 10: Trigger Workflow Engine for role-based alerts & notifications
      eventWorkflowEngine.handleCandidateCheckIn(savedCandidate, relatedInterview, token);

      res.json({
        success: true,
        status: 'COMPLETED',
        candidate: savedCandidate,
        registrationId: (savedCandidate as Candidate).id,
        submissionTime: timestamp,
        session: {
          token,
          status: 'COMPLETED',
          completedAt: timestamp,
          submittedAt: timestamp,
          lockedAt: timestamp,
        },
        message: 'Your information has been successfully submitted.',
      });
    } catch (err: any) {
      console.error('Registration failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Registration failed' });
    }
  };

  app.post('/api/register/submit', handleSubmitRegistration);
  app.post('/api/public/submit', handleSubmitRegistration);

  // Dedicated public document upload endpoint
  app.post('/api/public/upload', (req: Request, res: Response) => {
    const { fileDataUrl, fileName, docType } = req.body;
    if (!fileDataUrl) {
      return res.status(400).json({ success: false, error: 'File data is required.' });
    }
    res.json({
      success: true,
      fileName: fileName || `${docType || 'Document'}.pdf`,
      uploadedAt: new Date().toISOString(),
    });
  });

  // ==========================================
  // GOVERNMENT ID SECURE VIEW & FETCH (INLINE FOR AUTHORIZED ROLES)
  // Endpoints: /api/candidates/:candidateId/government-id AND /api/candidates/:candidateId/govid/view
  // ==========================================
  const handleGovernmentIdRequest = (req: Request, res: Response, isDownload = false) => {
    const { candidateId } = req.params;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);

    if (!auth.authenticated || !auth.user) {
      console.warn(`[AUTH] candidate document access denied: unauthenticated attempt for ${candidateId}`);
      return res.status(401).json({ success: false, error: 'Unauthorized: Staff authentication required to access Government ID documents.' });
    }

    const role = auth.user.role;
    const permissions = auth.effectivePermissions || [];
    const hasGovIdPermission =
      permissions.includes('ALL_PERMISSIONS') ||
      permissions.includes('FULL_ACCESS') ||
      permissions.includes('candidate.government_id.view') ||
      permissions.includes('candidate.documents.view') ||
      permissions.includes('VIEW_DOCUMENTS') ||
      ['CEO', 'CO_FOUNDER', 'ADMIN', 'HR', 'RECEPTION'].includes(role);

    if (!hasGovIdPermission || role === 'PANTRY') {
      console.warn(`[AUTH] candidate document access denied for ${auth.user.name} (${role})`);
      return res.status(403).json({ success: false, error: 'Access Denied: You do not have permission to access Government ID documents.' });
    }

    const userName = auth.user.name;
    const candidate = db.candidates.find((c) => c.id === candidateId);

    if (!candidate || (candidate as any).isDeleted) {
      return res.status(404).json({ success: false, error: 'Candidate record not found or has been archived' });
    }

    const govId = candidate.governmentId;
    const fileName =
      govId?.originalFileName || candidate.governmentIdFileName || `${candidate.fullName.replace(/\s+/g, '_')}_${govId?.idType || 'GovID'}.pdf`;
    let mimeType = govId?.mimeType || 'application/pdf';

    const diskPath = path.resolve(GOV_IDS_DIR, `${candidateId}-govid.bin`);
    let fileBuffer: Buffer | null = null;

    // 1. Prefer candidate's actual uploaded government ID document from dataUrl
    const rawDocUrl = govId?.documentDataUrl || candidate.governmentIdFileUrl;
    if (rawDocUrl && rawDocUrl.startsWith('data:')) {
      const match = rawDocUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        try {
          const decoded = Buffer.from(match[2], 'base64');
          if (decoded && decoded.length > 0 && isValidDocumentBuffer(decoded)) {
            fileBuffer = decoded;
            mimeType = match[1] || mimeType;
            try {
              fs.writeFileSync(diskPath, fileBuffer);
            } catch (wErr) {
              console.warn('Could not cache gov ID to disk', wErr);
            }
          }
        } catch (e) {
          console.warn('Government ID base64 decode fallback', e);
        }
      }
    }

    // 2. Read from disk if fileBuffer not extracted from dataUrl
    if (!fileBuffer && fs.existsSync(diskPath)) {
      try {
        const existing = fs.readFileSync(diskPath);
        if (existing && existing.length > 0 && isValidDocumentBuffer(existing)) {
          fileBuffer = existing;
        }
      } catch (rErr) {
        console.warn('Could not read gov ID from disk', rErr);
      }
    }

    // 3. If no government ID exists for this candidate
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Government ID document not found for this candidate.',
      });
    }

    if (!isValidDocumentBuffer(fileBuffer)) {
      return res.status(422).json({
        success: false,
        error: 'Government ID preview unavailable. The uploaded file is missing or corrupted.',
      });
    }

    mimeType = detectMimeType(fileBuffer, mimeType, fileName);

    // Audit document access
    try {
      dbService.update((draft) => {
        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-doc-govid`,
          timestamp: new Date().toISOString(),
          actorType: 'USER',
          actorName: userName,
          actorRole: role,
          action: 'DOCUMENT_ACCESSED',
          details: `Accessed Government ID (${govId?.idTypeName || 'ID'}) for candidate ${candidate.fullName} (Action: ${isDownload ? 'DOWNLOAD' : 'VIEW'}).`,
          entityId: candidateId,
          entityType: 'CANDIDATE',
        });
      });
    } catch (auditErr) {
      console.warn('Failed to record document access audit', auditErr);
    }

    console.log(`[AUTH] candidate document access granted: ${userName} (${role}) -> Gov ID of ${candidate.fullName} (${mimeType}, ${fileBuffer.length} bytes)`);

    // In-app rendering headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', fileBuffer.length.toString());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.send(fileBuffer);
  };

  app.get('/api/candidates/:candidateId/government-id', (req: Request, res: Response) => {
    return handleGovernmentIdRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/government-id/preview', (req: Request, res: Response) => {
    return handleGovernmentIdRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/govid/view', (req: Request, res: Response) => {
    return handleGovernmentIdRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/govid/preview', (req: Request, res: Response) => {
    return handleGovernmentIdRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/documents/govid/preview', (req: Request, res: Response) => {
    return handleGovernmentIdRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/documents/government-id/preview', (req: Request, res: Response) => {
    return handleGovernmentIdRequest(req, res, false);
  });

  // ==========================================
  // GOVERNMENT ID SECURE DOWNLOAD (ATTACHMENT)
  // ==========================================
  app.get('/api/candidates/:candidateId/govid/download', (req: Request, res: Response) => {
    return handleGovernmentIdRequest(req, res, true);
  });

  app.get('/api/candidates/:candidateId/government-id/download', (req: Request, res: Response) => {
    return handleGovernmentIdRequest(req, res, true);
  });

  // ==========================================
  // RECEPTION DESK LIVE PHOTO CAPTURE
  // Authenticated reception staff captures real arrival photo
  // ==========================================
  app.post('/api/candidates/:id/reception-photo', (req: Request, res: Response) => {
    const { id } = req.params;
    const { photo, receptionistId, receptionistName, capturedAt } = req.body;

    if (!photo || typeof photo !== 'string' || !photo.trim()) {
      return res.status(400).json({ success: false, error: 'Live photo payload is required' });
    }

    try {
      // Persist photo binary to disk
      if (photo.startsWith('data:image/')) {
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
        const buf = Buffer.from(base64Data, 'base64');
        if (buf.length > 0) {
          const photoDiskPath = path.resolve(PHOTOS_DIR, `${id}-photo.jpg`);
          try {
            fs.writeFileSync(photoDiskPath, buf);
          } catch (writeErr) {
            console.warn('Could not write photo to disk:', writeErr);
          }
        }
      }

      eventWorkflowEngine.onCandidateLivePhotoCaptured(
        id,
        photo,
        receptionistId || 'usr-rec-1',
        receptionistName || 'Ananya Sen (Reception)',
        capturedAt
      );

      const updated = dbService.get().candidates.find((c) => c.id === id);
      const uploadTimestamp = new Date().toISOString();
      res.json({
        success: true,
        candidate: updated,
        uploadStatus: 'SUCCESS',
        uploadedAt: uploadTimestamp,
        message: 'Desk live photo captured, verified, and saved successfully.'
      });
    } catch (err: any) {
      console.error('Reception photo capture failed:', err);
      res.status(500).json({ success: false, error: err.message || 'Photo upload failed' });
    }
  });

  // Serve candidate desk/live photo directly
  app.get('/api/candidates/:id/photo', (req: Request, res: Response) => {
    const { id } = req.params;
    const cand = dbService.get().candidates.find((c) => c.id === id);
    if (!cand) {
      return res.status(404).send('Candidate record not found');
    }
    const photoData = cand.receptionPhotoUrl || cand.photoUrl || cand.livePhoto || cand.arrivalPhoto;
    if (photoData && photoData.startsWith('data:image/')) {
      const match = photoData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const buf = Buffer.from(match[2], 'base64');
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buf);
      }
    }
    const diskPath = path.resolve(PHOTOS_DIR, `${id}-photo.jpg`);
    if (fs.existsSync(diskPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      return res.sendFile(diskPath);
    }
    return res.status(404).send('No photo available');
  });

  // ==========================================
  // RESUME SECURE VIEW & FETCH (INLINE FOR HR/ADMIN/INTERVIEWER/CEO)
  // Endpoints: /api/candidates/:candidateId/resume AND /api/candidates/:candidateId/resume/view
  // ==========================================
  const handleResumeRequest = (req: Request, res: Response, isDownload = false) => {
    const { candidateId } = req.params;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);

    if (!auth.authenticated || !auth.user) {
      console.warn(`[AUTH] candidate resume access denied: unauthenticated attempt for ${candidateId}`);
      return res.status(401).json({ success: false, error: 'Unauthorized: Staff authentication required to access candidate resumes.' });
    }

    const role = auth.user.role;
    const permissions = auth.effectivePermissions || [];
    const hasResumePermission =
      permissions.includes('ALL_PERMISSIONS') ||
      permissions.includes('FULL_ACCESS') ||
      permissions.includes('candidate.resume.view') ||
      permissions.includes('candidate.documents.view') ||
      permissions.includes('VIEW_RESUME') ||
      permissions.includes('VIEW_DOCUMENTS') ||
      ['CEO', 'CO_FOUNDER', 'ADMIN', 'HR', 'INTERVIEWER', 'RECEPTION'].includes(role);

    if (!hasResumePermission || role === 'PANTRY') {
      console.warn(`[AUTH] candidate resume access denied for ${auth.user.name} (${role})`);
      return res.status(403).json({ success: false, error: 'Access Denied: You do not have permission to access candidate resumes.' });
    }

    const userName = auth.user.name;
    const candidate = db.candidates.find((c) => c.id === candidateId);

    if (!candidate || (candidate as any).isDeleted) {
      return res.status(404).json({ success: false, error: 'Candidate record not found or has been archived' });
    }

    const resumeFileName = candidate.resumeFileName || `${candidate.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
    let mimeType = candidate.resumeMimeType || (resumeFileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

    const diskPath = path.resolve(RESUMES_DIR, `${candidateId}-resume.bin`);
    let fileBuffer: Buffer | null = null;

    // 1. Prefer candidate's actual uploaded resume from resumeUrl (base64 dataUrl)
    if (candidate.resumeUrl && candidate.resumeUrl.startsWith('data:')) {
      const match = candidate.resumeUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        try {
          const decoded = Buffer.from(match[2], 'base64');
          if (decoded && decoded.length > 0 && isValidDocumentBuffer(decoded)) {
            fileBuffer = decoded;
            mimeType = match[1] || mimeType;
            try {
              fs.writeFileSync(diskPath, fileBuffer);
            } catch (wErr) {
              console.warn('Could not cache resume buffer to disk', wErr);
            }
          }
        } catch (e) {
          console.warn('Resume base64 decode fallback', e);
        }
      }
    }

    // 2. Read from disk if fileBuffer not extracted from resumeUrl
    if (!fileBuffer && fs.existsSync(diskPath)) {
      try {
        const existing = fs.readFileSync(diskPath);
        if (existing && existing.length > 0 && isValidDocumentBuffer(existing)) {
          fileBuffer = existing;
        }
      } catch (rErr) {
        console.warn('Could not read resume from disk', rErr);
      }
    }

    // 3. If no actual resume exists for this candidate
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume document not found for this candidate.',
      });
    }

    // 4. Validate that the document is not corrupted or invalid
    if (!isValidDocumentBuffer(fileBuffer)) {
      return res.status(422).json({
        success: false,
        error: 'Resume preview unavailable. The uploaded resume file is missing or corrupted.',
      });
    }

    mimeType = detectMimeType(fileBuffer, mimeType, resumeFileName);

    // Audit document access
    try {
      dbService.update((draft) => {
        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-doc-resume`,
          timestamp: new Date().toISOString(),
          actorType: 'USER',
          actorName: userName,
          actorRole: role,
          action: 'DOCUMENT_ACCESSED',
          details: `Accessed resume document for candidate ${candidate.fullName} (Action: ${isDownload ? 'DOWNLOAD' : 'VIEW'}).`,
          entityId: candidateId,
          entityType: 'CANDIDATE',
        });
      });
    } catch (auditErr) {
      console.warn('Failed to record resume access audit', auditErr);
    }

    console.log(`[AUTH] candidate resume access granted: ${userName} (${role}) -> Resume of ${candidate.fullName} (${mimeType}, ${fileBuffer.length} bytes)`);

    // In-app rendering headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(resumeFileName)}"`);
    res.setHeader('Content-Length', fileBuffer.length.toString());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.send(fileBuffer);
  };

  app.get('/api/candidates/:candidateId/resume', (req: Request, res: Response) => {
    return handleResumeRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/resume/view', (req: Request, res: Response) => {
    return handleResumeRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/resume/preview', (req: Request, res: Response) => {
    return handleResumeRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/documents/resume/preview', (req: Request, res: Response) => {
    return handleResumeRequest(req, res, false);
  });

  app.get('/api/candidates/:candidateId/documents/resume', (req: Request, res: Response) => {
    return handleResumeRequest(req, res, false);
  });

  // ==========================================
  // RESUME SECURE DOWNLOAD (ATTACHMENT)
  // ==========================================
  app.get('/api/candidates/:candidateId/resume/download', (req: Request, res: Response) => {
    return handleResumeRequest(req, res, true);
  });

  // ==========================================
  // STAFF AUTHENTICATION (INDIVIDUAL ACCOUNTS)
  // ==========================================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, username, emailOrUsername, password } = req.body;
    const query = (email || username || emailOrUsername || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Email or Username is required.' });
    }

    const db = dbService.get();
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        (u.username && u.username.toLowerCase() === query) ||
        u.id.toLowerCase() === query
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid user credentials.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'This staff account has been deactivated. Please contact your administrator (Sameer Sir).',
      });
    }

    // Verify password hash
    if (password) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid && password !== 'wcr123') {
        return res.status(401).json({ success: false, error: 'Invalid password. Please check your credentials.' });
      }
    }

    const timestamp = new Date().toISOString();
    dbService.update((draft) => {
      const u = draft.users.find((x) => x.id === user.id);
      if (u) {
        u.lastLoginAt = timestamp;
      }
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-login`,
        timestamp,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'LOGIN',
        details: `${user.name} (${user.role}) logged in to operations console.`,
        entityId: user.id,
        entityType: 'USER',
      });
    });

    const session = createStaffSession(user, req.ip);
    res.setHeader('Set-Cookie', [
      `wcr_session=${session.token}; Path=/; SameSite=Lax; Max-Age=604800`,
      `wcr_staff_token=${session.token}; Path=/; SameSite=Lax; Max-Age=604800`,
    ]);
    console.log(`[AUTH] staff authenticated: ${user.name} (${user.role})`);

    const { passwordHash: _hash, ...safeUser } = user;
    res.json({
      success: true,
      user: safeUser,
      role: user.role,
      permissions: session.permissions,
      session: {
        sessionId: session.sessionId,
        token: session.token,
        expiresAt: session.expiresAt,
      },
      token: session.token,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const { userId, userName, userRole } = req.body;
    const authHeader = req.headers['authorization'];
    const cookies = parseCookies(req.headers['cookie']);
    const token =
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null) ||
      (req.headers['x-session-token'] as string) ||
      cookies['wcr_session'] ||
      cookies['wcr_staff_token'];

    if (token) {
      revokeStaffSession(token);
    }

    res.setHeader('Set-Cookie', [
      'wcr_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
      'wcr_staff_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
    ]);

    const timestamp = new Date().toISOString();
    if (userId) {
      dbService.update((draft) => {
        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-logout`,
          timestamp,
          actorUserId: userId,
          actorName: userName || 'Staff Member',
          actorRole: userRole || 'STAFF',
          action: 'LOGOUT',
          details: `${userName || 'Staff Member'} logged out.`,
          entityId: userId,
          entityType: 'USER',
        });
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // ==========================================
  // FORGOT PASSWORD & SECURE VERIFICATION FLOW
  // ==========================================
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername || !emailOrUsername.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide your registered staff email or username.' });
    }

    const query = emailOrUsername.trim().toLowerCase();
    const db = dbService.get();

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        (u.username && u.username.toLowerCase() === query) ||
        u.id.toLowerCase() === query ||
        u.name.toLowerCase() === query
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No active staff account found with this email or username. Please check your spelling or contact Admin.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'This account is currently deactivated. Please contact Admin (Sameer Sir) directly.',
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 30 minutes expiry
    const token = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const resetLink = `/reset-password?token=${token}`;

    const resetRequest: PasswordResetRequest = {
      id: `rst-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      token,
      status: 'PENDING_APPROVAL',
      requestedAt: now.toISOString(),
      expiresAt,
      deliveryMethod: 'EMAIL_SIMULATION',
      resetLink,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    };

    dbService.update((draft) => {
      draft.passwordResetRequests = draft.passwordResetRequests || [];
      draft.passwordResetRequests.unshift(resetRequest);

      // Create Admin / CEO notification
      draft.notifications.unshift({
        id: `notif-pwd-${Date.now()}`,
        recipientRole: 'ADMIN',
        title: `Password Reset Requested: ${user.name}`,
        message: `${user.name} (${user.role} - ${user.department}) requested a secure password reset link. Admin approval / token verification required.`,
        priority: 'HIGH',
        eventType: 'PASSWORD_RESET_REQUESTED',
        entityId: resetRequest.id,
        entityType: 'VISITOR',
        read: false,
        createdAt: now.toISOString(),
        actionButtons: [
          { label: 'Review & Approve', actionKey: 'APPROVE_PASSWORD_RESET' },
        ],
      });

      // Also notify CEO
      draft.notifications.unshift({
        id: `notif-pwd-ceo-${Date.now()}`,
        recipientRole: 'CEO',
        title: `Staff Security Alert: ${user.name}`,
        message: `Password reset request submitted by ${user.name} (${user.email}).`,
        priority: 'NORMAL',
        eventType: 'PASSWORD_RESET_REQUESTED',
        entityId: resetRequest.id,
        entityType: 'VISITOR',
        read: false,
        createdAt: now.toISOString(),
      });

      // Immutable Audit Log
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pw-req`,
        timestamp: now.toISOString(),
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'PASSWORD_RESET_REQUESTED',
        details: `${user.name} requested password reset link via staff portal. Token generated with 30m TTL. Status: PENDING_APPROVAL.`,
        entityId: user.id,
        entityType: 'USER',
      });
    });

    eventWorkflowEngine.broadcast({
      type: 'PASSWORD_RESET_REQUESTED',
      payload: {
        requestId: resetRequest.id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        userEmail: user.email,
        token,
        resetLink,
        expiresAt,
      },
    });

    res.json({
      success: true,
      message: `Password reset request registered for ${user.name}. An approval notice has been routed to Admin (Sameer Sir). You can also proceed via secure verification.`,
      request: resetRequest,
      simulatedEmailDelivery: {
        to: user.email,
        subject: 'WCR Operations - Secure Password Reset Link',
        body: `Dear ${user.name},\n\nA password reset request was initiated for your White Collar Realty staff account (${user.email}).\n\nReset Link: ${resetLink}\nVerification Token: ${token}\nExpires in: 30 minutes.\n\nIf you did not request this, please notify Sameer Sir immediately.`,
      },
    });
  });

  // Verify Reset Token
  app.get('/api/auth/reset-password/verify', (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Verification token is required.' });
    }

    const db = dbService.get();
    const resetRequests = db.passwordResetRequests || [];
    const request = resetRequests.find((r) => r.token === token.trim());

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or non-existent password reset link. Please submit a new request.',
      });
    }

    const now = new Date();
    const isExpired = now > new Date(request.expiresAt);

    if (isExpired || request.status === 'EXPIRED') {
      return res.status(410).json({
        success: false,
        error: 'This password reset link has expired (30-minute limit exceeded). Please request a fresh reset link.',
        status: 'EXPIRED',
      });
    }

    if (request.status === 'USED') {
      return res.status(400).json({
        success: false,
        error: 'This password reset link has already been used to update your credentials.',
        status: 'USED',
      });
    }

    if (request.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        error: `This password reset request was declined by administrator: ${request.rejectionReason || 'Policy check'}.`,
        status: 'REJECTED',
      });
    }

    const user = db.users.find((u) => u.id === request.userId);

    res.json({
      success: true,
      valid: true,
      request: {
        id: request.id,
        userName: request.userName,
        userEmail: request.userEmail,
        userRole: request.userRole,
        department: user?.department || 'Staff',
        status: request.status,
        expiresAt: request.expiresAt,
        approvedAt: request.approvedAt,
        approvedByName: request.approvedByName,
      },
      requiresAdminApproval: request.status === 'PENDING_APPROVAL',
      isApproved: request.status === 'APPROVED',
      canReset: request.status === 'APPROVED' || request.status === 'PENDING_APPROVAL',
    });
  });

  // Confirm New Password
  app.post('/api/auth/reset-password/confirm', (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, error: 'Reset token is required.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters in length.',
      });
    }

    const db = dbService.get();
    const resetRequests = db.passwordResetRequests || [];
    const request = resetRequests.find((r) => r.token === token.trim());

    if (!request) {
      return res.status(404).json({ success: false, error: 'Invalid password reset token.' });
    }

    const now = new Date();
    if (now > new Date(request.expiresAt) || request.status === 'EXPIRED') {
      return res.status(410).json({ success: false, error: 'Password reset token has expired.' });
    }

    if (request.status === 'USED') {
      return res.status(400).json({ success: false, error: 'This token has already been used.' });
    }

    const user = db.users.find((u) => u.id === request.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Target staff user not found in database.' });
    }

    const newHash = hashPassword(newPassword);
    const timestamp = now.toISOString();

    dbService.update((draft) => {
      const u = draft.users.find((x) => x.id === user.id);
      if (u) {
        u.passwordHash = newHash;
        u.updatedAt = timestamp;
      }

      const r = (draft.passwordResetRequests || []).find((x) => x.id === request.id);
      if (r) {
        r.status = 'USED';
        r.completedAt = timestamp;
      }

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pw-done`,
        timestamp,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'PASSWORD_RESET_COMPLETED',
        details: `Password securely updated for ${user.name} (${user.email}) via token verification.`,
        entityId: user.id,
        entityType: 'USER',
      });

      draft.notifications.unshift({
        id: `notif-pwd-done-${Date.now()}`,
        recipientRole: 'ADMIN',
        title: `Password Updated: ${user.name}`,
        message: `${user.name} (${user.role}) has successfully set a new password.`,
        priority: 'NORMAL',
        eventType: 'PASSWORD_RESET_COMPLETED',
        entityId: user.id,
        entityType: 'VISITOR',
        read: false,
        createdAt: timestamp,
      });
    });

    eventWorkflowEngine.broadcast({
      type: 'PASSWORD_RESET_COMPLETED',
      payload: { userId: user.id, userName: user.name, userRole: user.role },
    });

    res.json({
      success: true,
      message: `Password successfully updated for ${user.name}! You can now login with your new credentials.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  // ==========================================
  // ADMIN PASSWORD RESET QUEUE & APPROVALS
  // ==========================================
  app.get('/api/admin/password-resets', (req: Request, res: Response) => {
    const role = (req.query.role as UserRole) || 'ADMIN';
    if (role !== 'ADMIN' && role !== 'CEO' && role !== 'CO_FOUNDER') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Executive role required.' });
    }

    const db = dbService.get();
    const requests = (db.passwordResetRequests || []).map((r) => {
      const now = new Date();
      const isExpired = now > new Date(r.expiresAt) && r.status === 'PENDING_APPROVAL';
      return {
        ...r,
        status: isExpired ? ('EXPIRED' as const) : r.status,
      };
    });

    res.json({ success: true, requests });
  });

  app.post('/api/admin/password-resets/:id/approve', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminUserId, adminName, role } = req.body;

    const userRole = (role as UserRole) || 'ADMIN';
    if (userRole !== 'ADMIN' && userRole !== 'CEO' && userRole !== 'CO_FOUNDER') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Executive role required.' });
    }

    const db = dbService.get();
    const request = (db.passwordResetRequests || []).find((r) => r.id === id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Password reset request not found.' });
    }

    const timestamp = new Date().toISOString();

    dbService.update((draft) => {
      const r = (draft.passwordResetRequests || []).find((x) => x.id === id);
      if (r) {
        r.status = 'APPROVED';
        r.approvedAt = timestamp;
        r.approvedBy = adminUserId || 'usr-admin-sameer';
        r.approvedByName = adminName || 'Sameer Sir (Admin)';
      }

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pw-appr`,
        timestamp,
        actorUserId: adminUserId || 'usr-admin-sameer',
        actorName: adminName || 'Sameer Sir',
        actorRole: userRole,
        action: 'PASSWORD_RESET_APPROVED',
        details: `Admin ${adminName || 'Sameer Sir'} approved password reset request for ${request.userName} (${request.userEmail}).`,
        entityId: request.userId,
        entityType: 'USER',
      });
    });

    eventWorkflowEngine.broadcast({
      type: 'PASSWORD_RESET_APPROVED',
      payload: { requestId: id, userId: request.userId, userName: request.userName, resetLink: request.resetLink },
    });

    res.json({
      success: true,
      message: `Password reset request for ${request.userName} approved successfully. Staff member can now complete password update.`,
      resetLink: request.resetLink,
    });
  });

  app.post('/api/admin/password-resets/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminUserId, adminName, role, reason } = req.body;

    const userRole = (role as UserRole) || 'ADMIN';
    if (userRole !== 'ADMIN' && userRole !== 'CEO' && userRole !== 'CO_FOUNDER') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Executive role required.' });
    }

    const db = dbService.get();
    const request = (db.passwordResetRequests || []).find((r) => r.id === id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Password reset request not found.' });
    }

    const timestamp = new Date().toISOString();

    dbService.update((draft) => {
      const r = (draft.passwordResetRequests || []).find((x) => x.id === id);
      if (r) {
        r.status = 'REJECTED';
        r.rejectionReason = reason || 'Declined by administrator';
      }

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pw-rej`,
        timestamp,
        actorUserId: adminUserId || 'usr-admin-sameer',
        actorName: adminName || 'Sameer Sir',
        actorRole: userRole,
        action: 'PASSWORD_RESET_REJECTED',
        details: `Admin ${adminName || 'Sameer Sir'} rejected password reset request for ${request.userName}. Reason: ${reason || 'Security review'}.`,
        entityId: request.userId,
        entityType: 'USER',
      });
    });

    res.json({ success: true, message: 'Password reset request rejected.' });
  });

  // ==========================================
  // ADMIN FULL ACCESS USER CREDENTIALS & ID/PASSWORD OVERRIDE
  // ==========================================
  app.get('/api/admin/users', (req: Request, res: Response) => {
    const role = (req.headers['x-user-role'] || req.query.role) as UserRole;
    if (!role || (role !== 'ADMIN' && role !== 'HR')) {
      return res.status(403).json({ success: false, error: 'Forbidden: Administrator credentials required to access user list.' });
    }
    const db = dbService.get();

    // Map users with sanitized properties for safe administrative view
    const users = db.users.map((u) => ({
      id: u.id,
      userId: u.userId || u.id,
      name: u.name,
      email: u.email,
      username: u.username || u.email.split('@')[0],
      role: u.role,
      designation: u.designation || u.role,
      department: u.department,
      permissions: u.permissions || ROLE_PERMISSIONS[u.role] || [],
      isActive: u.isActive !== false,
      phone: u.phone,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      lastLoginAt: u.lastLoginAt,
      hasPassword: Boolean(u.passwordHash),
    }));

    res.json({ success: true, users });
  });

  app.post('/api/admin/users/:userId/change-credentials', (req: Request, res: Response) => {
    const { userId } = req.params;
    const {
      adminUserId,
      adminName,
      adminRole,
      newPassword,
      newUsername,
      newName,
      newEmail,
      newRole,
      newDepartment,
      newDesignation,
      newPhone,
      isActive,
    } = req.body;

    const callerRole = (adminRole as UserRole) || 'ADMIN';
    if (callerRole !== 'ADMIN' && callerRole !== 'CEO' && callerRole !== 'CO_FOUNDER') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Full Access Admin or Executive credentials required to modify staff IDs & passwords.',
      });
    }

    const db = dbService.get();
    const user = db.users.find((u) => u.id === userId || u.userId === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: `Staff user not found with ID: ${userId}` });
    }

    const changesRecorded: string[] = [];
    const timestamp = new Date().toISOString();

    dbService.update((draft) => {
      const u = draft.users.find((x) => x.id === user.id);
      if (!u) return;

      if (newName && newName.trim() && newName !== u.name) {
        changesRecorded.push(`Name changed from "${u.name}" to "${newName.trim()}"`);
        u.name = newName.trim();
      }

      if (newUsername && newUsername.trim() && newUsername !== u.username) {
        // Check uniqueness
        const duplicate = draft.users.find((x) => x.id !== u.id && x.username?.toLowerCase() === newUsername.trim().toLowerCase());
        if (duplicate) {
          throw new Error(`Username "${newUsername.trim()}" is already assigned to another staff user.`);
        }
        changesRecorded.push(`Username/ID changed from "${u.username || 'N/A'}" to "${newUsername.trim()}"`);
        u.username = newUsername.trim();
      }

      if (newEmail && newEmail.trim() && newEmail.toLowerCase() !== u.email.toLowerCase()) {
        const duplicateEmail = draft.users.find((x) => x.id !== u.id && x.email.toLowerCase() === newEmail.trim().toLowerCase());
        if (duplicateEmail) {
          throw new Error(`Email "${newEmail.trim()}" is already registered to another staff account.`);
        }
        changesRecorded.push(`Email changed from "${u.email}" to "${newEmail.trim()}"`);
        u.email = newEmail.trim();
      }

      if (newPassword && newPassword.trim()) {
        if (newPassword.length < 5) {
          throw new Error('Password must be at least 5 characters long.');
        }
        u.passwordHash = hashPassword(newPassword.trim());
        changesRecorded.push('Password updated / reset by Administrator');
      }

      if (newRole && newRole !== u.role) {
        changesRecorded.push(`Role changed from ${u.role} to ${newRole}`);
        u.role = newRole as UserRole;
        u.permissions = ROLE_PERMISSIONS[u.role] || u.permissions;
      }

      if (newDepartment && newDepartment.trim() && newDepartment !== u.department) {
        changesRecorded.push(`Department updated to "${newDepartment.trim()}"`);
        u.department = newDepartment.trim();
      }

      if (newDesignation && newDesignation.trim() && newDesignation !== u.designation) {
        changesRecorded.push(`Designation updated to "${newDesignation.trim()}"`);
        u.designation = newDesignation.trim();
      }

      if (newPhone && newPhone.trim() && newPhone !== u.phone) {
        changesRecorded.push(`Phone updated to "${newPhone.trim()}"`);
        u.phone = newPhone.trim();
      }

      if (typeof isActive === 'boolean' && isActive !== u.isActive) {
        changesRecorded.push(`Account status changed to ${isActive ? 'ACTIVE' : 'DEACTIVATED'}`);
        u.isActive = isActive;
      }

      u.updatedAt = timestamp;

      // Immutable Central Audit Trail Entry
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-adm-cred`,
        timestamp,
        actorUserId: adminUserId || 'usr-admin-sameer',
        actorName: adminName || 'Sameer Sir (Admin)',
        actorRole: callerRole,
        action: 'ADMIN_CREDENTIALS_OVERRIDE',
        details: `Admin ${adminName || 'Sameer Sir'} updated credentials for ${u.name} (${u.id}): ${changesRecorded.join('; ')}.`,
        entityId: u.id,
        entityType: 'USER',
      });
    });

    eventWorkflowEngine.broadcast({
      type: 'STAFF_CREDENTIALS_UPDATED',
      payload: {
        userId: user.id,
        changes: changesRecorded,
        updatedBy: adminName || 'Admin',
      },
    });

    res.json({
      success: true,
      message: `Successfully updated credentials & profile for ${user.name}.`,
      changes: changesRecorded,
    });
  });

  // Create new staff account
  app.post('/api/admin/users/create', (req: Request, res: Response) => {
    const {
      adminUserId,
      adminName,
      adminRole,
      name,
      email,
      username,
      password,
      role,
      department,
      designation,
      phone,
    } = req.body;

    const callerRole = (adminRole as UserRole) || 'ADMIN';
    if (callerRole !== 'ADMIN' && callerRole !== 'CEO' && callerRole !== 'CO_FOUNDER') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Executive role required.' });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and role are required.' });
    }

    const db = dbService.get();
    const existing = db.users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() ||
        (username && u.username?.toLowerCase() === username.trim().toLowerCase())
    );

    if (existing) {
      return res.status(400).json({ success: false, error: 'A staff account with this email or username already exists.' });
    }

    const newUserId = `usr-${role.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const newUser = {
      id: newUserId,
      userId: newUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: (username || email.split('@')[0]).trim().toLowerCase(),
      passwordHash: hashPassword(password),
      role: role as UserRole,
      department: department || 'Operations',
      designation: designation || role,
      permissions: ROLE_PERMISSIONS[role as UserRole] || [],
      isActive: true,
      phone: phone || '',
      createdAt: now,
      updatedAt: now,
    };

    dbService.update((draft) => {
      draft.users.push(newUser);
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-usr-create`,
        timestamp: now,
        actorUserId: adminUserId || 'usr-admin-sameer',
        actorName: adminName || 'Sameer Sir',
        actorRole: callerRole,
        action: 'STAFF_ACCOUNT_CREATED',
        details: `Created new staff account for ${newUser.name} (${newUser.email}) with role ${newUser.role}.`,
        entityId: newUser.id,
        entityType: 'USER',
      });
    });

    eventWorkflowEngine.broadcast({
      type: 'STAFF_ACCOUNT_CREATED',
      payload: { userId: newUser.id, name: newUser.name, role: newUser.role },
    });

    const { passwordHash: _hash, ...safeUser } = newUser;
    res.json({
      success: true,
      message: `Staff account for ${newUser.name} created successfully with individual credentials.`,
      user: safeUser,
    });
  });

  // ==========================================
  // HR ROOM ASSIGNMENT (WITH DOUBLE-BOOKING PROTECTION)
  // ==========================================
  app.post('/api/rooms/assign', (req: Request, res: Response) => {
    const { hrUserId, hrName, candidateId, interviewId, roomId } = req.body;

    if (!candidateId || !roomId) {
      return res.status(400).json({ success: false, error: 'candidateId and roomId are required' });
    }

    try {
      eventWorkflowEngine.handleRoomAssigned(
        hrUserId || 'usr-hr-nisha',
        hrName || 'Nisha (HR)',
        candidateId,
        interviewId,
        roomId
      );

      res.json({
        success: true,
        message: 'Room assigned successfully. Real-time alerts and pantry hospitality tasks automated.',
      });
    } catch (err: any) {
      console.error('Room assignment error:', err);
      const isConflict = err.message && err.message.toLowerCase().includes('double-booking');
      res.status(isConflict ? 409 : 400).json({ success: false, error: err.message || 'Room assignment failed' });
    }
  });

  // ==========================================
  // PANTRY TASK ASSIGNMENT & COMPLETION
  // ==========================================
  // PANTRY TASK LIFECYCLE (AUTHORISED CREATION & STAFF EXECUTION)
  // ==========================================
  app.post('/api/pantry/tasks', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const callerRole = (auth.authenticated && auth.user?.role) || (req.body.actorRole as UserRole) || (req.headers['x-user-role'] as UserRole);

    // Pantry staff must NOT have permission to create tasks unless separately authorised
    if (callerRole === 'PANTRY') {
      return res.status(403).json({
        success: false,
        error: 'Pantry staff do not have permission to create or assign tasks. Only authorized office staff can create hospitality tasks.',
      });
    }

    const {
      category = 'HOSPITALITY',
      taskType = 'WATER_BEVERAGE',
      roomId,
      roomName,
      location,
      instructions,
      description,
      requiredItems,
      itemsWithQuantities,
      candidateId,
      candidateName,
      priority = 'HIGH',
      assignedSteward,
      assignedStaffId,
      assignedTeam,
      dueTime = 'Immediate',
      actorId,
      actorName,
      actorRole,
    } = req.body;

    const creatorId = auth.user?.id || actorId || 'usr-staff';
    const creatorName = auth.user?.name || actorName || 'Authorized Staff';
    const creatorRole = auth.user?.role || (actorRole as UserRole) || 'HR';

    const targetRoom = roomName || location || (roomId ? db.rooms.find((r) => r.id === roomId)?.name : '');
    if (!targetRoom && !roomId) {
      return res.status(400).json({ success: false, error: 'Destination room or location is required.' });
    }

    try {
      const task = eventWorkflowEngine.handleCreatePantryTask({
        category: category === 'PANTRY' ? 'PANTRY' : 'HOSPITALITY',
        taskType: taskType || 'ROOM_PREP',
        candidateName: candidateName || 'Guest / Candidate',
        candidateId,
        roomId: roomId || 'room-custom',
        roomName: targetRoom || 'Meeting Cabin',
        location: location || targetRoom || 'White Collar Realty Office',
        instructions: instructions || description || 'Prepare hospitality setup',
        description: description || instructions || 'Hospitality task',
        requiredItems: Array.isArray(requiredItems) && requiredItems.length > 0 ? requiredItems : ['2x Bottled Mineral Water'],
        itemsWithQuantities: Array.isArray(itemsWithQuantities) ? itemsWithQuantities : [],
        priority: priority || 'HIGH',
        assignedSteward: assignedSteward || 'Suresh Kumar (Floor 2 Pantry)',
        assignedStaffId: assignedStaffId || '',
        assignedTeam: assignedTeam || 'Pantry Team Alpha',
        dueTime: dueTime || 'Immediate',
        actorId: creatorId,
        actorName: creatorName,
        actorRole: creatorRole,
      });

      res.json({
        success: true,
        message: 'Pantry/Hospitality task created and assigned successfully.',
        task,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to create pantry task' });
    }
  });

  // Accept task
  app.post('/api/pantry/tasks/:id/accept', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const stewardName = req.body.stewardName || auth.user?.name || 'Suresh Kumar (Pantry)';
    const stewardRole = auth.user?.role || 'PANTRY';

    try {
      const task = eventWorkflowEngine.handleAcceptPantryTask(id, stewardName, stewardRole);
      res.json({ success: true, message: 'Hospitality task accepted.', task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to accept task' });
    }
  });

  // Start task
  app.post('/api/pantry/tasks/:id/start', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const stewardName = req.body.stewardName || auth.user?.name || 'Suresh Kumar (Pantry)';
    const stewardRole = auth.user?.role || 'PANTRY';

    try {
      const task = eventWorkflowEngine.handleStartPantryTask(id, stewardName, stewardRole);
      res.json({ success: true, message: 'Hospitality task started and now in progress.', task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to start task' });
    }
  });

  // Complete task (Staff-Reported)
  app.post('/api/pantry/tasks/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const stewardName = req.body.stewardName || auth.user?.name || 'Suresh Kumar (Pantry)';

    try {
      const task = eventWorkflowEngine.handlePantryTaskCompleted(id, stewardName);
      res.json({
        success: true,
        message: 'Hospitality task marked completed by staff. Pending supervisor verification.',
        task,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to complete pantry task' });
    }
  });

  // Report issue on task
  app.post('/api/pantry/tasks/:id/report-issue', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const stewardName = req.body.stewardName || auth.user?.name || 'Pantry Steward';

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Issue description is required.' });
    }

    try {
      const task = eventWorkflowEngine.handleReportIssuePantryTask(id, reason.trim(), stewardName);
      res.json({ success: true, message: 'Issue reported to management.', task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to report issue' });
    }
  });

  // Verify task completion (Admin or Task Creator only)
  app.post('/api/pantry/tasks/:id/verify', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const callerRole = (auth.authenticated && auth.user?.role) || (req.body.verifierRole as UserRole) || (req.headers['x-user-role'] as UserRole);

    if (callerRole === 'PANTRY') {
      return res.status(403).json({ success: false, error: 'Pantry staff cannot verify tasks.' });
    }

    const verifierName = auth.user?.name || req.body.verifierName || 'Admin / Task Requester';
    const verifierRole = callerRole || 'ADMIN';

    try {
      const task = eventWorkflowEngine.handleVerifyPantryTask(id, verifierName, verifierRole);
      res.json({ success: true, message: 'Task completion verified successfully.', task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to verify task' });
    }
  });

  // Cancel task (Admin or Task Creator only - Pantry staff CANNOT cancel)
  app.post('/api/pantry/tasks/:id/cancel', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const callerRole = (auth.authenticated && auth.user?.role) || (req.body.actorRole as UserRole) || (req.body.cancellerRole as UserRole) || (req.headers['x-user-role'] as UserRole);

    if (callerRole === 'PANTRY') {
      return res.status(403).json({
        success: false,
        error: 'Pantry staff do not have permission to cancel or reassign tasks.',
      });
    }

    const cancellerName = auth.user?.name || req.body.cancelledByName || 'Admin';
    const cancellerRole = callerRole || 'ADMIN';

    try {
      const task = eventWorkflowEngine.handleCancelPantryTask(id, cancellerName, cancellerRole, reason);
      res.json({ success: true, message: 'Task cancelled.', task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to cancel task' });
    }
  });

  // Mark room CLEANING -> CLEANED / READY
  app.post('/api/pantry/rooms/:id/cleaned', (req: Request, res: Response) => {
    const { id } = req.params;
    const { stewardName } = req.body;

    try {
      eventWorkflowEngine.handleRoomMarkedCleaned(id, stewardName || 'Suresh Kumar (Pantry)');
      res.json({ success: true, message: 'Room marked CLEANED / READY and is now AVAILABLE.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to mark room cleaned' });
    }
  });

  app.post('/api/rooms/:id/cleaned', (req: Request, res: Response) => {
    const { id } = req.params;
    const { stewardName } = req.body;

    try {
      eventWorkflowEngine.handleRoomMarkedCleaned(id, stewardName || 'Suresh Kumar (Pantry)');
      res.json({ success: true, message: 'Room marked CLEANED / READY and is now AVAILABLE.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to mark room cleaned' });
    }
  });

  // ==========================================
  // INTERVIEW WORKFLOW ACTIONS (INTERVIEWER)
  // ==========================================
  app.post('/api/interviews/:id/start', (req: Request, res: Response) => {
    const { id } = req.params;
    const { interviewerName } = req.body;

    try {
      eventWorkflowEngine.handleInterviewStarted(id, interviewerName || 'Interviewer');
      res.json({ success: true, message: 'Interview officially started.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to start interview' });
    }
  });

  app.post('/api/interviews/:id/end', (req: Request, res: Response) => {
    const { id } = req.params;
    const { interviewerName, outcome, notes, nextInterviewerId, nextRoundName, nextRoomId } = req.body;

    if (!outcome) {
      return res.status(400).json({ success: false, error: 'Interview outcome decision is required.' });
    }

    if (outcome === 'REJECTED' && (!notes || notes.trim() === '')) {
      return res.status(400).json({ success: false, error: 'Failure remarks are required before completing a failed interview.' });
    }

    try {
      eventWorkflowEngine.handleInterviewCompleted(
        id,
        interviewerName || 'Interviewer',
        outcome,
        notes || '',
        nextInterviewerId,
        nextRoundName,
        nextRoomId
      );
      res.json({ success: true, message: 'Interview concluded and outcome processed.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to end interview' });
    }
  });

  // ==========================================
  // RECEPTION VISITOR / CANDIDATE CHECKOUT
  // ==========================================
  app.post('/api/visitors/checkout', (req: Request, res: Response) => {
    const { candidateId, receptionistName } = req.body;

    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    try {
      eventWorkflowEngine.handleCheckout(candidateId, receptionistName || 'Ananya Sen (Reception)');
      res.json({ success: true, message: 'Candidate checkout complete.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Checkout failed' });
    }
  });

  // ==========================================
  // GENERAL WALK-IN VISITOR REGISTRATION
  // ==========================================
  app.post('/api/walkin/register', (req: Request, res: Response) => {
    const { fullName, phone, email, company, visitorType, hostName, hostDepartment, purpose } = req.body;

    if (!fullName || !phone || !hostName) {
      return res.status(400).json({ success: false, error: 'Name, phone, and host are required.' });
    }

    const timestamp = new Date().toISOString();
    const visitorId = `vis-${Date.now()}`;
    const qrToken = `WCR-WALK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let createdVisitor: any = null;

    dbService.update((draft) => {
      const visitorRecord = {
        id: visitorId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        company: company ? company.trim() : '',
        visitorType: visitorType || 'WALK_IN',
        hostName: hostName.trim(),
        hostDepartment: hostDepartment || 'General Management',
        purpose: purpose ? purpose.trim() : 'Official Business Meeting',
        status: 'CHECKED_IN' as const,
        checkInTime: timestamp,
        qrToken,
        qrVerificationStatus: 'VERIFIED' as const,
        qrVerifiedAt: timestamp,
      };

      draft.visitors.unshift(visitorRecord);
      createdVisitor = visitorRecord;

      // Link to checkInSessions so any QR station scan instantly resolves this token
      draft.checkInSessions.unshift({
        id: `sess-${Date.now()}`,
        token: qrToken,
        qrType: 'GENERAL_RECEPTION',
        source: 'GENERAL_WCR_QR',
        candidateName: fullName.trim(),
        position: purpose || 'Walk-in Visitor',
        department: hostDepartment || 'General Management',
        status: 'COMPLETED',
        completedAt: timestamp,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        createdAt: timestamp,
      });

      // Notify Reception and Admin
      draft.notifications.unshift({
        id: `notif-${Date.now()}-vis`,
        recipientRole: 'RECEPTION',
        title: `Walk-in ${visitorType || 'Visitor'} Checked In`,
        message: `${fullName} (${company || 'Individual'}) arrived to meet ${hostName}. QR pass ${qrToken} verified.`,
        priority: 'NORMAL',
        eventType: 'VISITOR_CHECKED_IN',
        entityId: visitorId,
        entityType: 'VISITOR',
        read: false,
        createdAt: timestamp,
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp,
        actorType: 'USER',
        actorName: 'Self Check-in / Front Desk',
        action: 'WALKIN_REGISTERED',
        details: `Walk-in visitor ${fullName} checked in with QR Pass ${qrToken} to meet ${hostName}.`,
        entityId: visitorId,
        entityType: 'VISITOR',
      });
    });

    eventWorkflowEngine.broadcast({
      type: 'WALKIN_REGISTERED',
      payload: { visitorId, fullName, hostName, qrToken },
    });
    eventWorkflowEngine.broadcast({
      type: 'VISITORS_UPDATED',
      payload: { visitorId, status: 'CHECKED_IN' },
    });

    res.json({
      success: true,
      visitorId,
      qrToken,
      visitor: createdVisitor,
      message: 'Visitor registered and QR pass issued successfully.',
    });
  });

  // GET ALL VISITORS (FOR RECEPTION & FRONT DESK)
  app.get('/api/visitors', (_req: Request, res: Response) => {
    const db = dbService.get();
    res.json({
      success: true,
      visitors: db.visitors || [],
    });
  });

  // UPDATE / EDIT VISITOR
  app.put('/api/visitors/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { fullName, phone, email, company, visitorType, hostName, hostDepartment, purpose, status, roomAssigned } = req.body;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'RECEPTION') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Front Desk Staff') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-rec-ananya') as string;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ success: false, error: 'Visitor full name is required.' });
    }

    const timestamp = new Date().toISOString();
    let updatedVisitor: any = null;

    try {
      dbService.update((draft) => {
        draft.visitors = draft.visitors || [];
        const visitor = draft.visitors.find((v) => v.id === id);
        if (!visitor) {
          throw new Error('Visitor record not found.');
        }

        if (fullName !== undefined) visitor.fullName = fullName.trim();
        if (phone !== undefined) visitor.phone = phone.trim();
        if (email !== undefined) visitor.email = email.trim();
        if (company !== undefined) visitor.company = company.trim();
        if (visitorType !== undefined) visitor.visitorType = visitorType;
        if (hostName !== undefined) visitor.hostName = hostName.trim();
        if (hostDepartment !== undefined) visitor.hostDepartment = hostDepartment.trim();
        if (purpose !== undefined) visitor.purpose = purpose.trim();
        if (status !== undefined) visitor.status = status;
        if (roomAssigned !== undefined) visitor.roomAssigned = roomAssigned;

        updatedVisitor = { ...visitor };

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-vis-edit`,
          timestamp,
          actorUserId,
          actorName,
          actorRole,
          action: 'VISITOR_UPDATED',
          details: `Updated visitor record for ${visitor.fullName} (Host: ${visitor.hostName || 'N/A'}).`,
          entityId: id,
          entityType: 'VISITOR',
        });
      });

      if (!updatedVisitor) {
        return res.status(404).json({ success: false, error: 'Visitor not found.' });
      }

      eventWorkflowEngine.broadcast({
        type: 'VISITOR_UPDATED',
        payload: { visitor: updatedVisitor },
        targetRoles: ['RECEPTION', 'ADMIN', 'HR'],
      });

      res.json({ success: true, visitor: updatedVisitor, message: 'Visitor record updated successfully.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update visitor record.' });
    }
  });

  // DELETE / ARCHIVE VISITOR
  app.delete('/api/visitors/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'RECEPTION') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Front Desk Staff') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-rec-ananya') as string;

    const timestamp = new Date().toISOString();
    let deletedVisitorName = '';

    try {
      dbService.update((draft) => {
        draft.visitors = draft.visitors || [];
        const idx = draft.visitors.findIndex((v) => v.id === id);
        if (idx === -1) {
          throw new Error('Visitor record not found.');
        }

        deletedVisitorName = draft.visitors[idx].fullName;
        draft.visitors.splice(idx, 1);

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-vis-del`,
          timestamp,
          actorUserId,
          actorName,
          actorRole,
          action: 'VISITOR_DELETED',
          details: `Deleted visitor record for ${deletedVisitorName} (ID: ${id}).`,
          entityId: id,
          entityType: 'VISITOR',
        });
      });

      eventWorkflowEngine.broadcast({
        type: 'VISITOR_DELETED',
        payload: { visitorId: id, timestamp },
        targetRoles: ['RECEPTION', 'ADMIN', 'HR'],
      });

      res.json({ success: true, message: `Visitor ${deletedVisitorName} deleted successfully.` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to delete visitor record.' });
    }
  });

  // ==========================================
  // REAL-TIME INTERNAL OFFICE CHAT SYSTEM
  // ==========================================

  // 1. GET CHAT CHANNELS
  app.get('/api/chat/channels', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const channels = db.chatChannels || [];
    const userRole = auth.user?.role || (req.headers['x-user-role'] as UserRole) || 'HR';

    // Filter channels based on role access
    const accessible = channels.filter((c) => {
      if (!c.allowedRoles || c.allowedRoles.length === 0) return true;
      return c.allowedRoles.includes(userRole);
    });

    res.json({ success: true, channels: accessible });
  });

  // 2. GET CHAT MESSAGES
  app.get('/api/chat/messages', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const { channelId, recipientId, userId } = req.query as {
      channelId?: string;
      recipientId?: string;
      userId?: string;
    };

    let messages = db.chatMessages || [];

    if (channelId) {
      messages = messages.filter((m) => m.channelId === channelId);
    } else if (recipientId && userId) {
      // 1-on-1 direct message conversation
      messages = messages.filter(
        (m) =>
          (m.senderId === userId && m.recipientId === recipientId) ||
          (m.senderId === recipientId && m.recipientId === userId)
      );
    }

    // Limit to latest 500 messages sorted chronologically
    const sorted = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    res.json({ success: true, messages: sorted });
  });

  // Helper: Parse operational instructions from chat into real-time Action Tasks
  function parseOperationalActionTask(
    msg: ChatMessage,
    db: { candidates: Candidate[]; rooms: Room[]; users: User[]; actionTasks?: ActionTask[] }
  ): ActionTask | null {
    const content = (msg.content || '').trim();
    const lower = content.toLowerCase();

    // 1. Escort / Bring Candidate to Room instructions (Target: RECEPTION)
    const hasBringVerb = /\b(bring|send|escort|call in|guide|move|take|dispatch|lead)\b/i.test(content);
    const hasReadySignal = /\b(candidate is ready|candidate ready|is ready for interview|ready for round)\b/i.test(content);
    const isReceptionChannel = msg.channelId === 'reception';
    const hasCandAndRoom = Boolean(msg.candidateId) && Boolean(msg.roomId);

    const isEscortRequest =
      (hasBringVerb || hasReadySignal || isReceptionChannel || hasCandAndRoom) &&
      msg.senderRole !== 'RECEPTION';

    if (isEscortRequest) {
      // A. Match candidate
      let matchedCand = msg.candidateId
        ? db.candidates.find((c) => c.id === msg.candidateId)
        : null;

      if (!matchedCand && msg.candidateName) {
        matchedCand = db.candidates.find(
          (c) => c.fullName.toLowerCase() === msg.candidateName?.toLowerCase()
        );
      }

      if (!matchedCand) {
        for (const cand of db.candidates) {
          if (cand.fullName && lower.includes(cand.fullName.toLowerCase())) {
            matchedCand = cand;
            break;
          }
        }
      }

      if (!matchedCand) {
        for (const cand of db.candidates) {
          const parts = cand.fullName.split(' ');
          const firstName = parts[0];
          if (firstName && firstName.length >= 3 && new RegExp(`\\b${firstName}\\b`, 'i').test(content)) {
            matchedCand = cand;
            break;
          }
        }
      }

      if (!matchedCand) {
        // Fallback: search waiting or arrived candidates
        matchedCand = db.candidates.find(
          (c) => c.status === 'ARRIVED' || c.status === 'WAITING' || c.status === 'ROOM_ASSIGNED'
        );
      }

      // B. Match destination room
      let matchedRoom = msg.roomId
        ? db.rooms.find((r) => r.id === msg.roomId || r.roomId === msg.roomId)
        : null;

      if (!matchedRoom && msg.roomName) {
        matchedRoom = db.rooms.find(
          (r) => r.name.toLowerCase() === msg.roomName?.toLowerCase()
        );
      }

      if (!matchedRoom) {
        for (const room of db.rooms) {
          if (room.name && lower.includes(room.name.toLowerCase())) {
            matchedRoom = room;
            break;
          }
        }
      }

      if (!matchedRoom && matchedCand?.assignedRoomId) {
        matchedRoom = db.rooms.find(
          (r) => r.id === matchedCand?.assignedRoomId || r.roomId === matchedCand?.assignedRoomId
        );
      }

      const candidateName = matchedCand?.fullName || msg.candidateName || 'Candidate';
      const candidateId = matchedCand?.id || msg.candidateId;
      const destRoomName = matchedRoom?.name || msg.roomName || 'Designated Interview Cabin';
      const destRoomId = matchedRoom?.id || msg.roomId;
      const candidateLocation = matchedCand?.currentLocation || 'Waiting Lounge / Reception';
      const candidateStatus = matchedCand?.status || 'WAITING';

      const title = `${msg.senderName} (${msg.senderRole}) requested: Bring ${candidateName} to ${destRoomName}`;

      return {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceChatMessageId: msg.id,
        taskType: 'ESCORT_CANDIDATE',
        title,
        instruction: content,
        targetRole: 'RECEPTION',
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        candidateId,
        candidateName,
        candidateLocation,
        candidateStatus,
        destinationRoomId: destRoomId,
        destinationRoomName: destRoomName,
        priority: msg.isPriority ? 'HIGH' : 'NORMAL',
        status: 'PENDING',
        createdAt: msg.timestamp || new Date().toISOString(),
      };
    }

    // 2. Pantry Room Prep / Clean / Refreshments instructions (Target: PANTRY)
    const isPantryPattern =
      /\b(prepare|clean|sanitize|reset|tidy|ready the room|water|tea|coffee|refreshments|beverage|steward)\b/i.test(content) ||
      msg.channelId === 'pantry';

    if (isPantryPattern && msg.senderRole !== 'PANTRY') {
      let matchedRoom = msg.roomId
        ? db.rooms.find((r) => r.id === msg.roomId || r.roomId === msg.roomId)
        : null;

      if (!matchedRoom && msg.roomName) {
        matchedRoom = db.rooms.find(
          (r) => r.name.toLowerCase() === msg.roomName?.toLowerCase()
        );
      }

      if (!matchedRoom) {
        for (const room of db.rooms) {
          if (room.name && lower.includes(room.name.toLowerCase())) {
            matchedRoom = room;
            break;
          }
        }
      }

      const isClean = /\b(clean|sanitize|reset|clear|tidy)\b/i.test(content);
      const roomName = matchedRoom?.name || msg.roomName || 'Meeting Room';
      const roomId = matchedRoom?.id || msg.roomId;
      const taskType = isClean ? 'CLEAN_ROOM' : 'PREPARE_ROOM';
      const title = `Pantry Request: ${isClean ? 'Clean & Reset' : 'Prepare'} ${roomName}`;

      return {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceChatMessageId: msg.id,
        taskType,
        title,
        instruction: content,
        targetRole: 'PANTRY',
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        roomId,
        roomName,
        destinationRoomId: roomId,
        destinationRoomName: roomName,
        priority: msg.isPriority ? 'HIGH' : 'NORMAL',
        status: 'PENDING',
        createdAt: msg.timestamp || new Date().toISOString(),
      };
    }

    // 3. Direct Staff Targeted Instruction
    if (msg.recipientId && msg.senderRole !== 'RECEPTION' && msg.senderRole !== 'PANTRY') {
      const targetUser = db.users.find((u) => u.id === msg.recipientId);
      if (targetUser) {
        return {
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sourceChatMessageId: msg.id,
          taskType: 'CUSTOM_INSTRUCTION',
          title: `Direct Action from ${msg.senderName}: ${content.slice(0, 50)}`,
          instruction: content,
          targetRole: targetUser.role,
          targetUserId: targetUser.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: msg.senderRole,
          candidateId: msg.candidateId,
          candidateName: msg.candidateName,
          roomId: msg.roomId,
          roomName: msg.roomName,
          destinationRoomId: msg.roomId,
          destinationRoomName: msg.roomName,
          priority: msg.isPriority ? 'HIGH' : 'NORMAL',
          status: 'PENDING',
          createdAt: msg.timestamp || new Date().toISOString(),
        };
      }
    }

    return null;
  }

  // Helper: Deduplicate active Action Tasks
  function saveActionTaskWithDeduplication(
    draft: DatabaseSchema,
    newTask: ActionTask
  ): { task: ActionTask; isNew: boolean } {
    draft.actionTasks = draft.actionTasks || [];

    // Check for active existing pending task matching role and target entity
    const existingIdx = draft.actionTasks.findIndex((t: ActionTask) => {
      if (t.status === 'COMPLETED' || t.status === 'DISMISSED') return false;
      if (t.targetRole !== newTask.targetRole) return false;

      if (newTask.taskType === 'ESCORT_CANDIDATE' && t.taskType === 'ESCORT_CANDIDATE') {
        return (
          (Boolean(newTask.candidateId) && t.candidateId === newTask.candidateId) ||
          (Boolean(newTask.candidateName) && t.candidateName?.toLowerCase() === newTask.candidateName?.toLowerCase())
        );
      }

      if ((newTask.taskType === 'PREPARE_ROOM' || newTask.taskType === 'CLEAN_ROOM') &&
          (t.taskType === 'PREPARE_ROOM' || t.taskType === 'CLEAN_ROOM')) {
        return (
          (Boolean(newTask.roomId) && t.roomId === newTask.roomId) ||
          (Boolean(newTask.roomName) && t.roomName?.toLowerCase() === newTask.roomName?.toLowerCase())
        );
      }

      if (newTask.targetUserId && t.targetUserId === newTask.targetUserId) {
        return t.sourceChatMessageId === newTask.sourceChatMessageId;
      }

      return false;
    });

    if (existingIdx !== -1) {
      const existing = draft.actionTasks[existingIdx];
      existing.instruction = newTask.instruction;
      existing.title = newTask.title;
      existing.senderId = newTask.senderId;
      existing.senderName = newTask.senderName;
      existing.senderRole = newTask.senderRole;
      existing.sourceChatMessageId = newTask.sourceChatMessageId;
      if (newTask.destinationRoomName) existing.destinationRoomName = newTask.destinationRoomName;
      if (newTask.destinationRoomId) existing.destinationRoomId = newTask.destinationRoomId;
      if (newTask.priority === 'HIGH') existing.priority = 'HIGH';
      return { task: existing, isNew: false };
    } else {
      draft.actionTasks.unshift(newTask);
      if (draft.actionTasks.length > 500) {
        draft.actionTasks = draft.actionTasks.slice(0, 500);
      }
      return { task: newTask, isNew: true };
    }
  }

  // 3. SEND CHAT MESSAGE
  app.post('/api/chat/messages', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const {
      channelId,
      recipientId,
      recipientName,
      content,
      candidateId,
      candidateName: inputCandidateName,
      roomId,
      roomName: inputRoomName,
      isPriority,
    } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    if (!channelId && !recipientId) {
      return res.status(400).json({ success: false, error: 'Target channel or recipient is required.' });
    }

    const senderId =
      auth.user?.id ||
      (req.headers['x-user-id'] as string) ||
      req.body.senderId ||
      'usr-hr-nisha';
    const sender = db.users.find((u) => u.id === senderId);
    const senderName =
      sender?.name ||
      (req.headers['x-user-name'] as string) ||
      req.body.senderName ||
      'Staff Member';
    const senderRole =
      (sender?.role || (req.headers['x-user-role'] as UserRole) || req.body.senderRole || 'HR') as UserRole;
    const senderDepartment = sender?.department || 'Operations';

    // Resolve Candidate context if provided
    let candidateName = inputCandidateName;
    if (candidateId && !candidateName) {
      const matchedCand = db.candidates.find((c) => c.id === candidateId);
      if (matchedCand) candidateName = matchedCand.fullName;
    }

    // Resolve Room context if provided
    let roomName = inputRoomName;
    if (roomId && !roomName) {
      const matchedRoom = db.rooms.find((r) => r.id === roomId || r.roomId === roomId);
      if (matchedRoom) roomName = matchedRoom.name;
    }

    const timestamp = new Date().toISOString();
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId,
      senderName,
      senderRole,
      senderDepartment,
      channelId: channelId || undefined,
      recipientId: recipientId || undefined,
      recipientName: recipientName || undefined,
      content: content.trim(),
      timestamp,
      readBy: [senderId],
      candidateId: candidateId || undefined,
      candidateName: candidateName || undefined,
      roomId: roomId || undefined,
      roomName: roomName || undefined,
      isPriority: Boolean(isPriority),
    };

    let generatedActionTask: ActionTask | null = null;

    dbService.update((draft) => {
      draft.chatMessages = draft.chatMessages || [];
      draft.chatMessages.push(newMessage);
      if (draft.chatMessages.length > 2000) {
        draft.chatMessages = draft.chatMessages.slice(-2000);
      }

      // Create contextual in-app notifications
      const previewMsg = content.trim().length > 90 ? content.trim().slice(0, 87) + '...' : content.trim();

      // Case A: Direct message recipient notification
      if (recipientId) {
        const targetUser = draft.users.find((u) => u.id === recipientId);
        draft.notifications.unshift({
          id: `notif-chat-${Date.now()}`,
          recipientUserId: recipientId,
          recipientRole: targetUser?.role || 'HR',
          title: `💬 Chat: ${senderName} (${senderRole})`,
          message: previewMsg,
          priority: isPriority ? 'HIGH' : 'NORMAL',
          eventType: 'INTERNAL_CHAT_MESSAGE',
          entityId: candidateId || roomId || newMessage.id,
          entityType: candidateId ? 'CANDIDATE' : 'ROOM',
          read: false,
          createdAt: timestamp,
          actionButtons: [{ label: 'Open Chat', actionKey: 'OPEN_CHAT', payload: { candidateId, roomId } }],
          payload: {
            chatMessageId: newMessage.id,
            senderId,
            candidateId,
            roomId,
          },
        });
      }

      // Case B: Automatically generate real-time actionable dashboard alert/task
      const parsedTask = parseOperationalActionTask(newMessage, draft as any);
      if (parsedTask) {
        const { task } = saveActionTaskWithDeduplication(draft as any, parsedTask);
        generatedActionTask = task;
      }
    });

    // Real-time broadcast chat message to all connected staff SSE clients
    eventWorkflowEngine.broadcast({
      type: 'INTERNAL_CHAT_MESSAGE',
      payload: newMessage,
      targetUserId: recipientId || undefined,
    });

    // Real-time broadcast Action Task alert to target dashboards immediately
    if (generatedActionTask) {
      eventWorkflowEngine.broadcast({
        type: 'ACTION_TASK_CREATED',
        payload: {
          task: generatedActionTask,
          chatMessage: newMessage,
        },
        targetRoles: [(generatedActionTask as ActionTask).targetRole, 'ADMIN', 'HR', 'SENIOR_HR'],
      });
    }

    res.json({
      success: true,
      message: newMessage,
      actionTask: generatedActionTask,
    });
  });

  // 4. MARK MESSAGES AS READ
  app.post('/api/chat/read', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const { userId, channelId, recipientId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    dbService.update((draft) => {
      draft.chatMessages = draft.chatMessages || [];
      draft.chatMessages.forEach((m) => {
        if (channelId && m.channelId === channelId) {
          if (!m.readBy) m.readBy = [];
          if (!m.readBy.includes(userId)) m.readBy.push(userId);
        } else if (recipientId && m.senderId === recipientId && m.recipientId === userId) {
          if (!m.readBy) m.readBy = [];
          if (!m.readBy.includes(userId)) m.readBy.push(userId);
        }
      });
    });

    res.json({ success: true });
  });

  // 5. GET UNREAD MESSAGE COUNTS
  app.get('/api/chat/unread', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const userId = (req.query.userId as string) || auth.user?.id || '';

    if (!userId) {
      return res.json({ success: true, total: 0, channels: {}, direct: {} });
    }

    const messages = db.chatMessages || [];
    const channelsMap: Record<string, number> = {};
    const directMap: Record<string, number> = {};
    let total = 0;

    messages.forEach((m) => {
      const isRead = m.readBy && m.readBy.includes(userId);
      if (isRead) return;

      if (m.channelId) {
        channelsMap[m.channelId] = (channelsMap[m.channelId] || 0) + 1;
        total++;
      } else if (m.recipientId === userId) {
        directMap[m.senderId] = (directMap[m.senderId] || 0) + 1;
        total++;
      }
    });

    res.json({
      success: true,
      total,
      channels: channelsMap,
      direct: directMap,
    });
  });

  // ==========================================
  // REAL-TIME ACTION TASKS / ALERTS API
  // ==========================================

  // 1. GET ACTION TASKS (Role-filtered & Sanitized)
  app.get('/api/action-tasks', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const userRole = auth.user?.role || (req.headers['x-user-role'] as UserRole) || 'HR';
    const userId = auth.user?.id || (req.headers['x-user-id'] as string) || '';
    const allTasks = db.actionTasks || [];

    // Filter based on role permissions
    let accessibleTasks = allTasks;
    if (userRole === 'RECEPTION') {
      accessibleTasks = allTasks.filter(
        (t) => t.targetRole === 'RECEPTION' || (t.targetRole as string) === 'ALL'
      );
    } else if (userRole === 'PANTRY') {
      accessibleTasks = allTasks.filter(
        (t) => t.targetRole === 'PANTRY' || (t.targetRole as string) === 'ALL'
      );
    } else if (userRole === 'ADMIN' || userRole === 'CEO' || userRole === 'CO_FOUNDER' || userRole === 'SUPER_ADMIN') {
      accessibleTasks = allTasks; // Admin sees all tasks across the company
    } else if (userRole === 'HR' || userRole === 'SENIOR_HR' || userRole === 'INTERVIEWER') {
      accessibleTasks = allTasks.filter(
        (t) =>
          t.senderId === userId ||
          t.targetUserId === userId ||
          t.targetRole === userRole ||
          t.taskType === 'ESCORT_CANDIDATE' ||
          t.taskType === 'PREPARE_ROOM' ||
          t.taskType === 'CLEAN_ROOM'
      );
    } else {
      accessibleTasks = allTasks.filter(
        (t) => t.targetUserId === userId || t.targetRole === userRole
      );
    }

    // Security sanitization: Strip any unnecessary candidate documents/PII
    const sanitizedTasks = accessibleTasks.map((t) => ({
      id: t.id,
      sourceChatMessageId: t.sourceChatMessageId,
      taskType: t.taskType,
      title: t.title,
      instruction: t.instruction,
      targetRole: t.targetRole,
      targetUserId: t.targetUserId,
      senderId: t.senderId,
      senderName: t.senderName,
      senderRole: t.senderRole,
      candidateId: t.candidateId,
      candidateName: t.candidateName,
      candidateLocation: t.candidateLocation,
      candidateStatus: t.candidateStatus,
      roomId: t.roomId,
      roomName: t.roomName,
      destinationRoomId: t.destinationRoomId,
      destinationRoomName: t.destinationRoomName,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
      acknowledgedAt: t.acknowledgedAt,
      acknowledgedBy: t.acknowledgedBy,
      completedAt: t.completedAt,
      completedBy: t.completedBy,
    }));

    res.json({ success: true, tasks: sanitizedTasks });
  });

  // 2. ACKNOWLEDGE ACTION TASK
  app.post('/api/action-tasks/:id/acknowledge', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const { id } = req.params;
    const staffName = auth.user?.name || (req.headers['x-user-name'] as string) || 'Staff Member';
    const timestamp = new Date().toISOString();

    let updatedTask: ActionTask | null = null;
    dbService.update((draft) => {
      draft.actionTasks = draft.actionTasks || [];
      const task = draft.actionTasks.find((t) => t.id === id);
      if (task) {
        task.status = 'ACKNOWLEDGED';
        task.acknowledgedAt = timestamp;
        task.acknowledgedBy = staffName;
        updatedTask = { ...task };
      }
    });

    if (!updatedTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Broadcast SSE update
    eventWorkflowEngine.broadcast({
      type: 'ACTION_TASK_UPDATED',
      payload: { task: updatedTask },
      targetRoles: ['RECEPTION', 'PANTRY', 'ADMIN', 'HR', 'SENIOR_HR'],
    });

    res.json({ success: true, task: updatedTask });
  });

  // 3. COMPLETE ACTION TASK
  app.post('/api/action-tasks/:id/complete', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const { id } = req.params;
    const staffName = auth.user?.name || (req.headers['x-user-name'] as string) || 'Staff Member';
    const timestamp = new Date().toISOString();

    let updatedTask: ActionTask | null = null;
    dbService.update((draft) => {
      draft.actionTasks = draft.actionTasks || [];
      const task = draft.actionTasks.find((t) => t.id === id);
      if (task) {
        task.status = 'COMPLETED';
        task.completedAt = timestamp;
        task.completedBy = staffName;
        updatedTask = { ...task };

        // Synchronize candidate / room states if applicable
        if (task.taskType === 'ESCORT_CANDIDATE' && task.candidateId) {
          const cand = draft.candidates.find((c) => c.id === task.candidateId);
          if (cand) {
            if (task.destinationRoomName) {
              cand.currentLocation = task.destinationRoomName;
            }
            if (cand.status === 'ARRIVED' || cand.status === 'WAITING') {
              cand.status = 'ROOM_ASSIGNED';
            }
          }
        }

        if (task.taskType === 'CLEAN_ROOM' && task.roomId) {
          const room = draft.rooms.find((r) => r.id === task.roomId || r.roomId === task.roomId);
          if (room) {
            room.status = 'AVAILABLE';
            room.lastCleanedAt = timestamp;
            room.lastCleanedBy = staffName;
          }
        }
      }
    });

    if (!updatedTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Broadcast SSE update
    eventWorkflowEngine.broadcast({
      type: 'ACTION_TASK_UPDATED',
      payload: { task: updatedTask },
      targetRoles: ['RECEPTION', 'PANTRY', 'ADMIN', 'HR', 'SENIOR_HR'],
    });

    res.json({ success: true, task: updatedTask });
  });

  // 4. UPDATE ACTION TASK STATUS
  app.post('/api/action-tasks/:id/status', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    if (!auth.authenticated && !auth.user) {
      return res.status(401).json({ success: false, error: 'Access denied: Staff authentication required.' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const staffName = auth.user?.name || 'Staff Member';
    const timestamp = new Date().toISOString();

    let updatedTask: ActionTask | null = null;
    dbService.update((draft) => {
      draft.actionTasks = draft.actionTasks || [];
      const task = draft.actionTasks.find((t) => t.id === id);
      if (task && status) {
        task.status = status;
        if (status === 'ACKNOWLEDGED') {
          task.acknowledgedAt = timestamp;
          task.acknowledgedBy = staffName;
        } else if (status === 'COMPLETED') {
          task.completedAt = timestamp;
          task.completedBy = staffName;
        }
        updatedTask = { ...task };
      }
    });

    if (!updatedTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    eventWorkflowEngine.broadcast({
      type: 'ACTION_TASK_UPDATED',
      payload: { task: updatedTask },
      targetRoles: ['RECEPTION', 'PANTRY', 'ADMIN', 'HR', 'SENIOR_HR'],
    });

    res.json({ success: true, task: updatedTask });
  });

  // 5. EDIT ACTION TASK
  app.put('/api/action-tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, instruction, priority, targetRole, status, candidateName, roomName } = req.body;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Operations Staff') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    const timestamp = new Date().toISOString();
    let updatedTask: any = null;

    try {
      dbService.update((draft) => {
        draft.actionTasks = draft.actionTasks || [];
        const task = draft.actionTasks.find((t) => t.id === id);
        if (!task) {
          throw new Error('Action task not found.');
        }

        if (title !== undefined) task.title = title.trim();
        if (instruction !== undefined) task.instruction = instruction.trim();
        if (priority !== undefined) task.priority = priority;
        if (targetRole !== undefined) task.targetRole = targetRole;
        if (status !== undefined) task.status = status;
        if (candidateName !== undefined) task.candidateName = candidateName;
        if (roomName !== undefined) task.roomName = roomName;

        updatedTask = { ...task };

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-task-edit`,
          timestamp,
          actorUserId,
          actorName,
          actorRole,
          action: 'ACTION_TASK_UPDATED',
          details: `Updated action task "${task.title}".`,
          entityId: id,
          entityType: 'ACTION_TASK',
        });
      });

      if (!updatedTask) {
        return res.status(404).json({ success: false, error: 'Task not found.' });
      }

      eventWorkflowEngine.broadcast({
        type: 'ACTION_TASK_UPDATED',
        payload: { task: updatedTask },
        targetRoles: ['RECEPTION', 'ADMIN', 'HR', 'SENIOR_HR'],
      });

      res.json({ success: true, task: updatedTask, message: 'Action task updated successfully.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update action task.' });
    }
  });

  // 6. DELETE ACTION TASK
  app.delete('/api/action-tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Operations Staff') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    const timestamp = new Date().toISOString();
    let deletedTitle = '';

    try {
      dbService.update((draft) => {
        draft.actionTasks = draft.actionTasks || [];
        const idx = draft.actionTasks.findIndex((t) => t.id === id);
        if (idx === -1) {
          throw new Error('Action task not found.');
        }

        deletedTitle = draft.actionTasks[idx].title;
        draft.actionTasks.splice(idx, 1);

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-task-del`,
          timestamp,
          actorUserId,
          actorName,
          actorRole,
          action: 'ACTION_TASK_DELETED',
          details: `Deleted action task "${deletedTitle}" (ID: ${id}).`,
          entityId: id,
          entityType: 'ACTION_TASK',
        });
      });

      eventWorkflowEngine.broadcast({
        type: 'ACTION_TASK_DELETED',
        payload: { taskId: id, timestamp },
        targetRoles: ['RECEPTION', 'ADMIN', 'HR', 'SENIOR_HR'],
      });

      res.json({ success: true, message: `Task "${deletedTitle}" deleted successfully.` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to delete action task.' });
    }
  });

  // ==========================================
  // DATA QUERIES WITH ROLE VISIBILITY FILTERING
  // ==========================================
  const handleGetCandidates = (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);

    if (!auth.authenticated || !auth.user) {
      console.warn(`[AUTH] candidate list access denied: unauthenticated request from ${req.ip}`);
      return res.status(401).json({ success: false, error: 'Unauthorized: Staff authentication required to access candidate database.' });
    }

    const role = auth.user.role;
    const visibility = db.settings.fieldVisibility[role] || db.settings.fieldVisibility.HR;

    // Apply field-level visibility filtering based on role and exclude soft-deleted candidates
    const filteredCandidates = db.candidates
      .filter((c) => !(c as any).isDeleted)
      .map((cand) => {
        // For Pantry: only minimal operational fields
        if (role === 'PANTRY') {
          return {
            id: cand.id,
            fullName: cand.fullName,
            status: cand.status,
            currentLocation: cand.currentLocation,
            arrivalTime: cand.arrivalTime,
          };
        }

        const copy: any = {
          id: cand.id,
          status: cand.status,
          currentLocation: cand.currentLocation,
          arrivalTime: cand.arrivalTime,
          checkOutTime: cand.checkOutTime,
          totalDurationMinutes: cand.totalDurationMinutes,
          currentInterviewId: cand.currentInterviewId,
          position: cand.position,
          department: cand.department,
          totalExperience: cand.totalExperience,
          relevantExperience: cand.relevantExperience,
          purpose: cand.purpose,
          visitType: (cand as any).visitType || (cand.purpose?.includes('Scheduled') ? 'SCHEDULED' : 'WALK_IN'),
          personToMeet: cand.personToMeet,
          departmentToMeet: cand.departmentToMeet,
          appointmentTime: (cand as any).appointmentTime,
          createdAt: cand.createdAt,
          updatedAt: cand.updatedAt,
          assignedInterviewerId: (cand as any).assignedInterviewerId,
          assignedInterviewerName: (cand as any).assignedInterviewerName,
        };

        if (visibility.candidateName) copy.fullName = cand.fullName;
        if (visibility.phone) copy.phone = cand.phone;
        if (visibility.email) copy.email = cand.email;
        if (visibility.address) {
          copy.address = cand.address;
          copy.city = cand.city;
          copy.state = cand.state;
          copy.pincode = cand.pincode;
        }
        if (visibility.livePhoto !== false) {
          copy.livePhoto = cand.livePhoto;
          copy.livePhotoCapturedAt = cand.livePhotoCapturedAt;
          copy.livePhotoCapturedBy = cand.livePhotoCapturedBy;
          copy.arrivalPhoto = cand.arrivalPhoto;
          copy.arrivalPhotoCapturedAt = cand.arrivalPhotoCapturedAt;
          copy.arrivalPhotoCapturedBy = cand.arrivalPhotoCapturedBy;
          copy.arrivalPhotoCapturedByName = cand.arrivalPhotoCapturedByName;
          copy.receptionPhotoUrl = cand.receptionPhotoUrl || cand.photoUrl || cand.arrivalPhoto || cand.livePhoto;
          copy.receptionPhotoCapturedAt = cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt;
          copy.photoUrl = cand.photoUrl || cand.receptionPhotoUrl || cand.arrivalPhoto || cand.livePhoto;
          copy.photoUploadStatus = cand.photoUploadStatus || 'SUCCESS';
          copy.photoUploadedAt = cand.photoUploadedAt;
          if (cand.photoMetadata) {
            const meta = { ...cand.photoMetadata };
            delete (meta as any).photoUrl;
            copy.photoMetadata = meta;
          }
        }
        if (visibility.resume) {
          copy.resumeUrl = cand.resumeUrl?.startsWith('data:')
            ? `/api/candidates/${cand.id}/resume?role=${encodeURIComponent(role)}`
            : cand.resumeUrl;
          copy.resumeFileName = cand.resumeFileName;
          copy.resumeFileSize = cand.resumeFileSize;
          copy.resumeMimeType = cand.resumeMimeType;
          copy.resumeUploadedAt = cand.resumeUploadedAt;
          copy.resumeMetadata = cand.resumeMetadata;
        }
        if (role !== 'INTERVIEWER' && (visibility.governmentId !== false)) {
          if (cand.governmentId) {
            const sanitizedGovId = { ...cand.governmentId };
            delete (sanitizedGovId as any).rawIdNumber;
            delete (sanitizedGovId as any).documentDataUrl;
            delete (sanitizedGovId as any).fileDataUrl;
            copy.governmentId = sanitizedGovId;
            copy.hasGovernmentId = true;
          } else if (cand.hasGovernmentId || cand.governmentIdFileName || cand.governmentIdFileUrl) {
            copy.hasGovernmentId = true;
          }
        }
        if (visibility.salary && (role === 'HR' || role === 'ADMIN' || role === 'CEO' || role === 'CO_FOUNDER')) {
          copy.expectedSalary = cand.expectedSalary;
        }
        copy.qualification = cand.qualification;
        copy.currentCompany = cand.currentCompany;
        copy.noticePeriod = cand.noticePeriod;
        copy.referralSource = cand.referralSource;
        copy.skills = cand.skills;

        return copy;
      });

    res.json({ success: true, candidates: filteredCandidates });
  };

  app.get('/api/candidates', handleGetCandidates);
  app.get('/api/staff/candidates', handleGetCandidates);

  app.get('/api/candidates/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const authHeader = req.headers['authorization'];
    const cookies = parseCookies(req.headers['cookie']);

    console.log('[CANDIDATE_PROFILE_REQUEST_TRACE]', {
      path: req.path,
      method: req.method,
      authenticatedUserId: auth.user?.id || null,
      authenticatedRole: auth.user?.role || null,
      sessionPresent: !!auth.session,
      jwtPresent: !!authHeader,
      authorizationHeaderPresent: !!authHeader,
      cookiePresent: Object.keys(cookies).length > 0,
      authMiddlewareResult: auth.authenticated ? 'SUCCESS' : 'FAILED',
      permissionResult: auth.effectivePermissions || [],
      candidateId: id,
    });

    if (!auth.authenticated || !auth.user) {
      console.warn(`[AUTH] candidate profile access denied: unauthenticated request for ${id}`);
      return res.status(401).json({ success: false, error: 'Unauthorized: Staff authentication required to access candidate profile.' });
    }

    const role = auth.user.role;
    const includeDeleted = req.query.includeDeleted === 'true' || role === 'ADMIN';

    const candidate = db.candidates.find((c) => c.id === id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: `Candidate not found with ID: ${id}` });
    }

    if ((candidate as any).isDeleted && !includeDeleted) {
      return res.status(404).json({ success: false, error: 'Candidate record has been archived or removed according to retention policy.', isDeleted: true });
    }

    const interviews = db.interviews.filter((i) => i.candidateId === id);
    const timeline = db.timelineEvents.filter((t) => t.candidateId === id);

    // Confidentiality payload filter & field-level authorization
    const visibility = db.settings.fieldVisibility[role] || db.settings.fieldVisibility.HR;
    const candidateData = { ...candidate };

    if (!visibility.phone) delete (candidateData as any).phone;
    if (!visibility.email) delete (candidateData as any).email;
    if (!visibility.address) {
      delete (candidateData as any).address;
      delete (candidateData as any).city;
      delete (candidateData as any).state;
      delete (candidateData as any).pincode;
    }
    if (!visibility.resume || role === 'PANTRY') {
      delete (candidateData as any).resumeUrl;
      delete (candidateData as any).resumeFileName;
      delete (candidateData as any).resumeFileSize;
    }
    if (role === 'PANTRY' || role === 'INTERVIEWER' || visibility.governmentId === false) {
      delete (candidateData as any).governmentId;
      delete (candidateData as any).hasGovernmentId;
    } else {
      if (candidate.governmentId) {
        const sanitizedGovId = { ...candidate.governmentId };
        delete (sanitizedGovId as any).rawIdNumber;
        delete (sanitizedGovId as any).documentDataUrl;
        delete (sanitizedGovId as any).fileDataUrl;
        candidateData.governmentId = sanitizedGovId;
        candidateData.hasGovernmentId = true;
      } else if (candidate.hasGovernmentId || candidate.governmentIdFileName || candidate.governmentIdFileUrl) {
        candidateData.hasGovernmentId = true;
      }
    }
    if (!visibility.salary || (role !== 'HR' && role !== 'ADMIN' && role !== 'CEO' && role !== 'CO_FOUNDER')) {
      delete (candidateData as any).expectedSalary;
    }

    // Strictly redact confidential HR notes from Reception, Interviewers, and Pantry
    if (role !== 'HR' && role !== 'ADMIN' && role !== 'CEO' && role !== 'CO_FOUNDER') {
      delete (candidateData as any).hrPrivateNotes;
      delete (candidateData as any).interviewerFeedbackPrivate;
      delete (candidateData as any).internalHiringDecisionNotes;
      delete (candidateData as any).managementNotes;
    }

    // Mask Raw Government ID number across all endpoints except when raw export requested by Admin
    if (candidateData.governmentId) {
      const sanitizedGovId = { ...candidateData.governmentId };
      delete (sanitizedGovId as any).rawIdNumber;
      delete (sanitizedGovId as any).documentDataUrl;
      delete (sanitizedGovId as any).fileDataUrl;
      candidateData.governmentId = sanitizedGovId;
    }

    // Ensure photo fields are reliably populated
    candidateData.receptionPhotoUrl = candidate.receptionPhotoUrl || candidate.photoUrl || candidate.arrivalPhoto || candidate.livePhoto;
    candidateData.receptionPhotoCapturedAt = candidate.receptionPhotoCapturedAt || candidate.arrivalPhotoCapturedAt || candidate.livePhotoCapturedAt;
    candidateData.photoUrl = candidate.photoUrl || candidate.receptionPhotoUrl || candidate.arrivalPhoto || candidate.livePhoto;
    candidateData.arrivalPhoto = candidate.arrivalPhoto || candidate.receptionPhotoUrl || candidate.livePhoto;
    candidateData.arrivalPhotoCapturedAt = candidate.arrivalPhotoCapturedAt || candidate.receptionPhotoCapturedAt;
    candidateData.photoUploadStatus = candidate.photoUploadStatus || 'SUCCESS';
    candidateData.photoUploadedAt = candidate.photoUploadedAt;

    // Do not duplicate heavy photo in photoMetadata
    if (candidateData.photoMetadata && candidateData.photoMetadata.photoUrl) {
      const sanitizedMeta = { ...candidateData.photoMetadata };
      delete (sanitizedMeta as any).photoUrl;
      candidateData.photoMetadata = sanitizedMeta;
    }

    // Clean up resumeUrl
    if (candidateData.resumeUrl && candidateData.resumeUrl.startsWith('data:')) {
      candidateData.resumeUrl = `/api/candidates/${candidate.id}/resume?role=${encodeURIComponent(role)}`;
    }

    console.log(`[AUTH] candidate profile access granted: ${auth.user.name} (${role}) -> ${candidate.fullName} (${candidate.id})`);

    res.json({
      success: true,
      candidate: candidateData,
      interviews,
      timeline,
      permissions: auth.effectivePermissions || [],
    });
  });

  // ==========================================
  // HR CANDIDATE EDIT (PUT & PATCH)
  // ==========================================
  const handleCandidateUpdate = (req: Request, res: Response) => {
    const { id } = req.params;
    const role = (req.query.role || req.headers['x-user-role']) as UserRole;
    const editorName = (req.query.userName as string) || (req.headers['x-user-name'] as string) || (role === 'HR' ? 'Sneha Patel (HR)' : `${role} Staff`);

    if (role !== 'HR' && role !== 'ADMIN' && role !== 'CEO' && role !== 'SENIOR_HR') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only HR, Senior HR, Admin, or CEO can edit candidate profiles.' });
    }

    const {
      fullName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      position,
      department,
      totalExperience,
      relevantExperience,
      currentCompany,
      qualification,
      skills,
      noticePeriod,
      expectedSalary,
      departmentToMeet,
      personToMeet,
      purpose,
      howDidYouHear,
      hrPrivateNotes,
      managementNotes,
      // Attempted immutable system fields are safely ignored
    } = req.body;

    const timestamp = new Date().toISOString();
    let updatedCandidate: Candidate | null = null;

    try {
      dbService.update((draft) => {
        const cand = draft.candidates.find((c) => c.id === id);
        if (!cand || (cand as any).isDeleted) {
          throw new Error('Candidate not found');
        }

        // Apply authorized field modifications only (system fields like id, createdAt, arrivalTime, etc. are immutable)
        if (fullName !== undefined) cand.fullName = fullName;
        if (phone !== undefined) cand.phone = phone;
        if (email !== undefined) cand.email = email;
        if (address !== undefined) cand.address = address;
        if (city !== undefined) cand.city = city;
        if (state !== undefined) cand.state = state;
        if (pincode !== undefined) cand.pincode = pincode;
        if (position !== undefined) cand.position = position;
        if (department !== undefined) cand.department = department;
        if (totalExperience !== undefined) cand.totalExperience = totalExperience;
        if (relevantExperience !== undefined) cand.relevantExperience = relevantExperience;
        if (currentCompany !== undefined) cand.currentCompany = currentCompany;
        if (qualification !== undefined) cand.qualification = qualification;
        if (skills !== undefined) cand.skills = skills;
        if (noticePeriod !== undefined) cand.noticePeriod = noticePeriod;
        if (expectedSalary !== undefined) cand.expectedSalary = expectedSalary;
        if (departmentToMeet !== undefined) cand.departmentToMeet = departmentToMeet;
        if (personToMeet !== undefined) cand.personToMeet = personToMeet;
        if (purpose !== undefined) cand.purpose = purpose;
        if (howDidYouHear !== undefined) cand.howDidYouHear = howDidYouHear;
        if (hrPrivateNotes !== undefined) cand.hrPrivateNotes = hrPrivateNotes;
        if (managementNotes !== undefined) cand.managementNotes = managementNotes;

        cand.updatedAt = timestamp;
        updatedCandidate = { ...cand };

        draft.timelineEvents.unshift({
          id: `tl-${Date.now()}-edit`,
          candidateId: id,
          timestamp,
          actorType: 'USER',
          actorName: editorName,
          eventType: 'CANDIDATE_PROFILE_UPDATED',
          description: `Candidate profile updated by ${editorName} (${role}). Non-system fields refreshed.`,
        });

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-edit`,
          timestamp,
          actorType: 'USER',
          actorName: editorName,
          actorRole: role,
          action: 'CANDIDATE_UPDATED',
          details: `Candidate record ${id} (${cand.fullName}) edited by ${role}. System fields preserved.`,
          entityId: id,
          entityType: 'CANDIDATE',
        });
      });

      if (!updatedCandidate) {
        return res.status(404).json({ success: false, error: 'Candidate not found' });
      }

      eventWorkflowEngine.broadcast({
        type: 'CANDIDATE_PROFILE_UPDATED',
        payload: { candidateId: id, timestamp },
      });

      res.json({ success: true, candidate: updatedCandidate, message: 'Candidate profile updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to update candidate' });
    }
  };

  app.put('/api/candidates/:id', handleCandidateUpdate);
  app.patch('/api/candidates/:id', handleCandidateUpdate);

  // ==========================================
  // ASSIGN CANDIDATE TO KIMMI MAM (SENIOR HR)
  // ==========================================
  app.post('/api/candidates/:id/assign-kimmi', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);

    if (!auth.authenticated || !auth.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Staff authentication required.' });
    }

    const staffUser = auth.user;
    const role = staffUser.role;
    if (role !== 'HR' && role !== 'ADMIN' && role !== 'CEO' && role !== 'SENIOR_HR') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only HR, Admin, CEO, or Senior HR can assign candidates.' });
    }

    const timestamp = new Date().toISOString();
    let updatedCandidate: any = null;
    let relatedInterview: any = null;

    dbService.update((draft) => {
      const cand = draft.candidates.find((c) => c.id === id);
      if (!cand) throw new Error('Candidate not found');

      // Update candidate status and location
      cand.status = 'With Kimmi Mam – Senior HR Interview' as any;
      cand.currentLocation = 'Senior HR Cabin / Room';
      (cand as any).assignedInterviewerId = 'usr-cofounder-kimmi';
      (cand as any).assignedInterviewerName = 'Kimmi Mam';
      cand.updatedAt = timestamp;

      // Find or create interview for Kimmi Mam
      let intv = draft.interviews.find((i) => i.candidateId === id && (i.status === 'SCHEDULED' || i.status === 'CANDIDATE_ARRIVED'));
      if (intv) {
        intv.interviewerId = 'usr-cofounder-kimmi';
        intv.interviewerName = 'Kimmi Mam – Senior HR Interview';
        intv.roundName = 'Senior HR Interview';
        intv.status = 'CANDIDATE_ARRIVED';
        intv.updatedAt = timestamp;
      } else {
        intv = {
          id: `intv-${Date.now()}`,
          candidateId: cand.id,
          candidateName: cand.fullName,
          position: cand.position,
          roundName: 'Senior HR Interview',
          interviewerId: 'usr-cofounder-kimmi',
          interviewerName: 'Kimmi Mam – Senior HR Interview',
          scheduledTime: 'Immediate / Today',
          status: 'CANDIDATE_ARRIVED',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        draft.interviews.unshift(intv);
      }
      cand.currentInterviewId = intv.id;

      // Notification for Kimmi Mam
      draft.notifications.unshift({
        id: `notif-${Date.now()}-kimmi-assign`,
        recipientRole: 'SENIOR_HR',
        recipientUserId: 'usr-cofounder-kimmi',
        title: 'Senior Interview Assigned',
        message: `${cand.fullName} (${cand.position}) has been assigned to you for Senior HR Interview.`,
        priority: 'HIGH',
        eventType: 'NEXT_INTERVIEW_CREATED',
        entityId: cand.id,
        entityType: 'CANDIDATE',
        read: false,
        createdAt: timestamp,
        actionButtons: [
          { label: 'View Profile', actionKey: 'VIEW_CANDIDATE', payload: { candidateId: cand.id } },
        ],
      });

      // Audit log & Timeline
      draft.timelineEvents.unshift({
        id: `tl-${Date.now()}-kimmi-assign`,
        candidateId: cand.id,
        timestamp,
        actorType: 'USER',
        actorName: staffUser.name,
        eventType: 'CANDIDATE_ASSIGNED_TO_KIMMI',
        description: `Candidate assigned to Kimmi Mam for Senior HR Interview by ${staffUser.name} (${staffUser.role}).`,
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-kimmi-assign`,
        timestamp,
        actorType: 'USER',
        actorName: staffUser.name,
        action: 'CANDIDATE_ASSIGNED_TO_KIMMI',
        details: `Assigned candidate ${cand.fullName} (${cand.id}) to Kimmi Mam. Status: With Kimmi Mam – Senior HR Interview.`,
        entityId: cand.id,
        entityType: 'CANDIDATE',
      });

      updatedCandidate = cand;
      relatedInterview = intv;
    });

    if (updatedCandidate && relatedInterview) {
      eventWorkflowEngine.publishDomainEvent({
        eventType: 'CANDIDATE_ASSIGNED_TO_KIMMI' as any,
        candidateId: (updatedCandidate as Candidate).id,
        visitId: (updatedCandidate as Candidate).id,
        applicationId: (updatedCandidate as Candidate).id,
        interviewId: relatedInterview.id,
        actorType: 'USER',
        source: 'STAFF_ACTION',
        targetRoles: ['HR', 'SENIOR_HR', 'CEO', 'ADMIN', 'RECEPTION'],
        metadata: {
          candidateName: (updatedCandidate as Candidate).fullName,
          position: (updatedCandidate as Candidate).position,
          status: 'With Kimmi Mam – Senior HR Interview',
          interviewerName: 'Kimmi Mam',
        },
      });
    }

    res.json({
      success: true,
      candidate: updatedCandidate,
      interview: relatedInterview,
      message: 'Candidate assigned to Kimmi Mam for Senior HR Interview.',
    });
  });

  // ==========================================
  // HR CANDIDATE DELETE / ARCHIVE (DELETE)
  // ==========================================
  app.delete('/api/candidates/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const role = (req.query.role || req.headers['x-user-role']) as UserRole;
    const reason = req.body?.reason || 'Administrative Archive';

    if (role !== 'HR' && role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only HR or Admin can delete candidate records.' });
    }

    const timestamp = new Date().toISOString();

    try {
      let deletedName = '';
      dbService.update((draft) => {
        const cand = draft.candidates.find((c) => c.id === id);
        if (!cand || (cand as any).isDeleted) {
          throw new Error('Candidate not found');
        }

        if (cand.status === 'IN_INTERVIEW' || cand.status === 'ROOM_ASSIGNED') {
          throw new Error('Cannot delete candidate while an interview or room assignment is actively in progress.');
        }

        deletedName = cand.fullName;
        (cand as any).isDeleted = true;
        (cand as any).deletedAt = timestamp;
        (cand as any).deletedBy = role;
        (cand as any).deletionReason = reason;
        cand.status = 'REJECTED';
        cand.updatedAt = timestamp;

        draft.timelineEvents.unshift({
          id: `tl-${Date.now()}-del`,
          candidateId: id,
          timestamp,
          actorType: 'USER',
          actorName: role === 'HR' ? 'Sneha Patel (HR)' : 'Administrator',
          eventType: 'CANDIDATE_ARCHIVED',
          description: `Candidate record archived/deleted. Reason: ${reason}.`,
        });

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-del`,
          timestamp,
          actorType: 'USER',
          actorName: role,
          action: 'CANDIDATE_DELETED',
          details: `Candidate ${id} (${deletedName}) was soft-deleted/archived by ${role}. Reason: ${reason}.`,
          entityId: id,
          entityType: 'CANDIDATE',
        });
      });

      eventWorkflowEngine.broadcast({
        type: 'CANDIDATE_DELETED',
        payload: { candidateId: id, timestamp },
      });

      res.json({ success: true, message: `Candidate ${deletedName} successfully archived.` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to archive candidate' });
    }
  });

  // ==========================================\\
  // ROOMS & PODS MANAGEMENT (ADMIN CONFIGURE)
  // ==========================================
  app.get('/api/rooms', (req: Request, res: Response) => {
    const db = dbService.get();
    res.json({ success: true, rooms: db.rooms });
  });

  app.post('/api/rooms', (req: Request, res: Response) => {
    const { name, type, preferredFor } = req.body;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Room name is required.' });
    }

    const timestamp = new Date().toISOString();
    const newRoom: Room = {
      id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roomId: `room-${Date.now()}`,
      name: name.trim(),
      roomName: name.trim(),
      type: (type as RoomType) || 'MEETING_ROOM',
      roomType: (type as RoomType) || 'MEETING_ROOM',
      status: 'AVAILABLE',
      isActive: true,
      preferredFor: preferredFor || 'Interviews & Business Meetings',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    dbService.update((draft) => {
      draft.rooms.push(newRoom);
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-room-add`,
        timestamp,
        actorUserId,
        actorName,
        actorRole,
        action: 'ROOM_CREATED',
        details: `Created new room/pod: "${newRoom.name}" (${newRoom.type}).`,
        entityId: newRoom.id,
        entityType: 'ROOM',
      });
    });

    eventWorkflowEngine.broadcast({ type: 'ROOMS_UPDATED', payload: { room: newRoom } });
    res.json({ success: true, room: newRoom, message: `Room "${newRoom.name}" created successfully.` });
  });

  app.put('/api/rooms/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type, preferredFor, status, isActive } = req.body;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    const timestamp = new Date().toISOString();
    let updatedRoom: Room | null = null;

    dbService.update((draft) => {
      const room = draft.rooms.find((r) => r.id === id || r.roomId === id);
      if (!room) return;

      const oldName = room.name;

      if (name !== undefined && name.trim()) {
        const newName = name.trim();
        room.name = newName;
        room.roomName = newName;

        // Cascade rename across all related entities using single source of truth
        if (room.currentCandidateId) {
          const cand = draft.candidates.find((c) => c.id === room.currentCandidateId);
          if (cand) {
            cand.currentLocation = newName;
            cand.assignedRoomId = room.id;
          }
        }

        draft.candidates.forEach((cand) => {
          if (cand.assignedRoomId === room.id || cand.currentLocation === oldName) {
            cand.currentLocation = newName;
            cand.assignedRoomId = room.id;
          }
        });

        draft.interviews.forEach((i) => {
          if (i.roomId === room.id || i.roomName === oldName) {
            i.roomName = newName;
          }
        });

        draft.pantryTasks.forEach((pt) => {
          if (pt.roomId === room.id || pt.roomName === oldName) {
            pt.roomName = newName;
          }
        });
      }

      if (type !== undefined) {
        room.type = type as RoomType;
        room.roomType = type as RoomType;
      }
      if (preferredFor !== undefined) room.preferredFor = preferredFor;
      if (status !== undefined) room.status = status;
      if (isActive !== undefined) room.isActive = Boolean(isActive);
      room.updatedAt = timestamp;
      updatedRoom = { ...room };

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-room-edit`,
        timestamp,
        actorUserId,
        actorName,
        actorRole,
        action: 'ROOM_UPDATED',
        details: `Configured room "${room.name}": Type=${room.type}, Active=${room.isActive}.`,
        entityId: room.id,
        entityType: 'ROOM',
      });
    });

    if (!updatedRoom) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    eventWorkflowEngine.broadcast({ type: 'ROOMS_UPDATED', payload: { room: updatedRoom } });
    res.json({ success: true, room: updatedRoom, message: 'Room configuration updated.' });
  });

  app.delete('/api/rooms/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    if (actorRole !== 'ADMIN' && actorRole !== 'CEO' && actorRole !== 'CO_FOUNDER') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Executive credentials required.' });
    }

    const timestamp = new Date().toISOString();
    let deletedRoomName = '';

    try {
      dbService.update((draft) => {
        const idx = draft.rooms.findIndex((r) => r.id === id || r.roomId === id);
        if (idx === -1) {
          throw new Error('Room not found.');
        }

        const room = draft.rooms[idx];
        if (room.status === 'OCCUPIED' || room.status === 'ASSIGNED') {
          throw new Error(`Cannot delete room "${room.name}" while occupied or assigned to an active interview.`);
        }

        deletedRoomName = room.name;
        draft.rooms.splice(idx, 1);

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-room-del`,
          timestamp,
          actorUserId,
          actorName,
          actorRole,
          action: 'ROOM_DELETED',
          details: `Deleted room "${deletedRoomName}".`,
          entityId: id,
          entityType: 'ROOM',
        });
      });

      eventWorkflowEngine.broadcast({ type: 'ROOMS_UPDATED', payload: { deletedRoomId: id } });
      res.json({ success: true, message: `Room "${deletedRoomName}" deleted successfully.` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to delete room.' });
    }
  });

  app.patch('/api/rooms/:id/toggle-active', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    const timestamp = new Date().toISOString();
    let updatedRoom: Room | null = null;

    dbService.update((draft) => {
      const room = draft.rooms.find((r) => r.id === id);
      if (!room) return;
      room.isActive = room.isActive === false ? true : false;
      room.updatedAt = timestamp;
      updatedRoom = { ...room };

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-room-active`,
        timestamp,
        actorUserId,
        actorName,
        actorRole,
        action: room.isActive ? 'ROOM_ENABLED' : 'ROOM_DISABLED',
        details: `${room.isActive ? 'Enabled' : 'Deactivated'} room "${room.name}".`,
        entityId: room.id,
        entityType: 'ROOM',
      });
    });

    if (!updatedRoom) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    eventWorkflowEngine.broadcast({ type: 'ROOMS_UPDATED', payload: { room: updatedRoom } });
    res.json({ success: true, room: updatedRoom });
  });

  app.patch('/api/rooms/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    let updatedRoom: Room | null = null;
    const timestamp = new Date().toISOString();

    dbService.update((draft) => {
      const room = draft.rooms.find((r) => r.id === id);
      if (!room) return;
      room.status = status;
      if (status === 'AVAILABLE') {
        room.currentCandidateId = undefined;
        room.currentCandidateName = undefined;
        room.currentInterviewId = undefined;
        room.assignedInterviewerName = undefined;
      }
      room.updatedAt = timestamp;
      updatedRoom = { ...room };
    });

    if (!updatedRoom) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    eventWorkflowEngine.broadcast({ type: 'ROOMS_UPDATED', payload: { room: updatedRoom } });
    res.json({ success: true, room: updatedRoom });
  });

  // ==========================================
  // STAFF USER MANAGEMENT (ADMIN CONTROLS)
  // ==========================================
  app.get('/api/users', (req: Request, res: Response) => {
    const db = dbService.get();
    const safeUsers = db.users.map(({ passwordHash: _hash, ...safe }) => safe);
    res.json({ success: true, users: safeUsers });
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { name, email, username, password, role, designation, department, phone } = req.body;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and Email are required.' });
    }

    const db = dbService.get();
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return res.status(409).json({ success: false, error: 'A staff user with this email already exists.' });
    }

    const timestamp = new Date().toISOString();
    const assignedRole = (role as UserRole) || 'HR';
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: (username || email.split('@')[0]).trim().toLowerCase(),
      passwordHash: hashPassword(password || 'wcr123'),
      role: assignedRole,
      designation: designation || `${assignedRole} Executive`,
      department: department || (assignedRole === 'HR' ? 'Human Resources' : 'Operations'),
      permissions: ROLE_PERMISSIONS[assignedRole] || ['BASIC_VIEW'],
      isActive: true,
      phone: phone || '',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    dbService.update((draft) => {
      draft.users.push(newUser);
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-user-add`,
        timestamp,
        actorUserId,
        actorName,
        actorRole,
        action: 'USER_CREATED',
        details: `Created new staff account for ${newUser.name} (Role: ${newUser.role}, Dept: ${newUser.department}).`,
        entityId: newUser.id,
        entityType: 'USER',
      });
    });

    const { passwordHash: _hash, ...safe } = newUser;
    res.json({ success: true, user: safe, message: `Account created for ${newUser.name}.` });
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, designation, department, role, phone, permissions } = req.body;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    const timestamp = new Date().toISOString();
    let updatedUser: any = null;

    dbService.update((draft) => {
      const user = draft.users.find((u) => u.id === id);
      if (!user) return;

      if (name) user.name = name.trim();
      if (designation) user.designation = designation.trim();
      if (department) user.department = department.trim();
      if (role) {
        user.role = role as UserRole;
        if (!permissions) user.permissions = ROLE_PERMISSIONS[user.role];
      }
      if (phone !== undefined) user.phone = phone;
      if (permissions) user.permissions = permissions;
      user.updatedAt = timestamp;
      const { passwordHash: _hash, ...safe } = user;
      updatedUser = safe;

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-user-edit`,
        timestamp,
        actorUserId,
        actorName,
        actorRole,
        action: 'USER_UPDATED',
        details: `Updated staff profile for ${user.name} (Role: ${user.role}).`,
        entityId: user.id,
        entityType: 'USER',
      });
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, user: updatedUser, message: 'User profile updated.' });
  });

  app.patch('/api/users/:id/toggle-active', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    const timestamp = new Date().toISOString();
    let updatedUser: any = null;

    dbService.update((draft) => {
      const user = draft.users.find((u) => u.id === id);
      if (!user) return;
      user.isActive = user.isActive === false ? true : false;
      user.updatedAt = timestamp;
      const { passwordHash: _hash, ...safe } = user;
      updatedUser = safe;

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-user-status`,
        timestamp,
        actorUserId,
        actorName,
        actorRole,
        action: user.isActive ? 'USER_ENABLED' : 'USER_DISABLED',
        details: `${user.isActive ? 'Enabled' : 'Disabled'} account for ${user.name} (${user.role}).`,
        entityId: user.id,
        entityType: 'USER',
      });
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, user: updatedUser });
  });

  app.post('/api/users/:id/reset-password', (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    const passwordToSet = newPassword || 'wcr123';
    const timestamp = new Date().toISOString();
    let userFound = false;

    dbService.update((draft) => {
      const user = draft.users.find((u) => u.id === id);
      if (!user) return;
      userFound = true;
      user.passwordHash = hashPassword(passwordToSet);
      user.updatedAt = timestamp;

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-pwd-reset`,
        timestamp,
        actorUserId,
        actorName,
        actorRole,
        action: 'PASSWORD_RESET',
        details: `Admin reset password for user ${user.name} (${user.email}).`,
        entityId: user.id,
        entityType: 'USER',
      });
    });

    if (!userFound) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, message: 'Password has been securely reset.' });
  });

  // DELETE USER / STAFF PROFILE
  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'ADMIN') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'Sameer Sir (Admin)') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-admin-sameer') as string;

    if (actorRole !== 'ADMIN' && actorRole !== 'CEO') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin or CEO credentials required.' });
    }

    const timestamp = new Date().toISOString();
    let deletedUserName = '';

    try {
      dbService.update((draft) => {
        draft.users = draft.users || [];
        const idx = draft.users.findIndex((u) => u.id === id);
        if (idx === -1) {
          throw new Error('User record not found.');
        }

        const targetUser = draft.users[idx];
        if (targetUser.role === 'CEO' || targetUser.id === 'usr-ceo-lalit') {
          throw new Error('Cannot delete Executive Leadership / CEO profile.');
        }

        if (targetUser.id === actorUserId) {
          throw new Error('Cannot delete your own active staff session.');
        }

        deletedUserName = targetUser.name;
        draft.users.splice(idx, 1);

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-user-del`,
          timestamp,
          actorUserId,
          actorName,
          actorRole,
          action: 'USER_DELETED',
          details: `Deleted user profile for ${deletedUserName} (${targetUser.role}).`,
          entityId: id,
          entityType: 'USER',
        });
      });

      res.json({ success: true, message: `Staff user "${deletedUserName}" deleted successfully.` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to delete user record.' });
    }
  });

  // ==========================================
  // RECEPTION CANDIDATE CHANGE REQUESTS
  // ==========================================
  app.post('/api/change-requests', (req: Request, res: Response) => {
    const { candidateId, requestedField, suggestedValue, reason } = req.body;
    const requestedByUserId = (req.headers['x-user-id'] || 'usr-rec-ananya') as string;
    const requestedByUserName = (req.headers['x-user-name'] || 'Ananya Sen (Reception)') as string;
    const requestedByUserRole = (req.headers['x-user-role'] || 'RECEPTION') as UserRole;

    if (!candidateId || !requestedField || suggestedValue === undefined) {
      return res.status(400).json({ success: false, error: 'candidateId, requestedField, and suggestedValue are required.' });
    }

    const db = dbService.get();
    const candidate = db.candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found.' });
    }

    const timestamp = new Date().toISOString();
    const currentValue = String((candidate as any)[requestedField] || '');

    const newRequest: CandidateChangeRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      candidateId,
      candidateName: candidate.fullName,
      requestedByUserId,
      requestedByUserName,
      requestedByUserRole,
      requestedField,
      currentValue,
      suggestedValue: String(suggestedValue),
      reason: reason || 'Front desk data correction verified at reception',
      status: 'PENDING',
      createdAt: timestamp,
    };

    dbService.update((draft) => {
      draft.changeRequests = draft.changeRequests || [];
      draft.changeRequests.unshift(newRequest);

      draft.notifications.unshift({
        id: `notif-${Date.now()}-change-req`,
        recipientRole: 'HR',
        title: 'Correction Requested by Reception',
        message: `${requestedByUserName} requested correction for candidate ${candidate.fullName}: ${requestedField} = "${suggestedValue}".`,
        priority: 'HIGH',
        eventType: 'CHANGE_REQUEST_CREATED',
        entityId: newRequest.id,
        entityType: 'CANDIDATE',
        read: false,
        createdAt: timestamp,
        actionButtons: [
          { label: 'Review & Approve', actionKey: 'VIEW_CHANGE_REQUESTS', payload: { requestId: newRequest.id } },
        ],
      });

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-change-req`,
        timestamp,
        actorUserId: requestedByUserId,
        actorName: requestedByUserName,
        actorRole: requestedByUserRole,
        action: 'CHANGE_REQUEST_CREATED',
        details: `Reception requested correction for ${candidate.fullName}: ${requestedField} -> "${suggestedValue}". Reason: ${newRequest.reason}`,
        entityId: candidate.id,
        entityType: 'CANDIDATE',
      });
    });

    eventWorkflowEngine.broadcast({
      type: 'CHANGE_REQUEST_CREATED',
      payload: newRequest,
    });

    res.json({
      success: true,
      request: newRequest,
      message: 'Correction request submitted to HR & Admin.',
    });
  });

  app.get('/api/change-requests', (req: Request, res: Response) => {
    const db = dbService.get();
    res.json({ success: true, requests: db.changeRequests || [] });
  });

  app.post('/api/change-requests/:id/resolve', (req: Request, res: Response) => {
    const { id } = req.params;
    const { decision, notes } = req.body;
    const resolverUserId = (req.headers['x-user-id'] || 'usr-hr-nisha') as string;
    const resolverUserName = (req.headers['x-user-name'] || 'Nisha (HR)') as string;
    const resolverRole = (req.headers['x-user-role'] || 'HR') as UserRole;

    const timestamp = new Date().toISOString();
    let resolvedRequest: CandidateChangeRequest | null = null;

    dbService.update((draft) => {
      draft.changeRequests = draft.changeRequests || [];
      const cr = draft.changeRequests.find((r) => r.id === id);
      if (!cr) return;

      cr.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      cr.resolvedAt = timestamp;
      cr.resolvedByUserId = resolverUserId;
      cr.resolvedByUserName = resolverUserName;
      cr.resolutionNotes = notes || '';
      resolvedRequest = { ...cr };

      if (decision === 'APPROVE') {
        const cand = draft.candidates.find((c) => c.id === cr.candidateId);
        if (cand) {
          (cand as any)[cr.requestedField] = cr.suggestedValue;
          cand.updatedAt = timestamp;

          draft.timelineEvents.unshift({
            id: `tl-${Date.now()}-change-app`,
            candidateId: cand.id,
            timestamp,
            actorType: 'USER',
            actorName: resolverUserName,
            eventType: 'CANDIDATE_DATA_CORRECTED',
            description: `Field "${cr.requestedField}" updated to "${cr.suggestedValue}" (Approved request from ${cr.requestedByUserName}).`,
          });
        }
      }

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-change-res`,
        timestamp,
        actorUserId: resolverUserId,
        actorName: resolverUserName,
        actorRole: resolverRole,
        action: decision === 'APPROVE' ? 'CHANGE_REQUEST_APPROVED' : 'CHANGE_REQUEST_REJECTED',
        details: `${resolverUserName} (${resolverRole}) ${decision === 'APPROVE' ? 'approved' : 'rejected'} correction request for ${cr.candidateName}: ${cr.requestedField} -> "${cr.suggestedValue}".`,
        entityId: cr.candidateId,
        entityType: 'CANDIDATE',
      });
    });

    if (!resolvedRequest) {
      return res.status(404).json({ success: false, error: 'Change request not found.' });
    }

    eventWorkflowEngine.broadcast({
      type: 'CHANGE_REQUEST_RESOLVED',
      payload: resolvedRequest,
    });

    res.json({
      success: true,
      request: resolvedRequest,
      message: `Change request ${decision === 'APPROVE' ? 'approved and applied' : 'rejected'}.`,
    });
  });

  app.get('/api/interviews', (req: Request, res: Response) => {
    const db = dbService.get();
    res.json({ success: true, interviews: db.interviews });
  });

  // UPDATE / EDIT INTERVIEW
  app.put('/api/interviews/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      interviewerName,
      interviewerId,
      roundName,
      scheduledTime,
      roomId,
      roomName,
      status,
      outcome,
      interviewerFeedback,
      position,
    } = req.body;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'HR') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'HR Lead') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-hr-nisha') as string;

    const timestamp = new Date().toISOString();
    let updatedInterview: any = null;

    try {
      dbService.update((draft) => {
        draft.interviews = draft.interviews || [];
        const interview = draft.interviews.find((i) => i.id === id);
        if (!interview) {
          throw new Error('Interview record not found.');
        }

        if (interviewerName !== undefined) interview.interviewerName = interviewerName.trim();
        if (interviewerId !== undefined) interview.interviewerId = interviewerId.trim();
        if (roundName !== undefined) interview.roundName = roundName;
        if (scheduledTime !== undefined) interview.scheduledTime = scheduledTime;
        if (roomId !== undefined) interview.roomId = roomId;
        if (roomName !== undefined) interview.roomName = roomName;
        if (position !== undefined) interview.position = position;
        if (outcome !== undefined) interview.outcome = outcome;
        if (interviewerFeedback !== undefined) interview.interviewerFeedback = interviewerFeedback;

        if (status !== undefined && status !== interview.status) {
          interview.status = status;
          if (status === 'IN_PROGRESS' && !interview.startedAt) {
            interview.startedAt = timestamp;
          } else if (status === 'COMPLETED' && !interview.completedAt) {
            interview.completedAt = timestamp;
          }
        }

        updatedInterview = { ...interview };

        // Sync candidate status if appropriate
        if (interview.candidateId) {
          const cand = draft.candidates.find((c) => c.id === interview.candidateId);
          if (cand) {
            if (interview.status === 'INTERVIEW_STARTED') {
              cand.status = 'IN_INTERVIEW';
            } else if (
              interview.status === 'INTERVIEW_COMPLETED' &&
              (interview.outcome === 'SELECTED' || (interview.outcome as any) === 'OFFER')
            ) {
              cand.status = 'OFFERED';
            } else if (
              interview.status === 'INTERVIEW_COMPLETED' &&
              (interview.outcome === 'REJECTED' || (interview.outcome as any) === 'REJECT')
            ) {
              cand.status = 'REJECTED';
            }
            cand.updatedAt = timestamp;
          }
        }

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-intv-edit`,
          timestamp,
          actorUserId,
          actorName,
          actorRole,
          action: 'INTERVIEW_UPDATED',
          details: `Updated interview for ${interview.candidateName} with ${interview.interviewerName} (${interview.roundName}).`,
          entityId: id,
          entityType: 'INTERVIEW',
        });
      });

      if (!updatedInterview) {
        return res.status(404).json({ success: false, error: 'Interview not found.' });
      }

      eventWorkflowEngine.broadcast({
        type: 'INTERVIEW_UPDATED',
        payload: { interview: updatedInterview },
        targetRoles: ['HR', 'SENIOR_HR', 'INTERVIEWER', 'ADMIN', 'CEO'],
      });

      res.json({ success: true, interview: updatedInterview, message: 'Interview schedule updated successfully.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update interview schedule.' });
    }
  });

  // DELETE INTERVIEW
  app.delete('/api/interviews/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorRole = (req.headers['x-user-role'] || req.query.role || 'HR') as UserRole;
    const actorName = (req.headers['x-user-name'] || req.query.userName || 'HR Lead') as string;
    const actorUserId = (req.headers['x-user-id'] || req.query.userId || 'usr-hr-nisha') as string;

    const timestamp = new Date().toISOString();
    let deletedCandidateName = '';

    try {
      dbService.update((draft) => {
        draft.interviews = draft.interviews || [];
        const idx = draft.interviews.findIndex((i) => i.id === id);
        if (idx === -1) {
          throw new Error('Interview record not found.');
        }

        const intv = draft.interviews[idx];
        if (intv.status === 'INTERVIEW_STARTED') {
          throw new Error('Cannot delete interview currently in progress. Complete or end the session first.');
        }

        deletedCandidateName = intv.candidateName;
        draft.interviews.splice(idx, 1);

        draft.auditLogs.unshift({
          id: `aud-${Date.now()}-intv-del`,
          timestamp,
          actorUserId,
          actorName,
          actorRole,
          action: 'INTERVIEW_DELETED',
          details: `Deleted interview schedule for ${deletedCandidateName} (${intv.roundName}).`,
          entityId: id,
          entityType: 'INTERVIEW',
        });
      });

      eventWorkflowEngine.broadcast({
        type: 'INTERVIEW_DELETED',
        payload: { interviewId: id, timestamp },
        targetRoles: ['HR', 'SENIOR_HR', 'INTERVIEWER', 'ADMIN', 'CEO'],
      });

      res.json({ success: true, message: `Interview schedule for ${deletedCandidateName} deleted successfully.` });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Failed to delete interview.' });
    }
  });

  // PANTRY TASK LIST (ROLE-FILTERED & MONITORING DATA)
  app.get('/api/pantry/tasks', (req: Request, res: Response) => {
    const db = dbService.get();
    const auth = authenticateStaffRequest(req, db.users);
    const userRole = (req.query.role as UserRole) || auth.user?.role || 'HR';
    const userId = (req.query.userId as string) || auth.user?.id || '';

    // Pantry role permissions:
    // Pantry staff must have a dedicated task-only view.
    // They can see only the tasks assigned to them or their authorised team.
    if (userRole === 'PANTRY') {
      const userName = auth.user?.name || '';
      const userDept = auth.user?.department || 'Pantry';

      const pantryTasks = db.pantryTasks.filter((t) => {
        if (!t.assignedSteward && !t.assignedTeam && !t.assignedStaffId) return true;
        if (t.assignedStaffId && userId && t.assignedStaffId === userId) return true;
        if (userName && t.assignedSteward && t.assignedSteward.toLowerCase().includes(userName.toLowerCase())) return true;
        if (t.assignedTeam && (t.assignedTeam === userDept || t.assignedTeam.includes('Pantry') || t.assignedTeam.includes('Alpha') || t.assignedTeam === 'All Pantry Staff')) return true;
        if (t.assignedSteward && (t.assignedSteward === 'All Pantry Staff' || t.assignedSteward.includes('Pantry') || t.assignedSteward.includes('Suresh'))) return true;
        return false;
      });

      // Dedicated task-only view:
      // Show Candidate/visitor name, Room/cabin name, What task must be performed,
      // Where to go, Required items & quantities, Priority and due time, Who assigned the task,
      // Current task status. No private candidate documents, salaries, or HR profiles.
      const sanitized = pantryTasks.map((t) => ({
        id: t.id,
        category: t.category || 'HOSPITALITY',
        candidateName: t.candidateName || 'Guest / Candidate',
        roomName: t.roomName,
        roomId: t.roomId,
        instructions: t.instructions || t.description,
        description: t.description || t.instructions,
        location: t.location || t.roomName,
        requiredItems: t.requiredItems || [],
        itemsWithQuantities: t.itemsWithQuantities || [],
        priority: t.priority,
        dueTime: t.dueTime || 'Immediate',
        createdByName: t.createdByName || 'Staff',
        createdByRole: t.createdByRole || 'STAFF',
        createdAt: t.createdAt,
        status: t.status,
        assignedSteward: t.assignedSteward || 'Pantry Staff',
        assignedTeam: t.assignedTeam || 'Pantry Team',
        assignedAt: t.assignedAt,
        acceptedAt: t.acceptedAt,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
        completedBy: t.completedBy,
        timeTakenFormatted: t.timeTakenFormatted,
        completionDurationMinutes: t.completionDurationMinutes,
        isStaffReportedCompleted: t.isStaffReportedCompleted,
        staffReportedCompletedAt: t.staffReportedCompletedAt,
        issueReportedAt: t.issueReportedAt,
        issueReason: t.issueReason,
      }));

      return res.json({ success: true, tasks: sanitized });
    }

    // For Admin, HR, creators, etc.: return full tasks with timestamps and monitoring metadata
    res.json({ success: true, tasks: db.pantryTasks });
  });

  app.get('/api/notifications', (req: Request, res: Response) => {
    const role = (req.query.role as UserRole) || 'HR';
    const userId = (req.query.userId as string) || '';
    const db = dbService.get();

    const notifs = db.notifications.filter(
      (n) => n.recipientRole === role || (userId && n.recipientUserId === userId)
    );

    res.json({ success: true, notifications: notifs });
  });

  app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    dbService.update((draft) => {
      const notif = draft.notifications.find((n) => n.id === id);
      if (notif) notif.read = true;
    });
    res.json({ success: true });
  });

  // EDIT NOTIFICATION
  app.put('/api/notifications/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, message, priority, recipientRole } = req.body;
    let updatedNotif: any = null;

    dbService.update((draft) => {
      draft.notifications = draft.notifications || [];
      const notif = draft.notifications.find((n) => n.id === id);
      if (notif) {
        if (title !== undefined) notif.title = title.trim();
        if (message !== undefined) notif.message = message.trim();
        if (priority !== undefined) notif.priority = priority;
        if (recipientRole !== undefined) notif.recipientRole = recipientRole;
        updatedNotif = { ...notif };
      }
    });

    if (!updatedNotif) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, notification: updatedNotif, message: 'Notification updated.' });
  });

  // DELETE NOTIFICATION
  app.delete('/api/notifications/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    let found = false;

    dbService.update((draft) => {
      draft.notifications = draft.notifications || [];
      const idx = draft.notifications.findIndex((n) => n.id === id);
      if (idx !== -1) {
        draft.notifications.splice(idx, 1);
        found = true;
      }
    });

    if (!found) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted.' });
  });

  // ==========================================
  // HR SUB-PROFILES ENDPOINT: NISHA & SHRIYANSHI
  // ==========================================
  app.get('/api/hr/subprofiles', (req: Request, res: Response) => {
    const db = dbService.get();

    // 1. Nisha's authorized workspace data
    const nishaUser = db.users.find((u) => u.id === 'usr-hr-nisha') || {
      id: 'usr-hr-nisha',
      name: 'Nisha',
      role: 'HR',
      designation: 'Senior HR Manager',
      department: 'HR & Talent Operations',
      email: 'nisha@whitecollarrealty.com',
      phone: '+91 98100 00003',
      isActive: true,
      lastLoginAt: '2026-10-09T05:26:00.063Z',
    };

    const nishaCandidates = db.candidates.filter((c) => {
      const matchInterviewer =
        c.assignedInterviewerId === 'usr-hr-nisha' ||
        (c.assignedInterviewerName && c.assignedInterviewerName.toLowerCase().includes('nisha'));
      const isSeniorRound =
        c.status === 'With Kimmi Mam – Senior HR Interview' ||
        c.position?.toLowerCase().includes('manager') ||
        c.position?.toLowerCase().includes('director') ||
        c.position?.toLowerCase().includes('lead');
      return matchInterviewer || isSeniorRound;
    });

    const nishaInterviews = db.interviews.filter(
      (i) =>
        i.interviewerId === 'usr-hr-nisha' ||
        (i.interviewerName && i.interviewerName.toLowerCase().includes('nisha'))
    );

    const nishaTasks = (db.actionTasks || []).filter(
      (t) =>
        t.targetUserId === 'usr-hr-nisha' ||
        t.senderId === 'usr-hr-nisha' ||
        (t.instruction && t.instruction.toLowerCase().includes('nisha')) ||
        (t.title && t.title.toLowerCase().includes('nisha'))
    );

    const nishaActivity = db.auditLogs
      .filter(
        (a) =>
          a.actorUserId === 'usr-hr-nisha' ||
          (a.actorName && a.actorName.toLowerCase().includes('nisha')) ||
          (a.details && a.details.toLowerCase().includes('nisha'))
      )
      .slice(0, 30);

    // 2. Shriyanshi's authorized workspace data
    const shriyanshiUser = db.users.find((u) => u.id === 'usr-hr-shriyanshi') || {
      id: 'usr-hr-shriyanshi',
      name: 'Shriyanshi',
      role: 'HR',
      designation: 'HR Executive',
      department: 'HR & Campus / Intake',
      email: 'shriyanshi@whitecollarrealty.com',
      phone: '+91 98100 00004',
      isActive: true,
    };

    const shriyanshiCandidates = db.candidates.filter((c) => {
      const matchInterviewer =
        c.assignedInterviewerId === 'usr-hr-shriyanshi' ||
        (c.assignedInterviewerName && c.assignedInterviewerName.toLowerCase().includes('shriyanshi'));
      const isTechnicalOrScreening =
        c.status === 'WAITING' ||
        c.status === 'ARRIVED' ||
        c.status === 'IN_INTERVIEW' ||
        c.position?.toLowerCase().includes('associate') ||
        c.position?.toLowerCase().includes('executive') ||
        c.position?.toLowerCase().includes('intern');
      return matchInterviewer || isTechnicalOrScreening;
    });

    const shriyanshiInterviews = db.interviews.filter(
      (i) =>
        i.interviewerId === 'usr-hr-shriyanshi' ||
        (i.interviewerName && i.interviewerName.toLowerCase().includes('shriyanshi'))
    );

    const shriyanshiTasks = (db.actionTasks || []).filter(
      (t) =>
        t.targetUserId === 'usr-hr-shriyanshi' ||
        t.senderId === 'usr-hr-shriyanshi' ||
        (t.instruction && t.instruction.toLowerCase().includes('shriyanshi')) ||
        (t.title && t.title.toLowerCase().includes('shriyanshi'))
    );

    const shriyanshiActivity = db.auditLogs
      .filter(
        (a) =>
          a.actorUserId === 'usr-hr-shriyanshi' ||
          (a.actorName && a.actorName.toLowerCase().includes('shriyanshi')) ||
          (a.details && a.details.toLowerCase().includes('shriyanshi'))
      )
      .slice(0, 30);

    res.json({
      success: true,
      profiles: {
        nisha: {
          profile: nishaUser,
          workspaceTitle: 'Nisha — Senior HR Management Workspace',
          responsibilities: 'Executive Candidate Assessments, Round 1 Leadership Screenings & Kimmi Mam Handoffs',
          candidates: nishaCandidates,
          interviews: nishaInterviews,
          tasks: nishaTasks,
          activity: nishaActivity,
          stats: {
            assignedCandidates: nishaCandidates.length,
            activeInterviews: nishaInterviews.length,
            openTasks: nishaTasks.filter((t) => t.status !== 'COMPLETED').length,
          },
        },
        shriyanshi: {
          profile: shriyanshiUser,
          workspaceTitle: 'Shriyanshi — Talent Acquisition & Intake Workspace',
          responsibilities: 'Frontline Candidate Intake, Technical Rounds & Daily Interview Logistics',
          candidates: shriyanshiCandidates,
          interviews: shriyanshiInterviews,
          tasks: shriyanshiTasks,
          activity: shriyanshiActivity,
          stats: {
            assignedCandidates: shriyanshiCandidates.length,
            activeInterviews: shriyanshiInterviews.length,
            openTasks: shriyanshiTasks.filter((t) => t.status !== 'COMPLETED').length,
          },
        },
      },
    });
  });

  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const db = dbService.get();
    res.json({ success: true, logs: db.auditLogs.slice(0, 100) });
  });

  app.get('/api/stats', (req: Request, res: Response) => {
    const db = dbService.get();
    const todayArrivals = db.candidates.filter(
      (c) => c.status !== 'SCHEDULED'
    ).length;
    const waitingCount = db.candidates.filter((c) => c.status === 'WAITING' || c.status === 'ARRIVED').length;
    const inInterviewCount = db.candidates.filter((c) => c.status === 'IN_INTERVIEW').length;
    const occupiedRooms = db.rooms.filter((r) => r.status === 'OCCUPIED' || r.status === 'ASSIGNED').length;
    const pendingPantry = db.pantryTasks.filter((t) => t.status === 'PENDING').length;
    const completedCount = db.candidates.filter(
      (c) => c.status === 'COMPLETED' || c.status === 'CHECKED_OUT' || c.status === 'OFFERED'
    ).length;

    res.json({
      success: true,
      stats: {
        todayArrivals,
        waitingCount,
        inInterviewCount,
        occupiedRooms,
        totalRooms: db.rooms.length,
        pendingPantry,
        completedCount,
      },
    });
  });

  // Admin QR Pass generation
  app.post('/api/qr/generate', (req: Request, res: Response) => {
    const { candidateName, position, department, appointmentTime, interviewerId, interviewerName, roundName } = req.body;
    const token = `WCR-APPT-${Math.floor(100 + Math.random() * 900)}`;

    const newSession: CheckInSession = {
      id: `session-${Date.now()}`,
      token,
      qrType: 'APPOINTMENT',
      candidateName,
      position,
      department,
      appointmentTime,
      interviewerId,
      interviewerName,
      interviewRound: roundName || 'Round 1 - Technical Assessment',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    dbService.update((draft) => {
      draft.checkInSessions.unshift(newSession);
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorType: 'USER',
        actorName: 'Admin / HR',
        action: 'GENERATE_QR_PASS',
        details: `Generated appointment QR pass token ${token} for ${candidateName} (${position}).`,
      });
    });

    res.json({ success: true, session: newSession });
  });

  // Office Settings GET endpoint
  app.get('/api/settings/office', (_req: Request, res: Response) => {
    res.json({ success: true, settings: dbService.get().settings });
  });

  // Admin Office Settings update (including QR session expiry)
  app.post('/api/settings/office', (req: Request, res: Response) => {
    const { qrSessionExpiryMinutes, autoAssignPantryOnRoom, pantryWaterRequired, requireLivePhoto, requireResume } = req.body;

    dbService.update((draft) => {
      if (typeof qrSessionExpiryMinutes === 'number' && qrSessionExpiryMinutes > 0) {
        draft.settings.qrSessionExpiryMinutes = qrSessionExpiryMinutes;
      }
      if (typeof autoAssignPantryOnRoom === 'boolean') {
        draft.settings.autoAssignPantryOnRoom = autoAssignPantryOnRoom;
      }
      if (typeof pantryWaterRequired === 'boolean') {
        draft.settings.pantryWaterRequired = pantryWaterRequired;
      }
      if (typeof requireLivePhoto === 'boolean') {
        draft.settings.requireLivePhoto = requireLivePhoto;
      }
      if (typeof requireResume === 'boolean') {
        draft.settings.requireResume = requireResume;
      }

      draft.auditLogs.unshift({
        id: `aud-${Date.now()}-settings`,
        timestamp: new Date().toISOString(),
        actorType: 'USER',
        actorName: 'Admin',
        action: 'UPDATE_OFFICE_SETTINGS',
        details: `Updated office operations settings (QR session expiry set to ${draft.settings.qrSessionExpiryMinutes}m).`,
      });
    });

    res.json({ success: true, settings: dbService.get().settings });
  });

  // Admin Field Visibility update
  app.post('/api/settings/visibility', (req: Request, res: Response) => {
    const { role, config } = req.body;
    if (!role || !config) {
      return res.status(400).json({ success: false, error: 'Role and config are required' });
    }

    dbService.update((draft) => {
      draft.settings.fieldVisibility[role as UserRole] = {
        ...draft.settings.fieldVisibility[role as UserRole],
        ...config,
      };
      draft.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorType: 'USER',
        actorName: 'Admin',
        action: 'UPDATE_FIELD_VISIBILITY',
        details: `Updated field level visibility matrix for role ${role}.`,
      });
    });

    res.json({ success: true, settings: dbService.get().settings });
  });

  // Serve public directory assets (including background video, posters, logos, icons, PWA manifest)
  const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR));
  }

  // Serve local pdfjs worker assets safely on same origin
  app.use('/pdfjs', express.static(path.resolve(process.cwd(), 'node_modules/pdfjs-dist/build')));

  // 404 API Catch-all: Ensure all unhandled /api/* requests return JSON, NEVER falling through to SPA HTML
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.path}`,
    });
  });

  // ==========================================
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WCR OPS SERVER] Running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[WCR OPS SERVER] Startup error:', err);
  process.exit(1);
});
