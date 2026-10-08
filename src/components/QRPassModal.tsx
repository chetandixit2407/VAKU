import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
        color: { dark: '#0f172a', light: '#ffffff' },
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
        color: { dark: '#0f172a', light: '#ffffff' },
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

  const publicOrigin = getPublicAppOrigin();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
        <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative text-slate-100">
          <button
            onClick={() => setIsStandeeMode(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block">
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
              <div className="w-60 h-60 flex items-center justify-center text-slate-500 text-xs">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 text-[10px] block">Scan Target URL</span>
              <strong className="text-amber-400 font-mono text-xs break-all">{urlToShow}</strong>
            </div>
            <p className="text-[11px] text-slate-400">
              iPhone Camera • Google Lens • Android Camera • Standard QR Scanners
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
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#1a0f0a]/95 border border-[rgba(225,165,95,0.28)] rounded-3xl max-w-3xl w-full shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-[rgba(200,140,80,0.18)] flex items-center justify-between bg-[#140b07]/90">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-[#fdf6ed]">WCR QR Station & Intake Hub</h2>
            </div>
            <p className="text-xs text-[#a88d77] mt-0.5">
              Two distinct workflows: General Blank Registration for walk-ins & Scheduled Interview Passes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#a88d77] hover:text-white hover:bg-[#25150d] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Tab Selector */}
        <div className="p-3 bg-[#120a06] border-b border-[rgba(200,140,80,0.18)] flex gap-2">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'GENERAL'
                ? 'bg-gradient-to-r from-[#c98944] to-amber-600 text-slate-950 shadow-md'
                : 'text-[#a88d77] hover:text-[#fdf6ed] hover:bg-[#20120b]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>General New Candidate QR (Blank Registration)</span>
          </button>
          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'SCHEDULED'
                ? 'bg-gradient-to-r from-[#c98944] to-amber-600 text-slate-950 shadow-md'
                : 'text-[#a88d77] hover:text-[#fdf6ed] hover:bg-[#20120b]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Scheduled Interview QRs (Appointment Pass)</span>
          </button>
        </div>

        {/* WORKFLOW A: GENERAL NEW CANDIDATE QR */}
        {activeTab === 'GENERAL' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: QR Display */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#120a06] border border-[rgba(200,140,80,0.22)] rounded-2xl text-center space-y-4">
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
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                  Reception Standee QR
                </span>
                <h4 className="text-sm font-bold text-white pt-1">General New Candidate Intake</h4>
                <p className="text-[11px] text-[#a88d77]">
                  Every scan generates an isolated, 100% blank form.
                </p>

                <div className="mt-2 p-2 bg-[#1a0f0a] rounded-xl border border-[rgba(200,140,80,0.2)] text-[11px] text-slate-300 flex items-center justify-between gap-1 overflow-hidden">
                  <span className="truncate font-mono text-[10px] text-[#a88d77]">{generalScanUrl}</span>
                  <button
                    onClick={() => handleCopyUrl(generalScanUrl)}
                    className="p-1 text-amber-400 hover:text-amber-300 shrink-0 cursor-pointer"
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
                  className="w-full py-2 px-3 bg-[#1e110a] hover:bg-[#2c180e] border border-[rgba(200,140,80,0.22)] text-[#e8c89b] text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>View / Print Reception Wall Standee</span>
                </button>
              </div>
            </div>

            {/* Right: Technical Specifications */}
            <div className="space-y-4">
              <div className="p-4 bg-[#120a06] border border-[rgba(200,140,80,0.22)] rounded-2xl space-y-2.5 text-xs text-slate-300">
                <span className="font-bold text-[#fdf6ed] flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  General QR Architecture (Mandatory Spec)
                </span>
                <ul className="space-y-2 text-[11px] text-[#a88d77] list-disc pl-4">
                  <li>
                    <strong className="text-slate-200">Genuinely Blank Form:</strong> Name, phone, email, and address fields are initialized empty.
                  </li>
                  <li>
                    <strong className="text-slate-200">Never Uses "Latest Candidate":</strong> No prefill from prior registrations.
                  </li>
                  <li>
                    <strong className="text-slate-200">Unique Registration Session:</strong> Every scan creates an isolated session ID (<code className="text-amber-400">reg-sess-*</code>).
                  </li>
                  <li>
                    <strong className="text-slate-200">Simultaneous Scans:</strong> Candidate A, Candidate B, and Candidate C can scan at the exact same moment without interference.
                  </li>
                  <li>
                    <strong className="text-slate-200">Live WebRTC Camera:</strong> Candidates snap their real-time arrival photo on their device.
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-gradient-to-br from-[#382012]/60 to-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-2xl text-xs space-y-1">
                <span className="text-amber-400 font-bold block text-[11px]">Reception Desk Kiosk Tip:</span>
                <p className="text-[#c9b19e] text-[11px] leading-relaxed">
                  Display this QR on the reception counter tablet or print the acrylic standee. Walk-in applicants scan with iPhone Camera, Android Camera, or Google Lens to register instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW B: SCHEDULED INTERVIEW QRS */}
        {activeTab === 'SCHEDULED' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Scheduled QR */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#120a06] border border-[rgba(200,140,80,0.22)] rounded-2xl text-center space-y-4">
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
                      <code className="px-2.5 py-1 bg-[#1c100a] border border-[rgba(200,140,80,0.3)] rounded-lg text-amber-400 font-mono text-xs font-bold">
                        {selectedSession.token}
                      </code>
                      <button
                        onClick={() => handleCopy(selectedSession.token)}
                        className="p-1 text-[#a88d77] hover:text-white transition cursor-pointer"
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

                    <div className="mt-2 p-2 bg-[#1a0f0a] rounded-xl border border-[rgba(200,140,80,0.2)] text-[11px] text-slate-300 flex items-center justify-between gap-1 overflow-hidden">
                      <span className="truncate font-mono text-[10px] text-[#a88d77]">{scheduledScanUrl}</span>
                      <button
                        onClick={() => handleCopyUrl(scheduledScanUrl)}
                        className="p-1 text-amber-400 hover:text-amber-300 shrink-0 cursor-pointer"
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
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#c98944] to-amber-600 hover:from-[#db974e] hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open Scheduled Candidate Form</span>
                    </button>
                    <button
                      onClick={() => setIsStandeeMode(true)}
                      className="w-full py-2 px-3 bg-[#1e110a] hover:bg-[#2c180e] border border-[rgba(200,140,80,0.22)] text-[#e8c89b] text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print Candidate Pass</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#a88d77] py-12">No scheduled pass selected</div>
              )}
            </div>

            {/* Right: Scheduled Sessions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#e8c89b] uppercase tracking-wider">
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
                  className="p-3.5 bg-[#120a06] border border-[rgba(200,140,80,0.25)] rounded-2xl space-y-2.5 text-xs animate-in fade-in"
                >
                  <span className="font-bold text-amber-400 block">Issue New Scheduled Pass</span>
                  <div>
                    <label className="text-[10px] text-[#a88d77] block">Candidate Name</label>
                    <input
                      type="text"
                      value={newCandidateName}
                      onChange={(e) => setNewCandidateName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#1e110a] border border-[rgba(200,140,80,0.22)] rounded-lg text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#a88d77] block">Position</label>
                    <input
                      type="text"
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#1e110a] border border-[rgba(200,140,80,0.22)] rounded-lg text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#a88d77] block">Appointment Time</label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#1e110a] border border-[rgba(200,140,80,0.22)] rounded-lg text-white text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPassForm(false)}
                      className="px-2.5 py-1 text-[#a88d77] hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generating}
                      className="px-3 py-1 bg-gradient-to-r from-[#c98944] to-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
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
                            ? 'bg-[#3b2011] border-amber-500 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-[#120a06]/60 border-[rgba(200,140,80,0.18)] hover:border-[rgba(200,140,80,0.35)]'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{sess.candidateName}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#1a0f0a] text-amber-400 rounded-sm">
                              {sess.token}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#a88d77]">{sess.position}</p>
                          {sess.appointmentTime && (
                            <p className="text-[10px] text-[#7d6554]">Scheduled: {sess.appointmentTime}</p>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sess.status === 'SUBMITTED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
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
        <div className="p-4 border-t border-[rgba(200,140,80,0.18)] bg-[#140b07]/90 flex items-center justify-between text-xs">
          <span className="text-[#a88d77] text-[11px] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            HTTPS Production Compliant • Real device scanning ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#20120b] hover:bg-[#2c180e] text-[#fdf6ed] text-xs font-semibold rounded-xl border border-[rgba(200,140,80,0.2)] cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
