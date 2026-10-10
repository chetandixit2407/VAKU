import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  LogOut,
  ChevronRight,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { Candidate, Visitor } from '../types/index.ts';

export type ArrivalStage =
  | 'EXPECTED'
  | 'ARRIVED'
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
    return { currentStage: 'EXITED', stageIndex: 3 };
  }
  if (
    status === 'IN_INTERVIEW' ||
    status === 'ROOM_ASSIGNED' ||
    status === 'COMPLETED' ||
    status === 'OFFERED' ||
    status === 'REJECTED' ||
    status.includes('Kimmi Mam') ||
    status.includes('Interview')
  ) {
    return { currentStage: 'IN_OFFICE', stageIndex: 2 };
  }
  if (
    status === 'ARRIVED' ||
    status === 'WAITING' ||
    candidate.checkedInAt ||
    candidate.receptionPhotoUrl ||
    candidate.photoUrl ||
    candidate.livePhoto ||
    candidate.arrivalPhoto ||
    candidate.qrVerificationStatus === 'VERIFIED'
  ) {
    return { currentStage: 'ARRIVED', stageIndex: 1 };
  }

  return { currentStage: 'EXPECTED', stageIndex: 0 };
}

export function computeVisitorArrivalStage(visitor: Visitor): ArrivalStage {
  const status = visitor.status || '';
  if (status === 'CHECKED_OUT') {
    return 'EXITED';
  }
  if (
    status === 'MEETING' ||
    (status as string) === 'IN_MEETING' ||
    (visitor.roomAssigned &&
      visitor.roomAssigned !== 'Pending Allocation' &&
      visitor.roomAssigned !== 'Pending Room Allocation')
  ) {
    return 'IN_OFFICE';
  }
  if (status === 'CHECKED_IN' || visitor.checkInTime) {
    return 'ARRIVED';
  }
  return 'EXPECTED';
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
    { id: 'IN_OFFICE', label: 'In Office', icon: DoorOpen },
    { id: 'EXITED', label: 'Checked Out', icon: LogOut },
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
      <div className="flex items-center justify-between min-w-[480px] gap-2">
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

export interface UnifiedRecordItem {
  id: string;
  recordType: 'CANDIDATE' | 'VISITOR';
  fullName: string;
  phone?: string;
  email?: string;
  positionOrPurpose: string;
  departmentOrCompany: string;
  hostOrRecruiter: string;
  checkInTime?: string;
  status: string;
  currentStage: ArrivalStage;
  room?: string;
  rawCandidate?: Candidate;
  rawVisitor?: Visitor;
}

export const VisitorJourneyOverview: React.FC<{
  candidates: Candidate[];
  visitors?: Visitor[];
  selectedStage?: ArrivalStage | null;
  onSelectStage?: (stage: ArrivalStage | null) => void;
  onOpenStageDetails?: (stage: ArrivalStage) => void;
  onOpenDossier?: (candidateId: string) => void;
  onCheckout?: (candidateId: string) => void;
  onClearAllFilters?: () => void;
}> = ({
  candidates,
  visitors = [],
  selectedStage,
  onSelectStage,
  onOpenStageDetails,
  onOpenDossier,
  onCheckout,
  onClearAllFilters,
}) => {
  const handleTileClick = (stageId: ArrivalStage) => {
    if (onSelectStage) {
      // Toggle off if clicking the already-selected stage, or switch to the new stage
      const nextStage = selectedStage === stageId ? null : stageId;
      onSelectStage(nextStage);
    }
  };

  const handleManualClear = () => {
    if (onSelectStage) {
      onSelectStage(null);
    }
    if (onClearAllFilters) {
      onClearAllFilters();
    }
  };

  const stages: {
    id: ArrivalStage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    description: string;
  }[] = [
    {
      id: 'EXPECTED',
      label: 'Expected',
      icon: Calendar,
      accent: 'text-slate-300',
      description: 'Scheduled appointments & expected arrivals',
    },
    {
      id: 'ARRIVED',
      label: 'Arrived',
      icon: Clock,
      accent: 'text-amber-400',
      description: 'Checked-in & waiting in reception lounge',
    },
    {
      id: 'IN_OFFICE',
      label: 'In Office',
      icon: DoorOpen,
      accent: 'text-emerald-400',
      description: 'Assigned to rooms or in active evaluation',
    },
    {
      id: 'EXITED',
      label: 'Checked Out',
      icon: LogOut,
      accent: 'text-slate-400',
      description: 'Concluded visits & departed premises',
    },
  ];

  // Map candidates to unified records
  const unifiedCandidateRecords: UnifiedRecordItem[] = candidates.map((c) => {
    const { currentStage } = computeArrivalStage(c);
    return {
      id: c.id,
      recordType: 'CANDIDATE',
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,
      positionOrPurpose: c.position || c.purpose || 'Job Applicant',
      departmentOrCompany: c.department || c.currentCompany || 'Sales & Operations',
      hostOrRecruiter: c.assignedInterviewerName || c.personToMeet || 'HR Panel',
      checkInTime: c.checkedInAt || c.arrivalTime,
      status: c.status,
      currentStage,
      room: c.assignedRoomName,
      rawCandidate: c,
    };
  });

  // Map visitors to unified records
  const unifiedVisitorRecords: UnifiedRecordItem[] = visitors.map((v) => {
    const currentStage = computeVisitorArrivalStage(v);
    return {
      id: v.id,
      recordType: 'VISITOR',
      fullName: v.fullName,
      phone: v.phone,
      email: v.email,
      positionOrPurpose: v.purpose || (v.visitorType ? `Visitor (${v.visitorType})` : 'Business Visit'),
      departmentOrCompany: v.company || v.hostDepartment || 'Official Guest',
      hostOrRecruiter: v.hostName || 'Reception Assistance',
      checkInTime: v.checkInTime,
      status: v.status,
      currentStage,
      room: v.roomAssigned,
      rawVisitor: v,
    };
  });

  // All unified records
  const allUnifiedRecords = [...unifiedCandidateRecords, ...unifiedVisitorRecords];

  // Group counts strictly by stage from the exact records
  const countsByStage: Record<ArrivalStage, number> = {
    EXPECTED: 0,
    ARRIVED: 0,
    IN_OFFICE: 0,
    EXITED: 0,
  };

  allUnifiedRecords.forEach((r) => {
    countsByStage[r.currentStage] = (countsByStage[r.currentStage] || 0) + 1;
  });

  // Records filtered by the selected stage
  const matchingRecords = selectedStage
    ? allUnifiedRecords.filter((r) => r.currentStage === selectedStage)
    : [];

  const selectedStageMeta = stages.find((s) => s.id === selectedStage) || stages[0];

  return (
    <div className="intake-flow-container bg-[#0B0F14] rounded-2xl p-4 border border-white/12 border-t-white/20 space-y-4 shadow-xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Visitor & Candidate Intake Flow
          </h3>
          <span className="text-[10px] text-[#AEB7C4] hidden md:inline">
            (Click any stage card to view records & filter queue)
          </span>
        </div>
        {selectedStage ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-300 font-mono font-medium">
              Stage: <strong>{selectedStageMeta?.label}</strong> ({matchingRecords.length} records)
            </span>
            <button
              type="button"
              onClick={handleManualClear}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset / Clear Filter</span>
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-[#AEB7C4] font-mono">
            Showing all ({allUnifiedRecords.length}) records
          </span>
        )}
      </div>

      {/* 4 Stage Cards Evenly Distributed Across Available Width */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {stages.map((stg) => {
          const Icon = stg.icon;
          const count = countsByStage[stg.id] || 0;
          const isSelected = selectedStage === stg.id;

          return (
            <motion.button
              key={stg.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleTileClick(stg.id)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`intake-stage-card p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group select-none focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2 ${
                isSelected
                  ? 'is-selected bg-amber-500/20 border-amber-400 text-white shadow-xl ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-[#141820] border-[#252A32] text-white shadow-md hover:bg-[#1B2028] hover:border-white/20'
              }`}
              title={`Click to filter ${stg.label} records (${count})`}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5">
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-400 text-slate-950 uppercase">
                    Active
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-1 mb-2 pointer-events-none">
                <div
                  className={`intake-icon-badge w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-white/[0.06] border border-white/[0.08]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : stg.accent}`} />
                </div>
                <span className="text-base font-mono font-bold tabular-nums text-white intake-stage-count pr-1">
                  {count}
                </span>
              </div>
              <p className="text-xs font-bold tracking-tight truncate text-[#F5F6F8] intake-stage-label pointer-events-none">
                {stg.label}
              </p>
              <p className="text-[10px] text-[#AEB7C4] truncate mt-0.5 pointer-events-none">
                {stg.description}
              </p>
              <div
                className={`flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.08] text-[9px] transition-opacity pointer-events-none ${
                  isSelected ? 'text-amber-300 opacity-100 font-bold' : 'text-[#AEB7C4] opacity-0 group-hover:opacity-100'
                }`}
              >
                <span>{isSelected ? 'Selected • Click to Clear' : 'View Records'}</span>
                <span>&rarr;</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Interactive Filtered Records Details Panel When A Card Is Clicked */}
      <AnimatePresence>
        {selectedStage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-[#0E131A] border border-amber-500/30 space-y-3 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                    <selectedStageMeta.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                      <span>{selectedStageMeta?.label} Records ({matchingRecords.length})</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Stage Filter Active
                      </span>
                    </h4>
                    <p className="text-[10px] text-[#AEB7C4]">
                      Showing relevant visitors and candidates for {selectedStageMeta?.label}.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualClear}
                  className="px-3 py-1 bg-white/6 hover:bg-white/10 text-white text-xs font-semibold rounded-lg border border-white/10 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Clear Filter & Restore All</span>
                </button>
              </div>

              {/* Records Listing or Clean Empty State */}
              {matchingRecords.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-2 bg-[#141820] rounded-xl border border-white/6">
                  <div className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-white">
                    No records found for {selectedStageMeta?.label}
                  </h5>
                  <p className="text-[11px] text-[#AEB7C4] max-w-md mx-auto">
                    There are currently no candidates or visitors in this stage. Click another card or restore the full view.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleManualClear}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      Restore All Records
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matchingRecords.map((item) => {
                    const isCandidate = item.recordType === 'CANDIDATE';
                    return (
                      <div
                        key={`${item.recordType}-${item.id}`}
                        className="p-3.5 rounded-xl bg-[#141820] border border-white/8 hover:border-amber-400/50 transition shadow-sm space-y-2.5 text-xs text-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-bold text-xs text-white truncate">
                                {item.fullName}
                              </h5>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                  isCandidate
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                }`}
                              >
                                {isCandidate ? 'Candidate' : 'Visitor'}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-300 font-medium truncate mt-0.5">
                              {item.positionOrPurpose}
                            </p>
                            <p className="text-[10px] text-[#AEB7C4] truncate">
                              {item.departmentOrCompany}
                            </p>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/10 text-white shrink-0 border border-white/15">
                            {item.status}
                          </span>
                        </div>

                        {/* Metadata Details */}
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-1 text-[10px] text-slate-300">
                          <div className="flex justify-between items-center gap-1">
                            <span className="text-[#AEB7C4]">Host / Recruiter:</span>
                            <span className="font-medium text-white truncate max-w-[150px]">
                              {item.hostOrRecruiter}
                            </span>
                          </div>
                          {item.phone && (
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-[#AEB7C4]">Contact:</span>
                              <span className="font-mono text-amber-300">{item.phone}</span>
                            </div>
                          )}
                          {item.checkInTime && (
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-[#AEB7C4]">Arrival / Check-in:</span>
                              <span className="font-mono text-slate-300">
                                {new Date(item.checkInTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                          {item.room && (
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-[#AEB7C4]">Room:</span>
                              <span className="text-emerald-400 font-semibold">{item.room}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/6 text-[10px]">
                          <span className="text-[#AEB7C4] font-mono">
                            ID: {item.id.slice(0, 12)}...
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isCandidate && onOpenDossier && (
                              <button
                                type="button"
                                onClick={() => onOpenDossier(item.id)}
                                className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Dossier</span>
                              </button>
                            )}
                            {item.status !== 'CHECKED_OUT' && onCheckout && (
                              <button
                                type="button"
                                onClick={() => onCheckout(item.id)}
                                className="px-2 py-1 rounded-md bg-white/8 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-semibold border border-white/10 transition flex items-center gap-1 cursor-pointer"
                              >
                                <LogOut className="w-3 h-3" />
                                <span>Check-Out</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

