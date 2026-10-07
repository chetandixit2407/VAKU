export type DomainEventType =
  | 'CANDIDATE_FORM_SUBMITTED'
  | 'CANDIDATE_ARRIVED'
  | 'CANDIDATE_WAITING'
  | 'ROOM_ASSIGNED'
  | 'INTERVIEW_STARTED'
  | 'INTERVIEW_COMPLETED'
  | 'NEXT_INTERVIEW_CREATED'
  | 'ROOM_STATUS_CHANGED'
  | 'ROOM_RESET_TASK_CREATED'
  | 'PANTRY_TASK_CREATED'
  | 'PANTRY_TASK_COMPLETED'
  | 'CANDIDATE_CHECKED_OUT'
  | 'CANDIDATE_LIVE_PHOTO_CAPTURED'
  | 'CANDIDATE_RESUME_UPLOADED'
  | 'CANDIDATE_PROFILE_UPDATED'
  | 'CANDIDATE_DELETED'
  | 'CANDIDATE_VALIDATION_COMPLETED'
  | 'REGISTRATION_SESSION_COMPLETED'
  | 'NOTIFICATION_CREATED'
  | 'DASHBOARD_RESYNC'
  | 'CANDIDATE_ASSIGNED_TO_KIMMI'
  | 'VISITOR_CHECKED_IN'
  | 'WALKIN_REGISTERED'
  | 'INTERNAL_CHAT_MESSAGE'
  | 'ACTION_TASK_CREATED'
  | 'ACTION_TASK_UPDATED'
  | 'ROOM_REQUEST_ACTION'
  | 'HEARTBEAT';

export interface DomainEvent {
  eventId: string;
  eventType: DomainEventType | string;
  candidateId?: string;
  visitId?: string;
  applicationId?: string;
  interviewId?: string;
  roomId?: string;
  taskId?: string;
  registrationSessionId?: string;
  timestamp: string;
  actorType: 'SYSTEM' | 'CANDIDATE' | 'STAFF' | 'USER';
  source: 'CANDIDATE_REGISTRATION' | 'STAFF_ACTION' | 'WORKFLOW_ENGINE';
  targetRoles?: UserRole[];
  targetUserId?: string;
  metadata?: Record<string, any>;
}

export interface StaffSession {
  sessionId: string;
  token: string;
  userId: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  designation?: string;
  department: string;
  permissions: string[];
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
}

export type UserRole =
  | 'HR'
  | 'SENIOR_HR'
  | 'ADMIN'
  | 'CEO'
  | 'CO_FOUNDER'
  | 'INTERVIEWER'
  | 'RECEPTION'
  | 'PANTRY'
  | 'EMPLOYEE'
  | 'MANAGER'
  | 'VISITOR_COORDINATOR'
  | 'FACILITIES'
  | 'SECURITY'
  | 'SUPER_ADMIN';

export interface User {
  id: string;
  userId?: string;
  name: string;
  email: string;
  username?: string;
  passwordHash?: string;
  role: UserRole;
  designation?: string;
  department: string;
  permissions?: string[];
  isActive: boolean;
  avatar?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export type PasswordResetStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'USED' | 'EXPIRED';

export interface PasswordResetRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  token: string;
  status: PasswordResetStatus;
  requestedAt: string;
  expiresAt: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectionReason?: string;
  completedAt?: string;
  ipAddress?: string;
  deliveryMethod: 'EMAIL_SIMULATION' | 'ADMIN_APPROVAL_LINK' | 'DIRECT_TOKEN';
  resetLink?: string;
}

export type CandidateStatus =
  | 'SCHEDULED'
  | 'ARRIVED'
  | 'WAITING'
  | 'ROOM_ASSIGNED'
  | 'IN_INTERVIEW'
  | 'COMPLETED'
  | 'CHECKED_OUT'
  | 'REJECTED'
  | 'OFFERED'
  | 'DELETED'
  | 'With Kimmi Mam – Senior HR Interview';

export type InterviewStage =
  | 'Round 1 - Technical Assessment'
  | 'Round 2 - HR & Culture Fit'
  | 'Round 3 - Leadership & Commercial'
  | 'Final Executive Review';

export type InterviewStatus =
  | 'SCHEDULED'
  | 'CANDIDATE_ARRIVED'
  | 'ROOM_ASSIGNED'
  | 'INTERVIEW_STARTED'
  | 'INTERVIEW_COMPLETED'
  | 'CANCELLED';

export type InterviewOutcome = 'PENDING' | 'NEXT_INTERVIEW' | 'HOLD' | 'REJECTED' | 'SELECTED';

