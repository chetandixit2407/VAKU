import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  Calendar,
  Clock,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Camera,
  ShieldCheck,
  Check,
  Building,
  AlertCircle,
  Lock,
  Edit3,
  Trash2,
  Save,
  RefreshCw,
  DoorOpen,
  GraduationCap,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import type { Candidate, Interview, TimelineEvent, UserRole } from '../types/index.ts';
import { formatDateTime, formatPhotoTimestamp } from '../utils/dateFormatter.ts';
import { ResumeDocumentModal } from './ResumeDocumentModal.tsx';
import { ReceptionPhotoModal } from './ReceptionPhotoModal.tsx';
import { VisitorArrivalTimeline } from './VisitorArrivalTimeline.tsx';
import { authenticatedFetch } from '../utils/apiClient.ts';

type DossierSection =
  | 'Identity'
  | 'Application'
  | 'Experience'
  | 'Interview'
  | 'Documents'
  | 'Status'
  | 'Notes';

interface CandidateDossierModalProps {
  candidateId: string;
  initialCandidate?: Candidate;
  currentRole: UserRole;
  onClose: () => void;
  onAssignRoom?: (candidateId: string, interviewId?: string) => void;
  onPhotoCaptured?: (updated: Candidate) => void;
  onCandidateUpdated?: () => void;
  onCandidateDeleted?: () => void;
}

