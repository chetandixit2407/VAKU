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
      <div className="p-6 bg-white/95 border border-[#EFE0CC] rounded-3xl shadow-[0_14px_45px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[#171717]">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#8C6033]" />
            <h1 className="text-xl font-extrabold text-[#171717] tracking-tight">
              Front Desk Reception & Escort Terminal
            </h1>
          </div>
          <p className="text-xs text-[#77716B] mt-0.5">
            Real-time candidate profile management, government ID verification, live photo capture, and checkout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenWalkIn}
            className="px-3.5 py-2 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 hover:border-[#C99A68]"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C99A68]" />
            <span>Intake Walk-in / Client</span>
          </button>
          <button
            onClick={onOpenQR}
            className="px-3.5 py-2 bg-white hover:bg-[#FAF9F6] text-[#171717] font-semibold text-xs rounded-xl border border-[#EFE0CC] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <QrCode className="w-3.5 h-3.5 text-[#8C6033]" />
            <span>Reception QR Standees</span>
          </button>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="px-3.5 py-2 bg-[#FAF4ED] hover:bg-[#F3EFE9] text-[#8C6033] font-semibold text-xs rounded-xl border border-[#E4CCAF] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open Internal Office Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C99A68]" />
              <span>Office Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* 🚨 PROMINENT REAL-TIME ACTION ALERTS & ESCORT TASK CARDS */}
      {receptionTasks.length > 0 && (
        <div className="p-5 bg-white/95 border border-[#E4CCAF] rounded-3xl space-y-3 shadow-[0_14px_45px_rgba(201,154,104,0.1)] animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#EFE0CC]">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C99A68] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#C99A68]"></span>
              </span>
              <div>
                <h2 className="text-sm font-black text-[#171717] tracking-wide uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C99A68]" />
                  <span>Immediate Action Tasks & Escort Alerts ({receptionTasks.length})</span>
                </h2>
                <p className="text-[11px] text-[#77716B]">
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
                className="px-2.5 py-1 rounded-lg bg-[#FAF4ED] hover:bg-[#F3EFE9] text-[#8C6033] border border-[#E4CCAF] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#C99A68]" />
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
                  className={`p-4 rounded-2xl border transition shadow-sm relative flex flex-col justify-between ${
                    isPending
                      ? 'bg-white border-[#E4CCAF] ring-2 ring-[#C99A68]/20'
                      : isAcknowledged
                      ? 'bg-white border-sky-300 ring-1 ring-sky-200'
                      : 'bg-[#FAF9F6] border-[#EFE0CC] opacity-90'
                  }`}
                >
                  {/* Top Header: Sender, Time & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EFE0CC]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#FAF4ED] text-[#8C6033] flex items-center justify-center font-black text-xs border border-[#E4CCAF] shrink-0">
                        {task.senderName ? task.senderName.substring(0, 2).toUpperCase() : 'HR'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#171717] truncate flex items-center gap-1.5">
                          <span>{task.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]">
                            {task.senderRole}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#77716B] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8A847D]" />
                          <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF] flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          PENDING ACTION
                        </span>
                      )}
                      {isAcknowledged && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-sky-600" />
                          ACKNOWLEDGED
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          COMPLETED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="py-3 space-y-2">
                    <div className="text-xs sm:text-sm font-bold text-[#171717] tracking-tight leading-snug">
                      {task.title || `Bring ${task.candidateName || 'Candidate'} to ${task.destinationRoomName || 'Room'}`}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Candidate Box */}
                      <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EFE0CC]">
                        <span className="text-[10px] font-bold text-[#77716B] uppercase tracking-wider block">
                          Candidate
                        </span>
                        <span className="text-xs font-bold text-[#171717] truncate block mt-0.5">
                          {task.candidateName || 'Candidate'}
                        </span>
                        <span className="text-[10px] text-[#77716B] block truncate mt-0.5">
                          📍 {task.candidateLocation || 'Waiting Lounge / Reception'}
                        </span>
                      </div>

                      {/* Destination Box */}
                      <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EFE0CC]">
                        <span className="text-[10px] font-bold text-[#77716B] uppercase tracking-wider block">
                          Destination Room
                        </span>
                        <span className="text-xs font-bold text-[#8C6033] truncate block mt-0.5">
                          {task.destinationRoomName || 'Designated Cabin'}
                        </span>
                        <span className="text-[10px] text-[#77716B] block truncate mt-0.5">
                          🏢 Escort Destination
                        </span>
                      </div>
                    </div>

                    {task.instruction && task.instruction !== task.title && (
                      <div className="text-[11px] text-[#77716B] italic bg-[#FAF9F6] p-2 rounded-lg border border-[#EFE0CC]">
                        "{task.instruction}"
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-[#EFE0CC] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => onAcknowledgeTask && onAcknowledgeTask(task.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C99A68]" />
                          <span>ACKNOWLEDGE</span>
                        </button>
                      )}

                      {isAcknowledged && (
                        <button
                          onClick={() => onCompleteTask && onCompleteTask(task.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MARK AS ESCORTED</span>
                        </button>
                      )}

                      {task.candidateId && (
                        <button
                          onClick={() => setSelectedProfileCandidateId(task.candidateId!)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#171717] border border-[#EFE0CC] font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#8C6033]" />
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
                        className="text-[11px] font-semibold text-[#77716B] hover:text-[#171717] transition flex items-center gap-1 cursor-pointer"
                        title="Reply directly in chat"
                      >
                        <MessageSquare className="w-3 h-3 text-[#C99A68]" />
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
        <div className="p-4 bg-white/95 border border-[#E4CCAF] rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#8C6033] font-bold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C99A68]" />
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
                className="text-[10px] font-bold text-[#8C6033] hover:underline flex items-center gap-1 cursor-pointer lowercase"
              >
                <MessageSquare className="w-3 h-3 text-[#C99A68]" />
                <span>reply in chat &rarr;</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {roomAssignedCandidates.map((cand) => (
              <div
                key={cand.id}
                className="p-3 bg-[#FAF9F6] border border-[#EFE0CC] rounded-xl flex items-center justify-between text-xs cursor-pointer hover:border-[#C99A68] transition"
                onClick={() => setSelectedProfileCandidateId(cand.id)}
              >
                <div>
                  <h4 className="font-bold text-[#171717] hover:text-[#8C6033] flex items-center gap-1.5">
                    {cand.fullName}
                    <Eye className="w-3 h-3 text-[#8A847D]" />
                  </h4>
                  <p className="text-[#77716B] text-[11px]">{cand.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhotoCandidate(cand);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#FAF9F6] border border-[#E4CCAF] text-[#8C6033] font-semibold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Capture arrival photo"
                  >
                    <Camera className="w-3 h-3 text-[#C99A68]" />
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
                      className="px-2 py-1 bg-white hover:bg-[#FAF9F6] border border-[#EFE0CC] text-[#77716B] font-semibold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Update staff in chat"
                    >
                      <MessageSquare className="w-3 h-3 text-[#C99A68]" />
                      <span>Chat</span>
                    </button>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] text-[#77716B] block">Direct Candidate to:</span>
                    <span className="font-bold text-[#8C6033] text-xs flex items-center gap-1 justify-end">
                      <MapPin className="w-3 h-3 text-[#C99A68]" />
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white/95 border border-[#EFE0CC] rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-[#FAF4ED] text-[#171717] font-extrabold border border-[#E4CCAF] shadow-2xs'
                : 'bg-white text-[#77716B] hover:text-[#171717] border border-[#EFE0CC]'
            }`}
          >
            All Active ({activeCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('WAITING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'WAITING'
                ? 'bg-[#FAF4ED] text-[#171717] font-extrabold border border-[#E4CCAF] shadow-2xs'
                : 'bg-white text-[#77716B] hover:text-[#171717] border border-[#EFE0CC]'
            }`}
          >
            Waiting Lounge ({waitingCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('IN_MEETING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'IN_MEETING'
                ? 'bg-[#FAF4ED] text-[#171717] font-extrabold border border-[#E4CCAF] shadow-2xs'
                : 'bg-white text-[#77716B] hover:text-[#171717] border border-[#EFE0CC]'
            }`}
          >
            In Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED').length})
          </button>
          <button
            onClick={() => setActiveFilter('CHECKOUT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'CHECKOUT'
                ? 'bg-[#FAF4ED] text-[#171717] font-extrabold border border-[#E4CCAF] shadow-2xs'
                : 'bg-white text-[#77716B] hover:text-[#171717] border border-[#EFE0CC]'
            }`}
          >
            Check-out ({readyForCheckout.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A847D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates / mobile..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E4CCAF] rounded-xl text-xs text-[#171717] focus:outline-hidden focus:border-[#C99A68] transition"
          />
        </div>
      </div>

      {/* Reception Radar Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting Lounge */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#171717] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C99A68]" />
              Lounge Waiting Area ({waitingCandidates.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {waitingCandidates.length === 0 ? (
              <div className="p-8 text-center bg-white/80 border border-[#EFE0CC] rounded-2xl text-xs text-[#77716B]">
                Lounge is currently clear.
              </div>
            ) : (
              waitingCandidates.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 bg-white/95 border border-[#EFE0CC] hover:border-[#E4CCAF] rounded-2xl space-y-3 text-xs shadow-xs cursor-pointer transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {cand.arrivalPhoto || cand.livePhoto ? (
                        <img
                          src={cand.arrivalPhoto || cand.livePhoto}
                          alt={cand.fullName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-[#E4CCAF] shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] shrink-0">
                          <UserCheck className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-[#171717] text-sm hover:text-[#8C6033] flex items-center gap-1">
                          {cand.fullName}
                          <Eye className="w-3 h-3 text-[#8A847D]" />
                        </h4>
                        <p className="text-[11px] text-[#8C6033] font-medium">{cand.position}</p>
                        <p className="text-[10px] text-[#77716B] mt-0.5">
                          Arrived: {cand.arrivalTime ? new Date(cand.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF] shrink-0">
                      Waiting
                    </span>
                  </div>

                  {/* Badges: Government ID & Resume */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-600" />
                      ID: {cand.governmentId?.idTypeName || 'Aadhaar'} ({cand.governmentId?.verificationStatus || 'Verified'})
                    </span>

                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-emerald-600" /> Resume
                    </span>
                  </div>

                  {/* Desk Photo Verification status & Action */}
                  <div className="pt-2 border-t border-[#EFE0CC] flex items-center justify-between gap-2">
                    {cand.arrivalPhoto ? (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Desk Photo Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8A847D] italic">
                        Photo unverified
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoCandidate(cand);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#E4CCAF] text-[#8C6033] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#C99A68]" />
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
          <h3 className="text-sm font-extrabold text-[#171717] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            In Active Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW').length + visitors.filter((v) => v.status === 'CHECKED_IN').length})
          </h3>

          <div className="space-y-2.5">
            {candidates
              .filter((c) => c.status === 'IN_INTERVIEW')
              .map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-3.5 bg-white/95 border border-[#EFE0CC] hover:border-sky-300 rounded-2xl space-y-2 text-xs cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171717] hover:text-sky-700 flex items-center gap-1">
                      {cand.fullName}
                      <Eye className="w-3 h-3 text-[#8A847D]" />
                    </span>
                    <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-semibold border border-sky-200">
                      Interview
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#77716B]">
                    <span>{cand.position}</span>
                    <span className="text-[#8C6033] font-semibold">{cand.currentLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#77716B] pt-1 border-t border-[#EFE0CC]">
                    <span className="text-cyan-700 font-medium">
                      Gov ID: {cand.governmentId?.maskedIdNumber || 'Verified'}
                    </span>
                    {cand.arrivalPhoto && (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Arrival Photo Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}

            {visitors.map((vis) => (
              <div
                key={vis.id}
                className="p-3.5 bg-white/95 border border-[#EFE0CC] rounded-2xl space-y-1 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#171717]">{vis.fullName}</span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-semibold border border-purple-200">
                    {vis.visitorType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#77716B]">
                  <span>Host: {vis.hostName}</span>
                  <span className="text-[#171717]">{vis.company || 'Official Visit'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready for Physical Checkout Terminal */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-[#171717] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Physical Check-Out Terminal ({readyForCheckout.length})
          </h3>

          <div className="space-y-2.5">
            {readyForCheckout.length === 0 ? (
              <div className="p-8 text-center bg-white/80 border border-[#EFE0CC] rounded-2xl text-xs text-[#77716B]">
                No visitors currently pending checkout.
              </div>
            ) : (
              readyForCheckout.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 bg-white/95 border border-[#EFE0CC] hover:border-emerald-300 rounded-2xl space-y-3 text-xs shadow-xs cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#171717] hover:text-emerald-700 flex items-center gap-1">
                        {cand.fullName}
                        <Eye className="w-3 h-3 text-[#8A847D]" />
                      </h4>
                      <p className="text-[11px] text-[#77716B]">{cand.position}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Rounds Done
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckout(cand.id);
                    }}
                    className="w-full py-2 px-3 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#C99A68]" />
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
