import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  DoorOpen,
  Calendar,
  MessageSquare,
  X,
  ArrowRight,
  Sparkles,
  Command,
} from 'lucide-react';
import type { Candidate, Room, Interview, ActionTask } from '../../types/index.ts';

interface WCRCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  rooms: Room[];
  interviews: Interview[];
  actionTasks?: ActionTask[];
  onSelectCandidate: (candidateId: string) => void;
  onSelectRoom?: (room: Room) => void;
  onOpenChat?: () => void;
}

export const WCRCommandPalette: React.FC<WCRCommandPaletteProps> = ({
  isOpen,
  onClose,
  candidates,
  rooms,
  interviews,
  actionTasks = [],
  onSelectCandidate,
  onSelectRoom,
  onOpenChat,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredCandidates = candidates.filter(
    (c) =>
      c.fullName.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      c.status.toLowerCase().includes(q)
  );

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      (r.currentCandidateName && r.currentCandidateName.toLowerCase().includes(q))
  );

  const filteredInterviews = interviews.filter(
    (i) =>
      i.candidateName.toLowerCase().includes(q) ||
      i.interviewerName.toLowerCase().includes(q) ||
      i.roundName.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white/98 border border-[#EFE0CC] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.15)] overflow-hidden text-[#171717] flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#EFE0CC] flex items-center gap-3 bg-[#FAF9F6]">
          <Search className="w-5 h-5 text-[#8C6033] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates, rooms, interviews, staff or tasks... (ESC to close)"
            className="flex-1 bg-transparent text-[#171717] placeholder-[#8A847D] text-sm sm:text-base outline-none font-medium"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF] hidden sm:inline">
              ESC
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-[#77716B] hover:text-[#171717] hover:bg-[#F3EFE9] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Candidates Group */}
          {filteredCandidates.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C6033] px-2 mb-2 flex items-center justify-between">
                <span>Candidates ({filteredCandidates.length})</span>
                <Users className="w-3.5 h-3.5 text-[#8A847D]" />
              </div>
              <div className="space-y-1">
                {filteredCandidates.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCandidate(c.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#EFE0CC] hover:border-[#C99A68] flex items-center justify-between gap-3 cursor-pointer transition text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      {c.livePhoto ? (
                        <img
                          src={c.livePhoto}
                          alt=""
                          className="w-8 h-8 rounded-xl object-cover border border-[#E4CCAF]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033]">
                          <Users className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-[#171717]">{c.fullName}</div>
                        <div className="text-[11px] text-[#8C6033] font-medium">{c.position}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]">
                        {c.status}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8A847D]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rooms Group */}
          {filteredRooms.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C6033] px-2 mb-2 flex items-center justify-between">
                <span>Office Rooms ({filteredRooms.length})</span>
                <DoorOpen className="w-3.5 h-3.5 text-[#8A847D]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredRooms.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (onSelectRoom) onSelectRoom(r);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#EFE0CC] hover:border-[#C99A68] flex items-center justify-between gap-2 cursor-pointer transition text-xs shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-[#171717]">{r.name}</div>
                      <div className="text-[10px] text-[#77716B]">
                        {r.currentCandidateName ? `Occupied by ${r.currentCandidateName}` : r.status}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          {query.length === 0 && (
            <div className="pt-2 border-t border-[#EFE0CC]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A847D] px-2 block mb-2">
                Quick Shortcuts
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {onOpenChat && (
                  <button
                    onClick={() => {
                      onOpenChat();
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F3EFE9] border border-[#EFE0CC] flex items-center gap-2 text-[#171717] font-semibold transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-[#8C6033]" />
                    <span>Open Office Chat</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredCandidates.length === 0 &&
            filteredRooms.length === 0 &&
            filteredInterviews.length === 0 && (
              <div className="p-8 text-center text-xs text-[#8A847D]">
                No matching results found for "{query}".
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
