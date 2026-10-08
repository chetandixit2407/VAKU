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
  DoorOpen,
  Route,
} from 'lucide-react';
import type { Candidate, Interview, TimelineEvent, UserRole } from '../types/index.ts';
import { formatDateTime } from '../utils/dateFormatter.ts';
import { ResumeDocumentModal } from './ResumeDocumentModal.tsx';
import { GovernmentIdModal } from './GovernmentIdModal.tsx';
import { ReceptionPhotoModal } from './ReceptionPhotoModal.tsx';
import { authenticatedFetch } from '../utils/apiClient.ts';
import { WCRCandidateJourney } from './design-system/index.ts';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'interviews' | 'documents' | 'activity'>('overview');
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
        const data = await res.json();
        if (data.success && data.candidate) {
          setCandidate(data.candidate);
          setInterviews(Array.isArray(data.interviews) ? data.interviews : []);
          setTimeline(Array.isArray(data.timeline) ? data.timeline : []);
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
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
        <div className="bg-white/98 border border-[#EFE0CC] rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
          <div className="w-10 h-10 border-2 border-[#C99A68] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8C6033] font-bold">Fetching Candidate Command Dossier...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-white/98 border border-[#EFE0CC] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
          <div className="w-12 h-12 bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111111]">Candidate Details Unavailable</h3>
            <p className="text-xs text-[#77716B] mt-1.5 leading-relaxed">
              {fetchError || 'Unable to retrieve candidate dossier from server. The record may have been archived.'}
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => fetchCandidate(1)}
              className="flex-1 py-2.5 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white hover:bg-[#FAF9F6] text-[#77716B] hover:text-[#111111] font-semibold text-xs rounded-xl border border-[#EFE0CC] transition cursor-pointer"
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

  const govId = candidate.governmentId;
  const valResult = candidate.validationResult;
  const isGovIdVerified = govId?.verificationStatus === 'VERIFIED';
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

  // Waiting time calculation
  const waitingTime = (() => {
    const t = candidate.arrivalTime || candidate.createdAt;
    if (!t) return 'Just arrived';
    const diffMins = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 60000));
    if (diffMins < 60) return `${diffMins} mins`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  })();

  const activeInterviewer =
    candidate.interviewerName ||
    (candidate as any).assignedInterviewerName ||
    (interviews.length > 0 ? interviews[0].interviewerName : 'Not Assigned');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white/98 border border-[#EFE0CC] rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#171717]">
        {/* Sync status warning banner */}
        {fetchError && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Showing cached dossier snapshot. Real-time background sync is reconnecting.</span>
            </div>
            <button
              onClick={() => fetchCandidate(1)}
              className="text-amber-800 hover:text-amber-950 font-bold text-xs underline cursor-pointer"
            >
              Retry Sync
            </button>
          </div>
        )}

        {/* Top Header with Requirement 15 fields */}
        <div className="p-5 sm:p-6 border-b border-[#EFE0CC] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
          <div className="flex items-start gap-4 min-w-0">
            {photoToDisplay ? (
              <div className="relative shrink-0">
                <img
                  src={photoToDisplay}
                  alt={candidate.fullName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#E4CCAF] shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] shrink-0 shadow-xs">
                <User className="w-8 h-8 text-[#C99A68]" />
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-[#171717] tracking-tight truncate">
                  {candidate.fullName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]">
                  {candidate.status}
                </span>
                {valResult?.overallStatus === 'READY_FOR_RECEPTION' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready For Reception
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-semibold text-[#8C6033] truncate">
                {candidate.position}
              </p>

              {/* Requirement 15 Comprehensive Header Strip */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#77716B] pt-1">
                <span className="flex items-center gap-1 text-[#171717]">
                  <MapPin className="w-3.5 h-3.5 text-[#C99A68]" />
                  Location: <strong className="text-[#8C6033]">{candidate.currentLocation || 'Reception Lounge'}</strong>
                </span>

                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#8A847D]" />
                  Interviewer: <strong className="text-[#171717]">{activeInterviewer}</strong>
                </span>

                <span className="flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5 text-sky-600" />
                  Room: <strong className="text-emerald-700">{candidate.assignedRoomName || 'Unassigned'}</strong>
                </span>

                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#8A847D]" />
                  Waiting Time: <strong className="text-[#8C6033]">{waitingTime}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-start shrink-0">
            {canEditOrDelete && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#171717] font-bold text-xs border border-[#E4CCAF] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#8C6033]" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#77716B] hover:text-[#171717] hover:bg-[#F3EFE9] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Requirement 15: Overview, Journey, Interviews, Documents, Activity) */}
        <div className="px-6 border-b border-[#EFE0CC] flex gap-6 text-xs font-semibold bg-[#FAF9F6] overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'journey', label: 'Journey', icon: Route },
            { id: 'interviews', label: `Interviews (${interviews.length})`, icon: Briefcase },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'activity', label: `Activity (${timeline.length})`, icon: Layers },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === id
                  ? 'border-[#C99A68] text-[#8C6033] font-bold'
                  : 'border-transparent text-[#77716B] hover:text-[#171717]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && !isEditing && (
            <div className="space-y-6">
              {/* Operational & Contact Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#8C6033] uppercase tracking-wider">
                  Operational & Contact Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Mobile Phone</span>
                    <strong className="text-[#171717]">{candidate.phone || 'N/A'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Email Address</span>
                    <strong className="text-[#171717] truncate block">{candidate.email || 'N/A'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Current Location</span>
                    <strong className="text-[#8C6033]">{candidate.currentLocation || 'Reception Lounge'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Visit Purpose</span>
                    <strong className="text-[#171717]">{candidate.purpose || 'Interview / Job Application'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Department</span>
                    <strong className="text-[#171717]">{candidate.department || 'Sales & Business Development'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Address</span>
                    <strong className="text-[#171717] truncate block">
                      {[candidate.city, candidate.state].filter(Boolean).join(', ') || 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Professional Background */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#8C6033] uppercase tracking-wider">
                  Professional Background
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Total Experience</span>
                    <strong className="text-[#171717]">{candidate.totalExperience || 'Fresher'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Current / Previous Company</span>
                    <strong className="text-[#171717]">{candidate.currentCompany || 'N/A'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Qualification</span>
                    <strong className="text-[#171717]">{candidate.qualification || 'Graduate'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Notice Period</span>
                    <strong className="text-[#171717]">{candidate.noticePeriod || 'Immediate'}</strong>
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Expected Salary</span>
                    {canViewConfidential ? (
                      <strong className="text-[#171717]">{candidate.expectedSalary || 'Confidential'}</strong>
                    ) : (
                      <span className="text-[#77716B] font-mono text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Confidential
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#EFE0CC]">
                    <span className="text-[#77716B] text-[10px] block">Key Skills</span>
                    <strong className="text-[#8C6033] truncate block">{candidate.skills || 'Advisory'}</strong>
                  </div>
                </div>
              </div>

              {/* Confidential HR Notes: Signature Charcoal Inner Panel */}
              {canViewConfidential && (
                <div className="p-4 bg-[#171717] border border-[#2D2D2D] rounded-2xl space-y-2 text-white shadow-md">
                  <div className="flex items-center gap-2 text-[#D6B28A] text-xs font-bold uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-[#C99A68]" />
                    <span>Confidential HR Remarks (Authorized View)</span>
                  </div>
                  <p className="text-[#EFE0CC] text-xs italic leading-relaxed">
                    {candidate.hrPrivateNotes || 'No private HR notes recorded yet.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: JOURNEY */}
          {activeTab === 'journey' && (
            <div className="space-y-6">
              <WCRCandidateJourney
                status={candidate.status}
                interviewStage={candidate.interviewRound}
              />

              <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EFE0CC] space-y-3 text-xs">
                <h4 className="font-bold text-[#171717] text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C99A68]" />
                  <span>Pipeline Milestone Log</span>
                </h4>
                <div className="space-y-2 text-[#77716B]">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EFE0CC]">
                    <span className="text-[#171717]">Initial QR Self-Registration</span>
                    <span className="text-emerald-700 font-bold">✓ Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EFE0CC]">
                    <span className="text-[#171717]">Reception Arrival & Photo Capture</span>
                    <span className="text-emerald-700 font-bold">
                      {candidate.arrivalPhoto || candidate.livePhoto ? '✓ Verified' : 'Pending Desk Verification'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EFE0CC]">
                    <span className="text-[#171717]">Room Allocation & Escort</span>
                    <span className="text-[#8C6033] font-bold">
                      {candidate.assignedRoomName ? `Assigned to ${candidate.assignedRoomName}` : 'Awaiting HR Room Choice'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DOCUMENTS (Resume, Gov ID, Photo) */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resume Card */}
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EFE0CC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8C6033] uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#C99A68]" />
                      Candidate Resume
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        hasResume
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-[#77716B] border-slate-200'
                      }`}
                    >
                      {hasResume ? 'Attached' : 'Missing'}
                    </span>
                  </div>

                  <p className="text-xs text-[#77716B]">
                    {candidate.resumeFileName || 'Official candidate curriculum vitae.'}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    {hasResume ? (
                      <>
                        <button
                          onClick={() => setShowResumeModal(true)}
                          className="flex-1 py-2 rounded-xl bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C99A68]" />
                          <span>View Resume</span>
                        </button>
                        <button
                          onClick={handleDownloadResume}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#E4CCAF] text-[#171717] text-xs font-semibold transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-[#8A847D] italic">No document available</span>
                    )}
                  </div>
                </div>

                {/* Government ID Card */}
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EFE0CC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8C6033] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-600" />
                      Government ID
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isGovIdVerified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : hasGovId
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-[#77716B] border-slate-200'
                      }`}
                    >
                      {isGovIdVerified ? 'Verified' : hasGovId ? 'Uploaded' : 'Missing'}
                    </span>
                  </div>

                  <p className="text-xs text-[#77716B]">
                    {govId?.idType ? `Type: ${govId.idType}` : 'Encrypted government identification doc.'}
                  </p>

                  <div className="pt-2">
                    {hasGovId ? (
                      <button
                        onClick={() => setShowGovIdModal(true)}
                        className="w-full py-2 rounded-xl bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspect Government ID</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#8A847D] italic">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reception Photo Desk Verification */}
              {canCapturePhoto && (
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EFE0CC] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#171717]">Reception Desk Camera Verification</h4>
                    <p className="text-[11px] text-[#77716B]">Capture or update high-resolution photo on arrival.</p>
                  </div>
                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#E4CCAF] text-[#8C6033] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Camera className="w-4 h-4 text-[#C99A68]" />
                    <span>Open Camera</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: INTERVIEWS */}
          {activeTab === 'interviews' && (
            <div className="space-y-3">
              {interviews.length === 0 ? (
                <div className="text-center py-8 text-[#77716B] text-xs">No interview rounds scheduled yet.</div>
              ) : (
                interviews.map((intv) => (
                  <div key={intv.id} className="p-4 bg-[#FAF9F6] border border-[#EFE0CC] rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#171717] text-sm">{intv.roundName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF4ED] text-[#8C6033] border border-[#E4CCAF]">
                        {intv.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#77716B]">
                      <span>Interviewer: <strong className="text-[#171717]">{intv.interviewerName}</strong></span>
                      <span>Scheduled: {intv.scheduledTime}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: ACTIVITY / TIMELINE */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-[#77716B] text-xs">No activity logged yet.</div>
              ) : (
                timeline.map((event) => {
                  const formatted = formatDateTime(event.timestamp);
                  return (
                    <div key={event.id} className="p-3.5 bg-[#FAF9F6] border border-[#EFE0CC] rounded-2xl flex items-start gap-3 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C99A68] mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#171717]">{event.eventType}</span>
                          <span className="text-[10px] text-[#8A847D]">
                            {formatted.date} at {formatted.time}
                          </span>
                        </div>
                        <p className="text-[#77716B] text-[11px] mt-0.5">{event.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* EDIT CANDIDATE FORM VIEW */}
          {isEditing && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE0CC]">
                <h3 className="text-sm font-bold text-[#8C6033] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#C99A68]" /> Editing Candidate Profile (HR / Admin)
                </h3>
                <span className="text-[10px] text-[#8A847D] font-mono">ID: {candidateId}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#171717] font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E4CCAF] rounded-xl text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[#171717] font-semibold mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E4CCAF] rounded-xl text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[#171717] font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E4CCAF] rounded-xl text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[#171717] font-semibold mb-1">Position Applied *</label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E4CCAF] rounded-xl text-[#171717]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE0CC]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white border border-[#EFE0CC] text-[#77716B] hover:text-[#171717] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-5 py-2 bg-[#171717] hover:bg-[#282828] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#C99A68]" />
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#EFE0CC] bg-white flex items-center justify-between">
          <span className="text-xs text-[#8A847D]">Security: Role-based authenticated access</span>
          <div className="flex gap-2">
            {onAssignRoom && (currentRole === 'HR' || currentRole === 'ADMIN') && candidate.status !== 'CHECKED_OUT' && candidate.status !== 'DELETED' && (
              <button
                onClick={() => {
                  onClose();
                  onAssignRoom(candidate.id, candidate.currentInterviewId);
                }}
                className="px-4 py-2 bg-[#171717] hover:bg-[#282828] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                title="HR / Admin Room Control: Assign or change room"
              >
                <DoorOpen className="w-3.5 h-3.5 text-[#C99A68]" />
                <span>{candidate.assignedRoomId ? 'Change / Reassign Room' : 'Assign Room Now'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#FAF9F6] text-[#171717] text-xs font-semibold rounded-xl border border-[#EFE0CC] transition cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white/98 border border-rose-200 rounded-3xl p-6 max-w-md w-full space-y-4 text-[#111111] shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
            <div className="w-12 h-12 bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-[#111111]">Delete Candidate?</h3>
              <p className="text-xs text-[#77716B] font-medium">
                Candidate: <strong className="text-[#8C6033]">{candidate.fullName}</strong>
              </p>
              <p className="text-xs text-[#77716B] leading-relaxed">
                This action will remove/archive the candidate record according to retention policy.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">Reason for Archival</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Withdrawn by candidate / Duplicate application"
                className="w-full px-3 py-2 bg-white border border-[#E4CCAF] rounded-xl text-xs text-[#111111] focus:outline-hidden focus:border-[#C99A68]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-white hover:bg-[#FAF9F6] text-[#77716B] hover:text-[#111111] font-semibold text-xs rounded-xl border border-[#EFE0CC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCandidate}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
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
