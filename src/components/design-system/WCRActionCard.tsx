import React from 'react';
import { Sparkles, Clock, CheckCircle2, User, ArrowRight, ShieldAlert } from 'lucide-react';
import type { ActionTask } from '../../types/index.ts';

interface WCRActionCardProps {
  task: ActionTask;
  onAcknowledge?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onActionClick?: (task: ActionTask) => void;
}

export const WCRActionCard: React.FC<WCRActionCardProps> = ({
  task,
  onAcknowledge,
  onComplete,
  onActionClick,
}) => {
  const isPending = task.status === 'PENDING';
  const isAcknowledged = task.status === 'ACKNOWLEDGED' || task.status === 'IN_PROGRESS';
  const isHighPriority = task.priority === 'HIGH' || task.priority === 'CRITICAL';

  // High priority uses the signature dark charcoal inner panel (#171717)
  if (isHighPriority) {
    return (
      <div className="relative p-4 rounded-2xl bg-[#171717] text-white border border-[#2A2A2A] shadow-xl hover:border-[#C99A68]/50 transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C99A68] animate-ping shrink-0" />
              <h4 className="font-extrabold text-sm text-[#FDFCF9] tracking-tight truncate">
                {task.title}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#C99A68]/20 text-[#D6B28A] border border-[#C99A68]/30">
                HIGH PRIORITY
              </span>
            </div>

            <p className="text-xs text-[#C5BFB8] line-clamp-2 leading-relaxed">
              {task.instruction}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8A847D] pt-1">
              <span className="flex items-center gap-1 text-[#D6B28A]">
                <User className="w-3 h-3 text-[#C99A68]" />
                Role: <strong className="text-white">{task.targetRole}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8A847D]" />
                {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {task.candidateName && (
                <span className="text-[#E4CCAF] font-bold truncate">
                  Candidate: {task.candidateName}
                </span>
              )}
              {task.roomName && (
                <span className="text-emerald-400 font-bold truncate">
                  Room: {task.roomName}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isPending && onAcknowledge && (
              <button
                onClick={() => onAcknowledge(task.id)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#171717] border border-[#E4CCAF] font-bold text-xs transition cursor-pointer shadow-sm active:scale-95"
              >
                Acknowledge
              </button>
            )}

            {isAcknowledged && onComplete && (
              <button
                onClick={() => onComplete(task.id)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>
            )}

            {onActionClick && (
              <button
                onClick={() => onActionClick(task)}
                className="p-2 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#3E3E3E] text-[#D6B28A] hover:text-white transition cursor-pointer"
                title="Open task context"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard operational rows: clean white card with small caramel indicators
  return (
    <div
      className={`
        relative p-4 rounded-2xl border transition-all duration-300
        bg-white/95 border-[#EFE0CC] shadow-[0_4px_20px_rgba(0,0,0,0.03)]
        hover:border-[#C99A68]/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C99A68]" />
            <h4 className="font-extrabold text-sm text-[#171717] tracking-tight truncate">
              {task.title}
            </h4>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                isPending
                  ? 'bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]'
                  : 'bg-sky-50 text-sky-700 border border-sky-200'
              }`}
            >
              {isPending ? 'Action Required' : 'In Progress'}
            </span>
          </div>

          <p className="text-xs text-[#77716B] line-clamp-2 leading-relaxed">{task.instruction}</p>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8A847D] pt-1">
            <span className="flex items-center gap-1 text-[#8C6033]">
              <User className="w-3 h-3 text-[#C99A68]" />
              Role: <strong className="text-[#171717]">{task.targetRole}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#A8A199]" />
              {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {task.candidateName && (
              <span className="text-[#8C6033] font-bold truncate">
                Candidate: {task.candidateName}
              </span>
            )}
            {task.roomName && (
              <span className="text-emerald-700 font-bold truncate">
                Room: {task.roomName}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls - Black/charcoal button with white text and caramel hover */}
        <div className="flex items-center gap-2 shrink-0">
          {isPending && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(task.id)}
              className="px-3.5 py-1.5 rounded-xl bg-[#171717] hover:bg-[#282828] hover:border-[#C99A68] text-white font-bold text-xs transition cursor-pointer shadow-sm active:scale-95"
            >
              Acknowledge
            </button>
          )}

          {isAcknowledged && onComplete && (
            <button
              onClick={() => onComplete(task.id)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete</span>
            </button>
          )}

          {onActionClick && (
            <button
              onClick={() => onActionClick(task)}
              className="p-2 rounded-xl bg-[#F8F4EE] hover:bg-[#EFE0CC] border border-[#E4CCAF] text-[#8C6033] hover:text-[#171717] transition cursor-pointer"
              title="Open task context"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