export interface CandidateResumeMetadata {
  id: string;
  candidateId: string;
  originalFileName: string;
  mimeType: string;
  fileSize: string;
  storageKey?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface CandidatePhotoMetadata {
  photoUrl?: string;
  capturedAt: string;
  capturedBy: string;
  capturedByName?: string;
  captureSource: 'RECEPTION_LIVE_CAMERA' | 'CANDIDATE_SELF_REGISTRATION';
}



export type ValidationOverallStatus = 'READY_FOR_RECEPTION' | 'NEEDS_REVIEW' | 'INVALID';

export interface ValidationCheckItem {
  id: string;
  name: string;
  category: 'PERSONAL' | 'PROFESSIONAL' | 'RESUME' | 'GOV_ID' | 'CONSISTENCY';
  status: 'PASSED' | 'NEEDS_REVIEW' | 'INVALID' | 'WARNING';
  details: string;
  expected?: string;
  actual?: string;
}

export interface CandidateValidationResult {
  id: string;
  candidateId: string;
  overallStatus: ValidationOverallStatus;
  validationTimestamp: string;
  checksPerformed: number;
  checksPassed: number;
  checksFlagged: number;
  systemActor: string;
  summary: string;
  checks: ValidationCheckItem[];
  resumeExtractedData?: {
    name?: string;
    nameMatch?: 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'NOT_FOUND';
    email?: string;
    emailMatch?: 'MATCH' | 'MISMATCH' | 'NOT_FOUND';
    phone?: string;
    phoneMatch?: 'MATCH' | 'MISMATCH' | 'NOT_FOUND';
    totalExperience?: string;
    company?: string;
    designation?: string;
  };

}

export type GovernmentIdType = 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VOTER_ID' | 'PASSPORT' | 'OTHER';

export interface GovernmentIdDocument {
  id?: string;
  candidateId?: string;
  idType?: GovernmentIdType;
  idTypeName?: string;
  idNumberMasked?: string;
  maskedIdNumber?: string;
  rawIdNumber?: string;
  verified?: boolean;
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NEEDS_REVIEW';
  uploadedAt?: string;
  storageKey?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSize?: string;
  documentDataUrl?: string;
  fileDataUrl?: string;
  verificationNotes?: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  position: string;
  department: string;
  totalExperience: string;
  relevantExperience: string;
  currentCompany: string;
  qualification: string;
  noticePeriod: string;
  expectedSalary: string;
  referralSource: string;
  skills?: string;
  departmentToMeet?: string;
  personToMeet?: string;
  howDidYouHear?: string;
  purpose?: string;
  visitType?: 'WALK_IN' | 'SCHEDULED_INTERVIEW' | 'CLIENT_MEETING' | 'VENDOR';
  appointmentTime?: string;
  interviewerId?: string;
  interviewerName?: string;
  interviewRound?: string;
  livePhoto?: string;
  livePhotoCapturedAt?: string;
  livePhotoCapturedBy?: string;
  arrivalPhoto?: string; // Reception desk verified live photo
  arrivalPhotoCapturedAt?: string;
  arrivalPhotoCapturedBy?: string;
  arrivalPhotoCapturedByName?: string;
  photoMetadata?: CandidatePhotoMetadata;
  governmentId?: GovernmentIdDocument;
  hasGovernmentId?: boolean;
  governmentIdFileName?: string;
  governmentIdFileUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeFileSize?: string;
  resumeMimeType?: string;
  resumeUploadedAt?: string;
  resumeMetadata?: CandidateResumeMetadata;

