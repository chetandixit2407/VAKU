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
  VISIT_PURPOSE_OPTIONS,
  CONFIGURED_STAFF_HOSTS,
  getRecommendedHostForPurpose,
  isInterviewPurpose,
  validatePersonName,
  validateIndianMobile,
  validateEmail,
  validateAppointmentDateTime,
  type VisitPurpose,
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

  // 1. Purpose of Visit
  const [selectedPurpose, setSelectedPurpose] = useState<VisitPurpose>('Interview / Candidate');

  // Helper
  const isCandidate = isInterviewPurpose(selectedPurpose);

  // 2. Personal Information
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // 3. Visit Type & Appointments
  const [visitType, setVisitType] = useState<'WALK_IN' | 'SCHEDULED'>('SCHEDULED');
  const [appointmentDate, setAppointmentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState<string>('11:00');
  const [confirmedAppointment, setConfirmedAppointment] = useState<{
    time?: string;
    stage?: string;
    interviewer?: string;
  } | null>(null);

  // 4. Host Selection
  const [selectedHostId, setSelectedHostId] = useState<string>('usr-hr-nisha');

  // 5. Purpose-specific Fields
  const [position, setPosition] = useState<string>('Sales Manager - Luxury Residential');
  const [customPosition, setCustomPosition] = useState<string>('');
  const [totalExperience, setTotalExperience] = useState<string>('3-5 Years');
  const [currentCompany, setCurrentCompany] = useState<string>('');
  const [noticePeriod, setNoticePeriod] = useState<string>('Immediate');
  const [referralSource, setReferralSource] = useState<string>('HR Direct Call / Scheduled Invitation');

  // Client fields
  const [propertyInterest, setPropertyInterest] = useState<string>('Luxury Residential / Villas');
  const [clientBudget, setClientBudget] = useState<string>('');

  // Business Meeting fields
  const [companyName, setCompanyName] = useState<string>('');
  const [meetingAgenda, setMeetingAgenda] = useState<string>('');

  // Vendor / Service fields
  const [vendorCompany, setVendorCompany] = useState<string>('');
  const [serviceNature, setServiceNature] = useState<string>('Courier / Document Delivery');

  // General Inquiry field
  const [inquiryNotes, setInquiryNotes] = useState<string>('');

  // 6. CV Flow (Interview only)
  const [cvMode, setCvMode] = useState<CvHandlingMode>('DOCUMENT_UPLOAD');
  const [resumeFile, setResumeFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
  } | null>(null);
  const [cvPhotos, setCvPhotos] = useState<string[]>([]);
  const [requireResumeSetting, setRequireResumeSetting] = useState<boolean>(false);

  // 7. Photo Capture
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoCaptureSource>('LIVE_CAMERA');
  const [isReceptionAssistedPhoto, setIsReceptionAssistedPhoto] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Validation Errors (Field-level)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<any>(null);
  const [submissionTime, setSubmissionTime] = useState<string>('');

  // Field refs
  const fieldRefs: Record<string, React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLDivElement | null>> = {
    fullName: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    position: useRef<HTMLInputElement>(null),
    appointmentDate: useRef<HTMLInputElement>(null),
    companyName: useRef<HTMLInputElement>(null),
    vendorCompany: useRef<HTMLInputElement>(null),
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

  // Sync recommended host when purpose changes
  const handlePurposeChange = (newPurpose: VisitPurpose) => {
    setSelectedPurpose(newPurpose);
    const recHost = getRecommendedHostForPurpose(newPurpose);
    setSelectedHostId(recHost.id);
    if (newPurpose !== 'Interview') {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.position;
        delete next.cv;
        return next;
      });
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
        // Fallback to /api/register/session/:token
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
        if (data.session.position) setPosition(data.session.position);
        if (data.session.appointmentTime) {
          setConfirmedAppointment({
            time: data.session.appointmentTime,
            stage: data.session.interviewRound,
            interviewer: data.session.interviewerName,
          });
          setVisitType('SCHEDULED');
        }
      }

      if (data.prefill) {
        if (data.prefill.fullName) setFullName(data.prefill.fullName);
        if (data.prefill.phone) setPhone(data.prefill.phone);
        if (data.prefill.email) setEmail(data.prefill.email);
        if (data.prefill.position) setPosition(data.prefill.position);
        if (data.prefill.totalExperience) setTotalExperience(data.prefill.totalExperience);
        if (data.prefill.currentCompany) setCurrentCompany(data.prefill.currentCompany);
        if (data.prefill.noticePeriod) setNoticePeriod(data.prefill.noticePeriod);
      }
    } catch (err: any) {
      console.warn('Session load error', err);
      setSessionError('Unable to load pass details.');
    } finally {
      setSessionLoading(false);
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

  // Fallback Device Photo Upload
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
        (ref.current as any).focus();
      }
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError(null);
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

    // 3. Email
    if (selectedPurpose === 'Interview' || email.trim()) {
      const emailCheck = validateEmail(email, selectedPurpose === 'Interview');
      if (!emailCheck.isValid) {
        newErrors.email = emailCheck.error || 'Please enter a valid email address.';
      }
    }

    // 4. Appointments validation
    if (visitType === 'SCHEDULED' && !confirmedAppointment) {
      const apptCheck = validateAppointmentDateTime(appointmentDate, appointmentTime);
      if (!apptCheck.isValid) {
        newErrors.appointmentDate = apptCheck.error || 'Please choose a valid appointment date and time.';
      }
    }

    // 5. Purpose-specific validation
    if (selectedPurpose === 'Interview') {
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
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      scrollToFirstError(firstErrorKey);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const resolvedPosition =
      selectedPurpose === 'Interview'
        ? position === 'Other'
          ? customPosition.trim()
          : position
        : selectedPurpose;

    const resolvedHost = CONFIGURED_STAFF_HOSTS.find((h) => h.id === selectedHostId) || CONFIGURED_STAFF_HOSTS[0];
    const cleanPhone = phone.trim().replace(/[\s-]/g, '').replace(/^\+91/, '').replace(/^0/, '');

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

    const payload = {
      token: tokenInput,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email.trim(),
      purpose: selectedPurpose,
      visitType,
      appointmentTime:
        visitType === 'SCHEDULED'
          ? confirmedAppointment?.time || `${appointmentDate} ${appointmentTime}`
          : undefined,
      personToMeet: resolvedHost.name,
      departmentToMeet: resolvedHost.department,
      hostId: resolvedHost.id,
      position: resolvedPosition,
      totalExperience: selectedPurpose === 'Interview' ? totalExperience : undefined,
      currentCompany:
        selectedPurpose === 'Interview'
          ? currentCompany.trim()
          : selectedPurpose === 'Business Meeting'
          ? companyName.trim()
          : selectedPurpose === 'Vendor / Service / Delivery'
          ? vendorCompany.trim()
          : undefined,
      noticePeriod: selectedPurpose === 'Interview' ? noticePeriod : undefined,
      referralSource: selectedPurpose === 'Interview' ? referralSource : undefined,
      livePhoto: photoDataUrl || undefined,
      photoSource: isReceptionAssistedPhoto ? 'RECEPTION_ASSISTED' : photoSource,
      isReceptionAssistedPhoto,
      resumeUrl: selectedPurpose === 'Interview' ? resolvedCvUrl : undefined,
      resumeFileName: selectedPurpose === 'Interview' ? resolvedCvFileName : undefined,
      resumeFileSize: resumeFile?.size,
      cvHandlingMode: selectedPurpose === 'Interview' ? cvMode : undefined,
      propertyInterest: selectedPurpose === 'Client / Property Consultation' ? propertyInterest : undefined,
      clientBudget: selectedPurpose === 'Client / Property Consultation' ? clientBudget.trim() : undefined,
      meetingAgenda: selectedPurpose === 'Business Meeting' ? meetingAgenda.trim() : undefined,
      serviceNature: selectedPurpose === 'Vendor / Service / Delivery' ? serviceNature.trim() : undefined,
      inquiryNotes: selectedPurpose === 'General Inquiry' ? inquiryNotes.trim() : undefined,
      company:
        selectedPurpose === 'Business Meeting'
          ? companyName.trim()
          : selectedPurpose === 'Vendor / Service / Delivery'
          ? vendorCompany.trim()
          : undefined,
    };

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
        throw new Error(data.error || 'Submission failed');
      }

      const returnedRecord = data.candidate || data.visitor || { fullName, position: resolvedPosition, id: tokenInput };
      setSubmittedCandidate(returnedRecord);
      setIsCompletedSession(true);
      const timeStr = data.submissionTime || new Date().toISOString();
      setSubmissionTime(formatAuthoritativeTimestamp(timeStr));

      if (onSuccess) onSuccess(returnedRecord);
    } catch (err: any) {
      console.error('Check-in error', err);
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS / RECEIPT VIEW
  if (isCompletedSession && submittedCandidate) {
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
              White Collar Realty • Scheduled Check-In
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Check-In Confirmed
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {isInterview
                ? 'Your scheduled interview arrival has been recorded. Front desk & HR have been alerted.'
                : `Your arrival has been recorded. ${hostInfo.name} has been notified.`}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3.5 mt-4">
            <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">
                  Pass Reference
                </span>
                <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                  {submittedCandidate.id || tokenInput}
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
                  {selectedPurpose === 'Interview' ? position : selectedPurpose}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  Host: <strong className="text-slate-800">{hostInfo.name}</strong> ({hostInfo.department})
                </p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block mb-0.5">Next Steps:</strong>
              Please take a seat in our <strong>Ground Floor Waiting Lounge</strong>. You will be escorted to your room shortly.
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pass locked and registered. You may close this browser window.</span>
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
            Scheduled Pass Check-In
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
        {/* 1. PURPOSE OF VISIT */}
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
                    {item.key === 'Interview' && <Briefcase className="w-4 h-4" />}
                    {item.key === 'Client / Property Consultation' && <Building2 className="w-4 h-4" />}
                    {item.key === 'Business Meeting' && <Users className="w-4 h-4" />}
                    {item.key === 'Vendor / Service / Delivery' && <Truck className="w-4 h-4" />}
                    {item.key === 'General Inquiry' && <HelpCircle className="w-4 h-4" />}
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
            <div ref={fieldRefs.fullName as any}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500">English or Hindi</span>
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

            <div ref={fieldRefs.phone as any}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500">10-Digit Mobile</span>
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

          <div ref={fieldRefs.email as any}>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-800">
                Email Address {selectedPurpose === 'Interview' ? <span className="text-rose-500">*</span> : <span className="text-slate-400">(Optional)</span>}
              </label>
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
              required={selectedPurpose === 'Interview'}
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
        {/* 3. APPOINTMENT DETAILS */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            3. Visit Type & Schedule
          </label>

          {confirmedAppointment ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Confirmed Appointment Pass
              </span>
              <p className="text-xs text-emerald-800">
                Scheduled Time: <strong>{confirmedAppointment.time}</strong> • Stage:{' '}
                <strong>{confirmedAppointment.stage || 'Round 1'}</strong>
              </p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
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
        {/* 4. HOST / PERSON SELECTION */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              4. Person or Team to Meet
            </label>
            <span className="text-[11px] text-slate-500">Routed appropriately</span>
          </div>

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
        </div>

        <div className="h-px bg-slate-200" />

        {/* ======================================================== */}
        {/* 5. PURPOSE-SPECIFIC FIELDS */}
        {/* ======================================================== */}
        {selectedPurpose === 'Interview' && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              5. Candidate Interview Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {selectedPurpose === 'Client / Property Consultation' && (
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
                  Budget / Location <span className="text-slate-400">(Optional)</span>
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
                <label className="block font-semibold text-slate-800 mb-1">Meeting Agenda</label>
                <input
                  type="text"
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  placeholder="e.g. Strategic Partnership Discussion"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
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
                  placeholder="e.g. BlueDart / Otis / IT Support"
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
                <label className="block font-semibold text-slate-800 mb-1">Service Nature</label>
                <select
                  value={serviceNature}
                  onChange={(e) => setServiceNature(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
                >
                  <option value="Courier / Document Delivery">Courier / Document Delivery</option>
                  <option value="Office Supplies / Pantry Restock">Office Supplies / Pantry Restock</option>
                  <option value="IT Hardware & Technical Support">IT Hardware & Technical Support</option>
                  <option value="Facilities / Maintenance">Facilities / Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedPurpose === 'General Inquiry' && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              5. Inquiry Note
            </label>
            <textarea
              rows={2}
              value={inquiryNotes}
              onChange={(e) => setInquiryNotes(e.target.value)}
              placeholder="How can our front desk assist you today?"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden"
            />
          </div>
        )}

        <div className="h-px bg-slate-200" />

        {/* ======================================================== */}
        {/* 6. CV FLOW — INTERVIEW ONLY (NEVER SHOWN FOR NON-INTERVIEW) */}
        {/* ======================================================== */}
        {selectedPurpose === 'Interview' && (
          <div className="space-y-3.5" ref={fieldRefs.cv as any}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>6. Resume / Curriculum Vitae</span>
                {requireResumeSetting && <span className="text-rose-500">*</span>}
              </label>
              <span className="text-[11px] text-slate-500">Choose submission method</span>
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
                        title="Remove file"
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
                  You indicated that you have brought a hard copy of your CV. The front desk coordinator will scan and attach it to your digital dossier at the reception desk.
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
