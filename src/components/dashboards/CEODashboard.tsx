import React from 'react';
import {
  Award,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  FileText,
  DoorOpen,
  ChevronRight,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';
import { WCRGlassCard, WCRMetricCard } from '../design-system/index.ts';

interface CEODashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  onOpenDossier: (candidateId: string) => void;
}

export const CEODashboard: React.FC<CEODashboardProps> = ({
  candidates,
  interviews,
  rooms,
  onOpenDossier,
}) => {
  const activeCandidates = candidates.filter((c) => c.status !== 'CHECKED_OUT' && c.status !== 'SCHEDULED');
  const offeredCount = candidates.filter((c) => c.status === 'OFFERED' || c.status === 'COMPLETED').length;
  const inSessionCount = candidates.filter((c) => c.status === 'IN_INTERVIEW').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Banner */}
      <WCRGlassCard className="p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" elevation="standard">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#8C6033]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#8C6033]">
              White Collar Realty • Executive Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
            Strategic Office Operations Overview
          </h1>
          <p className="text-xs text-[#77716B]">
            Filtered executive briefing &bull; High-level talent pipeline & facility command.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 bg-[#FAF4ED] border border-[#E4CCAF] rounded-2xl text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#8C6033] block">Offer Rate</span>
            <span className="text-xl font-black text-emerald-700">
              {candidates.length > 0 ? `${Math.round((offeredCount / Math.max(1, candidates.length)) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </WCRGlassCard>

      {/* Signature Dark Charcoal Executive Insight Panel */}
      <div className="p-5 sm:p-6 bg-[#171717] text-white rounded-3xl border border-[#2D2D2D] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C99A68]">
            <Sparkles className="w-4 h-4" />
            <span>EXECUTIVE BRIEFING & THROUGHPUT</span>
          </div>
          <p className="text-sm font-semibold text-[#FDFCF9] leading-relaxed">
            Today's recruitment pipeline is running at optimal capacity with {activeCandidates.length} candidate{activeCandidates.length === 1 ? '' : 's'} on premises. Executive suites and boardroom pods are pre-allocated for next rounds.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-1.5 rounded-xl bg-[#262626] border border-[#3E3E3E] text-xs font-bold text-[#E4CCAF]">
            Turnaround: 18m avg
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-[#262626] border border-[#3E3E3E] text-xs font-bold text-emerald-400">
            98.5% SLA
          </span>
        </div>
      </div>

      {/* Strategic Animated Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <WCRMetricCard
          label="Active Presence"
          value={activeCandidates.length}
          subtitle="Candidates on premises"
          icon={<Award className="w-5 h-5" />}
          accentColor="caramel"
        />

        <WCRMetricCard
          label="Interviews Live"
          value={inSessionCount}
          subtitle="Evaluation rounds"
          icon={<UserCheck className="w-5 h-5" />}
          accentColor="blue"
        />

        <WCRMetricCard
          label="Offers / Completes"
          value={offeredCount}
          subtitle="Today's selections"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />

        <WCRMetricCard
          label="Executive Suites"
          value={rooms.filter((r) => r.type === 'EXECUTIVE_BOARDROOM' || r.isReservedNextRound).length}
          subtitle="Leadership chambers"
          icon={<DoorOpen className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Candidate Pipeline Briefing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#171717] flex items-center gap-2 tracking-tight">
            <Sparkles className="w-4 h-4 text-[#8C6033]" />
            Executive Candidate Briefs
          </h2>
          <span className="text-xs text-[#77716B] font-medium">
            Confidentiality Filter Active &bull; Operational noise suppressed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => {
            return (
              <WCRGlassCard
                key={cand.id}
                enableTilt={true}
                className="p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {cand.livePhoto ? (
                      <img
                        src={cand.livePhoto}
                        alt={cand.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#E4CCAF] shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#171717] truncate">{cand.fullName}</h3>
                      <p className="text-xs text-[#8C6033] font-medium truncate">{cand.position}</p>
                      <p className="text-[11px] text-[#77716B] truncate">{cand.department}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF] shrink-0">
                    {cand.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF9F6] p-3 rounded-xl border border-[#EFE0CC]">
                  <div>
                    <span className="text-[#8A847D] block text-[10px]">Experience</span>
                    <strong className="text-[#171717]">{cand.totalExperience || 'Fresher'}</strong>
                  </div>
                  <div>
                    <span className="text-[#8A847D] block text-[10px]">Location</span>
                    <strong className="text-[#8C6033]">{cand.currentLocation || 'Lobby'}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8A847D]">
                    ID: <strong className="font-mono text-[#171717]">{cand.id}</strong>
                  </span>
                  <button
                    onClick={() => onOpenDossier(cand.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                  >
                    <span>View Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#C99A68]" />
                  </button>
                </div>
              </WCRGlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
