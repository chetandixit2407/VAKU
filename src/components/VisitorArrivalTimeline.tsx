import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  QrCode,
  Camera,
  BellRing,
  DoorOpen,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import type { Candidate } from '../types/index.ts';

export type ArrivalStage =
  | 'EXPECTED'
  | 'ARRIVED'
  | 'QR_VERIFIED'
  | 'PHOTO_CAPTURED'
  | 'HOST_NOTIFIED'
  | 'IN_OFFICE'
  | 'EXITED';

interface VisitorArrivalTimelineProps {
  candidate: Candidate;
  compact?: boolean;
}

export function computeArrivalStage(candidate: Candidate): {
  currentStage: ArrivalStage;
  stageIndex: number;
} {
  const status = candidate.status || '';

  if (status === 'CHECKED_OUT') {
    return { currentStage: 'EXITED', stageIndex: 6 };
  }
  if (status === 'IN_INTERVIEW' || status === 'ROOM_ASSIGNED' || status.includes('Kimmi Mam')) {
    return { currentStage: 'IN_OFFICE', stageIndex: 5 };
  }
  if (candidate.assignedInterviewerName || candidate.assignedRoomName) {
    return { currentStage: 'HOST_NOTIFIED', stageIndex: 4 };
  }
  if (candidate.receptionPhotoUrl || candidate.photoUrl) {
    return { currentStage: 'PHOTO_CAPTURED', stageIndex: 3 };
  }
  if (candidate.checkedInAt || candidate.qrVerificationStatus === 'VERIFIED') {
    return { currentStage: 'QR_VERIFIED', stageIndex: 2 };
  }
  if (status === 'ARRIVED' || status === 'WAITING') {
    return { currentStage: 'ARRIVED', stageIndex: 1 };
  }

  return { currentStage: 'EXPECTED', stageIndex: 0 };
}

export const VisitorArrivalTimeline: React.FC<VisitorArrivalTimelineProps> = ({
  candidate,
  compact = false,
}) => {
  const { currentStage, stageIndex } = computeArrivalStage(candidate);

  const stages: {
    id: ArrivalStage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'EXPECTED', label: 'Expected', icon: Calendar },
    { id: 'ARRIVED', label: 'Arrived', icon: Clock },
    { id: 'QR_VERIFIED', label: 'QR Verified', icon: QrCode },
    { id: 'PHOTO_CAPTURED', label: 'Photo Captured', icon: Camera },
    { id: 'HOST_NOTIFIED', label: 'Host Notified', icon: BellRing },
    { id: 'IN_OFFICE', label: 'In Office', icon: DoorOpen },
    { id: 'EXITED', label: 'Exited', icon: LogOut },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        {stages.map((stg, i) => {
          const isPassed = i < stageIndex;
          const isCurrent = i === stageIndex;

          return (
            <div key={stg.id} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-amber-400 ring-2 ring-amber-400/40 scale-125'
                    : isPassed
                    ? 'bg-emerald-400'
                    : 'bg-white/15'
                }`}
                title={`${stg.label} ${isCurrent ? '(Current)' : isPassed ? '(Completed)' : ''}`}
              />
              {i < stages.length - 1 && (
                <div
                  className={`w-2 h-[1px] ${
                    isPassed ? 'bg-emerald-400/60' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 ml-1.5">
          {stages[stageIndex]?.label || currentStage}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full glass-panel-subtle rounded-2xl p-3 border border-white/6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[560px] gap-2">
        {stages.map((stg, i) => {
          const Icon = stg.icon;
          const isPassed = i < stageIndex;
          const isCurrent = i === stageIndex;

          return (
            <React.Fragment key={stg.id}>
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[70px]">
                {/* Node circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.08 : 1,
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 font-bold ring-4 ring-amber-400/20 shadow-lg shadow-amber-500/25'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-white/5 text-slate-500 border border-white/8'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </motion.div>

                {/* Stage Label */}
                <span
                  className={`text-[10px] font-medium tracking-tight text-center whitespace-nowrap ${
                    isCurrent
                      ? 'text-amber-400 font-bold'
                      : isPassed
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {stg.label}
                </span>
              </div>

              {/* Connecting hairline */}
              {i < stages.length - 1 && (
                <div className="flex-1 max-w-[40px] h-[1px] relative self-center -mt-4">
                  <div className="absolute inset-0 bg-white/10" />
                  {isPassed && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 bg-emerald-400/60"
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const VisitorJourneyOverview: React.FC<{
  candidates: Candidate[];
  selectedStage?: ArrivalStage | null;
  onSelectStage?: (stage: ArrivalStage | null) => void;
}> = ({ candidates, selectedStage, onSelectStage }) => {
  const stages: {
    id: ArrivalStage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }[] = [
    { id: 'EXPECTED', label: 'Expected', icon: Calendar, accent: 'text-slate-300' },
    { id: 'ARRIVED', label: 'Arrived', icon: Clock, accent: 'text-amber-400' },
    { id: 'QR_VERIFIED', label: 'QR Verified', icon: QrCode, accent: 'text-cyan-400' },
    { id: 'PHOTO_CAPTURED', label: 'Desk Photo', icon: Camera, accent: 'text-blue-400' },
    { id: 'HOST_NOTIFIED', label: 'Host Alerted', icon: BellRing, accent: 'text-purple-400' },
    { id: 'IN_OFFICE', label: 'In Office', icon: DoorOpen, accent: 'text-emerald-400' },
    { id: 'EXITED', label: 'Checked Out', icon: LogOut, accent: 'text-slate-400' },
  ];

  // Group candidate counts by stage
  const countsByStage: Record<ArrivalStage, number> = {
    EXPECTED: 0,
    ARRIVED: 0,
    QR_VERIFIED: 0,
    PHOTO_CAPTURED: 0,
    HOST_NOTIFIED: 0,
    IN_OFFICE: 0,
    EXITED: 0,
  };

  candidates.forEach((c) => {
    const { currentStage } = computeArrivalStage(c);
    countsByStage[currentStage] = (countsByStage[currentStage] || 0) + 1;
  });

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/8 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Visitor & Candidate Intake Flow
          </h3>
        </div>
        {selectedStage && (
          <button
            onClick={() => onSelectStage && onSelectStage(null)}
            className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
          >
            Clear Filter (Showing all {candidates.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stages.map((stg) => {
          const Icon = stg.icon;
          const count = countsByStage[stg.id] || 0;
          const isSelected = selectedStage === stg.id;

          return (
            <motion.button
              key={stg.id}
              onClick={() => onSelectStage && onSelectStage(isSelected ? null : stg.id)}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/15'
                  : count > 0
                  ? 'bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/16 text-slate-200'
                  : 'bg-white/2 border-white/5 opacity-60 hover:opacity-90 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <Icon className={`w-3.5 h-3.5 ${stg.accent}`} />
                <span className="text-xs font-mono font-bold tabular-nums">
                  {count}
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-tight truncate">
                {stg.label}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
