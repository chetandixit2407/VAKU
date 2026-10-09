import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Users2,
  Coffee,
  CalendarClock,
  LogOut,
  Camera,
  CheckCircle2,
  MapPin,
  Eye,
  Building2,
  Layers,
  Sparkles,
  ChevronRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { Candidate, Visitor } from '../types/index.ts';
import { VisitorArrivalTimeline } from './VisitorArrivalTimeline.tsx';
import { CandidateDossierModal } from './CandidateDossierModal.tsx';
import { ReceptionPhotoModal } from './ReceptionPhotoModal.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { formatPhotoTimestamp } from '../utils/dateFormatter.ts';
import { EditRecordModal } from './modals/EditRecordModal.tsx';
import { DeleteConfirmModal, DeleteRecordType } from './modals/DeleteConfirmModal.tsx';

interface SecondaryOperationsMoreViewProps {
  candidates: Candidate[];
  visitors: Visitor[];
  onCheckout: (candidateId: string) => void;
  onBackToDashboard: () => void;
  onRefresh?: () => void;
  initialTab?: 'all' | 'lounge' | 'meetings' | 'checkout';
}

export const SecondaryOperationsMoreView: React.FC<SecondaryOperationsMoreViewProps> = ({
  candidates,
  visitors,
  onCheckout,
  onBackToDashboard,
  onRefresh,
  initialTab = 'all',
}) => {
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState<'all' | 'lounge' | 'meetings' | 'checkout'>(initialTab);
  const [selectedProfileCandidateId, setSelectedProfileCandidateId] = useState<string | null>(null);
  const [selectedPhotoCandidate, setSelectedPhotoCandidate] = useState<Candidate | null>(null);

  // Edit / Delete Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    record: any;
  }>({
    isOpen: false,
    recordType: 'VISITOR',
    record: null,
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    recordId: string;
    recordName: string;
    metadata?: Record<string, any>;
  }>({
    isOpen: false,
    recordType: 'VISITOR',
    recordId: '',
    recordName: '',
  });

  // Filter lists
  const waitingCandidates = candidates.filter(
    (c) => c.status === 'ARRIVED' || c.status === 'WAITING'
  );

  const meetingCandidates = candidates.filter(
    (c) => c.status === 'IN_INTERVIEW' || c.status === 'ROOM_ASSIGNED'
  );

  const readyForCheckout = candidates.filter(
    (c) => c.status === 'COMPLETED' || c.status === 'OFFERED' || c.status === 'REJECTED'
  );

  const totalSecondaryCount = waitingCandidates.length + meetingCandidates.length + readyForCheckout.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header with Back Action */}
      <div className="p-5 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Return to primary dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>More Operations &bull; Secondary Sections</span>
              </h1>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              Access Lounge Waiting Area, In-Active Meetings, and Physical Check-Out terminal
            </p>
          </div>
        </div>

        {/* Total Summary Capsule */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white flex items-center gap-2">
            <span className="text-white/60">Total Tracked:</span>
            <span className="font-mono font-bold text-amber-400">{totalSecondaryCount}</span>
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs - Allows opening each section individually */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {/* Tab 1: All Secondary Sections */}
        <button
          onClick={() => setActiveTab('all')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-2 ${
            activeTab === 'all'
              ? 'is-active bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md ring-2 ring-amber-400/40'
              : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-[#1A1D24] hover:text-white hover:border-white/30'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Secondary Sections</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {totalSecondaryCount}
          </span>
        </button>

        {/* Tab 2: Lounge Waiting Area */}
        <button
          onClick={() => setActiveTab('lounge')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-2 ${
            activeTab === 'lounge'
              ? 'is-active bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md ring-2 ring-amber-400/40'
              : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-[#1A1D24] hover:text-white hover:border-white/30'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 text-amber-400" />
          <span>Lounge Waiting Area</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {waitingCandidates.length}
          </span>
        </button>

        {/* Tab 3: In Active Meetings */}
        <button
          onClick={() => setActiveTab('meetings')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-2 ${
            activeTab === 'meetings'
              ? 'is-active bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md ring-2 ring-amber-400/40'
              : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-[#1A1D24] hover:text-white hover:border-white/30'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
          <span>In Active Meetings</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {meetingCandidates.length + visitors.length}
          </span>
        </button>

        {/* Tab 4: Physical Check-Out */}
        <button
          onClick={() => setActiveTab('checkout')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shrink-0 border flex items-center gap-2 ${
            activeTab === 'checkout'
              ? 'is-active bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md ring-2 ring-amber-400/40'
              : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-[#1A1D24] hover:text-white hover:border-white/30'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 text-emerald-400" />
          <span>Physical Check-Out</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {readyForCheckout.length}
          </span>
        </button>
      </div>

      {/* Grid or Individual View */}
      <div
        className={`grid gap-6 ${
          activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {/* SECTION 1: Lounge Waiting Area */}
        {(activeTab === 'all' || activeTab === 'lounge') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-white/15">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Lounge Waiting Area ({waitingCandidates.length})</span>
              </h3>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('lounge')}
                  className="text-[11px] text-amber-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Focus</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {waitingCandidates.length === 0 ? (
                <div className="p-8 text-center dashboard-card card-dark bg-[#0B0B0D] rounded-2xl text-xs text-[#E0E0E0] border border-white/10 shadow-lg">
                  Lounge is currently clear.
                </div>
              ) : (
                waitingCandidates.map((cand) => (
                  <motion.div
                    key={cand.id}
                    whileHover={{ scale: 1.01, y: -2, transition: { duration: 0.2, ease: 'easeOut' } }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedProfileCandidateId(cand.id)}
                    className="p-4 rounded-2xl space-y-3 text-xs shadow-xl cursor-pointer transition dashboard-card card-dark candidate-card bg-[#0B0B0D] text-white border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center shrink-0">
                          {cand.receptionPhotoUrl || cand.photoUrl || cand.livePhoto || cand.arrivalPhoto ? (
                            <img
                              src={cand.receptionPhotoUrl || cand.photoUrl || cand.livePhoto || cand.arrivalPhoto}
                              alt={cand.fullName}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 shadow-md shrink-0"
                            />
                          ) : (
                            <div className="candidate-avatar w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold bg-[#25272B] border border-white/10 text-white">
                              {cand.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt) && (
                            <span
                              className="text-[9px] text-amber-300 font-mono tracking-tight mt-1 text-center truncate max-w-[85px]"
                              title={`Captured: ${formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt)}`}
                            >
                              {formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt).split(',')[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="candidate-name font-bold text-sm flex items-center gap-1 text-white">
                            {cand.fullName}
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </h4>
                          <p className="candidate-role text-[11px] font-semibold text-[#E0E0E0]">{cand.position}</p>
                          <p className="candidate-meta text-[10px] mt-0.5 text-[#BDBDBD]">
                            Arrived: {cand.checkedInAt ? new Date(cand.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Waiting
                      </span>
                    </div>

                    {/* Visitor Lifecycle Stage Tracker */}
                    <div className="card-divider pt-2 border-t border-white/10">
                      <VisitorArrivalTimeline candidate={cand} compact={true} />
                    </div>

                    {/* Desk Photo Verification status & Action */}
                    <div className="card-divider pt-2 border-t flex items-center justify-between gap-2 border-white/10">
                      {cand.receptionPhotoUrl || cand.arrivalPhoto ? (
                        <div className="flex flex-col">
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Desk Photo Verified
                          </span>
                          {(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt) && (
                            <span className="text-[9px] text-amber-300 font-mono">
                              Captured: {formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-amber-300 font-medium">
                          Desk Photo Required
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoCandidate(cand);
                        }}
                        className="px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300 shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{cand.receptionPhotoUrl || cand.arrivalPhoto ? 'Retake Photo' : 'Capture Desk Photo'}</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: In Active Meetings */}
        {(activeTab === 'all' || activeTab === 'meetings') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-white/15">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>In Active Meetings ({meetingCandidates.length + visitors.length})</span>
              </h3>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('meetings')}
                  className="text-[11px] text-blue-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Focus</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {meetingCandidates.length === 0 && visitors.length === 0 ? (
                <div className="p-8 text-center dashboard-card card-dark bg-[#0B0B0D] rounded-2xl text-xs text-[#E0E0E0] border border-white/10 shadow-lg">
                  No active meetings in progress right now.
                </div>
              ) : (
                <>
                  {meetingCandidates.map((cand) => (
                    <motion.div
                      key={cand.id}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedProfileCandidateId(cand.id)}
                      className="p-4 rounded-2xl space-y-2.5 text-xs cursor-pointer transition shadow-xl dashboard-card card-dark candidate-card bg-[#0B0B0D] border border-blue-500/30 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="candidate-name font-bold flex items-center gap-1 text-sm text-white">
                          {cand.fullName}
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono text-blue-300 bg-blue-500/15 border border-blue-500/30">
                          {cand.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#E0E0E0]">
                        <span className="candidate-role">{cand.position}</span>
                        <span className="font-semibold flex items-center gap-1 text-amber-400">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          {cand.assignedRoomName || cand.currentLocation || 'Cabin'}
                        </span>
                      </div>

                      <div className="card-divider pt-2 border-t border-white/10">
                        <VisitorArrivalTimeline candidate={cand} compact={true} />
                      </div>
                    </motion.div>
                  ))}

                  {visitors.map((vis) => (
                    <div
                      key={vis.id}
                      className="p-3.5 rounded-2xl space-y-2 text-xs dashboard-card card-dark bg-[#0B0B0D] text-white border border-white/10 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{vis.fullName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono text-purple-300 bg-purple-500/15 border border-purple-500/30">
                          {vis.visitorType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#E0E0E0]">
                        <span>Host: <strong className="text-white">{vis.hostName}</strong></span>
                        <span className="text-[#BDBDBD]">{vis.company || 'Official Visit'}</span>
                      </div>

                      {/* Clearly visible Edit and Delete buttons for Visitors in Secondary View */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono text-[10px]">{vis.phone || 'Phone: N/A'}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditModal({
                                isOpen: true,
                                recordType: 'VISITOR',
                                record: vis,
                              })
                            }
                            className="p-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 text-xs transition cursor-pointer"
                            title="Edit Visitor Information"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                recordType: 'VISITOR',
                                recordId: vis.id,
                                recordName: vis.fullName,
                              })
                            }
                            className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 text-xs transition cursor-pointer"
                            title="Delete Visitor"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: Physical Check-Out */}
        {(activeTab === 'all' || activeTab === 'checkout') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-white/15">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Physical Check-Out ({readyForCheckout.length})</span>
              </h3>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('checkout')}
                  className="text-[11px] text-emerald-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Focus</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {readyForCheckout.length === 0 ? (
                <div className="p-8 text-center dashboard-card card-dark bg-[#0B0B0D] rounded-2xl text-xs text-[#E0E0E0] border border-white/10 shadow-lg">
                  No visitors currently awaiting checkout.
                </div>
              ) : (
                readyForCheckout.map((cand) => (
                  <motion.div
                    key={cand.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedProfileCandidateId(cand.id)}
                    className="p-4 rounded-2xl space-y-3 text-xs shadow-xl cursor-pointer transition dashboard-card card-dark candidate-card bg-[#0B0B0D] text-white border border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="candidate-name font-bold flex items-center gap-1 text-sm text-white">
                          {cand.fullName}
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </h4>
                        <p className="candidate-role text-[11px] font-semibold text-[#E0E0E0]">{cand.position}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Completed
                      </span>
                    </div>

                    <div className="card-divider pt-1">
                      <VisitorArrivalTimeline candidate={cand} compact={true} />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCheckout(cand.id);
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Complete Physical Checkout</span>
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Candidate Profile Modal */}
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

      {/* Live Photo Modal */}
      {selectedPhotoCandidate && (
        <ReceptionPhotoModal
          candidate={selectedPhotoCandidate}
          receptionistId="usr-rec-1"
          receptionistName="Ananya Sen (Reception)"
          onClose={() => setSelectedPhotoCandidate(null)}
          onSuccess={() => {
            setSelectedPhotoCandidate(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={editModal.isOpen}
        recordType={editModal.recordType}
        record={editModal.record}
        onClose={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        recordType={deleteModal.recordType}
        recordId={deleteModal.recordId}
        recordName={deleteModal.recordName}
        metadata={deleteModal.metadata}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
