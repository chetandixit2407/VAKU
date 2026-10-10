import React from 'react';
import { motion } from 'motion/react';
import {
  UserCheck,
  Play,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileText,
  MapPin,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';

interface InterviewerDashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  currentInterviewerId: string;
  onStartInterview: (interviewId: string) => void;
  onOpenEndInterviewModal: (interview: Interview) => void;
  onOpenDossier: (candidateId: string) => void;
}

export const InterviewerDashboard: React.FC<InterviewerDashboardProps> = ({
  candidates,
  interviews,
  rooms,
  currentInterviewerId,
  onStartInterview,
  onOpenEndInterviewModal,
  onOpenDossier,
}) => {
  // Filter for interviews assigned to this interviewer
  const myInterviews = interviews.filter(
    (i) => !currentInterviewerId || i.interviewerId === currentInterviewerId || i.interviewerName.includes('Nisha')
  );

  const waitingInterviews = myInterviews.filter(
    (i) => i.status === 'CANDIDATE_ARRIVED' || i.status === 'ROOM_ASSIGNED'
  );
  const activeInterviews = myInterviews.filter((i) => i.status === 'INTERVIEW_STARTED');
  const completedInterviews = myInterviews.filter((i) => i.status === 'INTERVIEW_COMPLETED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 card-dark bg-[#0B0B0D] text-white rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Interviewer Command Station
            </h1>
          </div>
          <p className="text-xs text-[#E0E0E0] mt-0.5">
            Active logged-in interviewer: <strong className="text-amber-400">Nisha Verma (Senior Director)</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold font-mono">
            {waitingInterviews.length} Candidates Waiting
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold font-mono">
            {activeInterviews.length} In Session
          </span>
        </div>
      </div>

      {/* High-Priority Waiting Queue */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          Candidates Arrived & Assigned To You
        </h2>

        {waitingInterviews.length === 0 ? (
          <div className="p-10 text-center card-dark bg-[#0B0B0D] rounded-3xl border border-white/10 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No candidates waiting for your review</h3>
            <p className="text-xs text-[#E0E0E0]">
              When HR schedules or advances a candidate to your round, and they arrive, you will receive an automated alert here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {waitingInterviews.map((intv) => {
              const cand = candidates.find((c) => c.id === intv.candidateId);
              const hasRoom = intv.roomId || intv.status === 'ROOM_ASSIGNED';

              return (
                <motion.div
                  key={intv.id}
                  whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.99 }}
                  className="p-5 sm:p-6 rounded-2xl shadow-xl space-y-4 transition card-dark bg-[#0B0B0D] border border-white/10 text-white flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        {cand?.livePhoto ? (
                          <img
                            src={cand.livePhoto}
                            alt={intv.candidateName}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#25272B] border border-white/10 text-white">
                            <UserCheck className="w-7 h-7" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-white">{intv.candidateName}</h3>
                          <p className="text-xs sm:text-sm font-semibold text-amber-400">{intv.position}</p>
                          <p className="text-xs mt-0.5 text-[#E0E0E0]">{intv.roundName}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                          hasRoom
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {hasRoom ? 'Room Ready' : 'Awaiting HR Room'}
                      </span>
                    </div>

                    {/* Room & Location Status */}
                    <div className="p-3.5 card-inner inner-box bg-[#25272B] border border-white/10 rounded-xl space-y-2 text-xs text-white">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#BDBDBD]">Designated Room:</span>
                        <strong className={hasRoom ? 'text-amber-400 font-bold' : 'text-[#BDBDBD] italic'}>
                          {intv.roomName || 'Pending HR Assignment'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#BDBDBD]">Current Location:</span>
                        <span className="text-white font-medium">
                          {cand?.currentLocation || 'Waiting Lounge'}
                        </span>
                      </div>
                    </div>

                    {/* Candidate Profile Snippet */}
                    {cand && (
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#E0E0E0]">
                        <div>
                          <span>Experience: </span>
                          <strong className="text-white font-bold">{cand.totalExperience}</strong>
                        </div>
                        <div>
                          <span>Notice Period: </span>
                          <strong className="text-white font-bold">{cand.noticePeriod}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => onStartInterview(intv.id)}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Interview</span>
                    </button>
                    {cand && (
                      <button
                        onClick={() => onOpenDossier(cand.id)}
                        className="py-2 px-3 text-xs font-semibold rounded-xl border border-white/10 transition cursor-pointer bg-[#25272B] hover:bg-[#35383D] text-[#E0E0E0] hover:text-white"
                      >
                        View Resume
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Interviews In Session */}
      {activeInterviews.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-black/10">
          <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Interviews Currently In Progress ({activeInterviews.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInterviews.map((intv) => (
              <div
                key={intv.id}
                className="p-5 card-dark bg-[#0B0B0D] rounded-2xl border border-blue-500/30 shadow-xl space-y-4 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{intv.candidateName}</h3>
                    <p className="text-xs text-amber-400 font-semibold">{intv.position}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 animate-spin" />
                    In Session: {intv.roomName || 'Meeting Room'}
                  </span>
                </div>

                <div className="p-3 card-inner inner-box bg-[#25272B] rounded-xl text-xs text-[#E0E0E0] border border-white/10">
                  <p>Round: <strong className="text-white">{intv.roundName}</strong></p>
                  <p className="text-[11px] text-[#BDBDBD] mt-1">
                    Started: {intv.startedAt ? new Date(intv.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active now'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenEndInterviewModal(intv)}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conclude & Decide Next Stage</span>
                  </button>
                  {intv.candidateId && (
                    <button
                      onClick={() => onOpenDossier(intv.candidateId)}
                      className="px-3.5 py-2 bg-[#25272B] text-[#E0E0E0] hover:text-white rounded-xl text-xs font-semibold hover:bg-[#35383D] border border-white/10 transition cursor-pointer"
                    >
                      Dossier
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Interviews Today */}
      {completedInterviews.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-black/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#343A40]">
            Concluded Interviews Today ({completedInterviews.length})
          </h3>
          <div className="space-y-2">
            {completedInterviews.map((intv) => (
              <div
                key={intv.id}
                className="p-3 card-dark bg-[#0B0B0D] border border-white/10 rounded-xl flex items-center justify-between text-xs text-white"
              >
                <div>
                  <span className="font-bold text-white">{intv.candidateName}</span>
                  <span className="text-[#E0E0E0] ml-2">({intv.roundName})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-400">
                    Decision: {intv.outcome}
                  </span>
                  {intv.candidateId && (
                    <button
                      onClick={() => onOpenDossier(intv.candidateId)}
                      className="text-amber-400 hover:underline text-[11px]"
                    >
                      View Record
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
