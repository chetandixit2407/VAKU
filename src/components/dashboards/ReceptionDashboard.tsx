import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building,
  UserCheck,
  LogOut,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Sparkles,
  QrCode,
  ArrowRight,
  Camera,
  ShieldCheck,
  FileText,
  Eye,
  AlertTriangle,
  User,
  Search,
  MessageSquare,
  Building2,
  ChevronDown,
  Layers,
  ChevronRight,
  EyeOff,
} from 'lucide-react';
import type { Candidate, Room, Visitor, ActionTask } from '../../types/index.ts';
import { ReceptionPhotoModal } from '../ReceptionPhotoModal.tsx';
import { CandidateDossierModal } from '../CandidateDossierModal.tsx';
import { VisitorArrivalTimeline } from '../VisitorArrivalTimeline.tsx';

interface ReceptionDashboardProps {
  candidates: Candidate[];
  rooms: Room[];
  visitors: Visitor[];
  actionTasks?: ActionTask[];
  onAcknowledgeTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onCheckout: (candidateId: string) => void;
  onOpenCheckIn: () => void;
  onOpenWalkIn: () => void;
  onOpenQR: () => void;
  onOpenChat?: () => void;
  onOpenChatWithContext?: (options: {
    candidateId?: string;
    roomId?: string;
    channelId?: string;
    recipientId?: string;
    initialMessage?: string;
  }) => void;
  onRefresh?: () => void;
  onOpenMore?: (section?: 'all' | 'lounge' | 'meetings' | 'checkout') => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  candidates,
  rooms,
  visitors,
  actionTasks = [],
  onAcknowledgeTask,
  onCompleteTask,
  onCheckout,
  onOpenCheckIn,
  onOpenWalkIn,
  onOpenQR,
  onOpenChat,
  onOpenChatWithContext,
  onRefresh,
  onOpenMore,
}) => {
  const [selectedPhotoCandidate, setSelectedPhotoCandidate] = useState<Candidate | null>(null);
  const [selectedProfileCandidateId, setSelectedProfileCandidateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WAITING' | 'IN_MEETING' | 'CHECKOUT' | 'WALK_IN' | 'PRIORITY'>('ALL');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showSecondarySections, setShowSecondarySections] = useState(false);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreMenuOpen]);

  // Filter reception-targeted actionable alert tasks
  const receptionTasks = actionTasks.filter(
    (t) => (t.targetRole === 'RECEPTION' || t.taskType === 'ESCORT_CANDIDATE') && t.status !== 'DISMISSED'
  );

  // Real-time EventSource listener for instant reception updates
  useEffect(() => {
    const es = new EventSource('/api/events?role=RECEPTION');
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === 'CANDIDATE_FORM_SUBMITTED' ||
          data.type === 'CANDIDATE_ARRIVED' ||
          data.type === 'CANDIDATE_LIVE_PHOTO_CAPTURED' ||
          data.type === 'ROOM_ASSIGNED' ||
          data.type === 'INTERVIEW_COMPLETED' ||
          data.type === 'CANDIDATE_CHECKED_OUT'
        ) {
          if (onRefresh) onRefresh();
        }
      } catch (err) {
        console.error('Reception SSE error', err);
      }
    };

    return () => {
      es.close();
    };
  }, [onRefresh]);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeFilter === 'WAITING') return c.status === 'ARRIVED' || c.status === 'WAITING';
    if (activeFilter === 'IN_MEETING') return c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED';
    if (activeFilter === 'CHECKOUT')
      return c.status === 'COMPLETED' || c.status === 'OFFERED' || c.status === 'REJECTED';
    if (activeFilter === 'WALK_IN')
      return (c as any).registrationSource === 'WALK_IN' || (c as any).isWalkIn;
    if (activeFilter === 'PRIORITY')
      return c.status === 'ARRIVED' || (c as any).isPriority;
    return c.status !== 'CHECKED_OUT';
  });

  const activeCandidates = candidates.filter(
    (c) => c.status !== 'CHECKED_OUT' && c.status !== 'SCHEDULED'
  );
  const waitingCandidates = candidates.filter(
    (c) => c.status === 'ARRIVED' || c.status === 'WAITING'
  );
  const roomAssignedCandidates = candidates.filter((c) => c.status === 'ROOM_ASSIGNED');
  const readyForCheckout = candidates.filter(
    (c) => c.status === 'COMPLETED' || c.status === 'OFFERED' || c.status === 'REJECTED'
  );
  const walkInCandidates = candidates.filter(
    (c) => ((c as any).registrationSource === 'WALK_IN' || (c as any).isWalkIn) && c.status !== 'CHECKED_OUT'
  );
  const priorityCandidates = candidates.filter(
    (c) => (c.status === 'ARRIVED' || (c as any).isPriority) && c.status !== 'CHECKED_OUT'
  );

  return (
    <div className="space-y-6">
      {/* Front Desk Bar */}
      <div className="p-6 card-dark bg-[#0B0B0D] text-white rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Front Desk Reception & Escort Terminal
            </h1>
          </div>
          <p className="text-xs text-[#E0E0E0] mt-1">
            Real-time candidate intake, visitor timeline verification, live desk photo capture, and physical checkout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenWalkIn}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Intake Walk-in / Client</span>
          </button>
          <button
            onClick={onOpenQR}
            className="px-3.5 py-2 bg-white/6 hover:bg-white/10 text-slate-200 font-semibold text-xs rounded-xl border border-white/8 transition flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Reception QR Standees</span>
          </button>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
              title="Open Internal Office Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Office Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* 🚨 PROMINENT REAL-TIME ACTION ALERTS & ESCORT TASK CARDS */}
      {receptionTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 glass-panel-elevated rounded-3xl space-y-3 border border-amber-500/40 shadow-2xl shadow-amber-500/10"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
              <div>
                <h2 className="text-sm font-black text-amber-300 tracking-wide uppercase flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Immediate Action Tasks & Escort Alerts ({receptionTasks.length})</span>
                </h2>
                <p className="text-[11px] text-slate-300">
                  Real-time operational candidate escort instructions synchronized directly from HR & Office Chat.
                </p>
              </div>
            </div>

            {onOpenChatWithContext && (
              <button
                onClick={() =>
                  onOpenChatWithContext({
                    channelId: 'reception',
                    initialMessage: 'Reception acknowledged: Escorting candidate now.',
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Reception Chat</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-1">
            {receptionTasks.map((task) => {
              const isPending = task.status === 'PENDING';
              const isAcknowledged = task.status === 'ACKNOWLEDGED' || task.status === 'IN_PROGRESS';
              const isCompleted = task.status === 'COMPLETED';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition shadow-lg relative flex flex-col justify-between ${
                    isPending
                      ? 'glass-panel border-amber-400/80 ring-2 ring-amber-500/20'
                      : isAcknowledged
                      ? 'glass-panel border-sky-400/70 ring-1 ring-sky-500/20'
                      : 'glass-panel-subtle border-emerald-500/40 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/8">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs border border-amber-500/30 shrink-0">
                        {task.senderName ? task.senderName.substring(0, 2).toUpperCase() : 'HR'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{task.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/6 text-amber-400 border border-white/8">
                            {task.senderRole}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 animate-pulse font-mono">
                          <AlertCircle className="w-3 h-3" />
                          PENDING
                        </span>
                      )}
                      {isAcknowledged && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-sky-400" />
                          ESCORTING
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          COMPLETED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-3 space-y-2">
                    <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
                      {task.title || `Bring ${task.candidateName || 'Candidate'} to ${task.destinationRoomName || 'Room'}`}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#25272B] card-inner inner-box border border-white/10">
                        <span className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-wider block">
                          Candidate
                        </span>
                        <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">
                          {task.candidateName || 'Candidate'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#25272B] card-inner inner-box border border-white/10">
                        <span className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-wider block">
                          Destination Room
                        </span>
                        <span className="text-xs font-bold text-emerald-400 truncate block mt-0.5">
                          {task.destinationRoomName || 'Room'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/8 flex items-center justify-between gap-2">
                    {onOpenChatWithContext && (
                      <button
                        onClick={() =>
                          onOpenChatWithContext({
                            candidateId: task.candidateId,
                            roomId: task.destinationRoomId,
                            channelId: 'reception',
                            initialMessage: `Reception alert response: Regarding ${task.candidateName || 'candidate'}, escort in progress.`,
                          })
                        }
                        className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat Thread &rarr;</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {isPending && onAcknowledgeTask && (
                        <button
                          onClick={() => onAcknowledgeTask(task.id)}
                          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
                        >
                          Acknowledge Escort
                        </button>
                      )}
                      {(isPending || isAcknowledged) && onCompleteTask && (
                        <button
                          onClick={() => onCompleteTask(task.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Arrived in Room</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-2.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border ${
              activeFilter === 'ALL'
                ? 'is-active bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 border-amber-400 font-black'
                : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-white hover:text-black hover:border-black/20'
            }`}
          >
            All Active ({activeCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('WAITING')}
            className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border ${
              activeFilter === 'WAITING'
                ? 'is-active bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 border-amber-400 font-black'
                : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-white hover:text-black hover:border-black/20'
            }`}
          >
            Waiting Lounge ({waitingCandidates.length})
          </button>
          {/* Primary Tab 3: In Meetings */}
          <button
            onClick={() => setActiveFilter('IN_MEETING')}
            className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border ${
              activeFilter === 'IN_MEETING'
                ? 'is-active bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 border-amber-400 font-black'
                : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-white hover:text-black hover:border-black/20'
            }`}
          >
            In Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED').length})
          </button>

          {/* More Menu Dropdown Anchor */}
          <div className="relative shrink-0" ref={moreMenuRef}>
            {(() => {
              const isMoreActive = activeFilter === 'CHECKOUT' || activeFilter === 'WALK_IN' || activeFilter === 'PRIORITY';
              const activeMoreLabel =
                activeFilter === 'CHECKOUT'
                  ? `Ready Checkout (${readyForCheckout.length})`
                  : activeFilter === 'WALK_IN'
                  ? `Walk-Ins (${walkInCandidates.length})`
                  : activeFilter === 'PRIORITY'
                  ? `Priority (${priorityCandidates.length})`
                  : null;

              return (
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                  aria-expanded={isMoreMenuOpen}
                  aria-haspopup="true"
                  className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                    isMoreActive
                      ? 'is-active bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 border-amber-400 font-black'
                      : isMoreMenuOpen
                      ? 'bg-white text-black border-black/20'
                      : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-white hover:text-black hover:border-black/20'
                  }`}
                >
                  <span>{isMoreActive ? `More: ${activeMoreLabel}` : 'More'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMoreMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              );
            })()}

            {/* Dropdown Panel */}
            {isMoreMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-60 bg-[#0B0B0D] border border-white/20 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="text-[10px] font-bold text-white/50 px-2.5 py-1 uppercase tracking-wider">
                  Additional Reception Filters
                </div>

                {/* Ready Checkout */}
                <button
                  role="menuitem"
                  onClick={() => {
                    setActiveFilter('CHECKOUT');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                    activeFilter === 'CHECKOUT'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>Ready Checkout</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                    {readyForCheckout.length}
                  </span>
                </button>

                {/* Walk-In Candidates */}
                <button
                  role="menuitem"
                  onClick={() => {
                    setActiveFilter('WALK_IN');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                    activeFilter === 'WALK_IN'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>Walk-In Candidates</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                    {walkInCandidates.length}
                  </span>
                </button>

                {/* Priority / Immediate Arrivals */}
                <button
                  role="menuitem"
                  onClick={() => {
                    setActiveFilter('PRIORITY');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                    activeFilter === 'PRIORITY'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>Priority Arrivals</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                    {priorityCandidates.length}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates / mobile..."
            className="wcr-search-input w-full pl-8 pr-3 py-1.5 bg-[#111317] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
          />
        </div>
      </div>

      {/* Secondary Dashboard Sections Summary Banner (Hidden by default, accessible via More) */}
      <div className="p-4 bg-[#0B0B0D] card-dark rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Secondary Dashboard Sections</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white/70">
                Hidden by Default
              </span>
            </div>
            <p className="text-white/60 text-[11px] mt-0.5">
              Lounge Waiting Area, In Active Meetings, and Physical Check-Out terminal are preserved behind More navigation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (onOpenMore) onOpenMore('lounge');
              else setShowSecondarySections(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            title="Open Lounge Waiting Area"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Lounge ({waitingCandidates.length})</span>
          </button>
          <button
            onClick={() => {
              if (onOpenMore) onOpenMore('meetings');
              else setShowSecondarySections(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            title="Open In Active Meetings"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED').length})</span>
          </button>
          <button
            onClick={() => {
              if (onOpenMore) onOpenMore('checkout');
              else setShowSecondarySections(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            title="Open Physical Check-Out"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Check-Out ({readyForCheckout.length})</span>
          </button>
          <button
            onClick={() => {
              if (onOpenMore) onOpenMore('all');
              else setShowSecondarySections((prev) => !prev);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow cursor-pointer flex items-center gap-1.5"
          >
            <span>{showSecondarySections ? 'Collapse Sections' : 'Open in More →'}</span>
          </button>
        </div>
      </div>

      {/* Primary Candidate Intake & Verification Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Primary Candidate Intake Queue</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {filteredCandidates.length}
              </span>
            </h3>
          </div>
          <span className="text-[11px] text-white/50">
            Filtered by: {activeFilter === 'ALL' ? 'All Active' : activeFilter}
          </span>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="p-10 text-center bg-[#0B0B0D] card-dark rounded-2xl text-xs text-white/60 border border-white/10 shadow-lg">
            No candidates matching current filter or search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.map((cand) => {
              const isWaiting = cand.status === 'ARRIVED' || cand.status === 'WAITING';
              const isInMeeting = cand.status === 'IN_INTERVIEW' || cand.status === 'ROOM_ASSIGNED';
              const isCheckoutReady = cand.status === 'COMPLETED' || cand.status === 'OFFERED' || cand.status === 'REJECTED';

              return (
                <motion.div
                  key={cand.id}
                  whileHover={{ scale: 1.01, y: -2, transition: { duration: 0.15 } }}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 rounded-2xl space-y-3 text-xs shadow-xl cursor-pointer transition bg-[#0B0B0D] card-dark text-white border border-white/10 hover:border-amber-400/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {cand.receptionPhotoUrl || cand.photoUrl ? (
                        <img
                          src={cand.receptionPhotoUrl || cand.photoUrl}
                          alt={cand.fullName}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-500 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold bg-[#25272B] border border-white/10 text-white">
                          {cand.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm flex items-center gap-1 text-white">
                          {cand.fullName}
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </h4>
                        <p className="text-[11px] font-semibold text-white/80">{cand.position}</p>
                        <p className="text-[10px] mt-0.5 text-white/50">
                          Arrived: {cand.checkedInAt ? new Date(cand.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 font-mono border ${
                      isWaiting
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : isInMeeting
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : isCheckoutReady
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/10 text-white/80 border-white/15'
                    }`}>
                      {cand.status}
                    </span>
                  </div>

                  {/* Visitor Lifecycle Stage Tracker */}
                  <div className="pt-2 border-t border-white/10">
                    <VisitorArrivalTimeline candidate={cand} compact={true} />
                  </div>

                  {/* Desk Photo Verification status & Action */}
                  <div className="pt-2 border-t flex items-center justify-between gap-2 border-white/10">
                    {cand.receptionPhotoUrl ? (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Desk Photo Verified
                      </span>
                    ) : (
                      <span className="text-[10px] italic text-amber-300 font-medium">
                        Desk Photo Required
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoCandidate(cand);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300 shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{cand.receptionPhotoUrl ? 'Retake' : 'Capture'}</span>
                      </button>

                      {isCheckoutReady && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCheckout(cand.id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1 transition cursor-pointer bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Check-Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expandable Inline Secondary Sections (Hidden by default, shown only when explicitly toggled) */}
      {showSecondarySections && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Secondary Sections Inline View</span>
            </h3>
            <button
              onClick={() => setShowSecondarySections(false)}
              className="text-xs text-white/60 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
            >
              Hide Secondary Sections
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Waiting Lounge Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-black/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Lounge Waiting Area ({waitingCandidates.length})
                </h3>
              </div>

              <div className="space-y-3">
                {waitingCandidates.length === 0 ? (
                  <div className="p-8 text-center bg-[#0B0B0D] card-dark rounded-2xl text-xs text-white/60 border border-white/10 shadow-lg">
                    Lounge is currently clear.
                  </div>
                ) : (
                  waitingCandidates.map((cand) => (
                    <motion.div
                      key={cand.id}
                      onClick={() => setSelectedProfileCandidateId(cand.id)}
                      className="p-4 rounded-2xl space-y-3 text-xs shadow-xl cursor-pointer bg-[#0B0B0D] card-dark text-white border border-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {cand.receptionPhotoUrl || cand.photoUrl ? (
                            <img
                              src={cand.receptionPhotoUrl || cand.photoUrl}
                              alt={cand.fullName}
                              className="w-10 h-10 rounded-xl object-cover border border-amber-500 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[#25272B] border border-white/10 text-white shrink-0">
                              {cand.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-white">{cand.fullName}</h4>
                            <p className="text-[11px] text-white/70">{cand.position}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Waiting
                        </span>
                      </div>
                      <VisitorArrivalTimeline candidate={cand} compact={true} />
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* In-Session Meetings Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-black/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  In Active Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED').length})
                </h3>
              </div>

              <div className="space-y-3">
                {candidates
                  .filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED')
                  .map((cand) => (
                    <motion.div
                      key={cand.id}
                      onClick={() => setSelectedProfileCandidateId(cand.id)}
                      className="p-4 rounded-2xl space-y-2.5 text-xs cursor-pointer shadow-xl bg-[#0B0B0D] card-dark border border-blue-500/30 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{cand.fullName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono text-blue-300 bg-blue-500/15 border border-blue-500/30">
                          {cand.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-white/80">
                        <span>{cand.position}</span>
                        <span className="font-semibold text-amber-400">
                          {cand.assignedRoomName || cand.currentLocation || 'Cabin'}
                        </span>
                      </div>
                      <VisitorArrivalTimeline candidate={cand} compact={true} />
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Physical Checkout Terminal Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-black/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Physical Check-Out ({readyForCheckout.length})
                </h3>
              </div>

              <div className="space-y-3">
                {readyForCheckout.length === 0 ? (
                  <div className="p-8 text-center bg-[#0B0B0D] card-dark rounded-2xl text-xs text-white/60 border border-white/10 shadow-lg">
                    No visitors currently awaiting checkout.
                  </div>
                ) : (
                  readyForCheckout.map((cand) => (
                    <motion.div
                      key={cand.id}
                      onClick={() => setSelectedProfileCandidateId(cand.id)}
                      className="p-4 rounded-2xl space-y-3 text-xs shadow-xl cursor-pointer bg-[#0B0B0D] card-dark text-white border border-emerald-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-white">{cand.fullName}</h4>
                          <p className="text-[11px] text-white/70">{cand.position}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Completed
                        </span>
                      </div>
                      <VisitorArrivalTimeline candidate={cand} compact={true} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckout(cand.id);
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Complete Physical Checkout</span>
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reception Candidate Profile Modal */}
      {selectedProfileCandidateId && (
        <CandidateDossierModal
          candidateId={selectedProfileCandidateId}
          initialCandidate={candidates.find((c) => c.id === selectedProfileCandidateId)}
          currentRole="RECEPTION"
          onClose={() => setSelectedProfileCandidateId(null)}
          onPhotoCaptured={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Reception Live Photo Capture Modal */}
      {selectedPhotoCandidate && (
        <ReceptionPhotoModal
          candidate={selectedPhotoCandidate}
          receptionistId="usr-rec-1"
          receptionistName="Ananya Sen (Reception)"
          onClose={() => setSelectedPhotoCandidate(null)}
          onSuccess={(updated) => {
            setSelectedPhotoCandidate(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};
