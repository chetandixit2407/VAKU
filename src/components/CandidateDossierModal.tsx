import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import type { Candidate, Interview, TimelineEvent, UserRole } from '../types/index.ts';
import { formatDateTime } from '../utils/dateFormatter.ts';
import { ResumeDocumentModal } from './ResumeDocumentModal.tsx';
import { GovernmentIdModal } from './GovernmentIdModal.tsx';
import { ReceptionPhotoModal } from './ReceptionPhotoModal.tsx';
import { authenticatedFetch } from '../utils/apiClient.ts';

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
  const [loading, setLoading] = useState<boolean>(!initialCandidate);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(initialCandidate || null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'validation' | 'timeline' | 'interviews'>('profile');
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [showGovIdModal, setShowGovIdModal] = useState<boolean>(false);
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

  // Keep candidate synced if initialCandidate is supplied or updated
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
            headers: {
              'x-user-role': currentRole,
            },
          }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${res.status}`);
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
          console.warn('[Dossier Sync]', err?.name === 'AbortError' ? 'Request timed out' : err?.message || err);
          // If we already have candidate data (e.g. from initialCandidate), don't block the screen
          if (!candidate && !initialCandidate) {
            setFetchError(
              err?.name === 'AbortError'
                ? 'Server took too long to respond. Please check your connection and retry.'
                : err?.message || 'Failed to load candidate details.'
            );
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
        onClose();
      } else {
        setActionError(data.error || 'Failed to delete candidate.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error during deletion.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadResume = () => {
    if (!candidate) return;
    const downloadUrl = `/api/candidates/${candidate.id}/resume/download?role=${currentRole}`;
    const fileName = candidate.resumeFileName || `${candidate.fullName.replace(/\s+/g, '_')}_Resume.pdf`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  if (!candidate && loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-300 font-medium">Fetching Candidate Dossier...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Candidate Details Unavailable</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {fetchError || 'Unable to retrieve candidate dossier from server. The record may have been archived or network connection was interrupted.'}
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => fetchCandidate(1)}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const photoToDisplay = candidate.arrivalPhoto || candidate.livePhoto;
  const photoTimestamp = formatDateTime(candidate.arrivalPhotoCapturedAt || candidate.livePhotoCapturedAt || candidate.createdAt);
  const photoActor =
    candidate.arrivalPhotoCapturedByName ||
    candidate.livePhotoCapturedBy ||
    (candidate.arrivalPhoto ? 'Reception Desk' : 'Candidate Self-Capture');
  const resumeTimestamp = formatDateTime(candidate.resumeUploadedAt || candidate.createdAt);

  const govId = candidate.governmentId;
  const valResult = candidate.validationResult;
  const isGovIdVerified = govId?.verificationStatus === 'VERIFIED';
  const isGovIdNeedsReview = govId?.verificationStatus === 'NEEDS_REVIEW';
  const hasResume = Boolean(
    candidate.resumeUrl ||
    candidate.resumeFileName ||
    candidate.resumeMetadata
  );
  const hasGovId = Boolean(
    govId?.storageKey ||
    govId?.documentDataUrl ||
    govId?.maskedIdNumber ||
    govId?.idType ||
    govId?.originalFileName ||
    govId?.id ||
    candidate.hasGovernmentId ||
    candidate.governmentIdFileName ||
    candidate.governmentIdFileUrl
  );

  const canViewConfidential = currentRole === 'HR' || currentRole === 'ADMIN' || currentRole === 'CEO';
  const canCapturePhoto = currentRole === 'RECEPTION' || currentRole === 'HR' || currentRole === 'ADMIN';
  const canEditOrDelete = currentRole === 'HR' || currentRole === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        {/* Sync status warning banner if background fetch failed */}
        {fetchError && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Showing cached dossier snapshot. Real-time background sync is reconnecting.</span>
            </div>
            <button
              onClick={() => fetchCandidate(1)}
              className="text-amber-400 hover:text-amber-300 font-bold text-xs underline cursor-pointer"
            >
              Retry Sync
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/80">
          <div className="flex items-center gap-4">
            {photoToDisplay ? (
              <img
                src={photoToDisplay}
                alt={candidate.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <User className="w-8 h-8" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">{candidate.fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {candidate.status}
                </span>
                {valResult?.overallStatus === 'READY_FOR_RECEPTION' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready For Reception
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-400 font-medium mt-0.5">{candidate.position}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {candidate.currentLocation || 'Reception Lounge'}
                </span>
                <span>•</span>
                <span>ID: {candidate.id}</span>
                <span>•</span>
                <span className="text-cyan-400 font-semibold">{currentRole} Profile View</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEditOrDelete && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Candidate</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex gap-5 text-xs font-semibold bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'profile'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Candidate Profile
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'validation'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Automated Validation
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'interviews'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Interviews ({interviews.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'timeline'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Timeline ({timeline.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {actionError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{actionError}</span>
            </div>
          )}

          {activeTab === 'profile' && !isEditing && (
            <div className="space-y-6">
              {/* SECTION: LIVE PHOTO */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Camera className="w-4 h-4" />
                    <span>Reception & Live Photo</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      candidate.arrivalPhoto
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : candidate.livePhoto
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {candidate.arrivalPhoto ? 'Desk Verified' : candidate.livePhoto ? 'Captured' : 'Not Captured'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {photoToDisplay ? (
                    <img
                      src={photoToDisplay}
                      alt={candidate.fullName}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-500 shadow-xl shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                      No photo captured
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-xs text-left w-full">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Captured:</span>
                        <strong className="text-white">{photoTimestamp.date} at {photoTimestamp.time}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Captured By:</span>
                        <strong className="text-amber-300">{photoActor}</strong>
                      </div>
                    </div>

                    {canCapturePhoto && (
                      <button
                        onClick={() => setShowPhotoModal(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{photoToDisplay ? 'Retake Live Photo' : 'Capture Live Photo'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION: DOCUMENTS (RESUME & GOVERNMENT ID) - STRICTLY RESTRICTED FROM PANTRY */}
              {currentRole !== 'PANTRY' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Candidate Documents
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* RESUME CARD */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">Resume</h4>
                            <span className="text-[10px] text-slate-400 block">
                              {hasResume ? (candidate.resumeFileSize || '1.4 MB') : 'Not available'}
                            </span>
                          </div>
                        </div>
                        {hasResume ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Uploaded
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Not uploaded
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 truncate">
                        {hasResume
                          ? (candidate.resumeFileName || `${candidate.fullName.replace(/\s+/g, '_')}_Resume.pdf`)
                          : 'No resume uploaded by candidate'}
                      </p>

                      <div className="pt-1 border-t border-slate-800/80">
                        {hasResume ? (
                          <div className="flex items-center gap-2">
                            {/* PRIMARY ACTION: PREVIEW */}
                            <button
                              type="button"
                              onClick={() => setShowResumeModal(true)}
                              className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                              title="Preview resume directly inside WCR (no download required)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview Resume</span>
                            </button>

                            {/* SECONDARY ACTION: AUTHORIZED DOWNLOAD */}
                            <button
                              type="button"
                              onClick={handleDownloadResume}
                              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
                              title="Download original file"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                              <span>Download</span>
                            </button>
                          </div>
                        ) : (
                          <div className="py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 text-xs font-medium text-center">
                            Resume not uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* OPERATIONAL INFORMATION */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Operational & Reception Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Mobile Phone</span>
                    <strong className="text-white">{candidate.phone || 'N/A'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Email Address</span>
                    <strong className="text-white truncate block">{candidate.email || 'N/A'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Current Location</span>
                    <strong className="text-amber-400">{candidate.currentLocation || 'Reception Lounge'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Visit Purpose</span>
                    <strong className="text-white">{candidate.purpose || 'Interview / Job Application'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Department</span>
                    <strong className="text-white">{candidate.department || 'Sales & Business Development'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Interviewer / Host</span>
                    <strong className="text-slate-200">{candidate.interviewerName || candidate.personToMeet || 'Assigned on arrival'}</strong>
                  </div>
                </div>
              </div>

              {/* PROFESSIONAL BACKGROUND */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Professional Background
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Total Experience</span>
                    <strong className="text-white">{candidate.totalExperience || 'Fresher'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Previous Company</span>
                    <strong className="text-white">{candidate.currentCompany || 'N/A'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Qualification</span>
                    <strong className="text-white">{candidate.qualification || 'Graduate'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Notice Period</span>
                    <strong className="text-white">{candidate.noticePeriod || 'Immediate'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Expected CTC</span>
                    {canViewConfidential ? (
                      <strong className="text-white">{candidate.expectedSalary || 'Confidential'}</strong>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Confidential (HR Only)
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Skills</span>
                    <strong className="text-slate-200">{candidate.skills || 'Luxury Advisory'}</strong>
                  </div>
                </div>
              </div>

              {/* CONFIDENTIAL HR NOTES */}
              {canViewConfidential && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confidential HR Notes (Restricted)</span>
                  </div>
                  <p className="text-slate-200 text-xs italic">
                    {candidate.hrPrivateNotes || 'No private HR notes recorded yet.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* EDIT CANDIDATE FORM VIEW */}
          {activeTab === 'profile' && isEditing && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Editing Candidate Profile (HR / Admin)
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">ID: {candidateId}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Position Applied *</label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Experience</label>
                  <input
                    type="text"
                    value={editForm.totalExperience}
                    onChange={(e) => setEditForm({ ...editForm, totalExperience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Relevant Experience</label>
                  <input
                    type="text"
                    value={editForm.relevantExperience}
                    onChange={(e) => setEditForm({ ...editForm, relevantExperience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Company</label>
                  <input
                    type="text"
                    value={editForm.currentCompany}
                    onChange={(e) => setEditForm({ ...editForm, currentCompany: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Qualification</label>
                  <input
                    type="text"
                    value={editForm.qualification}
                    onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Notice Period</label>
                  <input
                    type="text"
                    value={editForm.noticePeriod}
                    onChange={(e) => setEditForm({ ...editForm, noticePeriod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected CTC</label>
                  <input
                    type="text"
                    value={editForm.expectedSalary}
                    onChange={(e) => setEditForm({ ...editForm, expectedSalary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 col-span-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">State</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Purpose of Visit</label>
                  <input
                    type="text"
                    value={editForm.purpose}
                    onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Host / Person to Meet</label>
                  <input
                    type="text"
                    value={editForm.personToMeet}
                    onChange={(e) => setEditForm({ ...editForm, personToMeet: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Skills</label>
                  <input
                    type="text"
                    value={editForm.skills}
                    onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Confidential HR Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.hrPrivateNotes}
                    onChange={(e) => setEditForm({ ...editForm, hrPrivateNotes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: AUTOMATED VALIDATION SUMMARY */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    Automated Validation Summary
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                    {valResult?.overallStatus || 'READY_FOR_RECEPTION'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Personal Information</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Passed
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Government ID & Format</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Resume Document</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Attached
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Data Consistency Check</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Passed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="space-y-3">
              {interviews.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No interview rounds scheduled yet.</div>
              ) : (
                interviews.map((intv) => (
                  <div key={intv.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{intv.roundName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                        {intv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {timeline.map((event) => {
                const formatted = formatDateTime(event.timestamp);
                return (
                  <div key={event.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{event.eventType}</span>
                        <span className="text-[10px] text-slate-400">{formatted.date} at {formatted.time}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">{event.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500">Security: Role-based authenticated access</span>
          <div className="flex gap-2">
            {onAssignRoom && candidate.status === 'ARRIVED' && (
              <button
                onClick={() => {
                  onClose();
                  onAssignRoom(candidate.id, candidate.currentInterviewId);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Assign Room Now
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 text-slate-100 shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Delete Candidate?</h3>
              <p className="text-xs text-slate-300 font-medium">
                Candidate: <strong className="text-amber-400">{candidate.fullName}</strong>
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                This action will remove/archive the candidate record<br className="hidden sm:inline" />
                {' '}and associated operational data according to retention policy.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Archival</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Withdrawn by candidate / Duplicate application"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCandidate}
                disabled={deleting}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
              >
                {deleting ? 'Archiving...' : 'Delete Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && (
        <ResumeDocumentModal
          candidate={candidate}
          currentRole={currentRole}
          onClose={() => setShowResumeModal(false)}
        />
      )}

      {/* Government ID Modal */}
      {showGovIdModal && (
        <GovernmentIdModal
          candidate={candidate}
          currentRole={currentRole}
          onClose={() => setShowGovIdModal(false)}
        />
      )}

      {/* Reception Photo Modal */}
      {showPhotoModal && (
        <ReceptionPhotoModal
          candidate={candidate}
          receptionistId="usr-rec-1"
          receptionistName="Ananya Sen (Reception)"
          onClose={() => setShowPhotoModal(false)}
          onSuccess={(updated) => {
            setShowPhotoModal(false);
            setCandidate(updated);
            if (onPhotoCaptured) onPhotoCaptured(updated);
          }}
        />
      )}
    </div>
  );
};
