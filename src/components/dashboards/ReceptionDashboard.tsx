import React, { useState, useEffect } from 'react';
import {
  Building,
  UserCheck,
  LogOut,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Sparkles,
  QrCode,
  ArrowRight,
  Camera,
  ShieldCheck,
  FileText,
  Eye,
  AlertTriangle,
  User,
  Search,
} from 'lucide-react';
import type { Candidate, Room, Visitor } from '../../types/index.ts';
import { ReceptionPhotoModal } from '../ReceptionPhotoModal.tsx';
import { CandidateDossierModal } from '../CandidateDossierModal.tsx';

interface ReceptionDashboardProps {
  candidates: Candidate[];
  rooms: Room[];
  visitors: Visitor[];
  onCheckout: (candidateId: string) => void;
  onOpenCheckIn: () => void;
  onOpenWalkIn: () => void;
  onOpenQR: () => void;
  onRefresh?: () => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  candidates,
  rooms,
  visitors,
  onCheckout,
  onOpenCheckIn,
  onOpenWalkIn,
  onOpenQR,
  onRefresh,
}) => {
  const [selectedPhotoCandidate, setSelectedPhotoCandidate] = useState<Candidate | null>(null);
  const [selectedProfileCandidateId, setSelectedProfileCandidateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WAITING' | 'IN_MEETING' | 'CHECKOUT'>('ALL');

  // Real-time EventSource listener for instant reception updates on new QR registrations
  useEffect(() => {
    const es = new EventSource('/api/events?role=RECEPTION');
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === 'CANDIDATE_FORM_SUBMITTED' ||
          data.type === 'CANDIDATE_ARRIVED' ||
          data.type === 'CANDIDATE_LIVE_PHOTO_CAPTURED' ||
          data.type === 'ROOM_ASSIGNED' ||
          data.type === 'INTERVIEW_COMPLETED' ||
          data.type === 'CANDIDATE_CHECKED_OUT'
        ) {
          if (onRefresh) onRefresh();
        }
      } catch (err) {
        console.error('Reception SSE error', err);
      }
    };

    return () => {
      es.close();
    };
  }, [onRefresh]);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeFilter === 'WAITING') return c.status === 'ARRIVED' || c.status === 'WAITING';
    if (activeFilter === 'IN_MEETING') return c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED';
    if (activeFilter === 'CHECKOUT')
      return c.status === 'COMPLETED' || c.status === 'OFFERED' || c.status === 'REJECTED';
    return c.status !== 'CHECKED_OUT';
  });

  const activeCandidates = candidates.filter(
    (c) => c.status !== 'CHECKED_OUT' && c.status !== 'SCHEDULED'
  );
  const waitingCandidates = candidates.filter(
    (c) => c.status === 'ARRIVED' || c.status === 'WAITING'
  );
  const roomAssignedCandidates = candidates.filter((c) => c.status === 'ROOM_ASSIGNED');
  const readyForCheckout = candidates.filter(
    (c) => c.status === 'COMPLETED' || c.status === 'OFFERED' || c.status === 'REJECTED'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Front Desk Bar */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Front Desk Reception & Escort Terminal
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time candidate profile management, government ID verification, live photo capture, and checkout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenWalkIn}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Intake Walk-in / Client</span>
          </button>
          <button
            onClick={onOpenQR}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Reception QR Standees</span>
          </button>
        </div>
      </div>

      {/* Real-time Escort Guidance Notice */}
      {roomAssignedCandidates.length > 0 && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl space-y-2 animate-pulse">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Immediate Reception Action: Escort Candidates to Designated Rooms</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {roomAssignedCandidates.map((cand) => (
              <div
                key={cand.id}
                className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:border-amber-400 transition"
                onClick={() => setSelectedProfileCandidateId(cand.id)}
              >
                <div>
                  <h4 className="font-bold text-white hover:text-amber-400 flex items-center gap-1.5">
                    {cand.fullName}
                    <Eye className="w-3 h-3 text-cyan-400" />
                  </h4>
                  <p className="text-slate-400 text-[11px]">{cand.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhotoCandidate(cand);
                    }}
                    className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-semibold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Capture arrival photo"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Photo</span>
                  </button>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Direct Candidate to:</span>
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-1 justify-end">
                      <MapPin className="w-3 h-3" />
                      {cand.currentLocation}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Active ({activeCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('WAITING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'WAITING'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Waiting Lounge ({waitingCandidates.length})
          </button>
          <button
            onClick={() => setActiveFilter('IN_MEETING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'IN_MEETING'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            In Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED').length})
          </button>
          <button
            onClick={() => setActiveFilter('CHECKOUT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeFilter === 'CHECKOUT'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Check-out ({readyForCheckout.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates / mobile..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400 transition"
          />
        </div>
      </div>

      {/* Reception Radar Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting Lounge */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Lounge Waiting Area ({waitingCandidates.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {waitingCandidates.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-500">
                Lounge is currently clear.
              </div>
            ) : (
              waitingCandidates.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl space-y-3 text-xs shadow-lg cursor-pointer transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {cand.arrivalPhoto || cand.livePhoto ? (
                        <img
                          src={cand.arrivalPhoto || cand.livePhoto}
                          alt={cand.fullName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-500 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <UserCheck className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-sm hover:text-cyan-300 flex items-center gap-1">
                          {cand.fullName}
                          <Eye className="w-3 h-3 text-slate-500" />
                        </h4>
                        <p className="text-[11px] text-amber-400 font-medium">{cand.position}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Arrived: {cand.arrivalTime ? new Date(cand.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                      Waiting
                    </span>
                  </div>

                  {/* Badges: Government ID & Resume */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      ID: {cand.governmentId?.idTypeName || 'Aadhaar'} ({cand.governmentId?.verificationStatus || 'Verified'})
                    </span>

                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Resume
                    </span>
                  </div>

                  {/* Desk Photo Verification status & Action */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {cand.arrivalPhoto ? (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Desk Photo Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">
                        Photo unverified
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoCandidate(cand);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{cand.arrivalPhoto ? 'Retake' : 'Capture Live Photo'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* In-Session Candidates & Walk-in Visitors */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            In Active Meetings ({candidates.filter((c) => c.status === 'IN_INTERVIEW').length + visitors.filter((v) => v.status === 'CHECKED_IN').length})
          </h3>

          <div className="space-y-2.5">
            {candidates
              .filter((c) => c.status === 'IN_INTERVIEW')
              .map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-3.5 bg-slate-900 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl space-y-2 text-xs cursor-pointer transition shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white hover:text-cyan-300 flex items-center gap-1">
                      {cand.fullName}
                      <Eye className="w-3 h-3 text-slate-500" />
                    </span>
                    <span className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full font-semibold">
                      Interview
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{cand.position}</span>
                    <span className="text-amber-400 font-semibold">{cand.currentLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="text-cyan-400 font-medium">
                      Gov ID: {cand.governmentId?.maskedIdNumber || 'Verified'}
                    </span>
                    {cand.arrivalPhoto && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Arrival Photo Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}

            {visitors.map((vis) => (
              <div
                key={vis.id}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{vis.fullName}</span>
                  <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full font-semibold">
                    {vis.visitorType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Host: {vis.hostName}</span>
                  <span className="text-slate-300">{vis.company || 'Official Visit'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready for Physical Checkout Terminal */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Physical Check-Out Terminal ({readyForCheckout.length})
          </h3>

          <div className="space-y-2.5">
            {readyForCheckout.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-500">
                No visitors currently pending checkout.
              </div>
            ) : (
              readyForCheckout.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedProfileCandidateId(cand.id)}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl space-y-3 text-xs shadow-lg cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white hover:text-emerald-300 flex items-center gap-1">
                        {cand.fullName}
                        <Eye className="w-3 h-3 text-slate-500" />
                      </h4>
                      <p className="text-[11px] text-slate-400">{cand.position}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Rounds Done
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckout(cand.id);
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Process Physical Checkout</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reception Candidate Profile Modal (CandidateDossierModal) */}
      {selectedProfileCandidateId && (
        <CandidateDossierModal
          candidateId={selectedProfileCandidateId}
          initialCandidate={candidates.find((c) => c.id === selectedProfileCandidateId)}
          currentRole="RECEPTION"
          onClose={() => setSelectedProfileCandidateId(null)}
          onPhotoCaptured={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Reception Live Photo Capture Modal */}
      {selectedPhotoCandidate && (
        <ReceptionPhotoModal
          candidate={selectedPhotoCandidate}
          receptionistId="usr-rec-1"
          receptionistName="Ananya Sen (Reception)"
          onClose={() => setSelectedPhotoCandidate(null)}
          onSuccess={(updated) => {
            setSelectedPhotoCandidate(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};
