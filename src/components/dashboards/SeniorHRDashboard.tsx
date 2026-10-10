import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  UserCheck,
  Play,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileText,
  MapPin,
  Sparkles,
  Award,
  XCircle,
  Eye,
  Shield,
  ArrowRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { Candidate, Interview, Room } from '../../types/index.ts';
import { EditRecordModal } from '../modals/EditRecordModal.tsx';
import { DeleteConfirmModal, DeleteRecordType } from '../modals/DeleteConfirmModal.tsx';

interface SeniorHRDashboardProps {
  candidates: Candidate[];
  interviews: Interview[];
  rooms: Room[];
  currentInterviewerId: string;
  onStartInterview: (interviewId: string) => void;
  onOpenEndInterviewModal: (interview: Interview) => void;
  onOpenDossier: (candidateId: string) => void;
  onAssignRoom?: (candidateId: string, interviewId: string) => void;
  onRefresh: () => void;
}

export const SeniorHRDashboard: React.FC<SeniorHRDashboardProps> = ({
  candidates,
  interviews,
  rooms,
  currentInterviewerId,
  onStartInterview,
  onOpenEndInterviewModal,
  onOpenDossier,
  onAssignRoom,
  onRefresh,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'active' | 'completed'>('pending');

  // Modal states for Edit and Delete
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    record: any;
  }>({
    isOpen: false,
    recordType: 'INTERVIEW',
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
    recordType: 'INTERVIEW',
    recordId: '',
    recordName: '',
  });

  // Filter interviews assigned to Kimmi Mam ('usr-cofounder-kimmi') or mentioning Kimmi
  const myInterviews = interviews.filter(
    (i) =>
      i.interviewerId === currentInterviewerId ||
      i.interviewerId === 'usr-cofounder-kimmi' ||
      i.interviewerName.includes('Kimmi') ||
      i.roundName.includes('Senior')
  );

  // Also include candidates directly marked 'With Kimmi Mam – Senior HR Interview'
  const candidatesAssignedToMe = candidates.filter(
    (c) =>
      c.status === 'With Kimmi Mam – Senior HR Interview' ||
      (c as any).assignedInterviewerId === 'usr-cofounder-kimmi' ||
      (c as any).assignedInterviewerName?.includes('Kimmi')
  );

  const combinedInterviews = [...myInterviews];
  candidatesAssignedToMe.forEach((cand) => {
    const hasExisting = combinedInterviews.some((i) => i.candidateId === cand.id);
    if (!hasExisting) {
      combinedInterviews.unshift({
        id: cand.currentInterviewId || `intv-kimmi-${cand.id}`,
        candidateId: cand.id,
        candidateName: cand.fullName,
        position: cand.position,
        roundName: 'Senior HR Interview',
        interviewerId: 'usr-cofounder-kimmi',
        interviewerName: 'Kimmi Mam – Senior HR Interview',
        scheduledTime: 'Immediate / Today',
        status: cand.status === 'IN_INTERVIEW' ? 'INTERVIEW_STARTED' : 'CANDIDATE_ARRIVED',
        createdAt: cand.arrivalTime || cand.createdAt || new Date().toISOString(),
        updatedAt: cand.updatedAt || new Date().toISOString(),
      });
    }
  });

  const pendingInterviews = combinedInterviews.filter(
    (i) => i.status === 'CANDIDATE_ARRIVED' || i.status === 'ROOM_ASSIGNED' || i.status === 'SCHEDULED'
  );
  const activeInterviews = combinedInterviews.filter((i) => i.status === 'INTERVIEW_STARTED');
  const completedInterviews = combinedInterviews.filter((i) => i.status === 'INTERVIEW_COMPLETED');

  const displayedInterviews =
    filterTab === 'pending' ? pendingInterviews : filterTab === 'active' ? activeInterviews : completedInterviews;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 card-dark bg-[#0B0B0D] rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-lg shadow-inner font-mono">
            KM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Kimmi Mam – Senior HR Interviewer Command Station
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                Senior Level
              </span>
            </div>
            <p className="text-xs text-[#E0E0E0] mt-0.5">
              Authorized Role: <strong className="text-white">Senior HR Interviewer</strong> • Executive Leadership
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold font-mono">
            {pendingInterviews.length} Pending Senior Reviews
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold font-mono">
            {activeInterviews.length} In Active Session
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterTab('pending')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 border ${
            filterTab === 'pending'
              ? 'is-active bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 border-amber-400 font-black'
              : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-[#1A1D24] hover:text-white hover:border-white/30'
          }`}
        >
          <span>Pending Senior Interviews</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px] font-mono">
            {pendingInterviews.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('active')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 border ${
            filterTab === 'active'
              ? 'is-active bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 border-amber-400 font-black'
              : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-[#1A1D24] hover:text-white hover:border-white/30'
          }`}
        >
          <span>In Active Session</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px] font-mono">
            {activeInterviews.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 border ${
            filterTab === 'completed'
              ? 'is-active bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 border-amber-400 font-black'
              : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-[#1A1D24] hover:text-white hover:border-white/30'
          }`}
        >
          <span>Completed Evaluations</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px] font-mono">
            {completedInterviews.length}
          </span>
        </button>
      </div>

      {/* Interviews List */}
      {displayedInterviews.length === 0 ? (
        <div className="p-12 text-center card-dark bg-[#0B0B0D] rounded-3xl border border-white/10 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No senior interviews in this view</h3>
          <p className="text-xs text-[#E0E0E0] max-w-md mx-auto">
            Candidates assigned for Senior HR Review with Kimmi Mam will appear here automatically in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedInterviews.map((intv) => {
            const cand = candidates.find((c) => c.id === intv.candidateId);
            const hasRoom = intv.roomId || intv.status === 'ROOM_ASSIGNED';

            return (
              <motion.div
                key={intv.id}
                whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                whileTap={{ scale: 0.99 }}
                className="p-5 sm:p-6 rounded-2xl shadow-xl space-y-4 transition card-dark bg-[#0B0B0D] border border-white/10 text-white flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {cand?.livePhoto ? (
                        <img
                          src={cand.livePhoto}
                          alt={intv.candidateName}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#25272B] border border-white/10 text-white">
                          <UserCheck className="w-7 h-7" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">{intv.candidateName}</h3>
                        <p className="text-xs sm:text-sm font-semibold text-amber-400">{intv.position}</p>
                        <p className="text-xs mt-0.5 text-[#E0E0E0]">{intv.roundName}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                        intv.status === 'INTERVIEW_STARTED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : intv.status === 'INTERVIEW_COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : hasRoom
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-white/10 text-[#E0E0E0] border border-white/15'
                      }`}
                    >
                      {intv.status === 'INTERVIEW_STARTED'
                        ? 'In Session'
                        : intv.status === 'INTERVIEW_COMPLETED'
                        ? `Completed (${intv.outcome || 'PASS'})`
                        : hasRoom
                        ? 'Room Assigned'
                        : 'Pending Room'}
                    </span>
                  </div>

                  {/* Details Box */}
                  <div className="p-3.5 card-inner inner-box bg-[#25272B] rounded-xl space-y-2 text-xs border border-white/10 text-white">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#BDBDBD]">Interview Level:</span>
                      <strong className="text-amber-400 font-bold font-mono">Senior Level (Kimmi Mam)</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#BDBDBD]">Designated Room:</span>
                      <strong className={hasRoom ? 'text-amber-400 font-bold' : 'text-[#BDBDBD] italic'}>
                        {intv.roomName || 'Pending Room Assignment'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#BDBDBD]">Current Location:</span>
                      <span className="text-white font-medium">
                        {cand?.currentLocation || 'Waiting Lounge'}
                      </span>
                    </div>
                    {intv.interviewerFeedback && (
                      <div className="pt-2 border-t border-white/10 text-xs">
                        <span className="text-[#BDBDBD] block mb-0.5">Remarks / Feedback:</span>
                        <p className="italic text-[#E0E0E0]">{intv.interviewerFeedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Candidate Summary Snippet */}
                  {cand && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-[#E0E0E0]">
                      <div>
                        <span>Experience: </span>
                        <strong className="text-white font-bold">{cand.totalExperience}</strong>
                      </div>
                      <div>
                        <span>Notice Period: </span>
                        <strong className="text-white font-bold">{cand.noticePeriod}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => onOpenDossier(intv.candidateId)}
                    className="flex-1 py-2 px-3 rounded-xl font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5 bg-[#25272B] hover:bg-[#35383D] text-[#E0E0E0] hover:text-white border border-white/10"
                    title="View candidate dossier & verified resume"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>View Dossier & Resume</span>
                  </button>

                  {/* Clearly visible Edit and Delete Interview Schedule buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditModal({
                          isOpen: true,
                          recordType: 'INTERVIEW',
                          record: intv,
                        })
                      }
                      className="p-2 rounded-xl bg-[#25272B] hover:bg-amber-500/20 text-[#E0E0E0] hover:text-amber-300 border border-white/10 transition cursor-pointer"
                      title="Edit Interview Schedule"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          recordType: 'INTERVIEW',
                          recordId: intv.id,
                          recordName: `${intv.candidateName || 'Interview'} (${intv.roundName})`,
                          metadata: { status: intv.status },
                        })
                      }
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 transition cursor-pointer"
                      title="Delete Interview Schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {intv.status === 'CANDIDATE_ARRIVED' || intv.status === 'ROOM_ASSIGNED' ? (
                    <button
                      type="button"
                      onClick={() => onStartInterview(intv.id)}
                      className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Interview</span>
                    </button>
                  ) : intv.status === 'INTERVIEW_STARTED' ? (
                    <button
                      type="button"
                      onClick={() => onOpenEndInterviewModal(intv)}
                      className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conclude & Pass/Fail</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#BDBDBD] font-medium px-2">
                      Completed
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
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
