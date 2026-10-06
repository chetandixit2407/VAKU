import React, { useState, useEffect, useCallback } from 'react';
import type {
  UserRole,
  Candidate,
  Interview,
  Room,
  Notification,
  PantryTask,
  Visitor,
  User,
} from './types/index.ts';
import { useRealtimeEvents } from './hooks/useRealtimeEvents.ts';
import { Navbar } from './components/Navbar.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { CandidateCheckInForm } from './components/CandidateCheckInForm.tsx';
import { GeneralNewCandidateRegister } from './components/GeneralNewCandidateRegister.tsx';
import { CandidateDossierModal } from './components/CandidateDossierModal.tsx';
import { AssignRoomModal } from './components/AssignRoomModal.tsx';
import { EndInterviewModal } from './components/EndInterviewModal.tsx';
import { QRPassModal } from './components/QRPassModal.tsx';
import { WalkInModal } from './components/WalkInModal.tsx';
import { SecureDocumentViewerModal } from './components/SecureDocumentViewerModal.tsx';
import { ForgotPasswordModal } from './components/ForgotPasswordModal.tsx';
import { ResetPasswordView } from './components/ResetPasswordView.tsx';
import {
  authenticatedFetch,
  setStoredStaffToken,
  clearStoredStaffToken,
  setStoredStaffRole,
} from './utils/apiClient.ts';

// Role Dashboards
import { HRDashboard } from './components/dashboards/HRDashboard.tsx';
import { AdminDashboard } from './components/dashboards/AdminDashboard.tsx';
import { CEODashboard } from './components/dashboards/CEODashboard.tsx';
import { InterviewerDashboard } from './components/dashboards/InterviewerDashboard.tsx';
import { SeniorHRDashboard } from './components/dashboards/SeniorHRDashboard.tsx';
import { ReceptionDashboard } from './components/dashboards/ReceptionDashboard.tsx';
import { PantryDashboard } from './components/dashboards/PantryDashboard.tsx';

