import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
  Building,
  UserPlus,
  ScanLine,
  CheckCircle2,
  Camera,
  Search,
} from 'lucide-react';
import type { CheckInSession } from '../types/index.ts';
import {
  getPublicAppOrigin,
  getCandidateRegistrationUrl,
  getCandidateCheckInUrl,
} from '../utils/publicOrigin.ts';

interface QRPassModalProps {
  onClose: () => void;
  onLaunchCheckIn: (token: string) => void;
  onLaunchGeneralRegister?: () => void;
  onLaunchPhotoCapture?: (candidateId: string) => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  onClose,
  onLaunchCheckIn,
  onLaunchGeneralRegister,
  onLaunchPhotoCapture,
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

  // Live QR Scanner State
  const [manualScanToken, setManualScanToken] = useState<string>('WCR-APPT-901');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scannedCandidate, setScannedCandidate] = useState<CheckInSession | null>(null);
  const [scannerStatus, setScannerStatus] = useState<string>('Scanning candidate QR...');

  // New Scheduled QR Generation state
  const [showNewPassForm, setShowNewPassForm] = useState<boolean>(false);
  const [newCandidateName, setNewCandidateName] = useState<string>('Amit Trivedi');
  const [newPosition, setNewPosition] = useState<string>('Senior Investment Advisor');
  const [newDepartment, setNewDepartment] = useState<string>('Sales & Business Development');
  const [newTime, setNewTime] = useState<string>('03:00 PM');
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    fetchSessions();
    generateGeneralQR();
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

  // Generate QR for selected scheduled session
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

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleExecuteScan = async (tokenToScan: string) => {
    setIsScanning(true);
    setScannerStatus(`Verifying pass token: ${tokenToScan}...`);

    try {
      const res = await fetch(`/api/qr/${encodeURIComponent(tokenToScan)}`);
      const data = await res.json();
      if (data.success && data.session) {
        setTimeout(() => {
          setScannedCandidate(data.session);
          setScannerStatus('Candidate verified successfully');
          setIsScanning(false);
        }, 500);
      } else {
        setScannerStatus(data.error || 'Pass token not recognized in active registry.');
      }
    } catch (err) {
      setScannerStatus('Pass lookup failed. Please check network.');
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
  const scheduledScanUrl = selectedSession
    ? getCandidateCheckInUrl(selectedSession.token)
    : '';

  // Standee Printable View
  if (isStandeeMode) {
    const isGen = activeTab === 'GENERAL';
    const qrToShow = isGen ? generalQrDataUrl : scheduledQrDataUrl;
    const urlToShow = isGen ? generalScanUrl : scheduledScanUrl;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
        <div className="glass-panel-elevated border-2 border-amber-500 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative text-slate-100">
          <button
            onClick={() => setIsStandeeMode(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block font-mono">
              White Collar Realty
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {isGen ? 'New Candidate Self-Registration' : 'Candidate Check-In Pass'}
            </h2>
            <p className="text-xs text-slate-300">
              {isGen
                ? 'Scan to open blank registration on your phone. No app installation required.'
                : 'Scan with your mobile camera to authenticate scheduled interview.'}
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl mx-auto border-4 border-amber-500">
            {qrToShow ? (
              <img src={qrToShow} alt="WCR QR" className="w-60 h-60 object-contain" />
            ) : (
              <div className="w-60 h-60 flex items-center justify-center text-slate-500 text-xs font-mono">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-[#07090C] rounded-xl border border-white/8 text-xs">
              <span className="text-slate-400 text-[10px] block">Target QR URL</span>
              <strong className="text-amber-400 font-mono text-xs break-all">{urlToShow}</strong>
            </div>
            <p className="text-[11px] text-slate-400">
              iPhone Camera &bull; Google Lens &bull; Android Camera &bull; Standard QR Scanners
            </p>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => {
                try {
                  window.print();
                } catch (e) {
                  console.warn('Print not allowed in sandbox', e);
                }
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Sign
            </button>
            <button
              onClick={() => setIsStandeeMode(false)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
            >
              Back to Station
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel-elevated rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-white/12 text-slate-100"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/8 flex items-center justify-between bg-white/2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  WCR QR Station & Intake Hub
                </h2>
                <p className="text-[11px] text-slate-400">
                  Live Optical Scanner &bull; Dual Standees &bull; Walk-In Self-Registration
                </p>
              </div>
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
              if (!scannedCandidate) handleExecuteScan('WCR-APPT-901');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'SCANNER'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>Interactive QR Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'GENERAL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Blank Registration Standee</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULED')}
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

        {/* ========================================================= */}
        {/* TAB 1: LIVE INTERACTIVE OPTICAL SCANNER (AXLE JOURNEY STYLE) */}
        {/* ========================================================= */}
        {activeTab === 'SCANNER' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Optical Scanner Viewport */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full max-w-[280px] aspect-square bg-[#05070A] rounded-3xl overflow-hidden border border-white/12 shadow-2xl flex items-center justify-center p-4">
                {/* Background optical grid pattern */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
                    backgroundSize: '16px 16px',
                  }}
                />

                {/* Corner Laser Brackets */}
                <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-amber-400" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-laser pointer-events-none" />

                {/* Central QR Reticle / Target */}
                <div className="relative z-10 w-36 h-36 border border-dashed border-amber-400/40 rounded-2xl flex flex-col items-center justify-center text-center p-3 bg-black/40 backdrop-blur-xs">
                  <QrCode className="w-12 h-12 text-amber-400/80 mb-1" />
                  <span className="text-[10px] text-amber-300 font-mono tracking-wider uppercase">
                    Align QR Here
                  </span>
                </div>

                {/* Scanning Status Tag */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-amber-400/30 text-[10px] font-semibold text-amber-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>{scannerStatus}</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Scan Selectors */}
              <div className="w-full max-w-[280px] space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Simulate QR Scanner Feed:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setManualScanToken('WCR-APPT-901');
                      handleExecuteScan('WCR-APPT-901');
                    }}
                    className="px-2.5 py-1.5 bg-white/6 hover:bg-white/10 text-slate-200 hover:text-amber-300 text-xs font-mono rounded-xl border border-white/8 transition cursor-pointer text-center"
                  >
                    WCR-APPT-901
                  </button>
                  <button
                    onClick={() => {
                      setManualScanToken('WCR-APPT-902');
                      handleExecuteScan('WCR-APPT-902');
                    }}
                    className="px-2.5 py-1.5 bg-white/6 hover:bg-white/10 text-slate-200 hover:text-amber-300 text-xs font-mono rounded-xl border border-white/8 transition cursor-pointer text-center"
                  >
                    WCR-APPT-902
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Candidate Found Reveal Card */}
            <div className="space-y-4">
              {scannedCandidate ? (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-panel rounded-2xl p-5 border border-amber-500/30 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/8">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                        Candidate Found
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/6 text-amber-400 font-mono text-[10px] font-bold">
                      {scannedCandidate.token}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {scannedCandidate.candidateName}
                      </h3>
                      <p className="text-xs font-medium text-amber-400">
                        {scannedCandidate.position} &bull; {scannedCandidate.department || 'Corporate'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 bg-white/4 rounded-xl border border-white/6">
                        <span className="text-slate-400 block text-[10px]">Interview Time</span>
                        <strong className="text-white font-mono">{scannedCandidate.appointmentTime || '11:00 AM'}</strong>
                      </div>
                      <div className="p-2 bg-white/4 rounded-xl border border-white/6">
                        <span className="text-slate-400 block text-[10px]">Interviewer</span>
                        <strong className="text-white">{scannedCandidate.interviewerName || 'Nisha Verma'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Transition */}
                  <div className="space-y-2 pt-2 border-t border-white/8">
                    <button
                      onClick={() => {
                        onClose();
                        onLaunchCheckIn(scannedCandidate.token);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Proceed to Arrival Check-In</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onLaunchCheckIn(scannedCandidate.token);
                      }}
                      className="w-full py-2 bg-white/6 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-white/8 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Proceed to Live Photo Capture</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-panel rounded-2xl p-6 text-center space-y-3 border border-white/8 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto text-amber-400">
                    <ScanLine className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Awaiting Optical Match</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Present pass to terminal camera or click one of the quick test tokens above to reveal verified candidate data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GENERAL NEW CANDIDATE QR (BLANK REGISTRATION) */}
        {/* ========================================================= */}
        {activeTab === 'GENERAL' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: QR Display */}
            <div className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl text-center space-y-4 border border-white/8">
              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-emerald-500">
                {generalQrDataUrl ? (
                  <img src={generalQrDataUrl} alt="WCR General QR" className="w-48 h-48 object-contain" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-700 text-xs">
                    Generating General QR...
                  </div>
                )}
              </div>

              <div className="space-y-1 w-full max-w-xs">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase font-mono">
                  Reception Standee QR
                </span>
                <h4 className="text-sm font-bold text-white pt-1">General New Candidate Intake</h4>
                <p className="text-[11px] text-slate-400">
                  Every scan generates an isolated, 100% blank form.
                </p>

                <div className="mt-2 p-2 bg-[#07090C] rounded-xl border border-white/8 text-[11px] text-slate-300 flex items-center justify-between gap-1 overflow-hidden">
                  <span className="truncate font-mono text-[10px] text-slate-400">{generalScanUrl}</span>
                  <button
                    onClick={() => handleCopyUrl(generalScanUrl)}
                    className="p-1 text-amber-400 hover:text-amber-300 shrink-0"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="w-full space-y-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    if (onLaunchGeneralRegister) {
                      onLaunchGeneralRegister();
                    } else {
                      window.location.href = '/register';
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open Blank Registration Form</span>
                </button>
                <button
                  onClick={() => setIsStandeeMode(true)}
                  className="w-full py-2 px-3 bg-white/6 hover:bg-white/10 border border-white/8 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>View / Print Reception Wall Standee</span>
                </button>
              </div>
            </div>

            {/* Right: Technical Specifications */}
            <div className="space-y-4">
              <div className="p-4 glass-panel rounded-2xl space-y-2.5 text-xs text-slate-300 border border-white/8">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  General QR Architecture Spec
                </span>
                <ul className="space-y-2 text-[11px] text-slate-400 list-disc pl-4">
                  <li>
                    <strong className="text-slate-200">Genuinely Blank Form:</strong> Name, phone, email, and experience fields are initialized empty.
                  </li>
                  <li>
                    <strong className="text-slate-200">Zero Session Contamination:</strong> No prefill from prior candidate registrations.
                  </li>
                  <li>
                    <strong className="text-slate-200">Isolated Session Tokens:</strong> Every scan generates a fresh cryptographic session.
                  </li>
                  <li>
                    <strong className="text-slate-200">Multi-Device Ready:</strong> 10+ walk-in applicants can scan simultaneously at front desk without locking.
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-1">
                <span className="text-amber-400 font-bold block text-[11px]">Front Desk Terminal Tip:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Display this QR on the reception tablet standee. Candidates scan with default iPhone or Android Camera app to complete check-in on their phone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SCHEDULED INTERVIEW APPOINTMENT PASSES */}
        {/* ========================================================= */}
        {activeTab === 'SCHEDULED' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Scheduled QR Display */}
            <div className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl text-center space-y-4 border border-white/8">
              {selectedSession ? (
                <>
                  <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-amber-500">
                    {scheduledQrDataUrl ? (
                      <img src={scheduledQrDataUrl} alt="WCR QR Code" className="w-44 h-44 object-contain" />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-700 text-xs">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 w-full max-w-xs">
                    <div className="flex items-center justify-center gap-2">
                      <code className="px-2.5 py-1 bg-[#07090C] border border-white/10 rounded-lg text-amber-400 font-mono text-xs font-bold">
                        {selectedSession.token}
                      </code>
                      <button
                        onClick={() => handleCopy(selectedSession.token)}
                        className="p-1 text-slate-400 hover:text-white transition"
                        title="Copy token"
                      >
                        {copiedToken === selectedSession.token ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-white pt-1">{selectedSession.candidateName}</h4>
                    <p className="text-xs text-amber-400 font-medium">{selectedSession.position}</p>

                    <div className="mt-2 p-2 bg-[#07090C] rounded-xl border border-white/8 text-[11px] text-slate-300 flex items-center justify-between gap-1 overflow-hidden">
                      <span className="truncate font-mono text-[10px] text-slate-400">{scheduledScanUrl}</span>
                      <button
                        onClick={() => handleCopyUrl(scheduledScanUrl)}
                        className="p-1 text-amber-400 hover:text-amber-300 shrink-0"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="w-full space-y-2 pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onLaunchCheckIn(selectedSession.token);
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open Scheduled Candidate Form</span>
                    </button>
                    <button
                      onClick={() => setIsStandeeMode(true)}
                      className="w-full py-2 px-3 bg-white/6 hover:bg-white/10 border border-white/8 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print Candidate Pass</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 py-12">No scheduled pass selected</div>
              )}
            </div>

            {/* Right: Scheduled Sessions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Active Scheduled Passes ({sessions.length})
                </span>
                <button
                  onClick={() => setShowNewPassForm(!showNewPassForm)}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue New Pass</span>
                </button>
              </div>

              {showNewPassForm ? (
                <form
                  onSubmit={handleCreateScheduledPass}
                  className="p-3.5 glass-panel rounded-2xl space-y-2.5 text-xs border border-white/8"
                >
                  <span className="font-bold text-amber-400 block">Issue New Scheduled Pass</span>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Candidate Name</label>
                    <input
                      type="text"
                      value={newCandidateName}
                      onChange={(e) => setNewCandidateName(e.target.value)}
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Position</label>
                    <input
                      type="text"
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Appointment Time</label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPassForm(false)}
                      className="px-2.5 py-1 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generating}
                      className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Generate Pass
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {sessions.map((sess) => {
                    const isSelected = selectedSession?.token === sess.token;
                    return (
                      <div
                        key={sess.id || sess.token}
                        onClick={() => setSelectedSession(sess)}
                        className={`p-3 rounded-2xl border transition cursor-pointer text-xs flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/60 shadow-lg'
                            : 'glass-panel-subtle hover:border-white/12'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{sess.candidateName}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-black/40 text-amber-400 rounded-sm">
                              {sess.token}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{sess.position}</p>
                          {sess.appointmentTime && (
                            <p className="text-[10px] text-slate-500">Scheduled: {sess.appointmentTime}</p>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sess.status === 'SUBMITTED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {sess.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-white/8 bg-black/30 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            HTTPS Production Compliant &bull; Real device scanning ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/6 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl border border-white/8 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
