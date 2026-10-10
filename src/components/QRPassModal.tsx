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
  Users,
  Building,
  UserPlus,
  CheckCircle2,
  Clock,
  DoorOpen,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { CheckInSession } from '../types/index.ts';
import {
  getCandidateRegistrationUrl,
  getCandidateCheckInUrl,
} from '../utils/publicOrigin.ts';

interface QRPassModalProps {
  onClose: () => void;
  onLaunchCheckIn: (token: string) => void;
  onLaunchGeneralRegister?: () => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  onClose,
  onLaunchCheckIn,
  onLaunchGeneralRegister,
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SCHEDULED'>('GENERAL');
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
                WCR QR Station & Reception Standees
              </h2>
              <p className="text-[11px] text-slate-400">
                Front Desk Blank Self-Registration Standee &bull; Scheduled Candidate Passes
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
            onClick={() => setActiveTab('GENERAL')}
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

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: BLANK CANDIDATE SELF-REGISTRATION STANDEE */}
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

          {/* TAB 2: SCHEDULED PASSES */}
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

