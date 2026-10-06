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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              HR Human Decision Required
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">Assign Interview Room</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate: <strong className="text-slate-200">{candidateName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Select Room for Candidate Allocation:
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoomCategory('operational')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    roomCategory === 'operational'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Operational Rooms
                </button>
                <button
                  type="button"
                  onClick={() => setRoomCategory('next_round')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    roomCategory === 'next_round'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Next Round Cabins</span>
                </button>
              </div>
            </div>

            {roomCategory === 'next_round' && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Reserved for Senior & Next Round Interviews:</strong> Lalit Sir Cabin and Elegance Suite.
                </span>
              </div>
            )}

            {loadingRooms ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading room availability...</div>
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
                          ? 'opacity-40 bg-slate-950/40 border-slate-800 cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500/10 border-amber-500/80 shadow-md ring-1 ring-amber-500/40 cursor-pointer'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <DoorOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{room.name}</h4>
                            {(room.id === 'room-lalit-cabin' || room.id === 'room-kimmi-cabin' || room.name === 'Elegance Suite' || room.name === 'Lalit Sir Cabin') && (
                              <span className="px-1.5 py-0.2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-sm text-[9px] font-bold">
                                Next Round Reserved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                            <span>Type: {room.type?.replace('_', ' ') || 'Meeting Room'}</span>
                            {room.preferredFor && (
                              <span className="truncate max-w-[200px]">({room.preferredFor})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : isAvail ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
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

          {/* Workflow Automation Guarantee Preview */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>10 System Operations Automated Automatically Upon Decision:</span>
            </div>
            <ul className="text-[10px] text-slate-400 space-y-1 pl-4 list-disc">
              <li>Reserve selected room & block double-booking</li>
              <li>Update candidate location to room & status to <code>ROOM_ASSIGNED</code></li>
              <li>Notify assigned interviewer with room details and 'Start Interview' action</li>
              <li>Notify reception with escort guidance</li>
              <li>Generate Pantry hospitality preparation task (water bottles & setup)</li>
              <li>Update live operational dashboards in real time</li>
              <li>Log audit trail with actor name and timestamp</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={submitting || !selectedRoomId}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Automating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Room & Automate Tasks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