import {
  Sparkles,
  QrCode,
  UserCheck,
  Smartphone,
  UserPlus,
  Shield,
  Key,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [routePath, setRoutePath] = useState<string>(() => window.location.pathname);
  const [currentRole, setCurrentRole] = useState<UserRole>('HR');
  const [currentUserId, setCurrentUserId] = useState<string>('usr-hr-nisha');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');

  // Floating Realtime Intake Alert Toast
  const [realtimeToast, setRealtimeToast] = useState<{
    id: string;
    title: string;
    message: string;
    candidateId?: string;
    timestamp: string;
  } | null>(null);

  // Application Data States
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pantryTasks, setPantryTasks] = useState<PantryTask[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  // Modals & Drawers
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<
    | 'GENERAL_REGISTER'
    | 'CHECK_IN'
    | 'QR_PASS'
    | 'WALK_IN'
    | 'DOSSIER'
    | 'ASSIGN_ROOM'
    | 'END_INTERVIEW'
    | 'STAFF_LOGIN'
    | 'FORGOT_PASSWORD'
    | null
  >(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [checkInToken, setCheckInToken] = useState<string>('WCR-APPT-901');

  // Staff Login State
  const [loginEmail, setLoginEmail] = useState<string>('nisha@whitecollarrealty.com');
  const [loginPassword, setLoginPassword] = useState<string>('wcr123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Initialize Authenticated Staff Session from backend on mount
  useEffect(() => {
    authenticatedFetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.authenticated && data.user) {
          setCurrentUser(data.user);
          setCurrentRole(data.user.role);
          setCurrentUserId(data.user.id);
          setStoredStaffRole(data.user.role);
          const tok = data.session?.token || data.token;
          if (tok) {
            setSessionToken(tok);
            setStoredStaffToken(tok);
          }
        } else {
          // Initialize active HR session
          authenticatedFetch('/api/auth/switch-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'HR' }),
          })
            .then((r) => r.json())
            .then((sData) => {
              if (sData.success) {
                setCurrentUser(sData.user);
                setCurrentRole(sData.user.role);
                setCurrentUserId(sData.user.id);
                setStoredStaffRole(sData.user.role);
                const tok = sData.session?.token || sData.token;
                if (tok) {
                  setSessionToken(tok);
                  setStoredStaffToken(tok);
                }
              }
            })
            .catch((err) => console.warn('Session bootstrap error', err));
        }
      })
      .catch((err) => console.warn('Auth check error', err));
  }, []);

  // Listen to popstate for browser back/forward routing
  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check routes
  const isResetPasswordRoute =
    routePath === '/reset-password' ||
    routePath.startsWith('/reset-password');
  const resetPasswordToken =
    new URLSearchParams(window.location.search).get('token') || '';

  const isGeneralRegisterRoute =
    routePath === '/register' ||
    routePath.startsWith('/register/') ||
    routePath.startsWith('/candidate/register');

  const isDashboardRoute =
    routePath === '/dashboard' ||
    routePath.startsWith('/dashboard/');

  const isCompleteRoute =
    routePath === '/registration-complete' ||
    routePath === '/thank-you' ||
    routePath === '/about';

  const registerTokenMatch = routePath.match(/\/register\/([^/?#]+)/) || routePath.match(/\/candidate\/register\/([^/?#]+)/);
  const dedicatedRegisterToken = registerTokenMatch ? registerTokenMatch[1] : undefined;

  const isCandidateRoute = routePath.startsWith('/candidate/check-in');
  const urlTokenMatch = routePath.match(/\/candidate\/check-in\/([^/?#]+)/);
  const queryToken = new URLSearchParams(window.location.search).get('token');
  const dedicatedToken = urlTokenMatch ? urlTokenMatch[1] : (queryToken || 'WCR-APPT-901');

  // Direct staff candidate profile route e.g. /candidate/:candidateId or /candidates/:candidateId
  const directCandidateMatch = routePath.match(/^\/(?:candidate|candidates)\/([^/?#]+)$/);
  const directCandidateId =
    directCandidateMatch && !['check-in', 'register'].includes(directCandidateMatch[1])
      ? directCandidateMatch[1]
      : null;

  useEffect(() => {
    if (directCandidateId) {
      setSelectedCandidateId(directCandidateId);
      setActiveModal('DOSSIER');
    }
  }, [directCandidateId]);

  useEffect(() => {
    if (routePath === '/staff/login') {
      setActiveModal('STAFF_LOGIN');
    }
  }, [routePath]);

  // Dedicated in-app document viewer route
  // e.g. /app/candidates/:candidateId/resume/view OR /app/candidates/:candidateId/government-id/view
  const docViewerMatch = routePath.match(/\/(?:app\/)?candidates\/([^/?#]+)\/(resume|government-id|govid)\/view/);
  const docCandidateId = docViewerMatch ? docViewerMatch[1] : null;
  const docViewerType: 'RESUME' | 'GOVERNMENT_ID' | null = docViewerMatch
    ? (docViewerMatch[2] === 'resume' ? 'RESUME' : 'GOVERNMENT_ID')
    : null;

  const [routeCandidate, setRouteCandidate] = useState<Candidate | null>(null);
  const [routeCandidateLoading, setRouteCandidateLoading] = useState<boolean>(false);

  // Fetch all live data from server with authenticated credentials
  const fetchAllData = useCallback(async () => {
    try {
      const [cRes, iRes, rRes, nRes, pRes, vRes] = await Promise.all([
        authenticatedFetch(`/api/candidates?role=${currentRole}`),
        authenticatedFetch('/api/interviews'),
        authenticatedFetch('/api/rooms'),
        authenticatedFetch(`/api/notifications?role=${currentRole}&userId=${currentUserId}`),
        authenticatedFetch('/api/pantry/tasks'),
        authenticatedFetch('/api/visitors'),
      ]);

      const [cData, iData, rData, nData, pData, vData] = await Promise.all([
        cRes.json(),
        iRes.json(),
        rRes.json(),
        nRes.json(),
        pRes.json(),
        vRes.json(),
      ]);

      if (cData.success && Array.isArray(cData.candidates)) setCandidates(cData.candidates);
      if (iData.success && Array.isArray(iData.interviews)) setInterviews(iData.interviews);
      if (rData.success && Array.isArray(rData.rooms)) setRooms(rData.rooms);
      if (nData.success && Array.isArray(nData.notifications)) setNotifications(nData.notifications);
      if (pData.success && Array.isArray(pData.tasks)) setPantryTasks(pData.tasks);
      if (vData.success && Array.isArray(vData.visitors)) setVisitors(vData.visitors);
    } catch (err) {
      console.error('Failed fetching data snapshot', err);
    }
  }, [currentRole, currentUserId]);

  // Hook into Realtime Server-Sent Events (SSE)
  const { connected: isRealtimeConnected } = useRealtimeEvents({
    role: currentRole,
    userId: currentUserId,
    sessionToken,
    onEvent: (event) => {
      console.log('[REALTIME EVENT RECEIVED ON DASHBOARD]', event);

      // Instant in-memory synchronization of incoming candidate record
      if (event.payload?.candidate) {
        const incomingCand = event.payload.candidate;
        setCandidates((prev) => {
          const idx = prev.findIndex((c) => c.id === incomingCand.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...incomingCand };
            return next;
          }
          return [incomingCand, ...prev];
        });
      } else if (event.type === 'CANDIDATE_ASSIGNED_TO_KIMMI' && event.payload?.candidateId) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === event.payload.candidateId
              ? {
                  ...c,
                  status: 'With Kimmi Mam – Senior HR Interview' as any,
                  assignedInterviewerId: 'usr-cofounder-kimmi',
                  assignedInterviewerName: 'Kimmi Mam',
                  currentLocation: 'Senior HR Cabin / Room',
                }
              : c
          )
        );
      }

      // Instant in-memory synchronization of incoming interview record
      if (event.payload?.interview) {
        const incomingIntv = event.payload.interview;
        setInterviews((prev) => {
          const idx = prev.findIndex((i) => i.id === incomingIntv.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...incomingIntv };
            return next;
          }
          return [incomingIntv, ...prev];
        });
      }

      // Trigger interactive intake alert banner if candidate arrived/submitted
      if (
        event.type === 'CANDIDATE_FORM_SUBMITTED' ||
        event.type === 'CANDIDATE_ARRIVED'
      ) {
        const meta = event.payload?.metadata || event.payload;
        const candName = meta?.candidateName || event.payload?.candidate?.fullName || 'New Candidate';
        const position = meta?.position || event.payload?.candidate?.position || 'Job Applicant';
        const candId = event.payload?.candidateId || event.payload?.candidate?.id;

        setRealtimeToast({
          id: `toast-${Date.now()}`,
          title: 'Candidate Intake Alert',
          message: `${candName} (${position}) has submitted check-in. Intake queue updated.`,
          candidateId: candId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        // Auto-dismiss toast after 9 seconds
        setTimeout(() => {
          setRealtimeToast((prev) => (prev?.candidateId === candId ? null : prev));
        }, 9000);
      }

      // Seamless zero-refresh authoritative state update on any backend event
      fetchAllData();
    },
  });

  // Re-fetch when switching roles or mounting
  useEffect(() => {
    if (!isCandidateRoute && !isGeneralRegisterRoute) {
      fetchAllData();
    }
  }, [fetchAllData, isCandidateRoute, isGeneralRegisterRoute]);

  // Load candidate record if on a direct document viewer route
  useEffect(() => {
    if (docCandidateId) {
      const existing = candidates.find((c) => c.id === docCandidateId);
      if (existing) {
        setRouteCandidate(existing);
      } else {
        setRouteCandidateLoading(true);
        authenticatedFetch(`/api/candidates/${encodeURIComponent(docCandidateId)}?role=${encodeURIComponent(currentRole)}`)
          .then((r) => {
            if (!r.ok) return { success: false };
            return r.json();
          })
          .then((data) => {
            if (data.success && data.candidate) {
              setRouteCandidate(data.candidate);
            }
          })
          .catch((err) => console.warn('[Doc Route Sync]', err))
          .finally(() => setRouteCandidateLoading(false));
      }
    } else {
      setRouteCandidate(null);
    }
  }, [docCandidateId, candidates, currentRole]);

  // Handle Role Persona Switching
  const handleSelectRole = async (role: UserRole) => {
    setCurrentRole(role);
    setStoredStaffRole(role);
    try {
      const res = await authenticatedFetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setCurrentUserId(data.user.id);
        const tok = data.session?.token || data.token;
        if (tok) {
          setSessionToken(tok);
          setStoredStaffToken(tok);
        }
      }
    } catch (err) {
      console.warn('Role switch error', err);
    }
  };

  // Staff Login Handler
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);

    try {
      const res = await authenticatedFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      setCurrentUser(data.user);
      setCurrentRole(data.user.role);
      setCurrentUserId(data.user.id);
      setStoredStaffRole(data.user.role);
      const tok = data.session?.token || data.token;
      if (tok) {
        setSessionToken(tok);
        setStoredStaffToken(tok);
      }
      setLoginSuccess(`Signed in as ${data.user.name} (${data.user.role})`);
      setTimeout(() => {
        setActiveModal(null);
        setLoginSuccess(null);
      }, 1000);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  // Staff Logout Handler
  const handleStaffLogout = async () => {
    try {
      await authenticatedFetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          userName: currentUser?.name,
          userRole: currentRole,
        }),
      });
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      clearStoredStaffToken();
      setSessionToken('');
      setCurrentUser(null);
      setActiveModal('STAFF_LOGIN');
    }
  };

  // Notification action handler
  const handleNotificationAction = (actionKey: string, payload?: any) => {
    if (actionKey === 'ASSIGN_ROOM') {
      setSelectedCandidateId(payload?.candidateId || '');
      setSelectedInterview(payload?.interviewId ? interviews.find((i) => i.id === payload.interviewId) || null : null);
      setActiveModal('ASSIGN_ROOM');
    } else if (actionKey === 'VIEW_CANDIDATE') {
      setSelectedCandidateId(payload?.candidateId || '');
      setActiveModal('DOSSIER');
    } else if (actionKey === 'START_INTERVIEW') {
      if (payload?.interviewId) {
        handleStartInterview(payload.interviewId);
      }
    } else if (actionKey === 'COMPLETE_PANTRY_TASK') {
      if (payload?.taskId) {
        handleCompletePantryTask(payload.taskId);
      }
    } else if (actionKey === 'CHECKOUT_CANDIDATE') {
      if (payload?.candidateId) {
        handleCheckout(payload.candidateId);
      }
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Interviewer actions
  const handleStartInterview = async (interviewId: string) => {
    try {
      await fetch(`/api/interviews/${interviewId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerName: 'Nisha Verma (Senior Director)' }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Pantry complete task
  const handleCompletePantryTask = async (taskId: string) => {
    try {
      await fetch(`/api/pantry/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stewardName: 'Suresh Kumar (Pantry)' }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Reception physical checkout
  const handleCheckout = async (candidateId: string) => {
    try {
      await fetch('/api/visitors/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          receptionistName: 'Ananya Sen (Reception)',
        }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ==========================================
  // DEDICATED GENERAL WCR BLANK REGISTRATION ROUTE
  // https://<domain>/register
  // ==========================================
  if (isGeneralRegisterRoute) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 sm:p-6 flex flex-col justify-center items-center font-sans antialiased selection:bg-amber-500 selection:text-slate-900">
        <div className="w-full max-w-2xl">
          <GeneralNewCandidateRegister
            initialToken={dedicatedRegisterToken}
            onSuccess={() => {
              console.log('General New Candidate Self-Registration confirmed');
            }}
          />
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  // ==========================================
  // DEDICATED PASSWORD RESET VERIFICATION ROUTE
  // https://<domain>/reset-password?token=<token>
  // ==========================================
  if (isResetPasswordRoute) {
    return (
      <ResetPasswordView
        token={resetPasswordToken}
        onBackToLogin={() => {
          window.history.pushState({}, '', '/');
          setRoutePath('/');
          setActiveModal('STAFF_LOGIN');
        }}
      />
    );
  }

  // ==========================================
  // DEDICATED SCHEDULED CANDIDATE SCAN ROUTE
  // https://<domain>/candidate/check-in/<token>
  // ==========================================
  if (isCandidateRoute) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 sm:p-6 flex flex-col justify-center items-center font-sans antialiased selection:bg-amber-500 selection:text-slate-900">
        <div className="w-full max-w-2xl">
          <CandidateCheckInForm
            initialToken={dedicatedToken}
            isStandalonePage={true}
            onSuccess={() => {
              console.log('Candidate check-in successfully submitted via QR phone route');
            }}
          />
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  // ==========================================
  // DEDICATED REGISTRATION COMPLETE / RECEIPT CONFIRMATION ROUTE
  // https://<domain>/registration-complete OR /thank-you
  // ==========================================
  if (isCompleteRoute) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 sm:p-6 flex flex-col justify-center items-center font-sans antialiased selection:bg-amber-500 selection:text-slate-900">
        <div className="w-full max-w-xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-widest text-amber-800 uppercase bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-block">
                WHITE COLLAR REALTY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ✓ Registration Completed
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your arrival information has been recorded and received by White Collar Realty operations.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Next Steps
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please take a seat in our <strong>Reception / Ground Floor Guest Lounge</strong>.
              Our coordinator has been notified and you will be escorted shortly.
            </p>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Session Locked & Completed
              </span>
              <span className="font-mono text-slate-400">Encrypted</span>
            </div>
          </div>
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  // ==========================================
  // DEDICATED IN-APP DOCUMENT VIEWER ROUTE
  // /app/candidates/:candidateId/resume/view
  // /app/candidates/:candidateId/government-id/view
  // ==========================================
  if (docViewerMatch && docCandidateId && docViewerType) {
    if (routeCandidateLoading) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              Loading Secure Document from WCR Repository...
            </p>
          </div>
        </div>
      );
    }

    if (!routeCandidate) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Document or Candidate Not Found</h2>
            <p className="text-xs text-slate-400">
              The requested candidate document may have been archived or deleted under WCR retention policy.
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                setRoutePath('/');
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              &larr; Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <SecureDocumentViewerModal
        candidate={routeCandidate}
        currentRole={currentRole}
        documentType={docViewerType}
        onClose={() => {
          window.history.pushState({}, '', '/');
          setRoutePath('/');
        }}
      />
    );
  }

  // ==========================================
  // UNCONNECTED / UNAUTHENTICATED DASHBOARD ROUTE GUARD
  // ==========================================
  if (isDashboardRoute && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Shield className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-white">Access Denied</h3>
              <p className="text-[11px] text-slate-400">Staff Authentication Required</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            You must authenticate with a White Collar Realty staff account to access confidential dashboard operations.
          </p>

          {loginError && (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleStaffLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Staff Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. reception@whitecollarrealty.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Sign In to Staff Console
            </button>
          </form>
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/register');
                setRoutePath('/register');
              }}
              className="text-xs text-slate-400 hover:text-amber-400 underline cursor-pointer"
            >
              &larr; Candidate Self-Registration (/register)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STAFF & OPERATIONS CONSOLE (HR, ADMIN, CEO, INTERVIEWER, RECEPTION, PANTRY)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Navbar */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        unreadCount={unreadCount}
        currentUser={currentUser}
        onLogout={handleStaffLogout}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onOpenQRPasses={() => setActiveModal('QR_PASS')}
        onOpenCheckIn={() => {
          setCheckInToken('WCR-APPT-901');
          setActiveModal('CHECK_IN');
        }}
        onOpenWalkIn={() => setActiveModal('WALK_IN')}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Realtime Candidate Intake Alert Banner */}
        {realtimeToast && (
          <div className="p-4 bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-purple-600/20 border border-amber-500/40 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md animate-bounce">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-300 uppercase tracking-wide">{realtimeToast.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({realtimeToast.timestamp})</span>
                </div>
                <p className="text-slate-200 font-medium mt-0.5">{realtimeToast.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {realtimeToast.candidateId && (
                <button
                  onClick={() => {
                    setSelectedCandidateId(realtimeToast.candidateId!);
                    setActiveModal('DOSSIER');
                    setRealtimeToast(null);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow cursor-pointer text-xs"
                >
                  View Profile &rarr;
                </button>
              )}
              <button
                onClick={() => setRealtimeToast(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Interactive Testing Quick Launcher Strip */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-white font-bold text-sm tracking-tight">
                WCR Dual QR Architecture & Desk Photo Verification
              </strong>
            </div>
            <p className="text-slate-400 text-xs">
              <strong className="text-emerald-400">1. General Reception QR</strong> (100% blank form, isolated session) &bull;{' '}
              <strong className="text-amber-400">2. Scheduled QR</strong> (Appointment pass) &bull;{' '}
              <strong className="text-cyan-400">3. Reception Live Photo</strong> (WebRTC desk verification).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Direct Blank Registration Test Button */}
            <button
              onClick={() => setActiveModal('GENERAL_REGISTER')}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
              title="Test General WCR Blank Self-Registration"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Test Blank Registration</span>
            </button>

            {/* Scheduled Check-In */}
            <button
              onClick={() => {
                setCheckInToken('WCR-APPT-901');
                setActiveModal('CHECK_IN');
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Scheduled Check-In</span>
            </button>

            {/* Dual QR Station Standee */}
            <button
              onClick={() => setActiveModal('QR_PASS')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>QR Standees</span>
            </button>

            {/* Staff Login Modal */}
            <button
              onClick={() => setActiveModal('STAFF_LOGIN')}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>Staff Login</span>
            </button>
          </div>
        </div>

        {/* Dynamic Role Dashboard View */}
        {currentRole === 'SENIOR_HR' && (
          <SeniorHRDashboard
            candidates={candidates}
            interviews={interviews}
            rooms={rooms}
            currentInterviewerId={currentUserId}
            onStartInterview={handleStartInterview}
            onOpenEndInterviewModal={(intv) => {
              setSelectedInterview(intv);
              setActiveModal('END_INTERVIEW');
            }}
            onOpenDossier={(candId) => {
              setSelectedCandidateId(candId);
              setActiveModal('DOSSIER');
            }}
            onAssignRoom={(candId, intvId) => {
              setSelectedCandidateId(candId);
              setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
              setActiveModal('ASSIGN_ROOM');
            }}
            onRefresh={fetchAllData}
          />
        )}

        {currentRole === 'HR' && (
          <HRDashboard
            candidates={candidates}
            interviews={interviews}
            rooms={rooms}
            onOpenDossier={(candId) => {
              setSelectedCandidateId(candId);
              setActiveModal('DOSSIER');
            }}
            onAssignRoom={(candId, intvId) => {
              setSelectedCandidateId(candId);
              setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
              setActiveModal('ASSIGN_ROOM');
            }}
            onRefresh={fetchAllData}
          />
        )}

        {currentRole === 'ADMIN' && <AdminDashboard onRefresh={fetchAllData} />}

        {currentRole === 'CEO' && (
          <CEODashboard
            candidates={candidates}
            interviews={interviews}
            rooms={rooms}
            onOpenDossier={(candId) => {
              setSelectedCandidateId(candId);
              setActiveModal('DOSSIER');
            }}
          />
        )}

        {currentRole === 'INTERVIEWER' && (
          <InterviewerDashboard
            candidates={candidates}
            interviews={interviews}
            rooms={rooms}
            currentInterviewerId={currentUserId}
            onStartInterview={handleStartInterview}
            onOpenEndInterviewModal={(intv) => {
              setSelectedInterview(intv);
              setActiveModal('END_INTERVIEW');
            }}
            onOpenDossier={(candId) => {
              setSelectedCandidateId(candId);
              setActiveModal('DOSSIER');
            }}
          />
        )}

        {currentRole === 'RECEPTION' && (
          <ReceptionDashboard
            candidates={candidates}
            rooms={rooms}
            visitors={visitors}
            onCheckout={handleCheckout}
            onOpenCheckIn={() => {
              setCheckInToken('WCR-APPT-901');
              setActiveModal('CHECK_IN');
            }}
            onOpenWalkIn={() => setActiveModal('WALK_IN')}
            onOpenQR={() => setActiveModal('QR_PASS')}
            onRefresh={fetchAllData}
          />
        )}

        {currentRole === 'PANTRY' && (
          <PantryDashboard
            tasks={pantryTasks}
            rooms={rooms}
            candidates={candidates}
            onCompleteTask={handleCompletePantryTask}
            onRefresh={fetchAllData}
          />
        )}
      </main>

      {/* Floating Offline Indicator */}
      <OfflineIndicator />

      {/* Slide-over Notification Feed Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        role={currentRole}
        onActionClick={handleNotificationAction}
        onMarkRead={handleMarkNotificationRead}
      />

      {/* MODALS */}
      {/* 1. GENERAL WCR BLANK CANDIDATE SELF-REGISTRATION MODAL */}
      {activeModal === 'GENERAL_REGISTER' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs p-4 flex items-center justify-center">
          <GeneralNewCandidateRegister
            onSuccess={() => {
              fetchAllData();
            }}
            onCancel={() => setActiveModal(null)}
          />
        </div>
      )}

      {/* 2. SCHEDULED CANDIDATE CHECK-IN PORTAL MODAL */}
      {activeModal === 'CHECK_IN' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs p-4 flex items-center justify-center">
          <CandidateCheckInForm
            initialToken={checkInToken}
            onSuccess={() => {
              fetchAllData();
            }}
            onCancel={() => setActiveModal(null)}
          />
        </div>
      )}

      {/* 3. DUAL QR PASS STATION MODAL */}
      {activeModal === 'QR_PASS' && (
        <QRPassModal
          onClose={() => setActiveModal(null)}
          onLaunchCheckIn={(token) => {
            setCheckInToken(token);
            setActiveModal('CHECK_IN');
          }}
          onLaunchGeneralRegister={() => {
            setActiveModal('GENERAL_REGISTER');
          }}
        />
      )}

      {/* 4. WALK-IN VISITOR MODAL */}
      {activeModal === 'WALK_IN' && (
        <WalkInModal
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            fetchAllData();
          }}
        />
      )}

      {/* 5. CANDIDATE DOSSIER MODAL */}
      {activeModal === 'DOSSIER' && selectedCandidateId && (
        <CandidateDossierModal
          candidateId={selectedCandidateId}
          initialCandidate={candidates.find((c) => c.id === selectedCandidateId)}
          currentRole={currentRole}
          onClose={() => {
            setSelectedCandidateId('');
            setActiveModal(null);
          }}
          onCandidateUpdated={fetchAllData}
          onCandidateDeleted={() => {
            setSelectedCandidateId('');
            setActiveModal(null);
            fetchAllData();
          }}
          onAssignRoom={(candId, intvId) => {
            setSelectedCandidateId(candId);
            setSelectedInterview(intvId ? interviews.find((i) => i.id === intvId) || null : null);
            setActiveModal('ASSIGN_ROOM');
          }}
        />
      )}

      {/* 6. HR ASSIGN ROOM MODAL */}
      {activeModal === 'ASSIGN_ROOM' && selectedCandidateId && (
        <AssignRoomModal
          candidateId={selectedCandidateId}
          candidateName={
            candidates.find((c) => c.id === selectedCandidateId)?.fullName || 'Candidate'
          }
          interviewId={selectedInterview?.id}
          onClose={() => {
            setActiveModal(null);
            setSelectedInterview(null);
          }}
          onSuccess={() => {
            setActiveModal(null);
            setSelectedInterview(null);
            fetchAllData();
          }}
        />
      )}

      {/* 7. INTERVIEWER END INTERVIEW DECISION MODAL */}
      {activeModal === 'END_INTERVIEW' && selectedInterview && (
        <EndInterviewModal
          interviewId={selectedInterview.id}
          candidateName={selectedInterview.candidateName}
          interviewerName={selectedInterview.interviewerName}
          currentRound={selectedInterview.roundName}
          onClose={() => {
            setActiveModal(null);
            setSelectedInterview(null);
          }}
          onSuccess={() => {
            setActiveModal(null);
            setSelectedInterview(null);
            fetchAllData();
          }}
        />
      )}

      {/* 8. STAFF LOGIN MODAL (EMAIL + PASSWORD) */}
      {activeModal === 'STAFF_LOGIN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Staff Login</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            {loginSuccess && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <form onSubmit={handleStaffLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Staff Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. reception@whitecollarrealty.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveModal('FORGOT_PASSWORD')}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  Authenticate Staff Session
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] space-y-1.5">
                <p className="font-semibold text-slate-400">Quick Select Staff Role (Password: <span className="font-mono text-amber-400">wcr123</span>):</p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('lalit@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <span className="font-bold text-emerald-400 block">CEO Suite</span>
                    <span className="text-[9px] text-slate-500 font-mono truncate block">lalit@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('nisha@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <span className="font-bold text-amber-400 block">HR Lead</span>
                    <span className="text-[9px] text-slate-500 font-mono truncate block">nisha@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('kimmi@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <span className="font-bold text-amber-300 block">Kimmi Mam (Sr HR)</span>
                    <span className="text-[9px] text-slate-500 font-mono truncate block">kimmi@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('reception@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <span className="font-bold text-cyan-400 block">Reception Desk</span>
                    <span className="text-[9px] text-slate-500 font-mono truncate block">reception@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('pantry@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <span className="font-bold text-amber-200 block">Pantry Steward</span>
                    <span className="text-[9px] text-slate-500 font-mono truncate block">pantry@...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('sameer@whitecollarrealty.com');
                      setLoginPassword('wcr123');
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <span className="font-bold text-purple-400 block">Admin Ops</span>
                    <span className="text-[9px] text-slate-500 font-mono truncate block">sameer@...</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. FORGOT PASSWORD MODAL */}
      {activeModal === 'FORGOT_PASSWORD' && (
        <ForgotPasswordModal
          onClose={() => setActiveModal(null)}
          onNavigateToReset={(token) => {
            setActiveModal(null);
            window.history.pushState({}, '', `/reset-password?token=${encodeURIComponent(token)}`);
            setRoutePath('/reset-password');
          }}
        />
      )}
    </div>
  );
}
