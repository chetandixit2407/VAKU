import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Sparkles,
  Smartphone,
  Printer,
  ShieldCheck,
  Calendar,
  User,
  Users,
  Building,
  UserPlus,
  CheckCircle2,
  Camera,
  Search,
  Upload,
  AlertCircle,
  Clock,
  DoorOpen,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { CheckInSession, Visitor } from '../types/index.ts';
import {
  getPublicAppOrigin,
  getCandidateRegistrationUrl,
  getCandidateCheckInUrl,
} from '../utils/publicOrigin.ts';
import { CONFIGURED_STAFF_HOSTS } from '../utils/registrationConfig.ts';

interface QRPassModalProps {
  onClose: () => void;
  onLaunchCheckIn: (token: string) => void;
  onLaunchGeneralRegister?: () => void;
  onLaunchPhotoCapture?: (candidateId: string) => void;
  onVisitorCheckInSuccess?: () => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  onClose,
  onLaunchCheckIn,
  onLaunchGeneralRegister,
  onLaunchPhotoCapture,
  onVisitorCheckInSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'SCANNER' | 'GENERAL' | 'SCHEDULED'>('SCANNER');
  const [sessions, setSessions] = useState<CheckInSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<CheckInSession | null>(null);
  const [generalQrDataUrl, setGeneralQrDataUrl] = useState<string>('');
  const [scheduledQrDataUrl, setScheduledQrDataUrl] = useState<string>('');
  const [isStandeeMode, setIsStandeeMode] = useState<boolean>(false);

  // Scheduled pass generation form
  const [showNewPassForm, setShowNewPassForm] = useState<boolean>(false);
  const [newCandidateName, setNewCandidateName] = useState<string>('Amit Trivedi');
  const [newPosition, setNewPosition] = useState<string>('Senior Investment Advisor');
  const [newDepartment, setNewDepartment] = useState<string>('Sales & Business Development');
  const [newTime, setNewTime] = useState<string>('03:00 PM');
  const [generating, setGenerating] = useState<boolean>(false);