  validationResult?: CandidateValidationResult;
  hrPrivateNotes?: string;
  hrNotes?: string;
  interviewerFeedbackPrivate?: string;
  internalHiringDecisionNotes?: string;
  managementNotes?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  deletionReason?: string;
  status: CandidateStatus;
  assignedRoomId?: string;
  assignedRoomName?: string;
  currentLocation: string;
  arrivalTime?: string;
  checkOutTime?: string;
  totalDurationMinutes?: number;
  appointmentId?: string;
  currentInterviewId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  roundName: InterviewStage | string;
  interviewerId: string;
  interviewerName: string;
  scheduledTime: string;
  status: InterviewStatus;
  roomId?: string;
  roomName?: string;
  startedAt?: string;
  completedAt?: string;
  outcome?: InterviewOutcome;
  interviewerFeedback?: string;
  nextInterviewerId?: string;
  nextRoundName?: string;
  createdAt: string;
  updatedAt: string;
}

export type RoomStatus = 'AVAILABLE' | 'ASSIGNED' | 'OCCUPIED' | 'MAINTENANCE' | 'NEEDS_CLEANING' | 'CLEANING';

export type RoomType = 'CABIN' | 'MEETING_ROOM' | 'WAITING_AREA' | 'POD' | 'OTHER' | 'EXECUTIVE_BOARDROOM' | 'STANDARD_MEETING' | 'INTERVIEW_POD';

export interface Room {
  id: string;
  roomId?: string;
  name: string;
  roomName?: string;
  type: RoomType;
  roomType?: RoomType;
  status: RoomStatus;
  isActive: boolean;
  preferredFor?: string;
  isReservedNextRound?: boolean;
  currentCandidateId?: string;
  currentCandidateName?: string;
  currentInterviewId?: string;
  assignedInterviewerName?: string;
  lastSanitizedAt?: string;
  cleaningRequestedAt?: string;
  lastCleanedAt?: string;
  lastCleanedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CandidateChangeRequest {
  id: string;
  candidateId: string;
  candidateName: string;
  requestedByUserId: string;
  requestedByUserName: string;
  requestedByUserRole: UserRole;
  requestedField: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
  resolvedByUserName?: string;
  resolutionNotes?: string;
}

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface NotificationAction {
  label: string;
  actionKey: string;
  payload?: Record<string, any>;
}

export interface Notification {
  id: string;
  recipientRole: UserRole;
  recipientUserId?: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  eventType: string;
  entityId: string;
  entityType: 'CANDIDATE' | 'INTERVIEW' | 'ROOM' | 'PANTRY_TASK' | 'VISITOR';
  read: boolean;
  createdAt: string;
  actionButtons?: NotificationAction[];
  payload?: Record<string, any>; // Role-filtered payload
}

export type PantryTaskType = 'ROOM_PREP' | 'WATER_BEVERAGE' | 'ROOM_RESET' | 'CUSTOM';
export type PantryTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface PantryTask {
  id: string;
  roomId: string;
  roomName: string;
  candidateId?: string;
  candidateName: string;
  taskType: PantryTaskType;
  description: string;
  requiredItems: string[];
  priority: NotificationPriority;
  status: PantryTaskStatus;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  assignedSteward?: string;
  sourceChatMessageId?: string;
}

export type ActionTaskType =
  | 'ESCORT_CANDIDATE'
  | 'PREPARE_ROOM'
  | 'CLEAN_ROOM'
  | 'CANDIDATE_READY'
  | 'CUSTOM_INSTRUCTION';

export type ActionTaskStatus =
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DISMISSED';

export interface ActionTask {
  id: string;
  sourceChatMessageId?: string;
  taskType: ActionTaskType;
  title: string;
  instruction: string;
  targetRole: UserRole;
  targetUserId?: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  candidateId?: string;
  candidateName?: string;
  candidateLocation?: string;
  candidateStatus?: string;
  roomId?: string;
  roomName?: string;
  destinationRoomId?: string;
  destinationRoomName?: string;
  priority: NotificationPriority;
  status: ActionTaskStatus;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  completedAt?: string;
  completedBy?: string;
}

export type ActorType = 'SYSTEM' | 'USER' | 'STAFF' | 'CANDIDATE';

export interface TimelineEvent {
  id: string;
  candidateId: string;
  timestamp: string;
  actorType: ActorType;
  actorName: string;
  eventType: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorType?: ActorType;
  actorUserId?: string;
  actorName: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details: string;
  entityId?: string;
  entityType?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export type SessionStatus = 'ACTIVE' | 'STARTED' | 'SUBMITTING' | 'COMPLETED' | 'SUBMITTED' | 'EXPIRED' | 'CANCELLED';

export interface CheckInSession {
  id: string;
  token: string;
  qrType: 'APPOINTMENT' | 'GENERAL_RECEPTION' | 'NEW_CANDIDATE_REGISTRATION';
  source?: 'GENERAL_WCR_QR' | 'SCHEDULED_APPOINTMENT';
  candidateId?: string;
  candidateName?: string;
  position?: string;
  department?: string;
  appointmentTime?: string;
  interviewerId?: string;
  interviewerName?: string;
  interviewRound?: string;
  status: SessionStatus;
  expiresAt: string;
  createdAt: string;
  openedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  lockedAt?: string;
}

export type VisitorType = 'CANDIDATE' | 'CLIENT' | 'VENDOR' | 'WALK_IN';

export interface Visitor {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  company?: string;
  visitorType: VisitorType;
  hostName: string;
  hostDepartment: string;
  hostId?: string;
  purpose: string;
  status: 'CHECKED_IN' | 'MEETING' | 'CHECKED_OUT';
  roomAssigned?: string;
  checkInTime: string;
  checkOutTime?: string;
  photo?: string;
}

export interface RoleFieldVisibility {
  candidateName: boolean;
  phone: boolean;
  email: boolean;
  address: boolean;
  resume: boolean;
  validationResults: boolean;
  livePhoto: boolean;
  governmentId?: boolean;
  hrNotes: boolean;
  interviewStatus: boolean;
  room: boolean;
  pantryTask: boolean;
  salary: boolean;
}

export interface OfficeSettings {
  autoAssignPantryOnRoom: boolean;
  pantryWaterRequired: boolean;
  requireLivePhoto: boolean;
  requireResume: boolean;
  requireGovernmentId?: boolean;
  allowedGovernmentIdTypes?: GovernmentIdType[];
  allowedUploadFormats: string[];
  qrSessionExpiryMinutes?: number;
  fieldVisibility: Record<UserRole, RoleFieldVisibility>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderDepartment?: string;
  channelId?: string; // e.g. 'general', 'hr-desk', 'reception', 'pantry', 'leadership'
  recipientId?: string; // for direct 1-on-1 staff messages
  recipientName?: string;
  recipientRole?: UserRole;
  content: string;
  timestamp: string;
  readBy: string[]; // user IDs who have read
  candidateId?: string;
  candidateName?: string;
  roomId?: string;
  roomName?: string;
  isPriority?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  icon?: string;
  allowedRoles?: UserRole[];
}
