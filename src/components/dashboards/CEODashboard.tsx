import React from 'react';
import { motion } from 'motion/react';
import {
  Award,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  FileText,
  ArrowRight,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';
import type { DashboardModalTarget } from '../DashboardCardDetailsModal.tsx';

interface CEODashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  onOpenDossier: (candidateId: string) => void;
  onOpenDetailsTarget?: (target: DashboardModalTarget) => void;
}

export const CEODashboard: React.FC<CEODashboardProps> = ({
  candidates,
  interviews,
  rooms,
  onOpenDossier,
  onOpenDetailsTarget,
}) => {
  const activeCandidates = candidates.filter((c) => c.status !== 'CHECKED_OUT' && c.status !== 'SCHEDULED');
  const offeredCount = candidates.filter((c) => c.status === 'OFFERED' || c.status === 'COMPLETED').length;
  const inSessionCount = candidates.filter((c) => c.status === 'IN_INTERVIEW').length;

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <div className="p-6 card-dark bg-[#0B0B0D] text-white rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              White Collar Realty • Executive Suite
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Strategic Office Operations Overview
          </h1>
          <p className="text-xs text-[#E0E0E0]">
            Filtered executive briefing • High-level talent pipeline & facility performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-[#25272B] card-inner inner-box rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-[#BDBDBD] block font-mono">Offer Rate</span>
            <span className="text-lg font-black text-emerald-400 tabular-nums">
              {candidates.length > 0 ? `${Math.round((offeredCount / Math.max(1, candidates.length)) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Strategic Metrics — All Black Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileTap={{ scale: 0.99 }}
          className="p-4 card-dark bg-[#0B0B0D] text-white rounded-2xl border border-white/10 shadow-md hover:shadow-xl transition"
        >
          <span className="text-xs text-[#E0E0E0] block font-medium">Active Office Presence</span>
          <p className="text-2xl font-black text-white mt-1 tabular-nums">{activeCandidates.length}</p>
          <span className="text-[10px] text-amber-400 font-semibold font-mono">Candidates on premises</span>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileTap={{ scale: 0.99 }}
          className="p-4 card-dark bg-[#0B0B0D] text-white rounded-2xl border border-white/10 shadow-md hover:shadow-xl transition"
        >
          <span className="text-xs text-[#E0E0E0] block font-medium">Interviews Live</span>
          <p className="text-2xl font-black text-white mt-1 tabular-nums">{inSessionCount}</p>
          <span className="text-[10px] text-[#BDBDBD] font-mono">Active evaluation rounds</span>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileTap={{ scale: 0.99 }}
          className="p-4 card-dark bg-[#0B0B0D] text-white rounded-2xl border border-white/10 shadow-md hover:shadow-xl transition"
        >
          <span className="text-xs text-[#E0E0E0] block font-medium">Leadership Offers / Hires</span>
          <p className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">{offeredCount}</p>
          <span className="text-[10px] text-emerald-400 font-semibold font-mono">Today's recommendations</span>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileTap={{ scale: 0.99 }}
          className="p-4 card-dark bg-[#0B0B0D] text-white rounded-2xl border border-white/10 shadow-md hover:shadow-xl transition"
        >
          <span className="text-xs text-[#E0E0E0] block font-medium">Executive Boardrooms</span>
          <p className="text-2xl font-black text-white mt-1 tabular-nums">
            {rooms.filter((r) => r.type === 'EXECUTIVE_BOARDROOM').length}
          </p>
          <span className="text-[10px] text-[#BDBDBD] font-mono">Executive meeting suites</span>
        </motion.div>
      </div>

      {/* Candidate Pipeline Briefing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Executive Candidate Briefs
          </h2>
          <span className="text-xs text-[#252A32] font-medium">
            Confidentiality Filter Active • Operational noise suppressed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand, idx) => {
            const intv = interviews.find((i) => i.id === cand.currentInterviewId);
            const isDark = idx % 2 === 0;

            return (
              <motion.div
                key={cand.id}
                whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                whileTap={{ scale: 0.99 }}
                className="card-dark bg-[#0B0B0D] text-white border border-white/10 p-5 rounded-2xl space-y-3 shadow-xl transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {cand.livePhoto ? (
                      <img
                        src={cand.livePhoto}
                        alt={cand.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-amber-500/80 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/8 text-slate-300">
                        <Award className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">{cand.fullName}</h3>
                      <p className="text-xs font-semibold text-amber-400">{cand.position}</p>
                      <p className="text-[11px] text-[#E0E0E0]">{cand.department}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-white/10 text-amber-300 border border-white/15">
                    {cand.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-[#25272B] border border-white/10 text-[#E0E0E0] card-inner">
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-[#BDBDBD]">Experience</span>
                    <strong className="text-white font-bold">{cand.totalExperience}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-[#BDBDBD]">Location</span>
                    <strong className="text-white font-bold">{cand.currentLocation}</strong>
                  </div>
                  {intv && (
                    <>
                      <div>
                        <span className="block text-[10px] uppercase font-mono text-[#BDBDBD]">Current Round</span>
                        <strong className="text-white font-bold">{intv.roundName}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-mono text-[#BDBDBD]">Interviewer</span>
                        <strong className="text-white font-bold">{intv.interviewerName}</strong>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#E0E0E0]">
                    {cand.currentCompany ? `Ex: ${cand.currentCompany}` : 'Qualified Profile'}
                  </span>
                  <button
                    onClick={() => onOpenDossier(cand.id)}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shadow bg-amber-500 hover:bg-amber-400 text-slate-950"
                  >
                    Executive Dossier
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
