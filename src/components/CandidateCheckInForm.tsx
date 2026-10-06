import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  Building2,
  Users,
  Truck,
  HelpCircle,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  User,
  Calendar,
  Clock,
  X,
  Phone,
  Mail,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { CameraCapture, type PhotoCaptureSource } from './CameraCapture.tsx';
import {
  VISIT_TYPE_OPTIONS,
  CONFIGURED_STAFF_HOSTS,
  isInterviewPurpose,
  validatePersonName,
  validateIndianMobile,
  validateEmail,
  validateAppointmentDateTime,
  type VisitTypeCategory,
  type StaffHostOption,
} from '../utils/registrationConfig.ts';

interface CandidateCheckInFormProps {
  initialToken?: string;
  isStandalonePage?: boolean;
  onSuccess?: (candidate: any) => void;
  onCancel?: () => void;
}

type CvHandlingMode = 'DOCUMENT_UPLOAD' | 'HARD_COPY' | 'PHOTO_PAGES' | 'UNAVAILABLE';

export const CandidateCheckInForm: React.FC<CandidateCheckInFormProps> = ({
  initialToken = 'WCR-APPT-901',
  isStandalonePage = false,
  onSuccess,
  onCancel,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [sessionLoading, setSessionLoading] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isCompletedSession, setIsCompletedSession] = useState<boolean>(false);
  const [isExpiredSession, setIsExpiredSession] = useState<boolean>(false);

  // ========================================================
  // FIRST FIELD: VISIT TYPE (NOT PRE-FILLED)
  // ========================================================
  const [visitType, setVisitType] = useState<string>('');

  // Helper
  const isCandidate = isInterviewPurpose(visitType);
  const isNormalVisitor = Boolean(visitType && !isCandidate);

  // ========================================================
  // PERSONAL INFORMATION (NOT PRE-FILLED)
  // ========================================================
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>(''); // Interview only, removed for visitor

  // ========================================================
  // WHOM TO MEET (NOT PRE-FILLED, NO DEFAULT HR/HOST)
  // ========================================================
  const [selectedHostId, setSelectedHostId] = useState<string>('');

  // ========================================================
  // APPOINTMENT & SCHEDULE
  // ========================================================
  const [visitSchedule, setVisitSchedule] = useState<'WALK_IN' | 'SCHEDULED'>('SCHEDULED');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [confirmedAppointment, setConfirmedAppointment] = useState<{
    time?: string;
    stage?: string;
    interviewer?: string;
  } | null>(null);

  // ========================================================
  // NORMAL VISITOR SPECIFIC FIELDS (NOT PRE-FILLED)
  // ========================================================
  const [workPurpose, setWorkPurpose] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [vendorCompany, setVendorCompany] = useState<string>('');
  const [serviceNature, setServiceNature] = useState<string>('');
  const [propertyInterest, setPropertyInterest] = useState<string>('');
  const [clientBudget, setClientBudget] = useState<string>('');
  const [meetingAgenda, setMeetingAgenda] = useState<string>('');
  const [otherPurposeReason, setOtherPurposeReason] = useState<string>('');

  // ========================================================
  // INTERVIEW CANDIDATE SPECIFIC FIELDS (NOT PRE-FILLED)
  // ========================================================
  const [position, setPosition] = useState<string>('');
  const [customPosition, setCustomPosition] = useState<string>('');
  const [totalExperience, setTotalExperience] = useState<string>('');
  const [currentCompany, setCurrentCompany] = useState<string>('');
  const [noticePeriod, setNoticePeriod] = useState<string>('');
  const [referralSource, setReferralSource] = useState<string>('');

  // CV Flow (Interview only)
  const [cvMode, setCvMode] = useState<CvHandlingMode>('DOCUMENT_UPLOAD');
  const [resumeFile, setResumeFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
  } | null>(null);
  const [cvPhotos, setCvPhotos] = useState<string[]>([]);
  const [requireResumeSetting, setRequireResumeSetting] = useState<boolean>(false);

  // Photo Capture (Interview only)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoCaptureSource>('LIVE_CAMERA');
  const [isReceptionAssistedPhoto, setIsReceptionAssistedPhoto] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Validation Errors & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<any>(null);
  const [submissionTime, setSubmissionTime] = useState<string>('');

  // Field refs
  const fieldRefs: Record<string, React.RefObject<any>> = {
    visitType: useRef<HTMLDivElement>(null),
    fullName: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    workPurpose: useRef<HTMLTextAreaElement>(null),
    selectedHostId: useRef<HTMLSelectElement>(null),
    position: useRef<HTMLSelectElement>(null),
    appointmentDate: useRef<HTMLInputElement>(null),
    companyName: useRef<HTMLInputElement>(null),
    vendorCompany: useRef<HTMLInputElement>(null),
    otherPurposeReason: useRef<HTMLInputElement>(null),
    cv: useRef<HTMLDivElement>(null),
    photo: useRef<HTMLDivElement>(null),
  };

  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const cvPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const devicePhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Format timestamp helper
  const formatAuthoritativeTimestamp = (isoString?: string): string => {
    try {
      const date = isoString ? new Date(isoString) : new Date();
      return (
        date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
        ', ' +
        date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    } catch {
      return new Date().toLocaleString();
    }
  };

  // ========================================================
  // CLEAN PATH SWITCHING — CLEARS STALE VALUES BETWEEN PATHS
  // ========================================================
  const handleVisitTypeChange = (newType: string) => {
    const wasCandidate = isCandidate;
    const willBeCandidate = isInterviewPurpose(newType);

    setVisitType(newType);
    setErrors({});
    setSubmitError(null);

    if (wasCandidate !== willBeCandidate) {
      // RESET Host selection to empty (no default host, no default HR)
      setSelectedHostId('');

      if (willBeCandidate) {
        // Switched from Visitor -> Interview:
        setWorkPurpose('');
        setCompanyName('');
        setVendorCompany('');
        setServiceNature('');
        setPropertyInterest('');
        setClientBudget('');
        setMeetingAgenda('');
        setOtherPurposeReason('');
        setPosition('');
        setCustomPosition('');
        setTotalExperience('');
        setCurrentCompany('');
        setNoticePeriod('');
        setReferralSource('');
        setEmail('');
        setResumeFile(null);
        setCvPhotos([]);
        setCvMode('DOCUMENT_UPLOAD');
        setPhotoDataUrl(null);
        setIsReceptionAssistedPhoto(false);
      } else {
        // Switched from Interview -> Visitor:
        setEmail('');
        setPosition('');
        setCustomPosition('');
        setTotalExperience('');
        setCurrentCompany('');
        setNoticePeriod('');
        setReferralSource('');
        setResumeFile(null);
        setCvPhotos([]);
        setPhotoDataUrl(null);
        setIsReceptionAssistedPhoto(false);
        setWorkPurpose('');
        setCompanyName('');
        setVendorCompany('');
        setServiceNature('');
        setPropertyInterest('');
        setClientBudget('');
        setMeetingAgenda('');
        setOtherPurposeReason('');
      }
    }
  };

  // Load office settings
  useEffect(() => {
    fetch('/api/settings/office')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings && typeof data.settings.requireResume === 'boolean') {
          setRequireResumeSetting(data.settings.requireResume);
        }
      })
      .catch(() => {});
  }, []);

  // Load session from token on mount
  useEffect(() => {
    if (initialToken) {
      loadSession(initialToken);
    }
  }, [initialToken]);

  const loadSession = async (token: string) => {
    if (!token.trim()) return;
    setSessionLoading(true);
    setSessionError(null);
    setIsCompletedSession(false);
    setIsExpiredSession(false);

    try {
      const res = await fetch(`/api/qr/${encodeURIComponent(token)}`);
      const data = await res.json();

      if (res.status === 410 || data.status === 'EXPIRED') {
        setIsExpiredSession(true);
        setSessionError('This appointment pass has expired. Please contact reception.');
        return;
      }

      if (!res.ok || !data.success) {
        const regRes = await fetch(`/api/register/session/${encodeURIComponent(token)}`);
        const regData = await regRes.json();
        if (regRes.ok && regData.success) {
          if (regData.status === 'COMPLETED') {
            setIsCompletedSession(true);
            setSubmittedCandidate(regData.candidate || { fullName: 'Visitor', id: token });
            setSubmissionTime(formatAuthoritativeTimestamp(regData.submittedAt));
          }
          return;
        }
        setSessionError(data.error || 'Invalid or unrecognized appointment token.');
        return;
      }

      if (data.status === 'COMPLETED') {
        setIsCompletedSession(true);
        setSubmittedCandidate({
          fullName: data.candidateName || 'Candidate',
          position: data.position || 'Visitor',
          id: token,
        });
        setSubmissionTime(formatAuthoritativeTimestamp(data.submittedAt));
        return;
      }

      if (data.session) {
        if (data.session.candidateName) setFullName(data.session.candidateName);
        if (data.session.position) {
          setPosition(data.session.position);
          setVisitType('Interview / Candidate'); // If explicit candidate appointment pass
        }
        if (data.session.appointmentTime) {
          setConfirmedAppointment({
            time: data.session.appointmentTime,
            stage: data.session.interviewRound,
            interviewer: data.session.interviewerName,
          });
          setVisitSchedule('SCHEDULED');
        }
      }
    } catch (err) {
      console.error('Session load error', err);
      setSessionError('Could not verify check-in token. Please verify your connection.');
    } finally {
      setSessionLoading(false);
    }
  };

  // Field change handlers
  const handleNameChange = (val: string) => {
    setFullName(val);
    if (errors.fullName) {
      const check = validatePersonName(val);
      if (check.isValid) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.fullName;
          return next;
        });
      }
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (errors.phone) {
      const check = validateIndianMobile(val);
      if (check.isValid) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.phone;
          return next;
        });
      }
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) {
      const check = validateEmail(val, isCandidate);
      if (check.isValid) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.email;
          return next;
        });
      }
    }
  };

  // Resume Document Upload Handler
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (!validExtensions.includes(ext)) {
        setErrors((prev) => ({
          ...prev,
          cv: 'Invalid file format. Please upload a PDF or Word document (.pdf, .doc, .docx).',
        }));
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          cv: 'File size exceeds 15 MB limit. Please upload a smaller document.',
        }));
        return;
      }

      const sizeMB = file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB';
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeFile({
          name: file.name,
          size: sizeMB,
          dataUrl: event.target?.result as string,
        });
        setErrors((prev) => {
          const next = { ...prev };
          delete next.cv;
          return next;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCvPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const readers = Array.from(files).map((f) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.readAsDataURL(f);
        });
      });
      Promise.all(readers).then((dataUrls) => {
        setCvPhotos((prev) => [...prev, ...dataUrls]);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.cv;
          return next;
        });
      });
    }
  };

  const handleDevicePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoDataUrl(evt.target?.result as string);
        setPhotoSource('FILE_UPLOAD');
        setIsReceptionAssistedPhoto(false);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.photo;
          return next;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToFirstError = (errorKey: string) => {
    const ref = fieldRefs[errorKey];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in ref.current && typeof (ref.current as any).focus === 'function') {
        ref.current.focus();
      }
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError(null);
    const newErrors: Record<string, string> = {};

    // 0. Visit Type
    if (!visitType) {
      newErrors.visitType = 'Please select your Visit Type to proceed.';
    }

    // 1. Full Name
    const nameCheck = validatePersonName(fullName);
    if (!nameCheck.isValid) {
      newErrors.fullName = nameCheck.error || 'Please enter a valid full name.';
    }

    // 2. Mobile
    const phoneCheck = validateIndianMobile(phone);
    if (!phoneCheck.isValid) {
      newErrors.phone = phoneCheck.error || 'Please enter a valid 10-digit mobile number.';
    }

    // 3. Whom to Meet
    if (!selectedHostId) {
      newErrors.selectedHostId = 'Please select whom you want to meet, or choose Reception Assistance.';
    }

    // 4. Appointment Schedule
    if (visitSchedule === 'SCHEDULED' && !confirmedAppointment) {
      if (!appointmentDate || !appointmentTime) {
        newErrors.appointmentDate = 'Please select appointment date and time.';
      } else {
        const apptCheck = validateAppointmentDateTime(appointmentDate, appointmentTime);
        if (!apptCheck.isValid) {
          newErrors.appointmentDate = apptCheck.error || 'Please choose a valid appointment date and time.';
        }
      }
    }

    // Normal Visitor Validation
    if (isNormalVisitor) {
      if (!workPurpose.trim()) {
        newErrors.workPurpose = 'Please describe what work/purpose you have for your visit.';
      }
      if (visitType === 'Business' && !companyName.trim()) {
        newErrors.companyName = 'Please enter your organization or company name.';
      } else if (visitType === 'Vendor' && !vendorCompany.trim()) {
        newErrors.vendorCompany = 'Please enter your vendor/service company name.';
      } else if (visitType === 'Other' && !otherPurposeReason.trim()) {
        newErrors.otherPurposeReason = 'Please specify the reason for your visit.';
      }
    }

    // Candidate Validation
    if (isCandidate) {
      const emailCheck = validateEmail(email, true);
      if (!emailCheck.isValid) {
        newErrors.email = emailCheck.error || 'Please enter a valid email address.';
      }

      const finalPosition = position === 'Other' ? customPosition.trim() : position.trim();
      if (!finalPosition) {
        newErrors.position = 'Please select or specify the position applied for.';
      }

      if (cvMode === 'DOCUMENT_UPLOAD' && !resumeFile) {
        newErrors.cv = 'Please upload your resume (PDF or Word), or choose another CV submission method.';
      } else if (cvMode === 'PHOTO_PAGES' && cvPhotos.length === 0) {
        newErrors.cv = 'Please snap or upload at least one photo of your resume pages.';
      } else if (cvMode === 'UNAVAILABLE' && requireResumeSetting) {
        newErrors.cv = 'Resume is required for interview check-in. Please upload or bring a hard copy.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      scrollToFirstError(firstErrorKey);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const cleanPhone = phone.trim().replace(/[\s-]/g, '').replace(/^\+91/, '').replace(/^0/, '');
    const resolvedHost =
      CONFIGURED_STAFF_HOSTS.find((h) => h.id === selectedHostId) || {
        id: 'RECEPTION_ASSISTANCE',
        name: 'Front Desk / Reception Assistance',
        role: 'Front Desk',
        department: 'Front Desk & Reception',
        team: 'Reception & Visitor Assistance',
      };

    let payload: any;

    if (isCandidate) {
      const resolvedPosition = position === 'Other' ? customPosition.trim() : position;
      const resolvedCvUrl =
        cvMode === 'DOCUMENT_UPLOAD' && resumeFile
          ? resumeFile.dataUrl
          : cvMode === 'PHOTO_PAGES' && cvPhotos.length > 0
          ? cvPhotos[0]
          : undefined;

      const resolvedCvFileName =
        cvMode === 'DOCUMENT_UPLOAD' && resumeFile
          ? resumeFile.name
          : cvMode === 'HARD_COPY'
          ? 'Hard_Copy_Brought_To_Reception.pdf'
          : cvMode === 'PHOTO_PAGES' && cvPhotos.length > 0
          ? 'Resume_Photos_Captured.jpg'
          : cvMode === 'UNAVAILABLE'
          ? 'CV_Unavailable_Flagged_For_HR.txt'
          : undefined;

      payload = {
        token: tokenInput,
        fullName: fullName.trim(),
        phone: cleanPhone,
        email: email.trim(),
        purpose: 'Interview / Candidate',
        visitType: visitSchedule,
        appointmentTime:
          visitSchedule === 'SCHEDULED'
            ? confirmedAppointment?.time || `${appointmentDate} ${appointmentTime}`
            : undefined,
        personToMeet: resolvedHost.name,
        departmentToMeet: resolvedHost.department,
        hostId: resolvedHost.id,
        position: resolvedPosition,
        totalExperience: totalExperience || undefined,
        currentCompany: currentCompany.trim() || undefined,
        noticePeriod: noticePeriod || undefined,
        referralSource: referralSource || undefined,
        livePhoto: photoDataUrl || undefined,
        photoSource: isReceptionAssistedPhoto ? 'RECEPTION_ASSISTED' : photoSource,
        isReceptionAssistedPhoto,
        resumeUrl: resolvedCvUrl,
        resumeFileName: resolvedCvFileName,
        resumeFileSize: resumeFile?.size,
        cvHandlingMode: cvMode,
      };
    } else {
      const resolvedPurpose =
        workPurpose.trim() ||
        (visitType === 'Other' && otherPurposeReason.trim()
          ? `Other: ${otherPurposeReason.trim()}`
          : visitType === 'Business' && meetingAgenda.trim()
          ? `Business Meeting: ${meetingAgenda.trim()}`
          : visitType === 'Client' && propertyInterest
          ? `Client Consultation: ${propertyInterest}`
          : visitType === 'Vendor' && serviceNature
          ? `Vendor Service: ${serviceNature}`
          : `${visitType} Visit`);

      payload = {
        token: tokenInput,
        fullName: fullName.trim(),
        phone: cleanPhone,
        email: '', // REMOVED FOR VISITOR
        purpose: resolvedPurpose,
        visitType: visitSchedule,
        appointmentTime:
          visitSchedule === 'SCHEDULED'
            ? confirmedAppointment?.time || `${appointmentDate} ${appointmentTime}`
            : undefined,
        personToMeet: resolvedHost.name,
        departmentToMeet: resolvedHost.department,
        hostId: resolvedHost.id,
        position: resolvedPurpose,
        company: companyName.trim() || vendorCompany.trim() || undefined,
        vendorCompany: vendorCompany.trim() || undefined,
        propertyInterest: visitType === 'Client' ? propertyInterest || undefined : undefined,
        clientBudget: visitType === 'Client' ? clientBudget.trim() || undefined : undefined,
        meetingAgenda: visitType === 'Business' ? meetingAgenda.trim() || undefined : undefined,
        serviceNature: visitType === 'Vendor' ? serviceNature.trim() || undefined : undefined,
        otherPurposeReason: visitType === 'Other' ? otherPurposeReason.trim() || undefined : undefined,
        inquiryNotes: workPurpose.trim() || undefined,
      };
    }

    try {
      const res = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        setIsCompletedSession(true);
        setSubmitError('This check-in pass has already been submitted and completed.');
        return;
      }

      if (res.status === 410) {
        setIsExpiredSession(true);
        setSubmitError('This check-in pass has expired. Please contact reception.');
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete check-in');
      }

      setSubmittedCandidate(data.candidate || data.visitor || { id: tokenInput, fullName });
      setSubmissionTime(formatAuthoritativeTimestamp(data.submissionTime));
      setIsCompletedSession(true);

      if (onSuccess) {
        onSuccess(data.candidate || data.visitor || data);
      }
    } catch (err: any) {
      console.error('Check-in error', err);
      setSubmitError(err.message || 'Check-in failed. Please check network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS / RECEIPT VIEW
  if (isCompletedSession && submittedCandidate) {
    const hostInfo =
      CONFIGURED_STAFF_HOSTS.find((h) => h.id === selectedHostId) || {
        name: 'Front Desk / Reception Assistance',
        department: 'Front Desk & Reception',
      };

    return (
      <div className="w-full max-w-xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-widest text-amber-800 uppercase bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              White Collar Realty • Reception
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Check-In Confirmed
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {isCandidate
                ? 'Your interview arrival has been recorded. Our HR team has been notified.'
                : `Your arrival has been recorded. ${hostInfo.name} has been notified.`}
            </p>
          </div>

          {/* Receipt Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3.5 mt-4">
            <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">
                  Pass Reference
                </span>
                <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                  {tokenInput}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">
                  Check-In Time
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {submissionTime || formatAuthoritativeTimestamp()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 py-1">
              {photoDataUrl ? (
                <img
                  src={photoDataUrl}
                  alt={fullName}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 shrink-0">
                  <User className="w-7 h-7" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{fullName}</h3>
                <p className="text-xs font-semibold text-amber-900 truncate">
                  {isCandidate ? (position === 'Other' ? customPosition : position) : (workPurpose || visitType)}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  Meeting: <strong className="text-slate-800">{hostInfo.name}</strong> ({hostInfo.department})
                </p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block mb-0.5">Next Steps:</strong>
              Please relax in our <strong>Ground Floor Reception & Guest Lounge</strong>. Our front desk team
              will escort you shortly.
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pass locked and registered. You may close this page.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Camera Overlay
  if (cameraActive) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <CameraCapture
          title="Arrival Photo Capture"
          subtitle="Align your face within the frame. Authoritative timestamp is attached automatically."
          preferredFacingMode="user"
          onCapture={(dataUrl, source) => {
            setPhotoDataUrl(dataUrl);
            setPhotoSource(source);
            setIsReceptionAssistedPhoto(false);
            setCameraActive(false);
            setErrors((prev) => {
              const next = { ...prev };
              delete next.photo;
              return next;
            });
          }}
          onSelectReceptionAssisted={() => {
            setIsReceptionAssistedPhoto(true);
            setPhotoDataUrl(null);
            setPhotoSource('RECEPTION_ASSISTED');
            setCameraActive(false);
            setErrors((prev) => {
              const next = { ...prev };
              delete next.photo;
              return next;
            });
          }}
          onCancel={() => setCameraActive(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-slate-200/90 rounded-2xl shadow-xl text-slate-900 overflow-hidden font-sans">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span className="text-[11px] font-bold tracking-widest text-slate-700 uppercase">
              WHITE COLLAR REALTY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Check-In Pass Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Token Pass: <strong className="font-mono text-slate-800">{tokenInput}</strong>
          </p>
        </div>

        {confirmedAppointment && (
          <div className="self-start sm:self-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5 shrink-0 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Scheduled: <strong className="text-slate-900">{confirmedAppointment.time}</strong></span>
          </div>
        )}
      </div>

      {sessionLoading && (
        <div className="p-6 text-center text-xs text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-600 mb-2" />
          <span>Verifying appointment pass details...</span>
        </div>
      )}

      {sessionError && !sessionLoading && (
        <div className="mx-5 sm:mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{sessionError}</span>
        </div>
      )}

      {submitError && (
        <div className="mx-5 sm:mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 text-xs">
        {/* ======================================================== */}
        {/* FIRST FIELD: VISIT TYPE (NOT PRE-FILLED) */}
        {/* ======================================================== */}
        <div className="space-y-3" ref={fieldRefs.visitType}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Visit Type</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">Select your visit category</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {VISIT_TYPE_OPTIONS.map((item) => {
              const isSelected = visitType === item.key;
              const IconComp = item.iconName === 'Briefcase'
                ? Briefcase
                : item.iconName === 'Building2'
                ? Building2
                : item.iconName === 'Truck'
                ? Truck
                : item.iconName === 'Users'
                ? Users
                : item.iconName === 'HelpCircle'
                ? HelpCircle
                : FileText;

              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => handleVisitTypeChange(item.key)}
                  className={`p-3 text-left rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <select
              value={visitType}
              onChange={(e) => handleVisitTypeChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-hidden focus:border-slate-900 transition"
            >
              <option value="" disabled>-- Select Visit Type --</option>
              {VISIT_TYPE_OPTIONS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label} — {item.tagline}
                </option>
              ))}
            </select>
          </div>

          {errors.visitType && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.visitType}</span>
            </p>
          )}
        </div>

        {!visitType && (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Please Select Your Visit Type Above</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Select <strong>Interview / Candidate</strong> or a <strong>Visitor category (Client, Vendor, Business, etc.)</strong> to display the appropriate form fields.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DYNAMIC MODE 1: NORMAL VISITOR FORM (NO EMAIL, NO RESUME, NO PHOTO) */}
        {/* ========================================================================= */}
        {isNormalVisitor && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="h-px bg-slate-200" />

            <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl flex items-center justify-between">
              <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                Normal Visitor Check-In ({visitType})
              </span>
              <span className="text-[10px] text-amber-800 font-medium">Quick Intake</span>
            </div>

            {/* Contact Details (EMAIL REMOVED) */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Visitor Contact Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div ref={fieldRefs.fullName}>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter full legal name"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                    }`}
                    required
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                <div ref={fieldRefs.phone}>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="98765 00000"
                      className={`w-full pl-12 pr-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                        errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                      }`}
                      required
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* What work/purpose do you have? */}
            <div className="space-y-2" ref={fieldRefs.workPurpose}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  What work / purpose do you have? <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">Reason for visit</span>
              </div>
              <textarea
                rows={2}
                value={workPurpose}
                onChange={(e) => {
                  setWorkPurpose(e.target.value);
                  if (errors.workPurpose) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.workPurpose;
                      return next;
                    });
                  }
                }}
                placeholder="Please describe your work, requirement, or reason for visiting..."
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                  errors.workPurpose ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                }`}
                required
              />
              {errors.workPurpose && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.workPurpose}</span>
                </p>
              )}
            </div>

            <div className="h-px bg-slate-200" />

            {/* Whom do you want to meet? (NO DEFAULT HOST/HR) */}
            <div className="space-y-3" ref={fieldRefs.selectedHostId}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Whom do you want to meet? <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">No default pre-selected</span>
              </div>

              <div>
                <select
                  value={selectedHostId}
                  onChange={(e) => {
                    setSelectedHostId(e.target.value);
                    if (errors.selectedHostId) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.selectedHostId;
                        return next;
                      });
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs font-medium focus:outline-hidden transition ${
                    errors.selectedHostId
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-300 focus:border-slate-900'
                  }`}
                  required
                >
                  <option value="" disabled>-- Select person or team to meet --</option>
                  <option value="RECEPTION_ASSISTANCE">
                    I don’t know / Reception assistance
                  </option>
                  <optgroup label="Leadership & Executives">
                    <option value="usr-ceo-lalit">Lalit Sir — CEO (Executive Leadership)</option>
                    <option value="usr-cofounder-kimmi">Kimmi Mam — Co-Founder & Senior HR</option>
                    <option value="usr-admin-sameer">Sameer Sir — Operations & Facilities Admin</option>
                  </optgroup>
                  <optgroup label="Sales & Luxury Property Advisory">
                    <option value="usr-sales-vikram">Vikram Malhotra — Sales Director (Property Advisory Team)</option>
                  </optgroup>
                  <optgroup label="HR & Talent Acquisition">
                    <option value="usr-hr-nisha">Nisha — Senior HR Manager (HR Team)</option>
                    <option value="usr-hr-shriyanshi">Shriyanshi — HR Executive (Talent Acquisition)</option>
                  </optgroup>
                  <optgroup label="Front Desk & Hospitality">
                    <option value="usr-rec-ananya">Ananya Sen — Front Desk Coordinator (Reception)</option>
                    <option value="usr-pan-ramesh">Ramesh Kumar — Hospitality & Pantry</option>
                  </optgroup>
                </select>

                {errors.selectedHostId && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.selectedHostId}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Appointment Details */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Appointment Schedule
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisitSchedule('WALK_IN')}
                  className={`py-3 px-3.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                    visitSchedule === 'WALK_IN'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      visitSchedule === 'WALK_IN' ? 'border-amber-400 bg-amber-400' : 'border-slate-400'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-xs block">Walk-In / Immediate</span>
                    <span className={`text-[10px] block ${visitSchedule === 'WALK_IN' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Office visit today
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisitSchedule('SCHEDULED')}
                  className={`py-3 px-3.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                    visitSchedule === 'SCHEDULED'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      visitSchedule === 'SCHEDULED' ? 'border-amber-400 bg-amber-400' : 'border-slate-400'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-xs block">Scheduled Slot</span>
                    <span className={`text-[10px] block ${visitSchedule === 'SCHEDULED' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Pre-arranged meeting
                    </span>
                  </div>
                </button>
              </div>

              {visitSchedule === 'SCHEDULED' && !confirmedAppointment && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" ref={fieldRefs.appointmentDate}>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                        Appointment Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                        Appointment Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                        required
                      />
                    </div>
                  </div>

                  {errors.appointmentDate && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.appointmentDate}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="h-px bg-slate-200" />

            {/* Other Existing Essential Details */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Additional Details
              </label>

              {visitType === 'Business' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div ref={fieldRefs.companyName}>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Organization / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. DLF / Godrej / Partner Firm"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                      required
                    />
                    {errors.companyName && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Meeting Agenda <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={meetingAgenda}
                      onChange={(e) => setMeetingAgenda(e.target.value)}
                      placeholder="e.g. Corporate Collaboration Discussion"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {visitType === 'Vendor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div ref={fieldRefs.vendorCompany}>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Vendor / Service Company <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={vendorCompany}
                      onChange={(e) => setVendorCompany(e.target.value)}
                      placeholder="e.g. BlueDart / Otis / IT Support"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                      required
                    />
                    {errors.vendorCompany && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.vendorCompany}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Nature of Delivery / Service</label>
                    <select
                      value={serviceNature}
                      onChange={(e) => setServiceNature(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                    >
                      <option value="Courier / Document Delivery">Courier / Document Delivery</option>
                      <option value="Office Supplies / Pantry Restock">Office Supplies / Pantry Restock</option>
                      <option value="IT Hardware & Technical Support">IT Hardware & Technical Support</option>
                      <option value="Facilities / Maintenance">Facilities / Maintenance</option>
                      <option value="Other Service">Other Service</option>
                    </select>
                  </div>
                </div>
              )}

              {visitType === 'Client' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Property Category of Interest</label>
                    <select
                      value={propertyInterest}
                      onChange={(e) => setPropertyInterest(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                    >
                      <option value="Commercial Leasing / Retail Space">Commercial Leasing / Retail Space</option>
                      <option value="Luxury Residential / Villas">Luxury Residential / Villas</option>
                      <option value="Corporate Office Space">Corporate Office Space</option>
                      <option value="Investment Plots / Land">Investment Plots / Land</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Budget / Location Preference <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={clientBudget}
                      onChange={(e) => setClientBudget(e.target.value)}
                      placeholder="e.g. Golf Course Road / 5-10 Cr"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {visitType === 'Other' && (
                <div ref={fieldRefs.otherPurposeReason}>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Specific Reason <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherPurposeReason}
                    onChange={(e) => setOtherPurposeReason(e.target.value)}
                    placeholder="Describe reason for reception assistance"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                    required
                  />
                  {errors.otherPurposeReason && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.otherPurposeReason}</p>
                  )}
                </div>
              )}

              {visitType === 'Visitor' && (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Company / Organization <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter organization if applicable"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DYNAMIC MODE 2: EXISTING INTERVIEW / CANDIDATE FORM (EXACT WORKFLOW) */}
        {/* ========================================================================= */}
        {isCandidate && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="h-px bg-slate-200" />

            <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-amber-400">
                <Briefcase className="w-4 h-4" />
                Interview Candidate Registration
              </span>
              <span className="text-[10px] text-slate-300 font-medium">HR Assessment Workflow</span>
            </div>

            {/* Candidate Contact Info */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                2. Candidate Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div ref={fieldRefs.fullName}>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter full legal name"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                    }`}
                    required
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                <div ref={fieldRefs.phone}>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="98765 00000"
                      className={`w-full pl-12 pr-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                        errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                      }`}
                      required
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div ref={fieldRefs.email}>
                <label className="block font-semibold text-slate-800 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. candidate@example.com"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                    errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                  }`}
                  required
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Whom to Meet */}
            <div className="space-y-3" ref={fieldRefs.selectedHostId}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  3. Interviewer or HR Host <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">No default pre-selected</span>
              </div>

              <div>
                <select
                  value={selectedHostId}
                  onChange={(e) => {
                    setSelectedHostId(e.target.value);
                    if (errors.selectedHostId) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.selectedHostId;
                        return next;
                      });
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs font-medium focus:outline-hidden transition ${
                    errors.selectedHostId
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-300 focus:border-slate-900'
                  }`}
                  required
                >
                  <option value="" disabled>-- Select interviewer / host --</option>
                  <option value="RECEPTION_ASSISTANCE">
                    I don’t know / Reception assistance
                  </option>
                  <optgroup label="HR & Talent Acquisition">
                    <option value="usr-hr-nisha">Nisha — Senior HR Manager (HR Team)</option>
                    <option value="usr-hr-shriyanshi">Shriyanshi — HR Executive (Talent Acquisition)</option>
                    <option value="usr-cofounder-kimmi">Kimmi Mam — Co-Founder & Senior HR</option>
                  </optgroup>
                  <optgroup label="Leadership & Sales">
                    <option value="usr-ceo-lalit">Lalit Sir — CEO (Executive Leadership)</option>
                    <option value="usr-sales-vikram">Vikram Malhotra — Sales Director</option>
                    <option value="usr-admin-sameer">Sameer Sir — Operations & Admin</option>
                  </optgroup>
                  <optgroup label="Front Desk & Hospitality">
                    <option value="usr-rec-ananya">Ananya Sen — Front Desk Coordinator</option>
                    <option value="usr-pan-ramesh">Ramesh Kumar — Hospitality Executive</option>
                  </optgroup>
                </select>

                {errors.selectedHostId && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.selectedHostId}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Candidate Role Details */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                4. Position & Experience Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div ref={fieldRefs.position}>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Position Applied For <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      if (errors.position) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.position;
                          return next;
                        });
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden ${
                      errors.position ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                    }`}
                    required
                  >
                    <option value="" disabled>-- Select position applied for --</option>
                    <option value="Sales Manager - Luxury Residential">Sales Manager - Luxury Residential</option>
                    <option value="Senior Real Estate Consultant">Senior Real Estate Consultant</option>
                    <option value="Business Development Executive">Business Development Executive</option>
                    <option value="Commercial Leasing Specialist">Commercial Leasing Specialist</option>
                    <option value="HR Coordinator">HR Coordinator</option>
                    <option value="Operations Executive">Operations Executive</option>
                    <option value="Digital Marketing & Lead Specialist">Digital Marketing & Lead Specialist</option>
                    <option value="Other">Other / Custom Designation</option>
                  </select>

                  {position === 'Other' && (
                    <input
                      type="text"
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      placeholder="Specify job designation"
                      className="w-full mt-2 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                      required
                    />
                  )}
                  {errors.position && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.position}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Total Experience</label>
                  <select
                    value={totalExperience}
                    onChange={(e) => setTotalExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="">-- Select experience level --</option>
                    <option value="Fresher">Fresher / Graduate Trainee</option>
                    <option value="1-2 Years">1-2 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5-8 Years">5-8 Years</option>
                    <option value="8+ Years">8+ Years (Senior / Leadership)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Current Organization <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. DLF / Godrej / Self-Employed"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Notice Period</label>
                  <select
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="">-- Select notice period --</option>
                    <option value="Immediate">Immediate Joiner (0 Days)</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days (1 Month)</option>
                    <option value="60+ Days">60+ Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Resume / CV Section */}
            <div className="space-y-3.5" ref={fieldRefs.cv}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>5. Resume / Curriculum Vitae</span>
                  {requireResumeSetting && <span className="text-rose-500">*</span>}
                </label>
                <span className="text-[11px] text-slate-500">Submission method</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setCvMode('DOCUMENT_UPLOAD')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    cvMode === 'DOCUMENT_UPLOAD'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <FileText className={`w-4 h-4 mb-1.5 ${cvMode === 'DOCUMENT_UPLOAD' ? 'text-amber-400' : 'text-slate-600'}`} />
                  <div>
                    <p className="font-bold text-[11px]">Upload File</p>
                    <p className={`text-[10px] ${cvMode === 'DOCUMENT_UPLOAD' ? 'text-slate-300' : 'text-slate-500'}`}>
                      PDF or Word
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCvMode('HARD_COPY')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    cvMode === 'HARD_COPY'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 mb-1.5 ${cvMode === 'HARD_COPY' ? 'text-amber-400' : 'text-slate-600'}`} />
                  <div>
                    <p className="font-bold text-[11px]">Hard Copy</p>
                    <p className={`text-[10px] ${cvMode === 'HARD_COPY' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Scan at Desk
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCvMode('PHOTO_PAGES')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    cvMode === 'PHOTO_PAGES'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <Camera className={`w-4 h-4 mb-1.5 ${cvMode === 'PHOTO_PAGES' ? 'text-amber-400' : 'text-slate-600'}`} />
                  <div>
                    <p className="font-bold text-[11px]">Scan Photos</p>
                    <p className={`text-[10px] ${cvMode === 'PHOTO_PAGES' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Page Camera
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCvMode('UNAVAILABLE')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    cvMode === 'UNAVAILABLE'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <HelpCircle className={`w-4 h-4 mb-1.5 ${cvMode === 'UNAVAILABLE' ? 'text-amber-400' : 'text-slate-600'}`} />
                  <div>
                    <p className="font-bold text-[11px]">Unavailable</p>
                    <p className={`text-[10px] ${cvMode === 'UNAVAILABLE' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Flag for HR
                    </p>
                  </div>
                </button>
              </div>

              {cvMode === 'DOCUMENT_UPLOAD' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  {resumeFile ? (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{resumeFile.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {resumeFile.size} • Attached & Verified
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => resumeInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setResumeFile(null)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={resumeInputRef}
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="w-full py-5 px-4 bg-white hover:bg-slate-100/70 border border-dashed border-slate-300 hover:border-slate-900 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center gap-2"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Upload Resume / CV (PDF or Word)</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Supports .pdf, .doc, .docx (Max 15 MB)</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {cvMode === 'HARD_COPY' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Physical Copy Brought to Reception</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    You indicated you brought a hard copy. The front desk coordinator will scan and attach it.
                  </p>
                </div>
              )}

              {cvMode === 'PHOTO_PAGES' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-slate-900">
                    CV Page Photos ({cvPhotos.length} attached)
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {cvPhotos.map((photoUrl, idx) => (
                      <div key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-slate-300 shadow-xs">
                        <img src={photoUrl} alt={`CV Page ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCvPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full hover:bg-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <input
                      type="file"
                      ref={cvPhotoInputRef}
                      accept="image/*"
                      multiple
                      onChange={handleCvPhotoUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => cvPhotoInputRef.current?.click()}
                      className="w-16 h-20 rounded-lg border border-dashed border-slate-300 hover:border-slate-800 bg-white flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Add Page</span>
                    </button>
                  </div>
                </div>
              )}

              {cvMode === 'UNAVAILABLE' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-amber-950">CV Unavailable Notice</p>
                  <p className="text-amber-900 text-[11px] leading-relaxed">
                    Your application will be flagged for HR review according to White Collar Realty hiring policy.
                  </p>
                </div>
              )}

              {errors.cv && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.cv}</span>
                </p>
              )}
            </div>

            <div className="h-px bg-slate-200" />

            {/* Arrival Photo Verification */}
            <div className="space-y-3" ref={fieldRefs.photo}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  6. Arrival Photo Verification
                </label>
                <span className="text-[11px] text-slate-500">Identity verification</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                {photoDataUrl ? (
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={photoDataUrl}
                        alt="Arrival Preview"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {photoSource === 'LIVE_CAMERA' ? 'Live Camera Capture' : 'Device Photo Upload'}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Ready for front-desk visitor pass
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCameraActive(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retake
                    </button>
                  </div>
                ) : isReceptionAssistedPhoto ? (
                  <div className="p-3 bg-white border border-amber-300 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Reception-Assisted Capture</p>
                        <p className="text-[11px] text-slate-500">The front desk will capture your photo upon arrival.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReceptionAssistedPhoto(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCameraActive(true)}
                        className="flex-1 py-3 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span>Open Camera to Take Photo</span>
                      </button>

                      <input
                        type="file"
                        ref={devicePhotoInputRef}
                        accept="image/*"
                        onChange={handleDevicePhotoUpload}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => devicePhotoInputRef.current?.click()}
                        className="py-3 px-3.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload from Device</span>
                      </button>
                    </div>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setIsReceptionAssistedPhoto(true)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Camera unavailable? Choose Reception-assisted photo at desk
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Primary CTA Button */}
        {visitType && (
          <div className="pt-3 space-y-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-xl active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Processing Check-In...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Check In</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500">
              White Collar Realty Automated Front Desk Operations • Secure Check-In
            </p>
          </div>
        )}
      </form>
    </div>
  );
};
