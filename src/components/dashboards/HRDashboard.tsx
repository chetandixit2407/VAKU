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
} from 'lucide-react';
import type { Candidate, Interview, Room, ActionTask } from '../../types/index.ts';
import { authenticatedFetch } from '../../utils/apiClient.ts';

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
      {/* Overview Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Waiting in Lobby</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{waitingCandidates.length}</p>
          <span className="text-[10px] text-amber-400 font-semibold">Requires Room / Interviewer</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>In Interview</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{inInterviewCandidates.length}</p>
          <span className="text-[10px] text-blue-400 font-semibold">Rounds in progress</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Available Rooms</span>
            <DoorOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{availableRooms.length} / {operationalRooms.length}</p>
          <span className="text-[10px] text-emerald-400 font-semibold">Ready for allocation</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Candidates</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{candidates.length}</p>
          <span className="text-[10px] text-purple-400 font-semibold">Today's active pipeline</span>
        </div>
      </div>

      {/* Live Dispatched Action Alerts & Escort Status */}
      {activeHRTasks.length > 0 && (
        <div className="p-4 bg-slate-900/90 border border-amber-500/40 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dispatched Action Alerts & Live Status ({activeHRTasks.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400">Synchronized live with Reception & Pantry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeHRTasks.map((task) => {
              const isPending = task.status === 'PENDING';
              const isAcknowledged = task.status === 'ACKNOWLEDGED' || task.status === 'IN_PROGRESS';

              return (
                <div
                  key={task.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white truncate">{task.title}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Target: <strong className="text-slate-300">{task.targetRole}</strong></span>
                      <span>•</span>
                      <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div>
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap animate-pulse">
                        Awaiting Ack
                      </span>
                    )}
                    {isAcknowledged && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Candidate Priority Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Live Candidate Intake & Room Allocation Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full authorized candidate management & live room assignment control for HR.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 font-semibold">
              {waitingCandidates.length} Pending
            </span>
          </div>

          {waitingCandidates.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No candidates waiting right now</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When a candidate scans the WCR QR code and submits their live photo and resume, they appear here immediately with zero page refresh.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitingCandidates.map((cand) => {
                const intv = interviews.find((i) => i.id === cand.currentInterviewId);
                return (
                  <div
                    key={cand.id}
                    className="p-4 sm:p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-xl space-y-3 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        {cand.livePhoto ? (
                          <img
                            src={cand.livePhoto}
                            alt={cand.fullName}
                            className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-500 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            <Users className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{cand.fullName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              {cand.status}
                            </span>
                          </div>
                          <p className="text-xs text-amber-400 font-medium">{cand.position}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {cand.currentLocation}
                            </span>
                            {cand.arrivalTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                Arrived: {new Date(cand.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        {cand.status === 'With Kimmi Mam – Senior HR Interview' || (cand as any).assignedInterviewerName?.includes('Kimmi') ? (
                          <span className="px-3 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Assigned to Kimmi Mam</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAssignToKimmi(cand.id)}
                            disabled={assigningKimmiId === cand.id}
                            className="px-3 py-2 bg-gradient-to-r from-purple-500/20 to-amber-500/20 hover:from-purple-500/30 hover:to-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            title="Assign to Kimmi Mam for Senior HR Interview"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>{assigningKimmiId === cand.id ? 'Assigning...' : 'Assign to Kimmi Mam'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => onAssignRoom(cand.id, cand.currentInterviewId)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
                          title="HR Room Control: Assign or reassign candidate room"
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                          <span>{cand.assignedRoomId ? 'Change Room' : 'Assign Room'}</span>
                        </button>
                        {onOpenChatWithContext && (
                          <button
                            onClick={() =>
                              onOpenChatWithContext({
                                candidateId: cand.id,
                                roomId: cand.assignedRoomId,
                                channelId: 'reception',
                                initialMessage: `Please bring ${cand.fullName} to ${cand.assignedRoomName || 'Elegance Suite'}.`,
                              })
                            }
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 hover:border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer"
                            title="Call reception in chat to escort candidate to room"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                            <span>Escort in Chat</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenDossier(cand.id)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                        >
                          View Dossier
                        </button>
                      </div>
                    </div>

                    {/* Interview Context row */}
                    {intv && (
                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate">
                          Scheduled: <strong className="text-slate-200">{intv.roundName}</strong> with{' '}
                          <strong className="text-amber-400">{intv.interviewerName}</strong>
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          Time: {intv.scheduledTime}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Active / In-Progress Interviews */}
          {inInterviewCandidates.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Interviews Currently in Session ({inInterviewCandidates.length})
              </h3>
              <div className="space-y-2">
                {inInterviewCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {cand.livePhoto && (
                        <img src={cand.livePhoto} alt="" className="w-9 h-9 rounded-xl object-cover" />
                      )}
                      <div>
                        <h4 className="font-bold text-white">{cand.fullName}</h4>
                        <p className="text-[11px] text-amber-400">{cand.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-semibold">
                        Location: {cand.currentLocation}
                      </span>
                      <button
                        onClick={() => onAssignRoom(cand.id, cand.currentInterviewId)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 hover:border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer"
                        title="HR Room Control: Reassign candidate room at any time"
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>Change Room</span>
                      </button>
                      <button
                        onClick={() => onOpenDossier(cand.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live Rooms Status Grid */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-amber-400" />
              Office Rooms & Pods
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time office room status.</p>
          </div>

          <div className="space-y-2.5">
            {operationalRooms.map((room) => {
              const isAvail = room.status === 'AVAILABLE';
              const isAssigned = room.status === 'ASSIGNED';
              const isOccupied = room.status === 'OCCUPIED';
              const isCleaning = room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING';

              return (
                <div
                  key={room.id}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{room.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isAvail
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isAssigned
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : isCleaning
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 animate-pulse'
                          : isOccupied
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isCleaning ? 'Cleaning (Pantry)' : room.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="capitalize">{room.type?.replace('_', ' ').toLowerCase() || 'Meeting Room'}</span>
                    {room.currentCandidateName && (
                      <span className="text-amber-400 font-semibold">
                        Occupant: {room.currentCandidateName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-slate-700 hover:border-amber-500/50 rounded-2xl flex items-center justify-between text-xs text-white font-semibold transition shadow-md group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Internal Office Chat</div>
                  <div className="text-[10px] text-slate-400 font-normal">Real-time staff & pantry communication</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
            </button>
          )}

          {/* HR Information Rule Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HR Information Authority</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              HR receives the complete candidate record including full contact details, live photo, resume, compensation remarks, and stage timeline. Room allocation is an authorized HR human decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
