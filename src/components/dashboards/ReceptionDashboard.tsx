import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { Candidate, Room, Visitor, ActionTask } from '../../types/index.ts';
import { ReceptionPhotoModal } from '../ReceptionPhotoModal.tsx';
import { CandidateDossierModal } from '../CandidateDossierModal.tsx';

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

  // Real-time EventSource listener for instant reception updates on new QR registrations
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Front Desk Bar */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Front Desk Reception & Escort Terminal
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time candidate profile management, government ID verification, live photo capture, and checkout.
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
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Reception QR Standees</span>
          </button>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer"
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
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border-2 border-amber-500/60 rounded-3xl space-y-3 shadow-2xl shadow-amber-500/10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-amber-500/30">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
              <div>
                <h2 className="text-sm font-black text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
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
                      ? 'bg-slate-900/95 border-amber-400 ring-2 ring-amber-500/30'
                      : isAcknowledged
                      ? 'bg-slate-900/95 border-sky-400/80 ring-1 ring-sky-500/30'
                      : 'bg-slate-900/80 border-emerald-500/40 opacity-80'
                  }`}
                >
                  {/* Top Header: Sender, Time & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs border border-amber-500/30 shrink-0">
                        {task.senderName ? task.senderName.substring(0, 2).toUpperCase() : 'HR'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{task.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-amber-400 border border-slate-700">
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
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          PENDING ACTION
                        </span>
                      )}
                      {isAcknowledged && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-sky-400" />
                          ACKNOWLEDGED
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          COMPLETED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="py-3 space-y-2">
                    <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
                      {task.title || `Bring ${task.candidateName || 'Candidate'} to ${task.destinationRoomName || 'Room'}`}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Candidate Box */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Candidate
                        </span>
                        <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">
                          {task.candidateName || 'Candidate'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                          📍 {task.candidateLocation || 'Waiting Lounge / Reception'}
                        </span>
                      </div>

                      {/* Destination Box */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Destination Room
                        </span>
                        <span className="text-xs font-bold text-cyan-300 truncate block mt-0.5">
                          {task.destinationRoomName || 'Designated Cabin'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                          🏢 Escort Destination
                        </span>
                      </div>
                    </div>

                    {task.instruction && task.instruction !== task.title && (
                      <div className="text-[11px] text-slate-300 italic bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                        "{task.instruction}"
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => onAcknowledgeTask && onAcknowledgeTask(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ACKNOWLEDGE</span>
                        </button>
                      )}

                      {isAcknowledged && (
                        <button
                          onClick={() => onCompleteTask && onCompleteTask(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MARK AS ESCORTED</span>
                        </button>
                      )}

                      {task.candidateId && (
                        <button
                          onClick={() => setSelectedProfileCandidateId(task.candidateId!)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>OPEN CANDIDATE</span>
                        </button>
                      )}
                    </div>

                    {onOpenChatWithContext && (
                      <button
                        onClick={() =>
                          onOpenChatWithContext({
                            candidateId: task.candidateId,
                            roomId: task.destinationRoomId,
                            channelId: 'reception',
                            recipientId: task.senderId,
                            initialMessage: `Acknowledged: Escorting ${task.candidateName || 'candidate'} to ${task.destinationRoomName || 'cabin'} now.`,
                          })
                        }
                        className="text-[11px] font-semibold text-slate-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
                        title="Reply directly in chat"
                      >
                        <MessageSquare className="w-3 h-3 text-amber-400" />
                        <span>Reply in Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-time Escort Guidance Notice */}
      {roomAssignedCandidates.length > 0 && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-amber-400 font-bold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Immediate Reception Action: Escort Candidates to Designated Rooms</span>
            </div>
            {onOpenChatWithContext && (
              <button
                onClick={() =>
                  onOpenChatWithContext({
                    channelId: 'reception',
                    initialMessage: 'Escorting candidate to room now.',
                  })
                }
                className="text-[10px] font-bold text-amber-300 hover:underline flex items-center gap-1 cursor-pointer lowercase"
              >
                <MessageSquare className="w-3 h-3" />
                <span>reply in chat &rarr;</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {roomAssignedCandidates.map((cand) => (
              <div
                key={cand.id}
                className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:border-amber-400 transition"
                onClick={() => setSelectedProfileCandidateId(cand.id)}
              >
                <div>
                  <h4 className="font-bold text-white hover:text-amber-400 flex items-center gap-1.5">
                    {cand.fullName}
                    <Eye className="w-3 h-3 text-cyan-400" />
                  </h4>
                  <p className="text-slate-400 text-[11px]">{cand.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhotoCandidate(cand);
                    }}
                    className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-semibold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Capture arrival photo"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Photo</span>
                  </button>
                  {onOpenChatWithContext && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChatWithContext({
                          candidateId: cand.id,
                          roomId: cand.assignedRoomId,
                          channelId: 'reception',
                          initialMessage: `Escorting ${cand.fullName} to ${cand.currentLocation || 'Elegance Suite'}.`,
                        });
                      }}
                      className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer"
                      title="Update staff in chat"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Direct Candidate to:</span>
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-1 justify-end">
                      <MapPin className="w-3 h-3" />
                      {cand.currentLocation}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Active ({activeCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('WAITING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'WAITING'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Waiting Lounge ({waitingCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('IN_MEETING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'IN_MEETING'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            In Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED').length})
          </button>
          <button
            onClick={() => setActiveFilter('CHECKOUT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'CHECKOUT'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Check-out ({readyForCheckout.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates / mobile..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400 transition"
          />
        </div>
      </div>

      {/* Reception Radar Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting Lounge */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Lounge Waiting Area ({waitingCandidates.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {waitingCandidates.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-500">
                Lounge is currently clear.
              </div>
            ) : (
              waitingCandidates.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl space-y-3 text-xs shadow-lg cursor-pointer transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {cand.arrivalPhoto || cand.livePhoto ? (
                        <img
                          src={cand.arrivalPhoto || cand.livePhoto}
                          alt={cand.fullName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-500 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <UserCheck className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-sm hover:text-cyan-300 flex items-center gap-1">
                          {cand.fullName}
                          <Eye className="w-3 h-3 text-slate-500" />
                        </h4>
                        <p className="text-[11px] text-amber-400 font-medium">{cand.position}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Arrived: {cand.arrivalTime ? new Date(cand.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                      Waiting
                    </span>
                  </div>

                  {/* Badges: Government ID & Resume */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      ID: {cand.governmentId?.idTypeName || 'Aadhaar'} ({cand.governmentId?.verificationStatus || 'Verified'})
                    </span>

                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Resume
                    </span>
                  </div>

                  {/* Desk Photo Verification status & Action */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {cand.arrivalPhoto ? (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Desk Photo Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">
                        Photo unverified
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoCandidate(cand);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{cand.arrivalPhoto ? 'Retake' : 'Capture Live Photo'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* In-Session Candidates & Walk-in Visitors */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            In Active Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW').length + visitors.filter((v) => v.status === 'CHECKED_IN').length})
          </h3>

          <div className="space-y-2.5">
            {candidates
              .filter((c) => c.status === 'IN_INTERVIEW')
              .map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-3.5 bg-slate-900 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl space-y-2 text-xs cursor-pointer transition shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white hover:text-cyan-300 flex items-center gap-1">
                      {cand.fullName}
                      <Eye className="w-3 h-3 text-slate-500" />
                    </span>
                    <span className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full font-semibold">
                      Interview
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{cand.position}</span>
                    <span className="text-amber-400 font-semibold">{cand.currentLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="text-cyan-400 font-medium">
                      Gov ID: {cand.governmentId?.maskedIdNumber || 'Verified'}
                    </span>
                    {cand.arrivalPhoto && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Arrival Photo Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}

            {visitors.map((vis) => (
              <div
                key={vis.id}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{vis.fullName}</span>
                  <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full font-semibold">
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

        {/* Ready for Physical Checkout Terminal */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Physical Check-Out Terminal ({readyForCheckout.length})
          </h3>

          <div className="space-y-2.5">
            {readyForCheckout.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-500">
                No visitors currently pending checkout.
              </div>
            ) : (
              readyForCheckout.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl space-y-3 text-xs shadow-lg cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white hover:text-emerald-300 flex items-center gap-1">
                        {cand.fullName}
                        <Eye className="w-3 h-3 text-slate-500" />
                      </h4>
                      <p className="text-[11px] text-slate-400">{cand.position}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Rounds Done
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckout(cand.id);
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Process Physical Checkout</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reception Candidate Profile Modal (CandidateDossierModal) */}
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
