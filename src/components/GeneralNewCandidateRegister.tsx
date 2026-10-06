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
  Eye,
  RotateCcw,
} from 'lucide-react';
import type { Candidate } from '../types/index.ts';
import { CameraCapture, type PhotoCaptureSource } from './CameraCapture.tsx';
import {
  VISIT_PURPOSE_OPTIONS,
  CONFIGURED_STAFF_HOSTS,
  getRecommendedHostForPurpose,
  isInterviewPurpose,
  validatePersonName,
  validateIndianMobile,
  validateEmail,
  validateAppointmentDateTime,
  type VisitPurpose,
  type StaffHostOption,
} from '../utils/registrationConfig.ts';

interface GeneralNewCandidateRegisterProps {
  initialToken?: string;
  onSuccess?: (record: any) => void;
  onCancel?: () => void;
}

type SessionState = 'INITIALIZING' | 'ACTIVE' | 'SUBMITTING' | 'COMPLETED' | 'EXPIRED' | 'NOT_FOUND';
type CvHandlingMode = 'DOCUMENT_UPLOAD' | 'HARD_COPY' | 'PHOTO_PAGES' | 'UNAVAILABLE';

export const GeneralNewCandidateRegister: React.FC<GeneralNewCandidateRegisterProps> = ({
  initialToken,
  onSuccess,
  onCancel,
}) => {
  const [sessionState, setSessionState] = useState<SessionState>('INITIALIZING');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');

  // 1. Purpose of Visit (First Decision)
  const [selectedPurpose, setSelectedPurpose] = useState<VisitPurpose>('Interview / Candidate');

  // 2. Personal Contact Information
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // 3. Visit Type & Appointments
  const [visitType, setVisitType] = useState<'WALK_IN' | 'SCHEDULED'>('WALK_IN');
  const [appointmentDate, setAppointmentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState<string>('11:00');
  const [existingAppointmentDetails, setExistingAppointmentDetails] = useState<{
    time?: string;
    stage?: string;
    interviewer?: string;
  } | null>(null);

  // 4. Host Selection
  const [selectedHostId, setSelectedHostId] = useState<string>('usr-hr-nisha');

  // 5. Purpose-Specific Fields
  // Interview fields
  const [position, setPosition] = useState<string>('Sales Manager - Luxury Residential');
  const [customPosition, setCustomPosition] = useState<string>('');
  const [totalExperience, setTotalExperience] = useState<string>('3-5 Years');
  const [currentCompany, setCurrentCompany] = useState<string>('');
  const [noticePeriod, setNoticePeriod] = useState<string>('Immediate');
  const [referralSource, setReferralSource] = useState<string>('Direct Walk-In / Office');

  // Client fields
  const [propertyInterest, setPropertyInterest] = useState<string>('Luxury Residential / Villas');
  const [clientBudget, setClientBudget] = useState<string>('');

  // Business Meeting fields
  const [companyName, setCompanyName] = useState<string>('');
  const [meetingAgenda, setMeetingAgenda] = useState<string>('');

  // Vendor / Service fields
  const [vendorCompany, setVendorCompany] = useState<string>('');
  const [serviceNature, setServiceNature] = useState<string>('Courier / Document Delivery');

  // General Inquiry & Other fields
  const [inquiryNotes, setInquiryNotes] = useState<string>('');
  const [otherPurposeReason, setOtherPurposeReason] = useState<string>('');

  // Helper check for candidate vs normal visitor
  const isCandidate = isInterviewPurpose(selectedPurpose);

  // 6. CV Flow (Interview only)
  const [cvMode, setCvMode] = useState<CvHandlingMode>('DOCUMENT_UPLOAD');
  const [resumeFile, setResumeFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
  } | null>(null);
  const [cvPhotos, setCvPhotos] = useState<string[]>([]);
  const [cvPhotoCameraActive, setCvPhotoCameraActive] = useState<boolean>(false);
  const [requireResumeSetting, setRequireResumeSetting] = useState<boolean>(false);

  // 7. Photo Capture
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoCaptureSource>('LIVE_CAMERA');
  const [isReceptionAssistedPhoto, setIsReceptionAssistedPhoto] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Validation Errors (Field-level)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalSubmitError, setGeneralSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] = useState<any>(null);
  const [submissionTimestamp, setSubmissionTimestamp] = useState<string>('');

  // Refs for auto-focusing invalid fields
  const fieldRefs: Record<string, React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement | null>> = {
    fullName: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    position: useRef<HTMLInputElement>(null),
    appointmentDate: useRef<HTMLInputElement>(null),
    appointmentTime: useRef<HTMLInputElement>(null),
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
          month: 'short',
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

  // Sync recommended host when purpose changes
  const handlePurposeChange = (newPurpose: VisitPurpose) => {
    setSelectedPurpose(newPurpose);
    const recHost = getRecommendedHostForPurpose(newPurpose);
    setSelectedHostId(recHost.id);
    const isNowCandidate = newPurpose === 'Interview / Candidate' || newPurpose === 'Interview';
    // Clear candidate-only errors if switching away from interview
    if (!isNowCandidate) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.position;
        delete next.cv;
        delete next.photo;
        delete next.companyName;
        delete next.vendorCompany;
        delete next.otherPurposeReason;
        return next;
      });
    }
  };

  // Fetch office settings (e.g. requireResume)
  useEffect(() => {
    fetch('/api/settings/office')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          if (typeof data.settings.requireResume === 'boolean') {
            setRequireResumeSetting(data.settings.requireResume);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Initialize or verify session
  const extractTokenFromUrl = (): string | null => {
    if (initialToken) return initialToken;
    const path = window.location.pathname;
    const match = path.match(/\/register\/([^/?#]+)/) || path.match(/\/candidate\/register\/([^/?#]+)/);
    if (match && match[1]) return match[1];
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session') || urlParams.get('token');
  };

  useEffect(() => {
    const activeToken = extractTokenFromUrl();
    if (activeToken) {
      verifyExistingSession(activeToken);
    } else {
      initFreshSession();
    }
  }, []);

  // Countdown timer for active session auto-expiry
  useEffect(() => {
    if (sessionState !== 'ACTIVE' || !expiresAt) return;

    const updateRemainingTime = () => {
      const diffMs = new Date(expiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeRemainingText('Expired');
        setSessionState('EXPIRED');
        return;
      }
      const totalSeconds = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setTimeRemainingText(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [sessionState, expiresAt]);

  const initFreshSession = async () => {
    setSessionState('INITIALIZING');
    setGeneralSubmitError(null);
    try {
      const res = await fetch('/api/register/session', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.session) {
        setSessionToken(data.session.token);
        setExpiresAt(data.session.expiresAt);
        setSessionState('ACTIVE');
        window.history.replaceState(null, '', `/register/${data.session.token}`);
      } else {
        setSessionState('NOT_FOUND');
      }
    } catch (err) {
      console.error('Session init error', err);
      setSessionState('NOT_FOUND');
    }
  };

  const verifyExistingSession = async (token: string) => {
    setSessionState('INITIALIZING');
    setGeneralSubmitError(null);
    try {
      const res = await fetch(`/api/register/session/${encodeURIComponent(token)}`);
      const data = await res.json();

      if (res.status === 410 || data.status === 'EXPIRED') {
        setSessionState('EXPIRED');
        return;
      }
      if (res.status === 404 || data.status === 'NOT_FOUND') {
        setSessionState('NOT_FOUND');
        return;
      }
      if (data.status === 'COMPLETED' || data.session?.status === 'COMPLETED') {
        setSessionState('COMPLETED');
        setSessionToken(token);
        if (data.candidate) {
          setSubmittedRecord(data.candidate);
        }
        const timeStr = data.submittedAt || data.completedAt || new Date().toISOString();
        setSubmissionTimestamp(formatAuthoritativeTimestamp(timeStr));
        return;
      }

      if (data.success && data.status === 'ACTIVE') {
        setSessionToken(data.session.token);
        setExpiresAt(data.session.expiresAt);
        setSessionState('ACTIVE');
      } else {
        setSessionState('NOT_FOUND');
      }
    } catch (err) {
      console.error('Verify session error', err);
      setSessionState('NOT_FOUND');
    }
  };

  // Field change & blur validation
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

  const handleNameBlur = () => {
    if (fullName.trim()) {
      const check = validatePersonName(fullName);
      if (!check.isValid) {
        setErrors((prev) => ({ ...prev, fullName: check.error || 'Invalid name' }));
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

  const handlePhoneBlur = () => {
    if (phone.trim()) {
      const check = validateIndianMobile(phone);
      if (!check.isValid) {
        setErrors((prev) => ({ ...prev, phone: check.error || 'Invalid mobile number' }));
      }
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) {
      const check = validateEmail(val, selectedPurpose === 'Interview');
      if (check.isValid) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.email;
          return next;
        });
      }
    }
  };

  const handleEmailBlur = () => {
    if (email.trim() || selectedPurpose === 'Interview') {
      const check = validateEmail(email, selectedPurpose === 'Interview');
      if (!check.isValid) {
        setErrors((prev) => ({ ...prev, email: check.error || 'Invalid email address' }));
      }
    }
  };

  // Resume Document Upload Handler
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file format
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (!validExtensions.includes(ext)) {
        setErrors((prev) => ({
          ...prev,
          cv: 'Invalid file format. Please upload a PDF or Word document (.pdf, .doc, .docx).',
        }));
        return;
      }

      // Max 15MB
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

  // CV Photo Upload Handler
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

  // Photo Upload fallback
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

  // Focus on the first invalid field
  const scrollToFirstError = (errorKey: string) => {
    const ref = fieldRefs[errorKey];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in ref.current && typeof (ref.current as any).focus === 'function') {
        (ref.current as any).focus();
      }
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || sessionState !== 'ACTIVE') return;

    setGeneralSubmitError(null);
    const newErrors: Record<string, string> = {};

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

    // 3. Email (Mandatory for Interview/Candidate, optional for others)
    if (isCandidate || email.trim()) {
      const emailCheck = validateEmail(email, isCandidate);
      if (!emailCheck.isValid) {
        newErrors.email = emailCheck.error || 'Please enter a valid email address.';
      }
    }

    // 4. Appointments validation
    if (visitType === 'SCHEDULED' && !existingAppointmentDetails) {
      const apptCheck = validateAppointmentDateTime(appointmentDate, appointmentTime);
      if (!apptCheck.isValid) {
        newErrors.appointmentDate = apptCheck.error || 'Please choose a valid appointment date and time.';
      }
    }

    // 5. Purpose-specific validation
    if (isCandidate) {
      const finalPosition = position === 'Other' ? customPosition.trim() : position.trim();
      if (!finalPosition) {
        newErrors.position = 'Please specify the role/position applied for.';
      }

      // CV validation
      if (cvMode === 'DOCUMENT_UPLOAD' && !resumeFile) {
        newErrors.cv = 'Please upload your resume (PDF or Word), or choose another CV submission method.';
      } else if (cvMode === 'PHOTO_PAGES' && cvPhotos.length === 0) {
        newErrors.cv = 'Please snap or upload at least one photo of your resume pages.';
      } else if (cvMode === 'UNAVAILABLE' && requireResumeSetting) {
        newErrors.cv = 'White Collar Realty policy requires a resume for interview appointments. Please upload or bring a hard copy.';
      }
    } else if (selectedPurpose === 'Business Meeting') {
      if (!companyName.trim()) {
        newErrors.companyName = 'Please enter your organization or company name.';
      }
    } else if (selectedPurpose === 'Vendor / Service / Delivery') {
      if (!vendorCompany.trim()) {
        newErrors.vendorCompany = 'Please enter your vendor/service company name.';
      }
    } else if (selectedPurpose === 'Other') {
      if (!otherPurposeReason.trim()) {
        newErrors.otherPurposeReason = 'Please specify the purpose or reason for your visit.';
      }
    }

    // If any validation errors exist, display and scroll to first error
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      scrollToFirstError(firstErrorKey);
      return;
    }

    // Proceed to submit
    setSubmitting(true);
    setErrors({});

    const resolvedPosition =
      isCandidate
        ? position === 'Other'
          ? customPosition.trim()
          : position
        : selectedPurpose;

    const resolvedHost = CONFIGURED_STAFF_HOSTS.find((h) => h.id === selectedHostId) || CONFIGURED_STAFF_HOSTS[0];

    const cleanPhone = phone.trim().replace(/[\s-]/g, '').replace(/^\+91/, '').replace(/^0/, '');

    const resolvedCvUrl =
      isCandidate && cvMode === 'DOCUMENT_UPLOAD' && resumeFile
        ? resumeFile.dataUrl
        : isCandidate && cvMode === 'PHOTO_PAGES' && cvPhotos.length > 0
        ? cvPhotos[0]
        : undefined;

    const resolvedCvFileName =
      isCandidate && cvMode === 'DOCUMENT_UPLOAD' && resumeFile
        ? resumeFile.name
        : isCandidate && cvMode === 'HARD_COPY'
        ? 'Hard_Copy_Brought_To_Reception.pdf'
        : isCandidate && cvMode === 'PHOTO_PAGES' && cvPhotos.length > 0
        ? 'Resume_Photos_Captured.jpg'
        : isCandidate && cvMode === 'UNAVAILABLE'
        ? 'CV_Unavailable_Flagged_For_HR.txt'
        : undefined;

    const resolvedPurpose =
      selectedPurpose === 'Other' && otherPurposeReason.trim()
        ? `Other: ${otherPurposeReason.trim()}`
        : selectedPurpose;

    const payload = {
      token: sessionToken,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email.trim(),
      purpose: resolvedPurpose,
      visitType,
      appointmentTime:
        visitType === 'SCHEDULED'
          ? existingAppointmentDetails?.time || `${appointmentDate} ${appointmentTime}`
          : undefined,
      personToMeet: resolvedHost.name,
      departmentToMeet: resolvedHost.department,
      hostId: resolvedHost.id,
      position: resolvedPosition,
      totalExperience: isCandidate ? totalExperience : undefined,
      currentCompany:
        isCandidate
          ? currentCompany.trim()
          : selectedPurpose === 'Business Meeting'
          ? companyName.trim()
          : selectedPurpose === 'Vendor / Service / Delivery'
          ? vendorCompany.trim()
          : undefined,
      noticePeriod: isCandidate ? noticePeriod : undefined,
      referralSource: isCandidate ? referralSource : undefined,
      // Photo ONLY for candidate!
      livePhoto: isCandidate ? photoDataUrl || undefined : undefined,
      photoSource: isCandidate ? (isReceptionAssistedPhoto ? 'RECEPTION_ASSISTED' : photoSource) : undefined,
      isReceptionAssistedPhoto: isCandidate ? isReceptionAssistedPhoto : false,
      // Resume ONLY for candidate!
      resumeUrl: isCandidate ? resolvedCvUrl : undefined,
      resumeFileName: isCandidate ? resolvedCvFileName : undefined,
      resumeFileSize: isCandidate ? resumeFile?.size : undefined,
      cvHandlingMode: isCandidate ? cvMode : undefined,
      // Metadata for non-interview visitors
      propertyInterest: (selectedPurpose === 'Client / Property' || selectedPurpose === 'Client / Property Consultation') ? propertyInterest : undefined,
      clientBudget: (selectedPurpose === 'Client / Property' || selectedPurpose === 'Client / Property Consultation') ? clientBudget.trim() : undefined,
      meetingAgenda: selectedPurpose === 'Business Meeting' ? meetingAgenda.trim() : undefined,
      serviceNature: selectedPurpose === 'Vendor / Service / Delivery' ? serviceNature.trim() : undefined,
      inquiryNotes: (selectedPurpose === 'General Visitor' || selectedPurpose === 'General Inquiry') ? inquiryNotes.trim() : undefined,
      otherPurposeReason: selectedPurpose === 'Other' ? otherPurposeReason.trim() : undefined,
      company:
        selectedPurpose === 'Business Meeting'
          ? companyName.trim()
          : selectedPurpose === 'Vendor / Service / Delivery'
          ? vendorCompany.trim()
          : undefined,
    };

    try {
      const res = await fetch('/api/register/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        setSessionState('COMPLETED');
        setGeneralSubmitError('This check-in pass has already been submitted and completed.');
        return;
      }

      if (res.status === 410) {
        setSessionState('EXPIRED');
        setGeneralSubmitError('This registration pass has expired. Please request a new pass at reception.');
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      const returnedRecord = data.candidate || data.visitor || { fullName, position: resolvedPosition, id: sessionToken };
      setSubmittedRecord(returnedRecord);
      setSessionState('COMPLETED');
      const timeStr = data.submissionTime || data.submittedAt || new Date().toISOString();
      setSubmissionTimestamp(formatAuthoritativeTimestamp(timeStr));

      if (onSuccess) onSuccess(returnedRecord);
    } catch (err: any) {
      console.error('Registration submission error:', err);
      setGeneralSubmitError(err.message || 'Submission failed. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS / RECEIPT VIEW
  if (sessionState === 'COMPLETED' && submittedRecord) {
    const isInterview = selectedPurpose === 'Interview';
    const hostInfo = CONFIGURED_STAFF_HOSTS.find((h) => h.id === selectedHostId) || CONFIGURED_STAFF_HOSTS[0];

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
              {isInterview
                ? 'Your interview arrival has been recorded. Our HR team has been notified.'
                : `Your arrival has been recorded. ${hostInfo.name} has been notified.`}
            </p>
          </div>

          {/* Receipt Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3.5 mt-4">
            <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">
                  Reference ID
                </span>
                <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                  {submittedRecord.id || sessionToken}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">
                  Check-In Time
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {submissionTimestamp || formatAuthoritativeTimestamp()}
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
                  {selectedPurpose === 'Interview' ? position : selectedPurpose}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  Meeting: <strong className="text-slate-800">{hostInfo.name}</strong> ({hostInfo.department})
                </p>
              </div>
            </div>

            {/* Reception Lounge Notice */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block mb-0.5">Next Steps:</strong>
              Please relax in our <strong>Ground Floor Reception & Guest Lounge</strong>. Our front desk team
              will escort you to the meeting area shortly.
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Session completed and locked. You may now close this page.</span>
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

  // Expired View
  if (sessionState === 'EXPIRED') {
    return (
      <div className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Check-In Pass Expired</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          For security and confidentiality, check-in QR passes expire after a period of inactivity.
          Please scan the front desk QR code again or request a fresh pass from reception.
        </p>
        <button
          type="button"
          onClick={initFreshSession}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer"
        >
          Generate New Registration Session
        </button>
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
            Visitor & Candidate Check-In
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome to White Collar Realty corporate office. Please complete your arrival details.
          </p>
        </div>

        {timeRemainingText && sessionState === 'ACTIVE' && (
          <div className="self-start sm:self-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5 shrink-0 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Valid for: <strong className="text-slate-900 font-mono">{timeRemainingText}</strong></span>
          </div>
        )}
      </div>

      {generalSubmitError && (
        <div className="mx-5 sm:mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{generalSubmitError}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 text-xs">
        {/* ======================================================== */}
        {/* 1. PURPOSE OF VISIT (FIRST DECISION) */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Purpose of Visit</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">Select reason for your visit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {VISIT_PURPOSE_OPTIONS.map((item) => {
              const isSelected = selectedPurpose === item.key;
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => handlePurposeChange(item.key)}
                  className={`p-3 text-left rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {(item.key === 'Interview / Candidate' || item.key === 'Interview') && <Briefcase className="w-4 h-4" />}
                    {(item.key === 'Client / Property' || item.key === 'Client / Property Consultation') && <Building2 className="w-4 h-4" />}
                    {item.key === 'Vendor / Service / Delivery' && <Truck className="w-4 h-4" />}
                    {item.key === 'Business Meeting' && <Users className="w-4 h-4" />}
                    {(item.key === 'General Visitor' || item.key === 'General Inquiry') && <HelpCircle className="w-4 h-4" />}
                    {item.key === 'Other' && <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[11px] mt-0.5 leading-snug line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-slate-200" />

        {/* ======================================================== */}
        {/* 2. CONTACT DETAILS */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            2. Visitor Information
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div ref={fieldRefs.fullName as any}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500">English or Hindi (e.g. Rahul Sharma)</span>
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Enter full legal name"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                  errors.fullName
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:border-slate-900'
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

            {/* Mobile Number */}
            <div ref={fieldRefs.phone as any}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500">10-Digit Indian Mobile</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="98765 00000"
                  className={`w-full pl-12 pr-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                    errors.phone
                      ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:border-slate-900'
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

          {/* Email Address */}
          <div ref={fieldRefs.email as any}>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-800">
                Email Address {isCandidate ? <span className="text-rose-500">*</span> : <span className="text-slate-400">(Optional)</span>}
              </label>
              <span className="text-[10px] text-slate-500">For visit records & communications</span>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="e.g. yourname@example.com"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden transition ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                  : 'border-slate-300 focus:border-slate-900'
              }`}
              required={isCandidate}
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

        {/* ======================================================== */}
        {/* 3. VISIT TYPE & APPOINTMENT TIMING */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            3. Visit Type & Appointment Schedule
          </label>

          {/* Walk-in vs Scheduled Radio Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisitType('WALK_IN')}
              className={`py-3 px-3.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                visitType === 'WALK_IN'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                visitType === 'WALK_IN' ? 'border-amber-400 bg-amber-400' : 'border-slate-400'
              }`} />
              <div>
                <span className="font-bold text-xs block">Walk-In / Immediate</span>
                <span className={`text-[10px] block ${visitType === 'WALK_IN' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Direct office arrival
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVisitType('SCHEDULED')}
              className={`py-3 px-3.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                visitType === 'SCHEDULED'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                visitType === 'SCHEDULED' ? 'border-amber-400 bg-amber-400' : 'border-slate-400'
              }`} />
              <div>
                <span className="font-bold text-xs block">Scheduled Appointment</span>
                <span className={`text-[10px] block ${visitType === 'SCHEDULED' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Pre-arranged meeting
                </span>
              </div>
            </button>
          </div>

          {/* Structured Date + Time input if Scheduled */}
          {visitType === 'SCHEDULED' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  Appointment Details
                </span>
                <span className="text-[11px] text-slate-500">Office Hours: 10:00 AM - 07:00 PM</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" ref={fieldRefs.appointmentDate as any}>
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

        {/* ======================================================== */}
        {/* 4. HOST / PERSON SELECTION (NOT SILENTLY DEFAULTED TO HR) */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              4. Person or Team to Meet
            </label>
            <span className="text-[11px] text-slate-500">Routed to assigned team</span>
          </div>

          <div>
            <select
              value={selectedHostId}
              onChange={(e) => setSelectedHostId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-hidden focus:border-slate-900 transition"
            >
              <option value="RECEPTION_ASSISTANCE">
                I don’t know whom to meet / Front Desk Assistance
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

            <p className="text-[11px] text-slate-500 mt-1">
              Selected Host:{' '}
              <strong className="text-slate-800">
                {CONFIGURED_STAFF_HOSTS.find((h) => h.id === selectedHostId)?.name}
              </strong>{' '}
              ({CONFIGURED_STAFF_HOSTS.find((h) => h.id === selectedHostId)?.department})
            </p>
          </div>
        </div>

        <div className="h-px bg-slate-200" />

        {/* ======================================================== */}
        {/* 5. PURPOSE-SPECIFIC FIELDS */}
        {/* ======================================================== */}
        {isCandidate && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              5. Candidate Interview Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Position Applied For */}
              <div ref={fieldRefs.position as any}>
                <label className="block font-semibold text-slate-800 mb-1">
                  Position / Role Applied For <span className="text-rose-500">*</span>
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                >
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

              {/* Total Experience */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Total Experience</label>
                <select
                  value={totalExperience}
                  onChange={(e) => setTotalExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                >
                  <option value="Fresher">Fresher / Graduate Trainee</option>
                  <option value="1-2 Years">1-2 Years</option>
                  <option value="3-5 Years">3-5 Years</option>
                  <option value="5-8 Years">5-8 Years</option>
                  <option value="8+ Years">8+ Years (Senior / Leadership)</option>
                </select>
              </div>

              {/* Current Organization */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Current / Previous Organization <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  placeholder="e.g. DLF / Godrej / Self-Employed"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                />
              </div>

              {/* Notice Period */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Notice Period</label>
                <select
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                >
                  <option value="Immediate">Immediate Joiner (0 Days)</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days (1 Month)</option>
                  <option value="60+ Days">60+ Days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {(selectedPurpose === 'Client / Property Consultation' || selectedPurpose === 'Client / Property') && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              5. Client & Property Inquiry Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Property Category of Interest</label>
                <select
                  value={propertyInterest}
                  onChange={(e) => setPropertyInterest(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                >
                  <option value="Commercial Leasing / Retail Space">Commercial Leasing / Retail Space</option>
                  <option value="Luxury Residential / Villas">Luxury Residential / Villas</option>
                  <option value="Corporate Office Space">Corporate Office Space</option>
                  <option value="Investment Plots / Land">Investment Plots / Land</option>
                  <option value="General High-Net-Worth Advisory">General High-Net-Worth Advisory</option>
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {selectedPurpose === 'Business Meeting' && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              5. Meeting Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div ref={fieldRefs.companyName as any}>
                <label className="block font-semibold text-slate-800 mb-1">
                  Organization / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Realty Group"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden ${
                    errors.companyName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                  }`}
                  required
                />
                {errors.companyName && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Meeting Agenda / Topic <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  placeholder="e.g. Commercial Partnership Discussion"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {selectedPurpose === 'Vendor / Service / Delivery' && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              5. Vendor & Delivery Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div ref={fieldRefs.vendorCompany as any}>
                <label className="block font-semibold text-slate-800 mb-1">
                  Vendor / Service Company <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorCompany}
                  onChange={(e) => setVendorCompany(e.target.value)}
                  placeholder="e.g. BlueDart / Otis Elevators / IT Maintenance"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden ${
                    errors.vendorCompany ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                  }`}
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
                >
                  <option value="Courier / Document Delivery">Courier / Document Delivery</option>
                  <option value="Office Supplies / Pantry Restock">Office Supplies / Pantry Restock</option>
                  <option value="IT Hardware & Technical Support">IT Hardware & Technical Support</option>
                  <option value="Facilities / Electrical / Maintenance">Facilities / Electrical / Maintenance</option>
                  <option value="Other Service">Other Service</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {(selectedPurpose === 'General Inquiry' || selectedPurpose === 'General Visitor') && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              5. Inquiry Note
            </label>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Brief Note for Front Desk <span className="text-slate-400">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={inquiryNotes}
                onChange={(e) => setInquiryNotes(e.target.value)}
                placeholder="How can our front desk assist you today?"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-slate-900"
              />
            </div>
          </div>
        )}

        {selectedPurpose === 'Other' && (
          <div className="space-y-4" ref={fieldRefs.otherPurposeReason as any}>
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              5. Purpose / Reason
            </label>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Purpose / Reason for Visit <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={otherPurposeReason}
                onChange={(e) => setOtherPurposeReason(e.target.value)}
                placeholder="Please describe the purpose of your visit for reception assistance"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs focus:outline-hidden ${
                  errors.otherPurposeReason ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-slate-900'
                }`}
                required
              />
              {errors.otherPurposeReason && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.otherPurposeReason}</p>
              )}
            </div>
          </div>
        )}

        <div className="h-px bg-slate-200" />

        {/* ======================================================== */}
        {/* 6. CV FLOW — INTERVIEW ONLY (NEVER SHOWN FOR NON-INTERVIEW) */}
        {/* ======================================================== */}
        {isCandidate && (
          <div className="space-y-3.5" ref={fieldRefs.cv as any}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>6. Resume / Curriculum Vitae</span>
                {requireResumeSetting && <span className="text-rose-500">*</span>}
              </label>
              <span className="text-[11px] text-slate-500">Choose submission method</span>
            </div>

            {/* 4 CV Handling Modes */}
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

            {/* Mode 1: Document Upload */}
            {cvMode === 'DOCUMENT_UPLOAD' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                {resumeFile ? (
                  <div className="space-y-2">
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
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
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

            {/* Mode 2: Hard Copy Brought */}
            {cvMode === 'HARD_COPY' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Physical Copy Brought to Reception</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  You indicated that you have brought a hard copy of your CV. The front desk coordinator will scan and attach it to your digital dossier at the reception desk.
                </p>
              </div>
            )}

            {/* Mode 3: Scan / Upload Photos of CV */}
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

            {/* Mode 4: CV Unavailable */}
            {cvMode === 'UNAVAILABLE' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-amber-950">CV Unavailable Notice</p>
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  Your application will be flagged for HR review according to White Collar Realty hiring policy. Please send your resume to hr@whitecollarrealty.com as soon as possible.
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
        )}

        {isCandidate && <div className="h-px bg-slate-200" />}

        {/* ======================================================== */}
        {/* 7. VISITOR ARRIVAL PHOTO (INTERVIEW CANDIDATE ONLY) */}
        {/* ======================================================== */}
        {isCandidate && (
          <div className="space-y-3" ref={fieldRefs.photo as any}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                7. Arrival Photo Verification
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
        )}

        {/* ======================================================== */}
        {/* 8. SINGLE PRIMARY CTA: "Check In" */}
        {/* ======================================================== */}
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
      </form>
    </div>
  );
};
