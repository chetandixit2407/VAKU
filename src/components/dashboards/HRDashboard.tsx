import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Calendar,
} from 'lucide-react';
import type { Candidate, Interview, Room, ActionTask } from '../../types/index.ts';
import { authenticatedFetch } from '../../utils/apiClient.ts';
import { formatPhotoTimestamp } from '../../utils/dateFormatter.ts';

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

  // Operational rooms strictly exclude reserved Next Round rooms
  const operationalRooms = rooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );

  return (
    <div className="space-y-6">
      {/* Live Dispatched Action Alerts & Escort Status */}
      {activeHRTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 card-dark bg-[#0B0B0D] rounded-2xl space-y-2.5 border border-amber-500/40 shadow-xl"
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dispatched Action Alerts & Live Status ({activeHRTasks.length})</span>
            </h3>
            <span className="text-[10px] text-[#BDBDBD]">Synchronized live with Reception & Pantry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeHRTasks.map((task) => {
              const isPending = task.status === 'PENDING';

              return (
                <div
                  key={task.id}
                  className="p-3 card-inner inner-box bg-[#25272B] rounded-xl flex items-center justify-between gap-3 text-xs border border-white/10"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-white truncate block">{task.title}</span>
                    <div className="text-[10px] text-[#BDBDBD] flex items-center gap-2 mt-0.5">
                      <span>Target: <strong className="text-white">{task.targetRole}</strong></span>
                      <span>&bull;</span>
                      <span className="font-mono text-[#E0E0E0]">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div>
                    {isPending ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap animate-pulse font-mono">
                        Awaiting Ack
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap font-mono">
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Candidate Priority Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-black/10">
            <div>
              <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Live Candidate Intake & Room Allocation Queue
              </h2>
              <p className="text-xs text-[#252A32] mt-0.5">
                Authorized candidate management & live room assignment control.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-[#17191D] rounded-xl text-xs text-amber-300 font-semibold font-mono border border-white/10">
              {waitingCandidates.length} Pending
            </span>
          </div>

          {waitingCandidates.length === 0 ? (
            <div className="p-12 text-center dashboard-card card-dark bg-[#0B0B0D] rounded-3xl space-y-2 border border-white/10 shadow-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No candidates waiting right now</h3>
              <p className="text-xs text-[#E0E0E0] max-w-sm mx-auto leading-relaxed">
                When a candidate completes QR check-in and submits their profile, they appear here instantly in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitingCandidates.map((cand) => {
                const intv = interviews.find((i) => i.id === cand.currentInterviewId);
                const isKimmi = cand.status === 'With Kimmi Mam – Senior HR Interview';

                return (
                  <motion.div
                    key={cand.id}
                    whileHover={{ scale: 1.01, y: -2, transition: { duration: 0.2, ease: 'easeOut' } }}
                    whileTap={{ scale: 0.99 }}
                    className="p-4 sm:p-5 rounded-2xl shadow-xl transition dashboard-card card-dark candidate-card bg-[#0B0B0D] text-white border border-white/10 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="flex flex-col items-center shrink-0">
                          {cand.receptionPhotoUrl || cand.photoUrl || cand.livePhoto || cand.arrivalPhoto ? (
                            <img
                              src={cand.receptionPhotoUrl || cand.photoUrl || cand.livePhoto || cand.arrivalPhoto}
                              alt={cand.fullName}
                              className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-500 shadow-md shrink-0"
                            />
                          ) : (
                            <div className="candidate-avatar w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 font-bold bg-[#25272B] border border-white/10 text-white shadow-xs">
                              {cand.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt) && (
                            <span
                              className="text-[9px] text-amber-300 font-mono tracking-tight mt-1 text-center truncate max-w-[90px]"
                              title={`Captured: ${formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt)}`}
                            >
                              {formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt).split(',')[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="candidate-name text-base font-bold text-white tracking-tight">
                              {cand.fullName}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                cand.status === 'ARRIVED'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : cand.status === 'With Kimmi Mam – Senior HR Interview'
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {cand.status}
                            </span>
                          </div>
                          <p className="candidate-role text-xs font-semibold text-[#E0E0E0]">
                            {cand.position}
                          </p>
                          <div className="candidate-meta flex items-center gap-3 text-[11px] mt-1 text-[#BDBDBD]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span className="font-medium text-white">{cand.currentLocation || 'Waiting Lounge'}</span>
                            </span>
                            {cand.checkedInAt && (
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Arrived: {new Date(cand.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Assign Room & Dossier */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          onClick={() => onAssignRoom(cand.id, intv?.id)}
                          className="btn-assign-room px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <DoorOpen className="w-3.5 h-3.5 text-slate-950" />
                          <span>Assign Room</span>
                        </button>
                        <button
                          onClick={() => onOpenDossier(cand.id)}
                          className="candidate-dossier-link text-[11px] font-semibold underline text-blue-400 hover:text-blue-300 transition cursor-pointer"
                        >
                          View Full Dossier &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Quick HR Kimmi Mam Escalation */}
                    <div className="card-divider pt-2.5 mt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <div className="candidate-detail flex items-center gap-1.5 text-[11px] text-[#BDBDBD]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Experience: <strong className="text-white font-bold">{cand.totalExperience || '0'}y</strong></span>
                        <span className="font-bold">&bull;</span>
                        <span>Notice: <strong className="text-white font-bold">{cand.noticePeriod || 'Immediate'}</strong></span>
                      </div>

                      {!isKimmi && (
                        <button
                          onClick={() => handleAssignToKimmi(cand.id)}
                          disabled={assigningKimmiId === cand.id}
                          className="btn-route-kimmi px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 bg-[#1F2937] hover:bg-[#111827] text-white border border-gray-700 shadow-xs"
                        >
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>{assigningKimmiId === cand.id ? 'Routing...' : 'Route to Kimmi Mam'}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* In-Interview Candidates Pipeline Section */}
          {inInterviewCandidates.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-[#111318] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>In-Session Candidates ({inInterviewCandidates.length})</span>
              </h3>
              <div className="space-y-2">
                {inInterviewCandidates.map((cand) => {
                  return (
                    <motion.div
                      key={cand.id}
                      whileHover={{ scale: 1.01, y: -2, transition: { duration: 0.2, ease: 'easeOut' } }}
                      whileTap={{ scale: 0.99 }}
                      className="p-3.5 rounded-2xl flex items-center justify-between text-xs shadow-xl dashboard-card card-dark candidate-card bg-[#0B0B0D] border border-blue-500/30 text-white cursor-pointer"
                    >
                      <div>
                        <strong className="candidate-name block text-sm text-white font-bold">{cand.fullName}</strong>
                        <span className="candidate-role text-[11px] text-[#E0E0E0]">
                          {cand.position} &bull; Room: <span className="text-amber-400 font-bold">{cand.assignedRoomName || cand.currentLocation}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onAssignRoom(cand.id, cand.currentInterviewId)}
                          className="px-3 py-1.5 font-bold text-xs rounded-xl border border-white/15 transition cursor-pointer bg-white/10 hover:bg-white/20 text-white"
                        >
                          Change Room
                        </button>
                        <button
                          onClick={() => onOpenDossier(cand.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/15 transition cursor-pointer bg-white/10 hover:bg-white/20 text-blue-300 hover:text-blue-200"
                        >
                          Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live Rooms Status Grid */}
        <div className="space-y-4">
          <div className="pb-1 border-b border-black/10">
            <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-amber-500" />
              Office Rooms & Cabins
            </h2>
            <p className="text-xs text-[#252A32] mt-0.5">Real-time room occupancy and readiness.</p>
          </div>

          <div className="space-y-2.5">
            {operationalRooms.map((room) => {
              const isAvail = room.status === 'AVAILABLE';
              const isAssigned = room.status === 'ASSIGNED';
              const isOccupied = room.status === 'OCCUPIED';
              const isCleaning = room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING';

              return (
                <motion.div
                  key={room.id}
                  whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.99 }}
                  className="p-3.5 rounded-2xl space-y-1 text-xs shadow-md transition card-dark bg-[#0B0B0D] border border-white/10 text-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{room.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        isAvail
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isAssigned
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : isCleaning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : isOccupied
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isCleaning ? 'Cleaning' : room.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#E0E0E0]">
                    <span className="capitalize">{room.type?.replace('_', ' ').toLowerCase() || 'Meeting Cabin'}</span>
                    {room.currentCandidateName && (
                      <span className="font-semibold truncate max-w-[140px] text-amber-400">
                        Occupant: {room.currentCandidateName}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full p-3.5 card-dark bg-[#0B0B0D] hover:border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-white font-semibold transition shadow-md group cursor-pointer border border-white/10"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Internal Office Chat</div>
                  <div className="text-[10px] text-[#D5DAE2] font-normal">Direct line to Interviewers & Pantry</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
            </button>
          )}

          {/* HR Information Authority Card */}
          <div className="p-4 card-dark bg-[#0B0B0D] rounded-2xl space-y-1.5 text-xs border border-white/10 shadow-md">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HR Information Authority</span>
            </div>
            <p className="text-[11px] text-[#D5DAE2] leading-relaxed">
              HR commands the complete candidate pipeline including contact details, live photo, resume, compensation remarks, and stage timeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
