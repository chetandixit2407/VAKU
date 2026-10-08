import React, { useState, useEffect } from 'react';
import {
  X,
  DoorOpen,
  CheckCircle2,
  Users,
  Zap,
  Sparkles,
  RefreshCw,
  Bell,
  Coffee,
  UserCheck,
} from 'lucide-react';
import type { Room } from '../types/index.ts';

interface AssignRoomModalProps {
  candidateId: string;
  candidateName?: string;
  interviewId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignRoomModal: React.FC<AssignRoomModalProps> = ({
  candidateId,
  candidateName = 'Candidate',
  interviewId,
  onClose,
  onSuccess,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCategory, setRoomCategory] = useState<'operational' | 'next_round'>('operational');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
        // Pre-select first available operational room
        const firstAvail = data.rooms.find(
          (r: Room) =>
            r.status === 'AVAILABLE' &&
            r.id !== 'room-lalit-cabin' &&
            r.id !== 'room-kimmi-cabin' &&
            r.name !== 'Lalit Sir Cabin' &&
            r.name !== 'Elegance Suite' &&
            !r.isReservedNextRound
        ) || data.rooms.find((r: Room) => r.status === 'AVAILABLE');
        if (firstAvail) setSelectedRoomId(firstAvail.id);
      }
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRoomId) {
      setError('Please select an available room.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/rooms/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hrUserId: 'usr-hr-1',
          hrName: 'Sneha Patel (HR Lead)',
          candidateId,
          interviewId,
          roomId: selectedRoomId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign room');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Room assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white/95 border border-[#EFE0CC] rounded-3xl max-w-lg w-full shadow-[0_24px_60px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#111111]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EFE0CC] flex items-center justify-between bg-white/50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6033] block">
              HR Human Decision Required
            </span>
            <h2 className="text-lg font-bold text-[#111111] mt-0.5">Assign Interview Room</h2>
            <p className="text-xs text-[#77716B] mt-0.5">
              Candidate: <strong className="text-[#111111]">{candidateName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#77716B] hover:text-[#111111] hover:bg-[#FAF4ED] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#111111]">
                Select Room for Candidate Allocation:
              </label>
              <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-xl border border-[#EFE0CC]">
                <button
                  type="button"
                  onClick={() => setRoomCategory('operational')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    roomCategory === 'operational'
                      ? 'bg-[#171717] text-white shadow-xs'
                      : 'text-[#77716B] hover:text-[#111111]'
                  }`}
                >
                  Operational Rooms
                </button>
                <button
                  type="button"
                  onClick={() => setRoomCategory('next_round')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    roomCategory === 'next_round'
                      ? 'bg-[#171717] text-white shadow-xs'
                      : 'text-[#8C6033] hover:text-[#111111]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#C99A68]" />
                  <span>Next Round Cabins</span>
                </button>
              </div>
            </div>

            {roomCategory === 'next_round' && (
              <div className="p-2.5 bg-[#FAF4ED] border border-[#E4CCAF] rounded-xl text-[11px] text-[#8C6033] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-[#C99A68]" />
                <span>
                  <strong>Reserved for Senior & Next Round Interviews:</strong> Lalit Sir Cabin and Elegance Suite.
                </span>
              </div>
            )}

            {loadingRooms ? (
              <div className="p-8 text-center text-xs text-[#77716B]">Loading room availability...</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {rooms
                  .filter((room) => {
                    const isReserved =
                      room.id === 'room-lalit-cabin' ||
                      room.id === 'room-kimmi-cabin' ||
                      room.roomId === 'room-lalit-cabin' ||
                      room.roomId === 'room-kimmi-cabin' ||
                      room.name === 'Lalit Sir Cabin' ||
                      room.name === 'Elegance Suite' ||
                      room.isReservedNextRound;
                    return roomCategory === 'next_round' ? isReserved : !isReserved;
                  })
                  .map((room) => {
                  const isAvail = room.status === 'AVAILABLE';
                  const isSelected = selectedRoomId === room.id;

                  return (
                    <div
                      key={room.id}
                      onClick={() => isAvail && setSelectedRoomId(room.id)}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                        !isAvail
                          ? 'opacity-40 bg-[#FAF9F6] border-[#EFE0CC] cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#FAF4ED] border-[#C99A68] shadow-md ring-1 ring-[#C99A68] cursor-pointer'
                          : 'bg-white hover:bg-[#FAF9F6] border-[#EFE0CC] hover:border-[#D6B28A] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#C99A68] text-white shadow-xs'
                              : 'bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]'
                          }`}
                        >
                          <DoorOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#111111]">{room.name}</h4>
                            {(room.id === 'room-lalit-cabin' || room.id === 'room-kimmi-cabin' || room.name === 'Elegance Suite' || room.name === 'Lalit Sir Cabin') && (
                              <span className="px-1.5 py-0.5 bg-[#FAF4ED] border border-[#E4CCAF] text-[#8C6033] rounded-md text-[9px] font-bold">
                                Next Round Reserved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[#77716B] mt-0.5">
                            <span>Type: {room.type?.replace('_', ' ') || 'Meeting Room'}</span>
                            {room.preferredFor && (
                              <span className="truncate max-w-[200px]">({room.preferredFor})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-[#171717] text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : isAvail ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available
                          </span>
                        ) : room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Cleaning
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F5F5] text-[#171717] border border-[#E0E0E0]">
                            {room.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EFE0CC] bg-white/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#77716B] hover:text-[#111111] text-xs font-semibold border border-[#EFE0CC] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={submitting || !selectedRoomId}
            className="px-5 py-2.5 rounded-xl bg-[#171717] hover:bg-[#282828] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Confirm Room Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
