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
}) => {
  const [selectedPhotoCandidate, setSelectedPhotoCandidate] = useState<Candidate | null>(null);
  const [selectedProfileCandidateId, setSelectedProfileCandidateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WAITING' | 'IN_MEETING' | 'CHECKOUT'>('ALL');

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

  return (
    <div className="space-y-6">
      {/* Front Desk Bar */}
      <div className="p-6 glass-panel rounded-3xl border border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Front Desk Reception & Escort Terminal
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
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
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Candidate
                        </span>
                        <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">
                          {task.candidateName || 'Candidate'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#17191D] dashboard-card rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-2.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                : 'card-pill'
            }`}
          >
            All Active ({activeCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('WAITING')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'WAITING'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                : 'card-pill'
            }`}
          >
            Waiting Lounge ({waitingCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('IN_MEETING')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'IN_MEETING'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                : 'card-pill'
            }`}
          >
            In Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED').length})
          </button>
          <button
            onClick={() => setActiveFilter('CHECKOUT')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'CHECKOUT'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                : 'card-pill'
            }`}
          >
            Ready Checkout ({readyForCheckout.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates / mobile..."
            className="w-full pl-8 pr-3 py-1.5 glass-input rounded-xl text-xs text-white"
          />
        </div>
      </div>

      {/* Reception Radar Columns with Visitor Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting Lounge Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-white/6">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Lounge Waiting Area ({waitingCandidates.length})
            </h3>
          </div>

          <div className="space-y-3">
            {waitingCandidates.length === 0 ? (
              <div className="p-8 text-center glass-panel-subtle rounded-2xl text-xs text-slate-500">
                Lounge is currently clear.
              </div>
            ) : (
              waitingCandidates.map((cand) => (
                <motion.div
                  key={cand.id}
                  whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 glass-panel dashboard-card hover:border-amber-500/50 rounded-2xl space-y-3 text-xs shadow-xl hover:shadow-2xl hover:shadow-amber-500/15 cursor-pointer transition border border-white/8"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {cand.receptionPhotoUrl || cand.photoUrl ? (
                        <img
                          src={cand.receptionPhotoUrl || cand.photoUrl}
                          alt={cand.fullName}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0 font-bold">
                          {cand.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-sm hover:text-amber-400 flex items-center gap-1">
                          {cand.fullName}
                          <Eye className="w-3 h-3 text-slate-500" />
                        </h4>
                        <p className="text-[11px] text-amber-400 font-medium">{cand.position}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Arrived: {cand.checkedInAt ? new Date(cand.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 font-mono">
                      Waiting
                    </span>
                  </div>

                  {/* Visitor Lifecycle Stage Tracker */}
                  <div className="pt-2 border-t border-white/6">
                    <VisitorArrivalTimeline candidate={cand} compact={true} />
                  </div>

                  {/* Desk Photo Verification status & Action */}
                  <div className="pt-2 border-t border-white/6 flex items-center justify-between gap-2">
                    {cand.receptionPhotoUrl ? (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Desk Photo Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 italic">
                        Desk Photo Required
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoCandidate(cand);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{cand.receptionPhotoUrl ? 'Retake' : 'Capture Desk Photo'}</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* In-Session Meetings Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-white/6">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              In Active Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED').length})
            </h3>
          </div>

          <div className="space-y-3">
            {candidates
              .filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED')
              .map((cand) => (
                <motion.div
                  key={cand.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 glass-panel dashboard-card border border-blue-500/30 hover:border-blue-500/60 rounded-2xl space-y-2.5 text-xs cursor-pointer transition shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white hover:text-cyan-300 flex items-center gap-1 text-sm">
                      {cand.fullName}
                      <Eye className="w-3 h-3 text-slate-500" />
                    </span>
                    <span className="text-[10px] text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full font-semibold border border-blue-500/30 font-mono">
                      {cand.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>{cand.position}</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {cand.assignedRoomName || cand.currentLocation || 'Cabin'}
                    </span>
                  </div>

                  {/* Compact Timeline */}
                  <div className="pt-2 border-t border-white/6">
                    <VisitorArrivalTimeline candidate={cand} compact={true} />
                  </div>
                </motion.div>
              ))}

            {visitors.map((vis) => (
              <div
                key={vis.id}
                className="p-3.5 glass-panel-subtle dashboard-card rounded-2xl space-y-1 text-xs border border-white/6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{vis.fullName}</span>
                  <span className="text-[10px] text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full font-semibold font-mono">
                    {vis.visitorType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Host: {vis.hostName}</span>
                  <span className="text-slate-300">{vis.company || 'Official Visit'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Checkout Terminal Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-white/6">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Physical Check-Out ({readyForCheckout.length})
            </h3>
          </div>

          <div className="space-y-3">
            {readyForCheckout.length === 0 ? (
              <div className="p-8 text-center glass-panel-subtle rounded-2xl text-xs text-slate-500">
                No visitors currently awaiting checkout.
              </div>
            ) : (
              readyForCheckout.map((cand) => (
                <motion.div
                  key={cand.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 glass-panel dashboard-card border border-emerald-500/40 hover:border-emerald-500 rounded-2xl space-y-3 text-xs shadow-lg cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white hover:text-emerald-300 flex items-center gap-1 text-sm">
                        {cand.fullName}
                        <Eye className="w-3 h-3 text-slate-500" />
                      </h4>
                      <p className="text-[11px] text-slate-400">{cand.position}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                      Completed
                    </span>
                  </div>

                  <div className="pt-1">
                    <VisitorArrivalTimeline candidate={cand} compact={true} />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckout(cand.id);
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
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
