import React from 'react';
import { DoorOpen, Sparkles, User, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Room } from '../../types/index.ts';
import { WCRGlassCard } from './WCRGlassCard.tsx';

interface WCRRoomCardProps {
  room: Room;
  onAssign?: (room: Room) => void;
  onMarkCleaned?: (roomId: string) => void;
  canMarkCleaned?: boolean;
}

export const WCRRoomCard: React.FC<WCRRoomCardProps> = ({
  room,
  onAssign,
  onMarkCleaned,
  canMarkCleaned = false,
}) => {
  const isAvailable = room.status === 'AVAILABLE';
  const isAssigned = room.status === 'ASSIGNED';
  const isOccupied = room.status === 'OCCUPIED';
  const isCleaning = room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING';

  const statusConfig = {
    AVAILABLE: {
      label: 'Available',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.06)]',
      dotColor: 'bg-emerald-500',
    },
    ASSIGNED: {
      label: 'Assigned',
      badgeBg: 'bg-[#FAF4ED] text-[#8C6033] border-[#E4CCAF]',
      glow: 'shadow-[0_4px_20px_rgba(201,154,104,0.08)]',
      dotColor: 'bg-[#C99A68]',
    },
    OCCUPIED: {
      label: 'Occupied',
      badgeBg: 'bg-[#FAF4ED] text-[#8C6033] border-[#E4CCAF]',
      glow: 'shadow-[0_4px_20px_rgba(201,154,104,0.08)]',
      dotColor: 'bg-[#C99A68]',
    },
    CLEANING: {
      label: 'Cleaning (Pantry)',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
      glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.08)]',
      dotColor: 'bg-amber-500',
    },
    NEEDS_CLEANING: {
      label: 'Needs Cleaning',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse',
      glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.08)]',
      dotColor: 'bg-amber-500',
    },
    RESERVED: {
      label: 'Reserved',
      badgeBg: 'bg-[#F5F5F5] text-[#171717] border-[#E0E0E0]',
      glow: '',
      dotColor: 'bg-[#555555]',
    },
    MAINTENANCE: {
      label: 'Maintenance',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      glow: '',
      dotColor: 'bg-rose-500',
    },
  }[room.status] || {
    label: room.status,
    badgeBg: 'bg-stone-50 text-stone-700 border-stone-200',
    glow: '',
    dotColor: 'bg-stone-400',
  };

  return (
    <WCRGlassCard
      enableTilt={true}
      className={`p-3.5 sm:p-4 transition-all duration-300 ${statusConfig.glow}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] shrink-0">
            <DoorOpen className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h4 className="font-extrabold text-sm text-[#171717] tracking-tight truncate">{room.name}</h4>
            <p className="text-[10px] text-[#77716B] capitalize font-medium">
              {room.type?.replace('_', ' ').toLowerCase() || 'Meeting Room'}
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} ${isCleaning ? 'animate-ping' : ''}`} />
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig.badgeBg}`}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Occupant or Interview info if available */}
      {room.currentCandidateName && (
        <div className="mt-2.5 pt-2 border-t border-[#EFE0CC] flex items-center justify-between text-[11px]">
          <span className="text-[#77716B] flex items-center gap-1 truncate">
            <User className="w-3 h-3 text-[#C99A68]" />
            Occupant: <strong className="text-[#171717]">{room.currentCandidateName}</strong>
          </span>
          {room.assignedInterviewerName && (
            <span className="text-[#8C6033] font-bold truncate ml-2">
              with {room.assignedInterviewerName}
            </span>
          )}
        </div>
      )}

      {/* Cleaning workflow action */}
      {isCleaning && canMarkCleaned && onMarkCleaned && (
        <div className="mt-3 pt-2.5 border-t border-[#EFE0CC] flex items-center justify-between gap-2">
          <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
            Cleaning In Progress
          </span>
          <button
            onClick={() => onMarkCleaned(room.id)}
            className="px-3 py-1 bg-[#171717] hover:bg-[#282828] text-white font-bold text-[11px] rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Mark Ready</span>
          </button>
        </div>
      )}
    </WCRGlassCard>
  );
};