export const CandidateDossierModal: React.FC<CandidateDossierModalProps> = ({
  candidateId,
  initialCandidate,
  currentRole,
  onClose,
  onAssignRoom,
  onPhotoCaptured,
  onCandidateUpdated,
  onCandidateDeleted,
}) => {
  // Strict privacy enforcement: Pantry role must never view candidate dossiers or personal profiles
  if (currentRole === 'PANTRY') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="bg-[#141820] border border-rose-500/50 p-6 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Access Prohibited</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Users with the Pantry role are strictly restricted to assigned hospitality tasks. Full candidate profiles, dossiers, and personal information are inaccessible.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Return to Pantry Tasks
          </button>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState<boolean>(!initialCandidate);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(initialCandidate || null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeSection, setActiveSection] = useState<DossierSection>('Identity');

  // Sub-Modals
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);

  // Edit & Delete state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('Administrative Archive');
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [editForm, setEditForm] = useState({
    fullName: initialCandidate?.fullName || '',
    phone: initialCandidate?.phone || '',
    email: initialCandidate?.email || '',
    address: initialCandidate?.address || '',
    city: initialCandidate?.city || '',
    state: initialCandidate?.state || '',
    pincode: initialCandidate?.pincode || '',
    position: initialCandidate?.position || '',
    department: initialCandidate?.department || '',
    totalExperience: initialCandidate?.totalExperience || '',
    relevantExperience: initialCandidate?.relevantExperience || '',
    currentCompany: initialCandidate?.currentCompany || '',
    qualification: initialCandidate?.qualification || '',
    noticePeriod: initialCandidate?.noticePeriod || '',
    expectedSalary: initialCandidate?.expectedSalary || '',
    skills: initialCandidate?.skills || '',
    purpose: initialCandidate?.purpose || 'Interview / Job Application',
    departmentToMeet: initialCandidate?.departmentToMeet || 'HR & Recruitment',
    personToMeet: initialCandidate?.personToMeet || '',
    hrPrivateNotes: initialCandidate?.hrPrivateNotes || '',
  });

  useEffect(() => {
    if (initialCandidate) {
      setCandidate(initialCandidate);
      setLoading(false);
      setFetchError(null);
      setEditForm((prev) => ({
        fullName: initialCandidate.fullName || prev.fullName,
        phone: initialCandidate.phone || prev.phone,
        email: initialCandidate.email || prev.email,
        address: initialCandidate.address || prev.address,
        city: initialCandidate.city || prev.city,
        state: initialCandidate.state || prev.state,
        pincode: initialCandidate.pincode || prev.pincode,
        position: initialCandidate.position || prev.position,
        department: initialCandidate.department || prev.department,
        totalExperience: initialCandidate.totalExperience || prev.totalExperience,
        relevantExperience: initialCandidate.relevantExperience || prev.relevantExperience,
        currentCompany: initialCandidate.currentCompany || prev.currentCompany,
        qualification: initialCandidate.qualification || prev.qualification,
        noticePeriod: initialCandidate.noticePeriod || prev.noticePeriod,
        expectedSalary: initialCandidate.expectedSalary || prev.expectedSalary,
        skills: initialCandidate.skills || prev.skills,
        purpose: initialCandidate.purpose || prev.purpose,
        departmentToMeet: initialCandidate.departmentToMeet || prev.departmentToMeet,
        personToMeet: initialCandidate.personToMeet || prev.personToMeet,
        hrPrivateNotes: initialCandidate.hrPrivateNotes || prev.hrPrivateNotes,
      }));
    }
  }, [initialCandidate]);

  useEffect(() => {
    fetchCandidate(2);
  }, [candidateId, currentRole]);

  const fetchCandidate = async (retries = 2) => {
    if (!candidateId || !candidateId.trim()) {
      setLoading(false);
      if (!candidate && !initialCandidate) {
        setFetchError('No candidate record selected.');
      }
      return;
    }

    if (!candidate && !initialCandidate) {
      setLoading(true);
    }
    setFetchError(null);

    let attempts = 0;
    while (attempts <= retries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await authenticatedFetch(
          `/api/candidates/${encodeURIComponent(candidateId.trim())}?role=${encodeURIComponent(currentRole)}`,
          {
            signal: controller.signal,
            headers: { 'x-user-role': currentRole },
          }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${res.status}`);
        }
        const data = await res.json();
        if (data.success && data.candidate) {
          setCandidate(data.candidate);
          setInterviews(data.interviews || []);
          setTimeline(data.timeline || []);
          setEditForm({
            fullName: data.candidate.fullName || '',
            phone: data.candidate.phone || '',
            email: data.candidate.email || '',
            address: data.candidate.address || '',
            city: data.candidate.city || '',
            state: data.candidate.state || '',
            pincode: data.candidate.pincode || '',
            position: data.candidate.position || '',
            department: data.candidate.department || '',
            totalExperience: data.candidate.totalExperience || '',
            relevantExperience: data.candidate.relevantExperience || '',
            currentCompany: data.candidate.currentCompany || '',
            qualification: data.candidate.qualification || '',
            noticePeriod: data.candidate.noticePeriod || '',
            expectedSalary: data.candidate.expectedSalary || '',
            skills: data.candidate.skills || '',
            purpose: data.candidate.purpose || 'Interview / Job Application',
            departmentToMeet: data.candidate.departmentToMeet || 'HR & Recruitment',
            personToMeet: data.candidate.personToMeet || '',
            hrPrivateNotes: data.candidate.hrPrivateNotes || '',
          });
          setFetchError(null);
          setLoading(false);
          return;
        } else {
          throw new Error(data.error || 'Failed to retrieve candidate profile.');
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        attempts++;
        if (attempts <= retries) {
          await new Promise((r) => setTimeout(r, attempts * 400));
        } else {
          if (!candidate && !initialCandidate) {
            setFetchError(err?.message || 'Failed to load candidate details.');
          }
          setLoading(false);
        }
      }
    }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    setActionError(null);
    try {
      const res = await authenticatedFetch(`/api/candidates/${candidateId}?role=${currentRole}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setCandidate(data.candidate);
        setIsEditing(false);
        if (onCandidateUpdated) onCandidateUpdated();
      } else {
        setActionError(data.error || 'Failed to update candidate profile.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error during update.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCandidate = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      const res = await authenticatedFetch(`/api/candidates/${candidateId}?role=${currentRole}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-role': currentRole },
        body: JSON.stringify({ reason: deleteReason }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteConfirm(false);
        if (onCandidateDeleted) onCandidateDeleted();
      } else {
        setActionError(data.error || 'Failed to delete record.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error during deletion.');
    } finally {
      setDeleting(false);
    }
  };

  const sections: { id: DossierSection; label: string; icon: any }[] = [
    { id: 'Identity', label: 'Identity', icon: User },
    { id: 'Application', label: 'Application', icon: Briefcase },
    { id: 'Experience', label: 'Experience', icon: Layers },
    { id: 'Interview', label: 'Interview', icon: Calendar },
    { id: 'Documents', label: 'Documents', icon: FileCheck },
    { id: 'Status', label: 'Status', icon: Clock },
    { id: 'Notes', label: 'Notes', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel-elevated rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-white/12 text-slate-100 overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/8 flex items-center justify-between bg-white/2 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Live photo or fallback avatar */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative group">
                {candidate?.receptionPhotoUrl || candidate?.photoUrl || candidate?.livePhoto || candidate?.arrivalPhoto ? (
                  <img
                    src={candidate.receptionPhotoUrl || candidate.photoUrl || candidate.livePhoto || candidate.arrivalPhoto}
                    alt={candidate?.fullName}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-xl"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
                    {(candidate?.fullName || 'WCR').slice(0, 2).toUpperCase()}
                  </div>
                )}
                {(candidate?.receptionPhotoUrl || candidate?.arrivalPhoto) && (
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center ring-2 ring-[#07090C] shadow-md"
                    title="Authoritative Desk Photo Verified"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              {/* Capture Timestamp directly below the photo */}
              {(candidate?.receptionPhotoCapturedAt || candidate?.arrivalPhotoCapturedAt || candidate?.livePhotoCapturedAt) && (
                <span
                  className="text-[9px] sm:text-[10px] text-amber-300 font-mono tracking-tight mt-1 truncate max-w-[110px] sm:max-w-[130px] text-center"
                  title={`Captured: ${formatPhotoTimestamp(candidate.receptionPhotoCapturedAt || candidate.arrivalPhotoCapturedAt || candidate.livePhotoCapturedAt)}`}
                >
                  {formatPhotoTimestamp(candidate.receptionPhotoCapturedAt || candidate.arrivalPhotoCapturedAt || candidate.livePhotoCapturedAt)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {candidate?.fullName || 'Candidate Profile'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 font-mono">
                  {candidate?.token || candidate?.id}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/12 text-[10px] font-semibold">
                  {candidate?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                <strong className="text-white">{candidate?.position}</strong> &bull; {candidate?.department || 'Operations'}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                <span>Arrival: <strong className="text-slate-200 font-mono">{candidate?.arrivalTime || (candidate?.checkedInAt ? new Date(candidate.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today')}</strong></span>
                <span>Location: <strong className="text-slate-200">{candidate?.assignedRoomName || candidate?.currentLocation || 'Reception Area'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action buttons (Edit, Delete, Close) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(currentRole === 'ADMIN' || currentRole === 'HR' || currentRole === 'SENIOR_HR') && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isEditing
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/8'
                }`}
                title={isEditing ? 'Cancel Edit' : 'Edit Candidate'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            )}

            {currentRole === 'ADMIN' && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/8 transition cursor-pointer"
                title="Archive / Delete candidate"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7 Section Navigation Tabs */}
        <div className="px-4 py-2 border-b border-white/6 bg-black/25 flex gap-1 overflow-x-auto shrink-0">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/8 border border-white/12 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/4'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{sec.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="dossier-tab-highlight"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Action notice / errors */}
          {actionError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-100">Confirm Candidate Record Archive</h4>
                  <p className="text-[11px] text-rose-300/80">
                    This will permanently delete/archive candidate files under White Collar Realty retention policy.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-white/6 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCandidate}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
                >
                  {deleting ? 'Deleting...' : 'Confirm Archive'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 1: IDENTITY */}
          {activeSection === 'Identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 glass-panel rounded-2xl space-y-3 border border-white/8">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <User className="w-3.5 h-3.5" />
                    Personal Information
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Full Name</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs mt-1"
                        />
                      ) : (
                        <strong className="text-white text-sm">{candidate?.fullName}</strong>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Phone Number</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs mt-1"
                        />
                      ) : (
                        <span className="text-slate-200 font-mono">{candidate?.phone}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Email Address</span>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs mt-1"
                        />
                      ) : (
                        <span className="text-slate-200">{candidate?.email || 'Not provided'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 glass-panel rounded-2xl space-y-3 border border-white/8">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    Location & Residence
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Current Address</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs mt-1"
                        />
                      ) : (
                        <span className="text-slate-200">{candidate?.address || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 text-[10px] block">City</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs mt-1"
                          />
                        ) : (
                          <span className="text-slate-200">{candidate?.city || 'Gurugram'}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">State</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.state}
                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                            className="w-full px-2.5 py-1.5 glass-input rounded-xl text-white text-xs mt-1"
                          />
                        ) : (
                          <span className="text-slate-200">{candidate?.state || 'Haryana'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desk Photo Verification Block */}
              <div className="p-4 glass-panel rounded-2xl border border-white/8 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {candidate?.receptionPhotoUrl || candidate?.photoUrl || candidate?.livePhoto || candidate?.arrivalPhoto ? (
                      <div className="relative shrink-0">
                        <img
                          src={candidate.receptionPhotoUrl || candidate.photoUrl || candidate.livePhoto || candidate.arrivalPhoto}
                          alt={`${candidate?.fullName} Desk Photo`}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-500/70 shadow-2xl"
                        />
                        <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-full ring-2 ring-[#0B0E14] shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex flex-col items-center justify-center gap-1 shrink-0">
                        <Camera className="w-7 h-7" />
                        <span className="text-[10px] font-bold">No Photo</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white">Desk Live Photo Verification</h4>
                        {candidate?.receptionPhotoUrl || candidate?.arrivalPhoto ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Verified Record
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            Pending Verification
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-amber-300 font-mono">
                        {candidate?.receptionPhotoCapturedAt || candidate?.arrivalPhotoCapturedAt || candidate?.livePhotoCapturedAt
                          ? `Captured: ${formatPhotoTimestamp(candidate.receptionPhotoCapturedAt || candidate.arrivalPhotoCapturedAt || candidate.livePhotoCapturedAt)}`
                          : 'No desk verification photo captured yet'}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        Verified By:{' '}
                        <strong className="text-slate-200">
                          {candidate?.arrivalPhotoCapturedByName || candidate?.livePhotoCapturedBy || 'Front Desk Operations Staff'}
                        </strong>
                      </p>

                      <p className="text-[11px] text-slate-400">
                        Database Storage:{' '}
                        <span className="text-emerald-400 font-semibold font-mono">
                          {candidate?.photoUploadStatus === 'SUCCESS' || candidate?.receptionPhotoUrl ? 'PERSISTED (wcr_database)' : 'PENDING'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{candidate?.receptionPhotoUrl || candidate?.arrivalPhoto ? 'Retake Desk Photo' : 'Capture Desk Photo'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: APPLICATION */}
          {activeSection === 'Application' && (
            <div className="p-4 glass-panel rounded-2xl space-y-4 border border-white/8">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Briefcase className="w-3.5 h-3.5" />
                Job Application & Terms
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Target Role</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      className="w-full px-2 py-1 glass-input rounded-lg text-white text-xs mt-1"
                    />
                  ) : (
                    <strong className="text-white text-xs">{candidate?.position}</strong>
                  )}
                </div>

                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Department</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-2 py-1 glass-input rounded-lg text-white text-xs mt-1"
                    />
                  ) : (
                    <span className="text-slate-200">{candidate?.department || 'Operations'}</span>
                  )}
                </div>

                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Expected CTC / Salary</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.expectedSalary}
                      onChange={(e) => setEditForm({ ...editForm, expectedSalary: e.target.value })}
                      className="w-full px-2 py-1 glass-input rounded-lg text-white text-xs mt-1"
                    />
                  ) : (
                    <span className="text-amber-300 font-mono font-bold">{candidate?.expectedSalary || 'Negotiable'}</span>
                  )}
                </div>

                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Notice Period</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.noticePeriod}
                      onChange={(e) => setEditForm({ ...editForm, noticePeriod: e.target.value })}
                      className="w-full px-2 py-1 glass-input rounded-lg text-white text-xs mt-1"
                    />
                  ) : (
                    <span className="text-slate-200">{candidate?.noticePeriod || 'Immediate'}</span>
                  )}
                </div>

                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Highest Qualification</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.qualification}
                      onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                      className="w-full px-2 py-1 glass-input rounded-lg text-white text-xs mt-1"
                    />
                  ) : (
                    <span className="text-slate-200">{candidate?.qualification || 'Graduate'}</span>
                  )}
                </div>

                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Host / Person to Meet</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.personToMeet}
                      onChange={(e) => setEditForm({ ...editForm, personToMeet: e.target.value })}
                      className="w-full px-2 py-1 glass-input rounded-lg text-white text-xs mt-1"
                    />
                  ) : (
                    <span className="text-slate-200">{candidate?.personToMeet || 'HR Coordinator'}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: EXPERIENCE */}
          {activeSection === 'Experience' && (
            <div className="p-4 glass-panel rounded-2xl space-y-4 border border-white/8">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5" />
                Work History & Skillset
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Current / Last Company</span>
                  <strong className="text-white text-xs">{candidate?.currentCompany || 'Not disclosed'}</strong>
                </div>

                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Total Experience</span>
                  <span className="text-amber-300 font-mono font-bold">{candidate?.totalExperience || '0'} Years</span>
                </div>

                <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                  <span className="text-slate-400 text-[10px] block">Relevant Experience</span>
                  <span className="text-amber-300 font-mono font-bold">{candidate?.relevantExperience || '0'} Years</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block mb-1">Key Professional Skills</span>
                <div className="p-3 bg-white/4 rounded-xl border border-white/6 text-xs text-slate-200">
                  {candidate?.skills || 'Real Estate Sales, Negotiation, CRM Operations, Client Relations'}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: INTERVIEW */}
          {activeSection === 'Interview' && (
            <div className="space-y-4">
              <div className="p-4 glass-panel rounded-2xl space-y-3 border border-white/8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    Interview Allocation & Cabin
                  </span>
                  {onAssignRoom && (
                    <button
                      onClick={() => onAssignRoom(candidateId)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>Allocate / Change Room</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                    <span className="text-slate-400 text-[10px] block">Assigned Cabin / Room</span>
                    <strong className="text-emerald-400 text-xs">
                      {candidate?.assignedRoomName || 'Not Assigned (Lobby)'}
                    </strong>
                  </div>

                  <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                    <span className="text-slate-400 text-[10px] block">Assigned Interviewer</span>
                    <strong className="text-white text-xs">
                      {candidate?.assignedInterviewerName || 'Pending Allocation'}
                    </strong>
                  </div>

                  <div className="p-3 bg-white/4 rounded-xl border border-white/6">
                    <span className="text-slate-400 text-[10px] block">Current Stage</span>
                    <span className="text-amber-400 font-semibold">{candidate?.status}</span>
                  </div>
                </div>
              </div>

              {/* Rounds List */}
              {interviews.length > 0 && (
                <div className="p-4 glass-panel rounded-2xl space-y-3 border border-white/8">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Scheduled Interview Rounds ({interviews.length})
                  </span>
                  <div className="space-y-2">
                    {interviews.map((intv) => (
                      <div
                        key={intv.id}
                        className="p-3 bg-white/4 rounded-xl border border-white/6 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-white block">{intv.roundName}</strong>
                          <span className="text-[11px] text-slate-400">
                            Interviewer: {intv.interviewerName} &bull; Room: {intv.roomName || 'TBD'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono text-[10px]">
                          {intv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: DOCUMENTS */}
          {activeSection === 'Documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resume Card */}
                <div className="p-5 glass-panel rounded-2xl border border-white/8 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Curriculum Vitae / Resume</h4>
                    <p className="text-[11px] text-slate-400">
                      {candidate?.resumeUrl || candidate?.resumeFileName
                        ? `File: ${candidate.resumeFileName || 'Resume.pdf'}`
                        : 'No resume file uploaded yet'}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowResumeModal(true)}
                    className="w-full py-2.5 px-3 bg-white/6 hover:bg-white/10 text-white font-semibold text-xs rounded-xl border border-white/10 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Resume in Secure Viewer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: STATUS & LIFECYCLE */}
          {activeSection === 'Status' && (
            <div className="space-y-4">
              {/* Animated Progress Timeline */}
              {candidate && <VisitorArrivalTimeline candidate={candidate} />}

              {/* Event Timeline History */}
              <div className="p-4 glass-panel rounded-2xl space-y-3 border border-white/8">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Authoritative Audit Log & Event Trail ({timeline.length})
                </span>

                {timeline.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {timeline.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2.5 bg-white/4 rounded-xl border border-white/6 text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <strong className="text-white block">{evt.action}</strong>
                          <p className="text-[11px] text-slate-400">{evt.details}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                          {formatDateTime(evt.timestamp).full}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No events logged yet.</p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 7: NOTES */}
          {activeSection === 'Notes' && (
            <div className="space-y-4">
              <div className="p-4 glass-panel rounded-2xl space-y-3 border border-white/8">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Lock className="w-3.5 h-3.5" />
                  Private HR & Interviewer Notes
                </span>
                <p className="text-[11px] text-slate-400">
                  Visible only to HR, Senior HR, Admin, and CEO suites. Not exposed to candidates.
                </p>

                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editForm.hrPrivateNotes}
                    onChange={(e) => setEditForm({ ...editForm, hrPrivateNotes: e.target.value })}
                    className="w-full p-3 glass-input rounded-xl text-white text-xs"
                    placeholder="Enter confidential interview notes, salary feedback, or observations..."
                  />
                ) : (
                  <div className="p-3 bg-white/4 rounded-xl border border-white/6 text-xs text-slate-200 whitespace-pre-wrap min-h-[80px]">
                    {candidate?.hrPrivateNotes || 'No private HR notes recorded yet.'}
                  </div>
                )}
              </div>

              {/* Validation Engine Results if available */}
              {candidate?.validationResult && (
                <div className="p-4 glass-panel rounded-2xl space-y-2 border border-white/8 text-xs">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Automated Validation Engine Checks
                  </span>
                  <div className="p-3 bg-white/4 rounded-xl border border-white/6 font-mono text-[11px] text-slate-300">
                    Confidence: {candidate.validationResult.confidenceScore || 100}% &bull; Passed
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save Edit Toolbar (when in editing mode) */}
          {isEditing && (
            <div className="p-3 glass-panel-elevated rounded-2xl flex items-center justify-between gap-3 border border-amber-500/40">
              <span className="text-xs font-bold text-amber-300">Unsaved changes in profile</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-white/6 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/8 bg-black/30 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            WCR Protected Record &bull; Encrypted
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/6 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl border border-white/8 transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </motion.div>

      {/* Sub-Modals for in-app document viewing */}
      {showResumeModal && candidate && (
        <ResumeDocumentModal
          candidate={candidate}
          currentRole={currentRole}
          onClose={() => setShowResumeModal(false)}
        />
      )}

      {showPhotoModal && candidate && (
        <ReceptionPhotoModal
          candidate={candidate}
          receptionistId="usr-rec-1"
          receptionistName="Receptionist"
          onClose={() => setShowPhotoModal(false)}
          onSuccess={(updated) => {
            setCandidate(updated);
            setShowPhotoModal(false);
            if (onPhotoCaptured) onPhotoCaptured(updated);
          }}
        />
      )}
    </div>
  );
};
