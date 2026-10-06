import React, { useState } from 'react';
import {
  UserCheck,
  Play,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileText,
  MapPin,
  Sparkles,
  Award,
  XCircle,
  Eye,
  Shield,
  ArrowRight,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';

interface SeniorHRDashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  currentInterviewerId: string;
  onStartInterview: (interviewId: string) => void;
  onOpenEndInterviewModal: (interview: Interview) => void;
  onOpenDossier: (candidateId: string) => void;
  onAssignRoom?: (candidateId: string, interviewId: string) => void;
  onRefresh: () => void;
}

export const SeniorHRDashboard: React.FC<SeniorHRDashboardProps> = ({
  candidates,
  interviews,
  rooms,
  currentInterviewerId,
  onStartInterview,
  onOpenEndInterviewModal,
  onOpenDossier,
  onAssignRoom,
  onRefresh,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'active' | 'completed'>('pending');

  // Filter interviews assigned to Kimmi Mam ('usr-cofounder-kimmi') or mentioning Kimmi
  const myInterviews = interviews.filter(
    (i) =>
      i.interviewerId === currentInterviewerId ||
      i.interviewerId === 'usr-cofounder-kimmi' ||
      i.interviewerName.includes('Kimmi') ||
      i.roundName.includes('Senior')
  );

  // Also include candidates directly marked 'With Kimmi Mam – Senior HR Interview'
  const candidatesAssignedToMe = candidates.filter(
    (c) =>
      c.status === 'With Kimmi Mam – Senior HR Interview' ||
      (c as any).assignedInterviewerId === 'usr-cofounder-kimmi' ||
      (c as any).assignedInterviewerName?.includes('Kimmi')
  );

  const combinedInterviews = [...myInterviews];
  candidatesAssignedToMe.forEach((cand) => {
    const hasExisting = combinedInterviews.some((i) => i.candidateId === cand.id);
    if (!hasExisting) {
      combinedInterviews.unshift({
        id: cand.currentInterviewId || `intv-kimmi-${cand.id}`,
        candidateId: cand.id,
        candidateName: cand.fullName,
        position: cand.position,
        roundName: 'Senior HR Interview',
        interviewerId: 'usr-cofounder-kimmi',
        interviewerName: 'Kimmi Mam – Senior HR Interview',
        scheduledTime: 'Immediate / Today',
        status: cand.status === 'IN_INTERVIEW' ? 'INTERVIEW_STARTED' : 'CANDIDATE_ARRIVED',
        createdAt: cand.arrivalTime || cand.createdAt || new Date().toISOString(),
        updatedAt: cand.updatedAt || new Date().toISOString(),
      });
    }
  });

  const pendingInterviews = combinedInterviews.filter(
    (i) => i.status === 'CANDIDATE_ARRIVED' || i.status === 'ROOM_ASSIGNED' || i.status === 'SCHEDULED'
  );
  const activeInterviews = combinedInterviews.filter((i) => i.status === 'INTERVIEW_STARTED');
  const completedInterviews = combinedInterviews.filter((i) => i.status === 'INTERVIEW_COMPLETED');

  const displayedInterviews =
    filterTab === 'pending' ? pendingInterviews : filterTab === 'active' ? activeInterviews : completedInterviews;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-lg shadow-inner">
            KM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Kimmi Mam – Senior HR Interviewer Command Station
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Senior Level
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized Role: <strong className="text-slate-200">Senior HR Interviewer</strong> • Executive Leadership
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            {pendingInterviews.length} Pending Senior Reviews
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            {activeInterviews.length} In Active Session
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilterTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            filterTab === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <span>Pending Senior Interviews</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/30 text-[10px]">
            {pendingInterviews.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            filterTab === 'active'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <span>In Active Session</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/30 text-[10px]">
            {activeInterviews.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            filterTab === 'completed'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <span>Completed Evaluations</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/30 text-[10px]">
            {completedInterviews.length}
          </span>
        </button>
      </div>

      {/* Interviews List */}
      {displayedInterviews.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No senior interviews in this view</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Candidates assigned for Senior HR Review with Kimmi Mam will appear here automatically in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedInterviews.map((intv) => {
            const cand = candidates.find((c) => c.id === intv.candidateId);
            const hasRoom = intv.roomId || intv.status === 'ROOM_ASSIGNED';

            return (
              <div
                key={intv.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-xl space-y-4 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {cand?.livePhoto ? (
                      <img
                        src={cand.livePhoto}
                        alt={intv.candidateName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <UserCheck className="w-7 h-7" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">{intv.candidateName}</h3>
                      <p className="text-xs text-amber-400 font-semibold">{intv.position}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{intv.roundName}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      intv.status === 'INTERVIEW_STARTED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : intv.status === 'INTERVIEW_COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : hasRoom
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {intv.status === 'INTERVIEW_STARTED'
                      ? 'In Session'
                      : intv.status === 'INTERVIEW_COMPLETED'
                      ? `Completed (${intv.outcome || 'PASS'})`
                      : hasRoom
                      ? 'Room Assigned'
                      : 'Pending Room'}
                  </span>
                </div>

                {/* Details Box */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Interview Level:</span>
                    <strong className="text-amber-400 font-bold">Senior Level (Kimmi Mam)</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Designated Room:</span>
                    <strong className={hasRoom ? 'text-amber-400 font-bold' : 'text-slate-500 italic'}>
                      {intv.roomName || 'Pending Room Assignment'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Current Location:</span>
                    <span className="text-slate-200 font-medium">
                      {cand?.currentLocation || 'Waiting Lounge'}
                    </span>
                  </div>
                  {intv.interviewerFeedback && (
                    <div className="pt-1.5 border-t border-slate-900 text-[11px]">
                      <span className="text-slate-400 block mb-0.5">Remarks / Feedback:</span>
                      <p className="text-slate-300 italic">{intv.interviewerFeedback}</p>
                    </div>
                  )}
                </div>

                {/* Candidate Summary Snippet */}
                {cand && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span>Experience: </span>
                      <strong className="text-slate-200">{cand.totalExperience}</strong>
                    </div>
                    <div>
                      <span>Notice Period: </span>
                      <strong className="text-slate-200">{cand.noticePeriod}</strong>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenDossier(intv.candidateId)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    title="View candidate dossier & verified resume"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Dossier & Resume</span>
                  </button>

                  {intv.status === 'CANDIDATE_ARRIVED' || intv.status === 'ROOM_ASSIGNED' ? (
                    <button
                      type="button"
                      onClick={() => onStartInterview(intv.id)}
                      className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Interview</span>
                    </button>
                  ) : intv.status === 'INTERVIEW_STARTED' ? (
                    <button
                      type="button"
                      onClick={() => onOpenEndInterviewModal(intv)}
                      className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conclude & Pass/Fail</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium px-2">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
