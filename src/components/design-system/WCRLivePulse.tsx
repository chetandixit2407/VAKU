import React from 'react';
import { Sparkles, Activity } from 'lucide-react';

interface WCRLivePulseProps {
  candidatesCount: number;
  waitingCount: number;
  interviewsCount: number;
  roomsOccupiedCount: number;
  actionsCount: number;
  isConnected: boolean;
}

export const WCRLivePulse: React.FC<WCRLivePulseProps> = ({
  candidatesCount,
  waitingCount,
  interviewsCount,
  roomsOccupiedCount,
  actionsCount,
  isConnected,
}) => {
  return (
    <div className="w-full p-3 sm:p-4 bg-white/95 backdrop-blur-xl border border-[#EFE0CC] rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Breathing Live Pulse Pill */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4ED] border border-[#E4CCAF] shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="font-black text-[11px] tracking-wider text-[#171717] uppercase">
            {isConnected ? 'LIVE OFFICE PULSE' : 'OFFLINE'}
          </span>
        </div>

        <span className="text-[11px] text-[#77716B] hidden md:inline font-medium">
          White Collar Realty Operations Engine
        </span>
      </div>

      {/* Center/Right: Live Metrics Strip with clean white + caramel styling */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-[11px]">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF9F6] border border-[#EFE0CC] text-[#77716B]">
          <strong className="text-[#171717] font-extrabold">{candidatesCount}</strong> Candidates
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]">
          <strong className="text-[#171717] font-extrabold">{waitingCount}</strong> Waiting
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1]">
          <strong className="text-[#171717] font-extrabold">{interviewsCount}</strong> Interviews
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] text-[#6B21A8]">
          <strong className="text-[#171717] font-extrabold">{roomsOccupiedCount}</strong> Rooms Occupied
        </div>

        {actionsCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#171717] border border-[#2D2D2D] text-[#D6B28A] font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C99A68] animate-pulse" />
            <strong className="text-white">{actionsCount}</strong> Actions Required
          </div>
        )}
      </div>
    </div>
  );
};
