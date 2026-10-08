import React from 'react';
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
  StopCircle,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';
import { WCRGlassCard, WCRMetricCard } from '../design-system/index.ts';

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <WCRGlassCard className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" elevation="standard">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#8C6033]" />
            <h1 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight">
              Interviewer Command Station
            </h1>
          </div>
          <p className="text-xs text-[#77716B] mt-0.5">
            Active logged-in interviewer: <strong className="text-[#171717]">Nisha Verma (Senior Director)</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] text-[#8C6033] text-xs font-bold">
            {waitingInterviews.length} In Queue
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
            {activeInterviews.length} In Session
          </span>
        </div>
      </WCRGlassCard>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <WCRMetricCard
          label="Awaiting Evaluation"
          value={waitingInterviews.length}
          subtitle="Arrived & ready"
          icon={<Clock className="w-5 h-5" />}
          accentColor="amber"
        />

        <WCRMetricCard
          label="Active Interview"
          value={activeInterviews.length}
          subtitle="In room currently"
          icon={<Play className="w-5 h-5" />}
          accentColor="blue"
        />

        <WCRMetricCard
          label="Completed Today"
          value={completedInterviews.length}
          subtitle="Evaluations submitted"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* High-Priority Waiting Queue */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-[#171717] flex items-center gap-2 tracking-tight">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C99A68] animate-pulse" />
          Candidates Arrived & Assigned To You
        </h2>

        {waitingInterviews.length === 0 ? (
          <WCRGlassCard className="p-10 text-center space-y-2" elevation="subtle">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#171717]">No candidates waiting for your review</h3>
            <p className="text-xs text-[#77716B]">
              When HR schedules or advances a candidate to your round, and they arrive, you will receive an automated alert here.
            </p>
          </WCRGlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitingInterviews.map((intv) => {
              const cand = candidates.find((c) => c.id === intv.candidateId);
              const hasRoom = intv.roomId || intv.status === 'ROOM_ASSIGNED';

              return (
                <WCRGlassCard
                  key={intv.id}
                  enableTilt={true}
                  className="p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {cand?.livePhoto ? (
                        <img
                          src={cand.livePhoto}
                          alt={intv.candidateName}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-[#E4CCAF] shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] shrink-0">
                          <UserCheck className="w-7 h-7" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#171717] truncate">{intv.candidateName}</h3>
                        <p className="text-xs text-[#8C6033] font-semibold truncate">{intv.position}</p>
                        <p className="text-[11px] text-[#77716B] mt-0.5 truncate">{intv.roundName}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                        hasRoom
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]'
                      }`}
                    >
                      {hasRoom ? 'Room Ready' : 'Awaiting Room'}
                    </span>
                  </div>

                  {/* Room & Location Status */}
                  <div className="p-3 bg-[#FAF9F6] border border-[#EFE0CC] rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#77716B] flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-[#C99A68]" />
                        Room: <strong className="text-[#171717]">{intv.roomName || cand?.assignedRoomName || 'Lobby Waiting'}</strong>
                      </span>
                      <span className="font-mono text-[#8A847D]">{intv.scheduledTime}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => onOpenDossier(intv.candidateId)}
                      className="px-3.5 py-2 bg-white hover:bg-[#FAF9F6] text-[#171717] font-semibold text-xs rounded-xl border border-[#EFE0CC] transition cursor-pointer shadow-2xs"
                    >
                      Inspect Dossier
                    </button>
                    <button
                      onClick={() => onStartInterview(intv.id)}
                      className="px-4 py-2 bg-[#171717] hover:bg-[#282828] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 hover:border-[#C99A68]"
                    >
                      <Play className="w-3.5 h-3.5 text-[#C99A68]" />
                      <span>Start Interview</span>
                    </button>
                  </div>
                </WCRGlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Interviews Session */}
      {activeInterviews.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-base font-extrabold text-[#171717] flex items-center gap-2 tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            Active Interview In Session
          </h2>
          <div className="space-y-3">
            {activeInterviews.map((intv) => (
              <WCRGlassCard
                key={intv.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                elevation="high"
              >
                <div>
                  <h3 className="text-lg font-bold text-[#171717]">{intv.candidateName}</h3>
                  <p className="text-xs text-[#8C6033] font-medium">{intv.position} &bull; {intv.roundName}</p>
                  <p className="text-[11px] text-[#77716B] mt-1">
                    Room: <strong className="text-emerald-700">{intv.roomName || 'Assigned Room'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenDossier(intv.candidateId)}
                    className="px-3.5 py-2 bg-white hover:bg-[#FAF9F6] text-[#171717] font-semibold text-xs rounded-xl border border-[#EFE0CC] transition cursor-pointer shadow-2xs"
                  >
                    Dossier
                  </button>
                  <button
                    onClick={() => onOpenEndInterviewModal(intv)}
                    className="px-4 py-2 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <StopCircle className="w-3.5 h-3.5 text-[#C99A68]" />
                    <span>Conclude & Submit Decision</span>
                  </button>
                </div>
              </WCRGlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
