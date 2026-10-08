import React from 'react';
import { CheckCircle2, Clock, UserCheck, Award, Flag, ChevronRight } from 'lucide-react';
import type { CandidateStatus } from '../../types/index.ts';

interface WCRCandidateJourneyProps {
  status: CandidateStatus | string;
  interviewStage?: string;
  className?: string;
  compact?: boolean;
}

export const WCRCandidateJourney: React.FC<WCRCandidateJourneyProps> = ({
  status,
  interviewStage,
  className = '',
  compact = false,
}) => {
  // Determine current active stage index (0 to 5)
  let activeIndex = 0;
  if (status === 'SCHEDULED') {
    activeIndex = 0; // REGISTERED
  } else if (status === 'ARRIVED') {
    activeIndex = 1; // RECEPTION
  } else if (status === 'WAITING') {
    activeIndex = 2; // WAITING
  } else if (status === 'ROOM_ASSIGNED') {
    activeIndex = 3; // INTERVIEW
  } else if (status === 'IN_INTERVIEW') {
    if (
      interviewStage?.includes('Round 2') ||
      interviewStage?.includes('Round 3') ||
      interviewStage?.includes('Executive')
    ) {
      activeIndex = 4; // ROUND 2
    } else {
      activeIndex = 3; // INTERVIEW
    }
  } else if (
    status === 'With Kimmi Mam – Senior HR Interview' ||
    status?.includes('Kimmi')
  ) {
    activeIndex = 4; // ROUND 2
  } else if (
    status === 'COMPLETED' ||
    status === 'CHECKED_OUT' ||
    status === 'OFFERED' ||
    status === 'REJECTED'
  ) {
    activeIndex = 5; // COMPLETED
  }

  const stages = [
    { key: 'REGISTERED', label: 'Registered' },
    { key: 'RECEPTION', label: 'Reception' },
    { key: 'WAITING', label: 'Waiting' },
    { key: 'INTERVIEW', label: 'Interview' },
    { key: 'ROUND_2', label: 'Round 2' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const progressPercentage = Math.min(100, Math.round((activeIndex / (stages.length - 1)) * 100));

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-[10px] text-[#77716B]">
          <span className="font-bold text-[#8C6033] uppercase tracking-wider">
            {stages[activeIndex]?.label || 'In Progress'}
          </span>
          <span className="font-mono text-[#8A847D]">
            Step {activeIndex + 1} of {stages.length}
          </span>
        </div>
        <div className="h-1.5 w-full bg-[#F3EFE9] rounded-full overflow-hidden border border-[#EFE0CC]">
          <div
            className="h-full bg-[#C99A68] transition-all duration-700 ease-out rounded-full shadow-xs"
            style={{ width: `${Math.max(8, progressPercentage)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white/95 rounded-2xl border border-[#EFE0CC] shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">
          Live Candidate Journey
        </span>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]">
          {stages[activeIndex]?.label} Active
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative my-4">
        {/* Background track line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-[#F3EFE9] rounded-full border border-[#EFE0CC]" />

        {/* Animated fill line */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-[#C99A68] transition-all duration-700 ease-out rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Stage Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {stages.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={stage.key} className="flex flex-col items-center">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
                    ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#C99A68] text-white font-extrabold shadow-md border-2 border-white scale-110 ring-2 ring-[#C99A68]/40'
                        : 'bg-[#FAF9F6] text-[#A8A199] border border-[#EFE0CC]'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`
                    text-[10px] mt-1.5 font-bold uppercase tracking-wider transition-colors duration-300
                    ${
                      isCurrent
                        ? 'text-[#171717] font-extrabold'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-[#A8A199]'
                    }
                  `}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