  // Scanner States
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [scanningActive, setScanningActive] = useState<boolean>(false);
  const [scanLoading, setScanLoading] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    scanType: 'WALK_IN' | 'SCHEDULED_APPOINTMENT' | 'GENERAL_REGISTRATION';
    visitor?: any;
    candidate?: any;
    interview?: any;
    session?: any;
    alreadyVerified?: boolean;
    message?: string;
  } | null>(null);

  // Walk-in Registration Inside Scanner
  const [showWalkInForm, setShowWalkInForm] = useState<boolean>(false);
  const [walkinName, setWalkinName] = useState<string>('');
  const [walkinPhone, setWalkinPhone] = useState<string>('');
  const [walkinEmail, setWalkinEmail] = useState<string>('');
  const [walkinCompany, setWalkinCompany] = useState<string>('');
  const [walkinHostId, setWalkinHostId] = useState<string>(CONFIGURED_STAFF_HOSTS[1]?.id || '');
  const [walkinPurpose, setWalkinPurpose] = useState<string>('Commercial Property Investment Discussion');
  const [registeringWalkIn, setRegisteringWalkIn] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  useEffect(() => {
    fetchSessions();
    generateGeneralQR();

    return () => {
      stopCamera();
    };
  }, []);

  const generateGeneralQR = () => {
    const generalUrl = getCandidateRegistrationUrl();
    QRCode.toDataURL(
      generalUrl,
      {
        width: 340,
        margin: 2,
        color: { dark: '#07090c', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) setGeneralQrDataUrl(url);
      }
    );
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const qrRes = await fetch('/api/qr/WCR-APPT-901');
      const s1 = await qrRes.json();
      const qrRes2 = await fetch('/api/qr/WCR-APPT-902');
      const s2 = await qrRes2.json();

      const list: CheckInSession[] = [];
      if (s1.session) list.push(s1.session);
      if (s2.session) list.push(s2.session);

      setSessions(list);
      if (list.length > 0) setSelectedSession(list[0]);
    } catch (err) {
      console.error('Failed to load QR sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSession) return;
    const scanUrl = getCandidateCheckInUrl(selectedSession.token);

    QRCode.toDataURL(
      scanUrl,
      {
        width: 320,
        margin: 2,
        color: { dark: '#07090c', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) setScheduledQrDataUrl(url);
      }
    );
  }, [selectedSession]);

  // Start Camera Scanning
  const startCamera = async () => {
    setScanError(null);
    setScanResult(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          setScanningActive(true);
          requestAnimationFrame(scanVideoFrame);
        }
      } else {
        setScanError('Camera is not supported on this browser/device.');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setScanError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. You can manually enter the code or upload a QR image.'
          : 'Unable to access camera. Please enter the QR code below.'
      );
      setScanningActive(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanningActive(false);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      scanLoopRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        stopCamera();
        handleValidateCode(code.data);
        return;
      }
    }

    scanLoopRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleValidateCode(code.data);
          } else {
            setScanError('Could not detect a valid QR code in this image. Please try another image or enter the code manually.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleValidateCode = async (rawCode: string) => {
    if (!rawCode.trim()) return;

    setScanLoading(true);
    setScanError(null);

    try {
      const res = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: rawCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unrecognised or invalid QR code.');
      }

      setScanResult(data);
      if (onVisitorCheckInSuccess) {
        onVisitorCheckInSuccess();
      }
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan and retrieve visitor details.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinPhone.trim()) {
      setScanError('Name and mobile number are required for walk-in registration.');
      return;
    }

    const host = CONFIGURED_STAFF_HOSTS.find((h) => h.id === walkinHostId) || CONFIGURED_STAFF_HOSTS[0];

    setRegisteringWalkIn(true);
    setScanError(null);
    try {
      const res = await fetch('/api/walkin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: walkinName.trim(),
          phone: walkinPhone.trim(),
          email: walkinEmail.trim(),
          company: walkinCompany.trim(),
          visitorType: 'WALK_IN',
          hostName: host.name,
          hostDepartment: host.department,
          purpose: walkinPurpose.trim() || 'Walk-in Visit',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register walk-in visitor.');
      }

      setShowWalkInForm(false);
      // Auto display verified result
      setScanResult({
        scanType: 'WALK_IN',
        visitor: data.visitor || {
          fullName: walkinName.trim(),
          visitorType: 'WALK-IN',
          company: walkinCompany.trim() || 'Not Provided',
          hostName: host.name,
          hostDepartment: host.department,
          purpose: walkinPurpose.trim() || 'Official Business Meeting',
          roomAssigned: 'Pending Allocation',
          checkInTime: new Date().toISOString(),
          qrVerificationStatus: 'VERIFIED',
          status: 'CHECKED_IN',
        },
        message: 'Walk-in visitor successfully registered & verified.',
      });

      if (onVisitorCheckInSuccess) {
        onVisitorCheckInSuccess();
      }
    } catch (err: any) {
      setScanError(err.message || 'Registration failed');
    } finally {
      setRegisteringWalkIn(false);
    }
  };

  const handleCreateScheduledPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: newCandidateName,
          position: newPosition,
          department: newDepartment,
          appointmentTime: newTime,
          interviewerName: 'Nisha Verma',
          roundName: 'Round 1 - Technical Assessment',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => [data.session, ...prev]);
        setSelectedSession(data.session);
        setShowNewPassForm(false);
      }
    } catch (err) {
      console.error('Failed to generate pass', err);
    } finally {
      setGenerating(false);
    }
  };

  const generalScanUrl = getCandidateRegistrationUrl();
  const scheduledScanUrl = selectedSession ? getCandidateCheckInUrl(selectedSession.token) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="glass-panel-elevated rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-white/12 text-slate-100 max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                WCR QR Station & Visitor Intake Hub
              </h2>
              <p className="text-[11px] text-slate-400">
                Walk-In Visitor Identification &bull; Scheduled QR Verification &bull; Front Desk Standees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/6 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Tab Selector */}
        <div className="p-2.5 bg-black/30 border-b border-white/6 flex gap-2">
          <button
            onClick={() => {
              setActiveTab('SCANNER');
              setScanResult(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'SCANNER'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>QR Scanner & Visitor Intake</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('GENERAL');
              stopCamera();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'GENERAL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Blank Self-Registration Standee</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('SCHEDULED');
              stopCamera();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'SCHEDULED'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Scheduled Passes</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: QR SCANNER & VISITOR INTAKE WORKFLOW */}
          {activeTab === 'SCANNER' && (
            <div className="space-y-4">
              {/* Scan Error Banner */}
              {scanError && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Scanned Result Card */}
              {scanResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-[#0B0B0D] border border-amber-400/40 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                          Authoritative Record Identified
                        </span>
                        <h3 className="text-base font-bold text-white">
                          {scanResult.scanType === 'WALK_IN'
                            ? scanResult.visitor?.fullName || 'Walk-In Visitor'
                            : scanResult.candidate?.fullName || 'Scheduled Candidate'}
                        </h3>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {scanResult.scanType === 'WALK_IN' ? 'WALK-IN' : 'SCHEDULED APPOINTMENT'}
                    </span>
                  </div>

                  {/* WALK-IN DETAILS DISPLAY */}
                  {scanResult.scanType === 'WALK_IN' && scanResult.visitor && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8 space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Visitor Name:</span>
                          <strong className="text-white text-sm">{scanResult.visitor.fullName}</strong>
                        </div>

                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8 space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Visit Type:</span>
                          <strong className="text-amber-400 text-sm font-mono">WALK-IN</strong>
                        </div>

                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8 space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Company / Organization:</span>
                          <span className="text-white font-medium">{scanResult.visitor.company || 'Not Provided'}</span>
                        </div>

                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8 space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Person Being Visited (Host):</span>
                          <span className="text-white font-medium">
                            {scanResult.visitor.hostName || 'Not Provided'}{' '}
                            {scanResult.visitor.hostDepartment && `(${scanResult.visitor.hostDepartment})`}
                          </span>
                        </div>

                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8 space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Purpose of Visit:</span>
                          <span className="text-white font-medium">{scanResult.visitor.purpose || 'Not Provided'}</span>
                        </div>

                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8 space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Assigned Room / Cabin:</span>
                          <span className="text-amber-300 font-mono font-medium">
                            {scanResult.visitor.roomAssigned || 'Pending Room Allocation'}
                          </span>
                        </div>

                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8 space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Check-in Date & Time:</span>
                          <span className="text-white font-mono">
                            {new Date(scanResult.visitor.checkInTime).toLocaleString()}
                          </span>
                        </div>

                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8 space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">QR Verification Status:</span>
                          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {scanResult.visitor.qrVerificationStatus || 'VERIFIED'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center justify-between text-xs">
                        <span>Current Visit Status: <strong>{scanResult.visitor.status || 'CHECKED_IN'}</strong></span>
                        <span className="text-[11px] font-mono">Intake Dashboard Updated Automatically</span>
                      </div>
                    </div>
                  )}

                  {/* SCHEDULED APPOINTMENT DISPLAY */}
                  {scanResult.scanType === 'SCHEDULED_APPOINTMENT' && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8">
                          <span className="text-[10px] text-slate-400 block font-mono">Candidate:</span>
                          <strong className="text-white text-sm">
                            {scanResult.candidate?.fullName || scanResult.session?.candidateName || 'Applicant'}
                          </strong>
                        </div>
                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8">
                          <span className="text-[10px] text-slate-400 block font-mono">Applied Role:</span>
                          <strong className="text-white text-sm">
                            {scanResult.candidate?.position || scanResult.session?.position || 'Job Role'}
                          </strong>
                        </div>
                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8">
                          <span className="text-[10px] text-slate-400 block font-mono">Interview Time:</span>
                          <strong className="text-amber-400 font-mono">
                            {scanResult.candidate?.appointmentTime || scanResult.session?.appointmentTime || 'Today'}
                          </strong>
                        </div>
                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/8">
                          <span className="text-[10px] text-slate-400 block font-mono">Assigned Host:</span>
                          <strong className="text-white">
                            {scanResult.candidate?.assignedInterviewerName || scanResult.session?.interviewerName || 'Panel'}
                          </strong>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            if (scanResult.session?.token) {
                              onLaunchCheckIn(scanResult.session.token);
                            }
                          }}
                          className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Open Candidate Check-In</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scan Another Button */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Authoritative check-in logged & verified on server.
                    </span>
                    <button
                      onClick={() => {
                        setScanResult(null);
                        setManualCodeInput('');
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                    >
                      Scan Next Visitor
                    </button>
                  </div>
                </motion.div>
              ) : showWalkInForm ? (
                /* WALK-IN REGISTRATION FORM */
                <form onSubmit={handleRegisterWalkIn} className="space-y-4 text-xs p-5 bg-[#0B0B0D] rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      <span>Register & Check-In Walk-In Visitor</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowWalkInForm(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Back to Scanner
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Visitor Name <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={walkinName}
                        onChange={(e) => setWalkinName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Mobile Number <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={walkinPhone}
                        onChange={(e) => setWalkinPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={walkinCompany}
                        onChange={(e) => setWalkinCompany(e.target.value)}
                        placeholder="e.g. Apex Investments (Optional)"
                        className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Host To Meet</label>
                      <select
                        value={walkinHostId}
                        onChange={(e) => setWalkinHostId(e.target.value)}
                        className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
                      >
                        {CONFIGURED_STAFF_HOSTS.map((h) => (
                          <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                            {h.name} ({h.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Purpose of Visit</label>
                    <input
                      type="text"
                      value={walkinPurpose}
                      onChange={(e) => setWalkinPurpose(e.target.value)}
                      placeholder="e.g. Commercial Property Investment Consultation"
                      className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowWalkInForm(false)}
                      className="px-4 py-2 bg-white/6 hover:bg-white/10 text-slate-300 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registeringWalkIn}
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow disabled:opacity-50"
                    >
                      {registeringWalkIn ? 'Registering...' : 'Register & Verify Walk-In'}
                    </button>
                  </div>
                </form>
              ) : (
                /* LIVE SCANNER & INPUT INTERFACE */
                <div className="space-y-4">
                  {/* Camera Video Feed */}
                  <div className="p-5 rounded-2xl bg-[#0B0B0D] border border-white/10 text-center space-y-3">
                    <div className="relative max-w-sm mx-auto h-56 rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
                      {scanningActive ? (
                        <>
                          <video ref={videoRef} className="w-full h-full object-cover" />
                          <div className="absolute inset-8 border-2 border-amber-400/80 rounded-2xl pointer-events-none animate-pulse">
                            <div className="w-full h-0.5 bg-amber-400 animate-bounce" />
                          </div>
                        </>
                      ) : (
                        <div className="p-6 text-center space-y-2">
                          <Camera className="w-8 h-8 text-amber-400/60 mx-auto" />
                          <p className="text-xs text-slate-300 font-semibold">Webcam / Mobile Camera Scanner</p>
                          <p className="text-[11px] text-slate-500">
                            Point camera at visitor pass or scan digital QR on mobile screen
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center pt-1">
                      {scanningActive ? (
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Stop Camera
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Start Camera Scan</span>
                        </button>
                      )}

                      <label className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload QR Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowWalkInForm(true)}
                        className="px-4 py-2 bg-white/6 hover:bg-white/10 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Register Walk-in</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual Pass Code Input Box */}
                  <div className="p-4 rounded-2xl bg-[#0B0B0D] border border-white/10 space-y-2 text-xs">
                    <label className="block text-slate-300 font-semibold">
                      Manual Pass Code or Barcode Scanner Input
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={manualCodeInput}
                          onChange={(e) => setManualCodeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleValidateCode(manualCodeInput);
                            }
                          }}
                          placeholder="e.g. WCR-APPT-901, WCR-WALK-..., or scan barcode"
                          className="w-full pl-9 pr-3 py-2 glass-input rounded-xl text-white text-xs font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleValidateCode(manualCodeInput)}
                        disabled={scanLoading || !manualCodeInput.trim()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                      >
                        {scanLoading ? 'Checking...' : 'Verify Pass'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Supports USB barcode scanner guns, keyboard typing, and candidate appointment tokens.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BLANK CANDIDATE SELF-REGISTRATION STANDEE */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block font-mono">
                      Reception Standee
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      Blank Self-Registration Standee
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Display this QR on reception tablet standees. Arriving walk-in candidates scan with their mobile camera to open an isolated blank self-registration form.
                  </p>
                  <div className="p-3 bg-white/[0.03] border border-white/8 rounded-xl space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <strong>Device-Independent:</strong> Works on all iOS & Android cameras.
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <strong>Concurrent Safe:</strong> 10+ candidates can scan simultaneously.
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        if (onLaunchGeneralRegister) onLaunchGeneralRegister();
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Blank Form Directly</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl shadow-xl border-4 border-amber-500 text-center space-y-2 max-w-xs mx-auto">
                  {generalQrDataUrl ? (
                    <img src={generalQrDataUrl} alt="WCR QR" className="w-48 h-48 mx-auto object-contain" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs font-mono">
                      Generating QR...
                    </div>
                  )}
                  <p className="text-[10px] text-slate-700 font-mono font-bold">
                    Scan with Mobile Camera to Register
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULED PASSES */}
          {activeTab === 'SCHEDULED' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/8">
                <div>
                  <h3 className="text-sm font-bold text-white">Scheduled Candidate Passes</h3>
                  <p className="text-[11px] text-slate-400">Pre-generated passes for scheduled interview panel</p>
                </div>
                <button
                  onClick={() => setShowNewPassForm(!showNewPassForm)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Scheduled Pass</span>
                </button>
              </div>

              {showNewPassForm && (
                <form onSubmit={handleCreateScheduledPass} className="p-4 bg-white/[0.03] rounded-2xl border border-white/10 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Candidate Name</label>
                      <input
                        type="text"
                        value={newCandidateName}
                        onChange={(e) => setNewCandidateName(e.target.value)}
                        className="w-full p-2 glass-input rounded-xl text-white text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Position</label>
                      <input
                        type="text"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        className="w-full p-2 glass-input rounded-xl text-white text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPassForm(false)}
                      className="px-3 py-1.5 bg-white/6 hover:bg-white/10 text-slate-300 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generating}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                    >
                      {generating ? 'Generating...' : 'Issue Pass'}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`p-4 rounded-2xl border text-xs space-y-2 cursor-pointer transition ${
                      selectedSession?.id === s.id
                        ? 'bg-amber-500/15 border-amber-400 text-white'
                        : 'bg-[#0B0B0D] border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-white text-sm">{s.candidateName}</strong>
                      <span className="font-mono text-amber-400 font-bold">{s.token}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{s.position} &bull; {s.appointmentTime}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-white/6 text-[10px] text-slate-500">
                      <span>Interviewer: {s.interviewerName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLaunchCheckIn(s.token);
                        }}
                        className="text-amber-400 hover:underline font-bold"
                      >
                        Launch Check-In &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
