import React from 'react';
import {
  Users,
  MapPin,
  Clock,
  DoorOpen,
  MessageSquare,
  Award,
  Sparkles,
  ChevronRight,
  FileText,
} from 'lucide-react';
import type { Candidate, Interview } from '../../types/index.ts';
import { WCRGlassCard } from './WCRGlassCard.tsx';
import { WCRCandidateJourney } from './WCRCandidateJourney.tsx';

interface WCRCandidateCardProps {
  candidate: Candidate;
  interview?: Interview | null;
  onOpenDossier: (candidateId: string) => void;
  onAssignRoom?: (candidateId: string, interviewId?: string) => void;
  onAssignToKimmi?: (candidateId: string) => void;
  isAssigningKimmi?: boolean;
  onOpenChatWithContext?: (options: {
    candidateId?: string;
    roomId?: string;
    channelId?: string;
    recipientId?: string;
    initialMessage?: string;
  }) => void;
  showJourneyMini?: boolean;
}

export const WCRCandidateCard: React.FC<WCRCandidateCardProps> = ({
  candidate,
  interview,
  onOpenDossier,
  onAssignRoom,
  onAssignToKimmi,
  isAssigningKimmi = false,
  onOpenChatWithContext,
  showJourneyMini = true,
}) => {
  const isWaiting =
    candidate.status === 'ARRIVED' ||
    candidate.status === 'WAITING' ||
    candidate.status === 'With Kimmi Mam – Senior HR Interview';
  const isInInterview = candidate.status === 'IN_INTERVIEW';
  const isAssignedToKimmi =
    candidate.status === 'With Kimmi Mam – Senior HR Interview' ||
    (candidate as any).assignedInterviewerName?.includes('Kimmi');

  return (
    <WCRGlassCard
      enableTilt={true}
      className="p-4 sm:p-5 transition-all duration-300"
      elevation={isInInterview ? 'high' : 'standard'}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Avatar & Candidate Info */}
        <div className="flex items-start gap-3.5 min-w-0">
          {candidate.livePhoto ? (
            <div className="relative shrink-0">
              <img
                src={candidate.livePhoto}
                alt={candidate.fullName}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-[#E4CCAF] shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
            </div>
          ) : (
            <div className="w-13 h-13 rounded-2xl bg-[#F8F4EE] border border-[#E4CCAF] flex items-center justify-center text-[#B88957] shadow-xs shrink-0">
              <Users className="w-6 h-6" />
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-[#171717] tracking-tight truncate">
                {candidate.fullName}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isWaiting
                    ? 'bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]'
                    : isInInterview
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {candidate.status}
              </span>
            </div>

            <p className="text-xs font-bold text-[#8C6033] truncate">
              {candidate.position}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#77716B] pt-0.5">
              <span className="flex items-center gap-1 text-[#171717]">
                <MapPin className="w-3 h-3 text-[#C99A68]" />
                {candidate.currentLocation || 'Reception Area'}
              </span>

              {candidate.arrivalTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#A8A199]" />
                  Arrived:{' '}
                  {new Date(candidate.arrivalTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}

              {candidate.assignedRoomName && (
                <span className="text-emerald-700 font-bold truncate">
                  Room: {candidate.assignedRoomName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Operational Action Buttons */}
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 shrink-0">
          {/* Kimmi Mam Assignment Button */}
          {onAssignToKimmi && (
            <>
              {isAssignedToKimmi ? (
                <span className="px-3 py-1.5 bg-[#FAF5FF] border border-[#E9D5FF] text-[#6B21A8] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Assigned to Kimmi Mam</span>
                </span>
              ) : (
                <button
                  onClick={() => onAssignToKimmi(candidate.id)}
                  disabled={isAssigningKimmi}
                  className="px-3 py-1.5 bg-[#FAF4ED] hover:bg-[#F3EFE9] text-[#8C6033] font-bold text-xs rounded-xl border border-[#E4CCAF] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Assign candidate for Senior HR round"
                >
                  <Award className="w-3.5 h-3.5 text-[#C99A68]" />
                  <span>{isAssigningKimmi ? 'Assigning...' : 'Assign Kimmi Mam'}</span>
                </button>
              )}
            </>
          )}

          {/* Room Allocation Button - Black primary button */}
          {onAssignRoom && (
            <button
              onClick={() => onAssignRoom(candidate.id, candidate.currentInterviewId)}
              className="px-3.5 py-1.5 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-95 hover:border-[#C99A68]"
            >
              <DoorOpen className="w-3.5 h-3.5 text-[#C99A68]" />
              <span>{candidate.assignedRoomId ? 'Change Room' : 'Assign Room'}</span>
            </button>
          )}

          {/* Quick Chat Escort */}
          {onOpenChatWithContext && (
            <button
              onClick={() =>
                onOpenChatWithContext({
                  candidateId: candidate.id,
                  roomId: candidate.assignedRoomId,
                  channelId: 'reception',
                  initialMessage: `Please escort ${candidate.fullName} to ${
                    candidate.assignedRoomName || 'assigned interview room'
                  }.`,
                })
              }
              className="px-3 py-1.5 bg-white hover:bg-[#FAF9F6] text-[#171717] font-semibold text-xs rounded-xl border border-[#E4CCAF] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C99A68]" />
              <span>Escort</span>
            </button>
          )}

          {/* Dossier Details Button */}
          <button
            onClick={() => onOpenDossier(candidate.id)}
            className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#F3EFE9] text-[#171717] font-semibold text-xs rounded-xl border border-[#EFE0CC] transition cursor-pointer flex items-center gap-1"
          >
            <span>Dossier</span>
            <ChevronRight className="w-3 h-3 text-[#8A847D]" />
          </button>
        </div>
      </div>

      {/* Mini Journey Tracker */}
      {showJourneyMini && (
        <div className="mt-3.5 pt-3 border-t border-[#EFE0CC]">
          <WCRCandidateJourney
            status={candidate.status}
            interviewStage={candidate.interviewRound}
            compact={true}
          />
        </div>
      )}

      {/* Scheduled Interview Context Banner */}
      {interview && (
        <div className="mt-2.5 p-2.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC] flex items-center justify-between text-[11px] text-[#77716B]">
          <span className="truncate">
            Round:{' '}
            <strong className="text-[#171717]">{interview.roundName}</strong> with{' '}
            <strong className="text-[#8C6033]">{interview.interviewerName}</strong>
          </span>
          <span className="font-mono text-[#8A847D] shrink-0 font-medium">
            {interview.scheduledTime}
          </span>
        </div>
      )}
    </WCRGlassCard>
  );
};
