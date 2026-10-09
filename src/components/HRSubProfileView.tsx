import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Users,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  DoorOpen,
  MapPin,
  ClipboardList,
  History,
  Edit3,
  Trash2,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import type { Candidate, Interview, ActionTask, UserRole } from '../types/index.ts';
import { authenticatedFetch, safeJson } from '../utils/apiClient.ts';
import { formatPhotoTimestamp } from '../utils/dateFormatter.ts';
import { EditRecordModal } from './modals/EditRecordModal.tsx';
import { DeleteConfirmModal, DeleteRecordType } from './modals/DeleteConfirmModal.tsx';

export type HRProfileKey = 'nisha' | 'shriyanshi';

interface HRSubProfileViewProps {
  activeProfileKey: HRProfileKey;
  onSelectProfile: (profileKey: HRProfileKey) => void;
  onBackToHRDashboard?: () => void;
  onOpenDossier: (candidateId: string) => void;
  onAssignRoom?: (candidateId: string, interviewId?: string) => void;
  currentUserRole?: UserRole;
  currentUserId?: string;
}

export const HRSubProfileView: React.FC<HRSubProfileViewProps> = ({
  activeProfileKey,
  onSelectProfile,
  onBackToHRDashboard,
  onOpenDossier,
  onAssignRoom,
  currentUserRole = 'HR',
  currentUserId,
}) => {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'candidates' | 'interviews' | 'tasks' | 'activity'>('candidates');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit / Delete Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    recordType: DeleteRecordType;
    record: any;
  }>({
    isOpen: false,
    recordType: 'CANDIDATE',
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
    recordType: 'CANDIDATE',
    recordId: '',
    recordName: '',
  });

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch('/api/hr/subprofiles');
      const data = await safeJson(res, { success: false });
      if (data.success && data.profiles) {
        setProfileData(data.profiles);
      } else {
        setError(data.error || 'Unable to retrieve HR sub-profile data.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching HR profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [activeProfileKey]);

  const currentWorkspace = profileData ? profileData[activeProfileKey] : null;
  const userProfile = currentWorkspace?.profile;

  // Filter candidates
  const filteredCandidates: Candidate[] = (currentWorkspace?.candidates || []).filter((c: Candidate) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.position?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q)
    );
  });

  // Filter interviews
  const filteredInterviews: Interview[] = (currentWorkspace?.interviews || []).filter((i: Interview) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.candidateName?.toLowerCase().includes(q) ||
      i.roundName?.toLowerCase().includes(q) ||
      i.roomName?.toLowerCase().includes(q) ||
      i.status?.toLowerCase().includes(q)
    );
  });

  // Filter tasks
  const filteredTasks: ActionTask[] = (currentWorkspace?.tasks || []).filter((t: ActionTask) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.instruction?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top HR Sub-Profile Header & Selector */}
      <div className="p-5 sm:p-6 card-dark bg-[#0B0B0D] text-white rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToHRDashboard && (
              <button
                type="button"
                onClick={onBackToHRDashboard}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Back to All HR Operations"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>HR Officers & Dedicated Workspaces</span>
                </h1>
              </div>
              <p className="text-xs text-[#BDBDBD] mt-0.5">
                Independent HR sub-profiles for Nisha & Shriyanshi with dedicated assignments, candidate ownership & audit trail.
              </p>
            </div>
          </div>

          {/* Profile Switcher Buttons */}
          <div className="flex items-center bg-[#17191D] p-1.5 rounded-2xl border border-white/10 gap-1.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => onSelectProfile('nisha')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeProfileKey === 'nisha'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-[#AEB7C4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Nisha</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeProfileKey === 'nisha' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
              }`}>
                Sr. HR
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectProfile('shriyanshi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeProfileKey === 'shriyanshi'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-[#AEB7C4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Shriyanshi</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeProfileKey === 'shriyanshi' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
              }`}>
                Intake
              </span>
            </button>

            <button
              type="button"
              onClick={fetchProfileData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Refresh profile data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Profile Card Banner */}
        {userProfile && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#17191D] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
                {activeProfileKey === 'nisha' ? 'N' : 'S'}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">{userProfile.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {userProfile.designation || (activeProfileKey === 'nisha' ? 'Senior HR Manager' : 'HR Executive')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Active Sub-Profile
                  </span>
                </div>
                <p className="text-xs text-amber-300/90 font-medium">
                  {currentWorkspace?.responsibilities}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#BDBDBD] pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{userProfile.email}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{userProfile.phone}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="text-[#AEB7C4]">
                    Dept: <strong className="text-white">{userProfile.department}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Edit User Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setEditModal({
                    isOpen: true,
                    recordType: 'USER',
                    record: userProfile,
                  })
                }
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#17191D] border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#BDBDBD] block font-mono">
              Assigned Candidates
            </span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">
              {currentWorkspace?.stats?.assignedCandidates ?? filteredCandidates.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#17191D] border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#BDBDBD] block font-mono">
              Active Interviews
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">
              {currentWorkspace?.stats?.activeInterviews ?? filteredInterviews.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#17191D] border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#BDBDBD] block font-mono">
              Open HR Tasks
            </span>
            <span className="text-2xl font-black text-sky-400 font-mono mt-0.5 block">
              {currentWorkspace?.stats?.openTasks ?? filteredTasks.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#17191D] border border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#BDBDBD] block font-mono">
              Activity Entries
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
              {currentWorkspace?.activity?.length ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-black/10">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'candidates'
                ? 'bg-[#17191D] text-amber-300 border border-white/10 shadow-sm'
                : 'text-[#252A32] hover:text-[#111318] hover:bg-black/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Assigned Candidates ({currentWorkspace?.candidates?.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interviews')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'interviews'
                ? 'bg-[#17191D] text-amber-300 border border-white/10 shadow-sm'
                : 'text-[#252A32] hover:text-[#111318] hover:bg-black/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Interviews & Rounds ({currentWorkspace?.interviews?.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-[#17191D] text-amber-300 border border-white/10 shadow-sm'
                : 'text-[#252A32] hover:text-[#111318] hover:bg-black/5'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Assigned Tasks ({currentWorkspace?.tasks?.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-[#17191D] text-amber-300 border border-white/10 shadow-sm'
                : 'text-[#252A32] hover:text-[#111318] hover:bg-black/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity History</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${userProfile?.name || 'HR'}'s records...`}
            className="w-full pl-8 pr-3 py-1.5 bg-[#17191D] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tab 1: Assigned Candidates */}
      {activeTab === 'candidates' && (
        <div className="space-y-3">
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center card-dark bg-[#0B0B0D] rounded-3xl border border-white/10 text-white space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No candidates in this queue</h3>
              <p className="text-xs text-[#BDBDBD] max-w-sm mx-auto">
                Candidates assigned to {userProfile?.name || 'this HR'} or matching this workspace scope appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-4 rounded-2xl bg-[#0B0B0D] card-dark text-white border border-white/10 hover:border-amber-400/40 shadow-xl transition space-y-3"
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
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold bg-[#25272B] border border-white/10 text-white">
                            {cand.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt) && (
                          <span
                            className="text-[9px] text-amber-300 font-mono tracking-tight mt-1 text-center truncate max-w-[80px]"
                            title={`Captured: ${formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt)}`}
                          >
                            {formatPhotoTimestamp(cand.receptionPhotoCapturedAt || cand.arrivalPhotoCapturedAt || cand.livePhotoCapturedAt).split(',')[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{cand.fullName}</h4>
                        <p className="text-xs text-[#E0E0E0]">{cand.position}</p>
                        <div className="flex items-center gap-2 text-[11px] text-[#BDBDBD] mt-0.5">
                          <span className="font-mono">{cand.phone}</span>
                          <span>&bull;</span>
                          <span>{cand.currentLocation || 'Waiting Area'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border bg-amber-500/15 text-amber-300 border-amber-500/30 shrink-0">
                      {cand.status}
                    </span>
                  </div>

                  {/* Actions Bar: Edit, Delete, Assign Room, Dossier */}
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Clearly Visible Edit Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditModal({
                            isOpen: true,
                            recordType: 'CANDIDATE',
                            record: cand,
                          })
                        }
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        title="Edit Candidate Record"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit</span>
                      </button>

                      {/* Clearly Visible Delete Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            recordType: 'CANDIDATE',
                            recordId: cand.id,
                            recordName: cand.fullName,
                            metadata: { status: cand.status },
                          })
                        }
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 hover:border-rose-500/40 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        title="Delete / Archive Candidate"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {onAssignRoom && (cand.status === 'ARRIVED' || cand.status === 'WAITING') && (
                        <button
                          type="button"
                          onClick={() => onAssignRoom(cand.id, cand.currentInterviewId)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                          <span>Assign Room</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenDossier(cand.id)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                      >
                        Dossier &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Interviews */}
      {activeTab === 'interviews' && (
        <div className="space-y-3">
          {filteredInterviews.length === 0 ? (
            <div className="p-12 text-center card-dark bg-[#0B0B0D] rounded-3xl border border-white/10 text-white space-y-2">
              <Calendar className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No scheduled interviews</h3>
              <p className="text-xs text-[#BDBDBD] max-w-sm mx-auto">
                No active interview rounds currently assigned to {userProfile?.name || 'this HR officer'}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInterviews.map((intv) => (
                <div
                  key={intv.id}
                  className="p-4 rounded-2xl bg-[#0B0B0D] card-dark text-white border border-white/10 hover:border-amber-400/40 shadow-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{intv.candidateName || 'Candidate'}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {intv.roundName || 'Round 1'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {intv.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#BDBDBD]">
                      <span>Interviewer: <strong className="text-white">{intv.interviewerName}</strong></span>
                      <span>&bull;</span>
                      <span>Room: <strong className="text-amber-400">{intv.roomName || 'Pending Allocation'}</strong></span>
                      {intv.scheduledTime && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono text-slate-300">{intv.scheduledTime}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setEditModal({
                          isOpen: true,
                          recordType: 'INTERVIEW',
                          record: intv,
                        })
                      }
                      className="px-3 py-1.5 bg-white/5 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit</span>
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
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 hover:border-rose-500/40 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center card-dark bg-[#0B0B0D] rounded-3xl border border-white/10 text-white space-y-2">
              <ClipboardList className="w-8 h-8 text-sky-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No active HR tasks</h3>
              <p className="text-xs text-[#BDBDBD] max-w-sm mx-auto">
                No active operational or escort assignments currently directed to {userProfile?.name || 'this HR'}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-[#0B0B0D] card-dark text-white border border-white/10 hover:border-amber-400/40 shadow-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#E0E0E0]">{task.instruction}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#BDBDBD] font-mono">
                      <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setEditModal({
                          isOpen: true,
                          recordType: 'ACTION_TASK',
                          record: task,
                        })
                      }
                      className="px-3 py-1.5 bg-white/5 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          recordType: 'ACTION_TASK',
                          recordId: task.id,
                          recordName: task.title,
                        })
                      }
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 hover:border-rose-500/40 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Activity History */}
      {activeTab === 'activity' && (
        <div className="card-dark bg-[#0B0B0D] p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Independent Activity & Audit Log for {userProfile?.name}</span>
            </h3>
            <span className="text-[10px] text-[#BDBDBD] font-mono">Immutable Operations Trail</span>
          </div>

          {(currentWorkspace?.activity || []).length === 0 ? (
            <p className="text-xs text-[#BDBDBD] py-6 text-center">
              No individual log entries recorded yet for {userProfile?.name}. Operations actions taken by this officer will appear here.
            </p>
          ) : (
            <div className="space-y-2.5">
              {currentWorkspace.activity.map((log: any, idx: number) => (
                <div
                  key={log.id || idx}
                  className="p-3 rounded-xl bg-[#17191D] border border-white/5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-amber-400 font-mono">[{log.category || 'HR'}]</span>
                    </div>
                    <p className="text-[#E0E0E0] text-[11px]">{log.details || log.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={editModal.isOpen}
        recordType={editModal.recordType}
        record={editModal.record}
        onClose={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          fetchProfileData();
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
          fetchProfileData();
        }}
      />
    </div>
  );
};
