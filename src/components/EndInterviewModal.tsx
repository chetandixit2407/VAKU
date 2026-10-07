import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Sparkles,
  Award,
  DoorOpen,
} from 'lucide-react';
import type { User, InterviewOutcome, Room } from '../types/index.ts';

interface EndInterviewModalProps {
  interviewId: string;
  candidateName: string;
  interviewerName: string;
  currentRound: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EndInterviewModal: React.FC<EndInterviewModalProps> = ({
  interviewId,
  candidateName,
  interviewerName,
  currentRound,
  onClose,
  onSuccess,
}) => {
  const [outcome, setOutcome] = useState<InterviewOutcome>('NEXT_INTERVIEW');
  const [notes, setNotes] = useState<string>('Strong commercial acumen, domain knowledge of luxury residential market.');
  const [nextInterviewerId, setNextInterviewerId] = useState<string>('usr-int-2');
  const [nextRoundName, setNextRoundName] = useState<string>('Round 2 - HR & Culture Fit');
  const [nextRoomId, setNextRoomId] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bootRes, roomsRes] = await Promise.all([
        fetch('/api/bootstrap'),
        fetch('/api/rooms'),
      ]);
      const data = await bootRes.json();
      if (data.success) {
        // Find other interviewers & HR & CO_FOUNDER (Kimmi Mam)
        const potential = data.users.filter(
          (u: User) => u.role === 'INTERVIEWER' || u.role === 'HR' || u.role === 'CEO' || u.role === 'CO_FOUNDER'
        );
        // Ensure Kimmi Mam has Senior HR Interview label
        potential.forEach((u: User) => {
          if (u.id === 'usr-cofounder-kimmi' || u.name.includes('Kimmi')) {
            u.name = 'Kimmi Mam – Senior HR Interview';
          }
        });
        setStaffUsers(potential);
      }

      const roomsData = await roomsRes.json();
      if (roomsData.success && Array.isArray(roomsData.rooms)) {
        setRooms(roomsData.rooms);
      }
    } catch (err) {
      console.error('Failed to load data for Next Round setup', err);
    }
  };

  const handleInterviewerChange = (userId: string) => {
    setNextInterviewerId(userId);
    const user = staffUsers.find((u) => u.id === userId);
    if (userId === 'usr-cofounder-kimmi' || user?.name?.includes('Kimmi')) {
      setNextRoundName('Senior HR Interview');
      setNextRoomId('room-kimmi-cabin'); // Elegance Suite
    } else if (userId === 'usr-ceo-lalit' || user?.name?.includes('Lalit')) {
      setNextRoundName('CEO Leadership Round');
      setNextRoomId('room-lalit-cabin'); // Lalit Sir Cabin
    }
  };

  const handleEnd = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewerName,
          outcome,
          notes,
          nextInterviewerId: outcome === 'NEXT_INTERVIEW' ? nextInterviewerId : undefined,
          nextRoundName: outcome === 'NEXT_INTERVIEW' ? nextRoundName : undefined,
          nextRoomId: outcome === 'NEXT_INTERVIEW' && nextRoomId ? nextRoomId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete interview');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Action failed');
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
              Interviewer Evaluation & Outcome
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">Conclude Interview Round</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate: <strong className="text-slate-200">{candidateName}</strong> • {currentRound}
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
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300">
              {error}
            </div>
          )}

          {/* Outcome Choice */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">
              Select Human Business Decision: <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutcome('NEXT_INTERVIEW')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  outcome === 'NEXT_INTERVIEW'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <strong className="block font-bold">Advance to Next Round</strong>
                  <span className="text-[10px] text-slate-400">Choose next interviewer</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('SELECTED')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  outcome === 'SELECTED'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <strong className="block font-bold">Selected / Offer</strong>
                  <span className="text-[10px] text-slate-400">Final hiring recommendation</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('HOLD')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  outcome === 'HOLD'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <strong className="block font-bold">Keep on Hold</strong>
                  <span className="text-[10px] text-slate-400">Awaiting candidate pool</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('REJECTED')}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  outcome === 'REJECTED'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-md ring-1 ring-rose-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <strong className="block font-bold">Reject / Exit</strong>
                  <span className="text-[10px] text-slate-400">Route to checkout</span>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Next Round details */}
          {outcome === 'NEXT_INTERVIEW' && (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Next Evaluation Setup
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Assign Next Interviewer:
                  </label>
                  <select
                    value={nextInterviewerId}
                    onChange={(e) => handleInterviewerChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
                  >
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role} - {u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Next Round Title:
                  </label>
                  <input
                    type="text"
                    value={nextRoundName}
                    onChange={(e) => setNextRoundName(e.target.value)}
                    placeholder="e.g. Round 2 - Leadership"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Next Round Room (Optional / Direct Allocation):
                    </label>
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Next Round Reserved Cabins Available
                    </span>
                  </div>
                  <select
                    value={nextRoomId}
                    onChange={(e) => setNextRoomId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="">— Assign later from Lobby (Default) —</option>
                    <optgroup label="👑 Reserved Senior Leadership Cabins">
                      {rooms
                        .filter(
                          (r) =>
                            r.id === 'room-kimmi-cabin' ||
                            r.id === 'room-lalit-cabin' ||
                            r.name === 'Elegance Suite' ||
                            r.name === 'Lalit Sir Cabin' ||
                            r.isReservedNextRound
                        )
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            ★ {r.name} ({r.status === 'AVAILABLE' ? 'Available' : r.status}) — {r.preferredFor || 'Senior Round'}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="🏢 Standard Operational Rooms">
                      {rooms
                        .filter(
                          (r) =>
                            r.id !== 'room-kimmi-cabin' &&
                            r.id !== 'room-lalit-cabin' &&
                            r.name !== 'Elegance Suite' &&
                            r.name !== 'Lalit Sir Cabin' &&
                            !r.isReservedNextRound
                        )
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.status === 'AVAILABLE' ? 'Available' : r.status})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Interviewer Evaluation Notes & Private HR Feedback:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Candidate strengths, communication, culture fit, compensation remarks..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleEnd}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Submitting Decision...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Finalize Decision & Conclude
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
