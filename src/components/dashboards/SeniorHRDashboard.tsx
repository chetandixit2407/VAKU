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
import { WCRGlassCard, WCRMetricCard } from '../design-system/index.ts';

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
      <WCRGlassCard className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" elevation="standard">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#171717] text-[#D6B28A] border border-[#2D2D2D] flex items-center justify-center font-black text-lg shadow-sm">
            KM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight">
                Kimmi Mam – Senior HR Command Station
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF] uppercase">
                Senior HR Round
              </span>
            </div>
            <p className="text-xs text-[#77716B] mt-0.5">
              Authorized Role: <strong className="text-[#171717]">Senior HR Co-Founder Interviewer</strong> &bull; Executive Leadership
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] text-[#8C6033] text-xs font-bold">
            {pendingInterviews.length} Pending
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
            {activeInterviews.length} In Session
          </span>
        </div>
      </WCRGlassCard>

      {/* Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <WCRMetricCard
          label="Pending Senior Reviews"
          value={pendingInterviews.length}
          subtitle="Awaiting interview"
          icon={<Clock className="w-5 h-5" />}
          accentColor="amber"
        />

        <WCRMetricCard
          label="Active In Session"
          value={activeInterviews.length}
          subtitle="Currently evaluating"
          icon={<Play className="w-5 h-5" />}
          accentColor="blue"
        />

        <WCRMetricCard
          label="Completed Today"
          value={completedInterviews.length}
          subtitle="Evaluations registered"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EFE0CC] pb-3">
        <button
          onClick={() => setFilterTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            filterTab === 'pending'
              ? 'bg-[#FAF4ED] text-[#171717] font-extrabold shadow-xs border border-[#E4CCAF]'
              : 'bg-white hover:bg-[#FAF9F6] text-[#77716B] border border-[#EFE0CC]'
          }`}
        >
          <span>Pending Senior Reviews</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#EFE0CC] text-[10px]">
            {pendingInterviews.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            filterTab === 'active'
              ? 'bg-[#FAF4ED] text-[#171717] font-extrabold shadow-xs border border-[#E4CCAF]'
              : 'bg-white hover:bg-[#FAF9F6] text-[#77716B] border border-[#EFE0CC]'
          }`}
        >
          <span>In Active Session</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#EFE0CC] text-[10px]">
            {activeInterviews.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            filterTab === 'completed'
              ? 'bg-[#FAF4ED] text-[#171717] font-extrabold shadow-xs border border-[#E4CCAF]'
              : 'bg-white hover:bg-[#FAF9F6] text-[#77716B] border border-[#EFE0CC]'
          }`}
        >
          <span>Completed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#EFE0CC] text-[10px]">
            {completedInterviews.length}
          </span>
        </button>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {displayedInterviews.length === 0 ? (
          <WCRGlassCard className="p-12 text-center space-y-2" elevation="subtle">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#171717]">No interviews in this tab</h3>
            <p className="text-xs text-[#77716B]">
              When candidates are forwarded to Kimmi Mam for senior HR assessment, they appear here in real-time.
            </p>
          </WCRGlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedInterviews.map((intv) => {
              const cand = candidates.find((c) => c.id === intv.candidateId);
              const isStarted = intv.status === 'INTERVIEW_STARTED';

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
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-[#E4CCAF] shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] shrink-0">
                          <Award className="w-7 h-7" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#171717] truncate">{intv.candidateName}</h3>
                        <p className="text-xs text-[#8C6033] font-semibold truncate">{intv.position}</p>
                        <p className="text-[11px] text-[#77716B] mt-0.5 truncate">{intv.roundName}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isStarted
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]'
                      }`}
                    >
                      {intv.status}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FAF9F6] border border-[#EFE0CC] rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#77716B] flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-[#C99A68]" />
                        Room: <strong className="text-[#171717]">{intv.roomName || cand?.assignedRoomName || 'Senior HR Cabin'}</strong>
                      </span>
                      <span className="font-mono text-[#8A847D]">{intv.scheduledTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => onOpenDossier(intv.candidateId)}
                      className="px-3.5 py-2 bg-white hover:bg-[#FAF9F6] text-[#171717] font-semibold text-xs rounded-xl border border-[#EFE0CC] transition cursor-pointer shadow-2xs"
                    >
                      Dossier
                    </button>

                    {isStarted ? (
                      <button
                        onClick={() => onOpenEndInterviewModal(intv)}
                        className="px-4 py-2 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer active:scale-95"
                      >
                        Conclude Interview
                      </button>
                    ) : (
                      <button
                        onClick={() => onStartInterview(intv.id)}
                        className="px-4 py-2 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95 hover:border-[#C99A68]"
                      >
                        <Play className="w-3.5 h-3.5 text-[#C99A68]" />
                        <span>Start Interview</span>
                      </button>
                    )}
                  </div>
                </WCRGlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
