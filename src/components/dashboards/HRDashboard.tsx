import React, { useState } from 'react';
import {
  Users,
  DoorOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  Award,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import type { Candidate, Interview, Room, ActionTask } from '../../types/index.ts';
import { authenticatedFetch } from '../../utils/apiClient.ts';
import {
  WCRGlassCard,
  WCRFloatingPanel,
  WCRMetricCard,
  WCRActionCard,
  WCRCandidateCard,
  WCRRoomCard,
} from '../design-system/index.ts';

interface HRDashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  actionTasks?: ActionTask[];
  onOpenDossier: (candidateId: string) => void;
  onAssignRoom: (candidateId: string, interviewId?: string) => void;
  onOpenChat?: () => void;
  onOpenChatWithContext?: (options: {
    candidateId?: string;
    roomId?: string;
    channelId?: string;
    recipientId?: string;
    initialMessage?: string;
  }) => void;
  onRefresh: () => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({
  candidates,
  interviews,
  rooms,
  actionTasks = [],
  onOpenDossier,
  onAssignRoom,
  onOpenChat,
  onOpenChatWithContext,
  onRefresh,
}) => {
  const [assigningKimmiId, setAssigningKimmiId] = useState<string | null>(null);

  // Active action tasks relevant to HR
  const activeHRTasks = actionTasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'ACKNOWLEDGED' || t.status === 'IN_PROGRESS'
  );

  const handleAssignToKimmi = async (candId: string) => {
    setAssigningKimmiId(candId);
    try {
      const res = await authenticatedFetch(`/api/candidates/${candId}/assign-kimmi`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to assign candidate to Kimmi Mam', err);
    } finally {
      setAssigningKimmiId(null);
    }
  };

  const waitingCandidates = candidates.filter(
    (c) =>
      c.status === 'ARRIVED' ||
      c.status === 'WAITING' ||
      c.status === 'With Kimmi Mam – Senior HR Interview'
  );
  const inInterviewCandidates = candidates.filter((c) => c.status === 'IN_INTERVIEW');

  // Operational rooms strictly exclude reserved Next Round rooms (Lalit Sir Cabin & Elegance Suite)
  const operationalRooms = rooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.roomId !== 'room-lalit-cabin' &&
      r.roomId !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );
  const availableRooms = operationalRooms.filter((r) => r.status === 'AVAILABLE');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Animated KPI Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <WCRMetricCard
          label="Waiting in Lobby"
          value={waitingCandidates.length}
          subtitle="Requires Room / Interviewer"
          icon={<Users className="w-5 h-5" />}
          accentColor="amber"
          trend={`${waitingCandidates.length} pending`}
        />

        <WCRMetricCard
          label="In Interview"
          value={inInterviewCandidates.length}
          subtitle="Rounds in active progress"
          icon={<UserCheck className="w-5 h-5" />}
          accentColor="blue"
        />

        <WCRMetricCard
          label="Available Rooms"
          value={availableRooms.length}
          total={operationalRooms.length}
          subtitle="Ready for allocation"
          icon={<DoorOpen className="w-5 h-5" />}
          accentColor="emerald"
        />

        <WCRMetricCard
          label="Total Candidates"
          value={candidates.length}
          subtitle="Today's active pipeline"
          icon={<FileText className="w-5 h-5" />}
          accentColor="caramel"
        />
      </div>

      {/* Dispatched Action Alerts & Escort Status (Requirement: ACTION REQUIRED CARD) */}
      {activeHRTasks.length > 0 && (
        <WCRGlassCard className="p-5 sm:p-6 space-y-4" elevation="standard">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C99A68] animate-pulse" />
              <h3 className="text-xs font-black text-[#171717] uppercase tracking-wider">
                ACTION REQUIRED ({activeHRTasks.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#77716B] font-medium">Synchronized live with Reception & Pantry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeHRTasks.map((task) => (
              <WCRActionCard
                key={task.id}
                task={task}
                onActionClick={() => {
                  if (task.candidateId) onOpenDossier(task.candidateId);
                  else if (onOpenChat) onOpenChat();
                }}
              />
            ))}
          </div>
        </WCRGlassCard>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Candidate Priority Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#171717] flex items-center gap-2 tracking-tight">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C99A68]" />
                Live Candidate Intake & Room Allocation Queue
              </h2>
              <p className="text-xs text-[#77716B] mt-0.5">
                Full authorized candidate management & live room assignment control for HR.
              </p>
            </div>
            <span className="px-3 py-1 bg-[#FAF4ED] border border-[#E4CCAF] rounded-xl text-xs text-[#8C6033] font-bold">
              {waitingCandidates.length} In Queue
            </span>
          </div>

          {waitingCandidates.length === 0 ? (
            <WCRGlassCard className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-[#171717]">No candidates waiting right now</h3>
              <p className="text-xs text-[#77716B] max-w-sm mx-auto">
                When a candidate scans the WCR QR code and submits their live photo and resume, they appear here immediately with zero page refresh.
              </p>
            </WCRGlassCard>
          ) : (
            <div className="space-y-3">
              {waitingCandidates.map((cand) => {
                const intv = interviews.find((i) => i.id === cand.currentInterviewId);
                return (
                  <WCRCandidateCard
                    key={cand.id}
                    candidate={cand}
                    interview={intv}
                    onOpenDossier={onOpenDossier}
                    onAssignRoom={onAssignRoom}
                    onAssignToKimmi={handleAssignToKimmi}
                    isAssigningKimmi={assigningKimmiId === cand.id}
                    onOpenChatWithContext={onOpenChatWithContext}
                  />
                );
              })}
            </div>
          )}

          {/* Active / In-Progress Interviews */}
          {inInterviewCandidates.length > 0 && (
            <div className="space-y-3 pt-3">
              <h3 className="text-sm font-extrabold text-[#171717] flex items-center gap-2 tracking-tight">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Interviews Currently in Session ({inInterviewCandidates.length})
              </h3>
              <div className="space-y-2.5">
                {inInterviewCandidates.map((cand) => (
                  <WCRGlassCard
                    key={cand.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    elevation="subtle"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {cand.livePhoto ? (
                        <img
                          src={cand.livePhoto}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-[#E4CCAF] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#171717] truncate">{cand.fullName}</h4>
                        <p className="text-[11px] text-[#8C6033] font-medium truncate">{cand.position}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-semibold">
                        Location: {cand.currentLocation}
                      </span>
                      <button
                        onClick={() => onAssignRoom(cand.id, cand.currentInterviewId)}
                        className="px-3.5 py-1.5 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="HR Room Control: Reassign candidate room"
                      >
                        <DoorOpen className="w-3.5 h-3.5 text-[#C99A68]" />
                        <span>Change Room</span>
                      </button>
                      <button
                        onClick={() => onOpenDossier(cand.id)}
                        className="px-3 py-1.5 bg-white hover:bg-[#FAF9F6] text-[#171717] font-semibold text-xs rounded-xl border border-[#EFE0CC] transition cursor-pointer shadow-2xs"
                      >
                        Details
                      </button>
                    </div>
                  </WCRGlassCard>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live Rooms Status Grid & WCR Intelligence */}
        <div className="space-y-4">
          {/* WCR INTELLIGENCE PANEL (Signature: White Card + Black Inner Panel) */}
          <WCRGlassCard className="p-4 sm:p-5 space-y-3" elevation="standard">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C99A68]" />
                </div>
                <h3 className="text-xs font-black text-[#171717] uppercase tracking-wider">
                  WCR INTELLIGENCE
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]">
                Automated Insights
              </span>
            </div>

            {/* Inner Dark Charcoal Panel */}
            <div className="p-4 bg-[#171717] text-white rounded-2xl border border-[#2D2D2D] shadow-md space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#C99A68] font-bold uppercase tracking-wider">
                <span>OPERATIONAL INSIGHT</span>
                <span className="text-[10px] text-[#8A847D] font-mono">Live</span>
              </div>
              <p className="text-xs text-[#E5E0D8] leading-relaxed">
                {waitingCandidates.length > 0
                  ? `${waitingCandidates.length} candidate${waitingCandidates.length > 1 ? 's are' : ' is'} waiting in lobby. ${availableRooms.length} room${availableRooms.length > 1 ? 's are' : ' is'} ready for allocation.`
                  : 'All candidate interviews flowing smoothly. No queue delays detected.'}
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-[#D6B28A]">
                <Clock className="w-3.5 h-3.5" />
                <span>Next room turnaround: approx 5 mins</span>
              </div>
            </div>
          </WCRGlassCard>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#171717] flex items-center gap-2 tracking-tight">
                <DoorOpen className="w-4 h-4 text-[#8C6033]" />
                Office Rooms & Pods
              </h2>
              <p className="text-xs text-[#77716B] mt-0.5">Real-time office room status.</p>
            </div>
            <span className="text-[11px] font-mono text-[#8A847D] font-bold">
              {availableRooms.length}/{operationalRooms.length} Avail
            </span>
          </div>

          <div className="space-y-2.5">
            {operationalRooms.map((room) => (
              <WCRRoomCard key={room.id} room={room} />
            ))}
          </div>

          {/* Quick Chat Launcher */}
          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full p-4 bg-white hover:bg-[#FAF9F6] border border-[#EFE0CC] hover:border-[#C99A68] rounded-2xl flex items-center justify-between text-xs text-[#171717] font-semibold transition shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] group-hover:scale-105 transition">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#171717]">Internal Office Chat</div>
                  <div className="text-[10px] text-[#77716B] font-normal">
                    Real-time staff & pantry communication
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8C6033] group-hover:translate-x-1 transition" />
            </button>
          )}

          {/* HR Information Authority Rule Card */}
          <WCRGlassCard className="p-4 space-y-2 text-xs" elevation="subtle">
            <div className="flex items-center gap-2 text-[#8C6033] font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>HR Confidentiality & Authority</span>
            </div>
            <p className="text-[11px] text-[#77716B] leading-relaxed">
              HR receives the complete candidate record including full contact details, live photo, resume, compensation remarks, and stage timeline. Room allocation is an authorized HR human decision.
            </p>
          </WCRGlassCard>
        </div>
      </div>
    </div>
  );
};
