import React, { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  Settings,
  Database,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Sliders,
  Users,
  KeyRound,
  UserCheck,
  UserX,
  Mail,
  Clock,
  Check,
  X,
  Copy,
  ExternalLink,
  Plus,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  DoorOpen,
  Edit3,
  Trash2,
  MapPin,
  Search,
  Filter,
  Phone,
  MessageSquare,
  Coffee,
  Calendar,
} from 'lucide-react';
import type {
  AuditLog,
  RoleFieldVisibility,
  UserRole,
  PasswordResetRequest,
  Room,
  RoomType,
  RoomStatus,
  Candidate,
  Interview,
  PantryTask,
  ActionTask,
} from '../../types/index.ts';
import { AdminChangeCredentialsModal } from '../AdminChangeCredentialsModal.tsx';

interface AdminDashboardProps {
  candidates?: Candidate[];
  interviews?: Interview[];
  rooms?: Room[];
  pantryTasks?: PantryTask[];
  actionTasks?: ActionTask[];
  onOpenDossier?: (candidateId: string) => void;
  onAssignRoom?: (candidateId: string, interviewId?: string) => void;
  onOpenChatWithContext?: (options: {
    candidateId?: string;
    roomId?: string;
    channelId?: string;
    initialMessage?: string;
  }) => void;
  onMarkRoomCleaned?: (roomId: string) => void;
  onAcknowledgeActionTask?: (taskId: string) => void;
  onCompleteActionTask?: (taskId: string) => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  candidates = [],
  interviews = [],
  rooms: propRooms,
  pantryTasks = [],
  actionTasks = [],
  onOpenDossier,
  onAssignRoom,
  onOpenChatWithContext,
  onMarkRoomCleaned,
  onAcknowledgeActionTask,
  onCompleteActionTask,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<
    'candidates' | 'users' | 'rooms' | 'tasks' | 'resets' | 'visibility' | 'audit' | 'settings'
  >('candidates');
  const [taskRoleFilter, setTaskRoleFilter] = useState<'ALL' | 'RECEPTION' | 'PANTRY' | 'CUSTOM'>('ALL');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'ALL' | 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED'>('ALL');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');
  const [cleaningOverrideRoomId, setCleaningOverrideRoomId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [visibilitySettings, setVisibilitySettings] = useState<Record<UserRole, RoleFieldVisibility> | null>(null);
  const [qrExpiryMinutes, setQrExpiryMinutes] = useState<number>(30);
  const [autoPantry, setAutoPantry] = useState<boolean>(true);
  const [reqLivePhoto, setReqLivePhoto] = useState<boolean>(true);
  const [reqResume, setReqResume] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Staff Users State
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserForCredentials, setSelectedUserForCredentials] = useState<any | null>(null);

  // Rooms State (Single source of truth)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | null>(null);
  const [newRoomForm, setNewRoomForm] = useState({
    name: '',
    type: 'MEETING_ROOM' as RoomType,
    preferredFor: '',
  });
  const [editRoomForm, setEditRoomForm] = useState({
    name: '',
    type: 'MEETING_ROOM' as RoomType,
    preferredFor: '',
    status: 'AVAILABLE' as RoomStatus,
    isActive: true,
  });
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Password Reset Queue State
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [loadingResets, setLoadingResets] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // New User Creation Modal
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'HR' as UserRole,
    department: 'HR & Recruitment',
    designation: 'HR Executive',
    phone: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserError, setNewUserError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRooms();
    fetchResets();
    fetchLogs();
    fetchSettings();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('wcr_staff_token') || sessionStorage.getItem('wcr_staff_token') || '';
    return {
      'x-user-role': 'ADMIN',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users?role=ADMIN', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setStaffUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load staff users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchResets = async () => {
    setLoadingResets(true);
    try {
      const res = await fetch('/api/admin/password-resets?role=ADMIN', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setResetRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to load password reset requests', err);
    } finally {
      setLoadingResets(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/audit-logs', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/bootstrap');
      const data = await res.json();
      if (data.success && data.settings) {
        setVisibilitySettings(data.settings.fieldVisibility);
        if (data.settings.qrSessionExpiryMinutes) {
          setQrExpiryMinutes(data.settings.qrSessionExpiryMinutes);
        }
        if (typeof data.settings.autoAssignPantryOnRoom === 'boolean') {
          setAutoPantry(data.settings.autoAssignPantryOnRoom);
        }
        if (typeof data.settings.requireLivePhoto === 'boolean') {
          setReqLivePhoto(data.settings.requireLivePhoto);
        }
        if (typeof data.settings.requireResume === 'boolean') {
          setReqResume(data.settings.requireResume);
        }
      }
    } catch (err) {
      console.error('Failed to load bootstrap settings', err);
    }
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomForm.name.trim()) return;
    setSavingRoom(true);
    setRoomError(null);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomForm.name.trim(),
          type: newRoomForm.type,
          preferredFor: newRoomForm.preferredFor.trim() || 'Interviews & Business Meetings',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowNewRoomModal(false);
        setNewRoomForm({
          name: '',
          type: 'MEETING_ROOM',
          preferredFor: '',
        });
        fetchRooms();
        fetchLogs();
        if (onRefresh) onRefresh();
      } else {
        setRoomError(data.error || 'Failed to create room.');
      }
    } catch (err: any) {
      setRoomError(err.message || 'Network error.');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleEditRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForEdit || !editRoomForm.name.trim()) return;
    setSavingRoom(true);
    setRoomError(null);

    try {
      const res = await fetch(`/api/rooms/${selectedRoomForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editRoomForm.name.trim(),
          type: editRoomForm.type,
          preferredFor: editRoomForm.preferredFor.trim(),
          status: editRoomForm.status,
          isActive: editRoomForm.isActive,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedRoomForEdit(null);
        fetchRooms();
        fetchLogs();
        if (onRefresh) onRefresh();
      } else {
        setRoomError(data.error || 'Failed to update room.');
      }
    } catch (err: any) {
      setRoomError(err.message || 'Network error.');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleToggleRoomActive = async (roomId: string) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/toggle-active`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        fetchRooms();
        fetchLogs();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to toggle room active state', err);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!window.confirm(`Are you sure you want to delete room "${roomName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'ADMIN' },
      });
      const data = await res.json();
      if (data.success) {
        fetchRooms();
        fetchLogs();
        if (onRefresh) onRefresh();
      } else {
        window.alert(data.error || 'Failed to delete room');
      }
    } catch (err) {
      console.error('Failed to delete room', err);
    }
  };

  const handleApproveReset = async (requestId: string) => {
    try {
      const res = await fetch(`/api/admin/password-resets/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: 'usr-admin-sameer',
          adminName: 'Sameer Sir (Admin)',
          role: 'ADMIN',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchResets();
        fetchLogs();
      }
    } catch (err) {
      console.error('Failed to approve password reset', err);
    }
  };

  const handleRejectReset = async (requestId: string) => {
    const reason = window.prompt('Enter rejection reason (optional):', 'Declined by Administrator');
    try {
      const res = await fetch(`/api/admin/password-resets/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: 'usr-admin-sameer',
          adminName: 'Sameer Sir (Admin)',
          role: 'ADMIN',
          reason: reason || 'Security review',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchResets();
        fetchLogs();
      }
    } catch (err) {
      console.error('Failed to reject password reset', err);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setNewUserError(null);

    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: 'usr-admin-sameer',
          adminName: 'Sameer Sir (Admin)',
          adminRole: 'ADMIN',
          ...newUserForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowNewUserModal(false);
        setNewUserForm({
          name: '',
          email: '',
          username: '',
          password: '',
          role: 'HR',
          department: 'HR & Recruitment',
          designation: 'HR Executive',
          phone: '',
        });
        fetchUsers();
        fetchLogs();
      } else {
        setNewUserError(data.error || 'Failed to create staff account.');
      }
    } catch (err: any) {
      setNewUserError(err?.message || 'Network error.');
    } finally {
      setCreatingUser(false);
    }
  };

  const copyResetUrl = (link?: string, id?: string) => {
    if (!link) return;
    const fullUrl = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedTokenId(id || link);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const handleAdminCleanOverride = async (roomId: string) => {
    setCleaningOverrideRoomId(roomId);
    try {
      if (onMarkRoomCleaned) {
        await onMarkRoomCleaned(roomId);
      } else {
        await fetch(`/api/rooms/${roomId}/cleaned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stewardName: 'Sameer Sir (Admin Override)' }),
        });
      }
      fetchRooms();
      onRefresh();
    } catch (err) {
      console.error('Failed to mark room cleaned', err);
    } finally {
      setCleaningOverrideRoomId(null);
    }
  };

  const handleSaveOfficeSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings/office', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrSessionExpiryMinutes: qrExpiryMinutes,
          autoAssignPantryOnRoom: autoPantry,
          requireLivePhoto: reqLivePhoto,
          requireResume: reqResume,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save office settings', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleField = async (role: UserRole, field: keyof RoleFieldVisibility) => {
    if (!visibilitySettings) return;
    const currentVal = visibilitySettings[role][field];
    const updated = {
      ...visibilitySettings,
      [role]: {
        ...visibilitySettings[role],
        [field]: !currentVal,
      },
    };
    setVisibilitySettings(updated);

    // Save to server
    setSavingSettings(true);
    try {
      await fetch('/api/settings/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          config: { [field]: !currentVal },
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update visibility', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const rolesList: UserRole[] = ['HR', 'ADMIN', 'CEO', 'INTERVIEWER', 'RECEPTION', 'PANTRY'];
  const fieldsList: { key: keyof RoleFieldVisibility; label: string }[] = [
    { key: 'candidateName', label: 'Candidate Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email Address' },
    { key: 'address', label: 'Full Address' },
    { key: 'resume', label: 'Resume Document' },
    { key: 'livePhoto', label: 'Live Capture Photo' },
    { key: 'salary', label: 'Expected Salary' },
    { key: 'hrNotes', label: 'Internal HR Notes' },
    { key: 'interviewStatus', label: 'Interview Status' },
    { key: 'room', label: 'Assigned Room' },
    { key: 'pantryTask', label: 'Pantry Tasks' },
  ];

  const pendingResetCount = resetRequests.filter((r) => r.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/10">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-[#111318] tracking-tight">
              Operations & Security Administration
            </h1>
          </div>
          <p className="text-xs text-[#252A32] font-medium mt-0.5">
            Full Access Credentials Manager (Sameer Sir), Room Configuration, Password Reset Approvals, and Central Audit Trail.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-[#0B0F14] border border-[#252A32] rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'candidates'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Live Candidates ({candidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-purple-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Accounts ({staffUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rooms'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Rooms & Pantry Monitor ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'tasks'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Action Alerts & Tasks</span>
            {actionTasks.filter((t) => t.status === 'PENDING').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                {actionTasks.filter((t) => t.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('resets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'resets'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Requests</span>
            {pendingResetCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {pendingResetCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('visibility')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'visibility'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Role Visibility Matrix
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Workflow Rules
          </button>
        </div>
      </div>

      {/* TAB 0: LIVE CANDIDATES FULL VISIBILITY & AUTHORITY (ADMIN) */}
      {activeTab === 'candidates' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-[#0B0B0D] card-dark dashboard-card border border-white/10 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#BDBDBD] block">
                Total Intake
              </span>
              <div className="text-xl font-black text-white mt-1">{candidates.length}</div>
              <span className="text-[10px] text-[#BDBDBD]">Authorized View</span>
            </div>
            <div className="p-4 bg-[#0B0B0D] card-dark dashboard-card border border-blue-500/30 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                In Session
              </span>
              <div className="text-xl font-black text-blue-300 mt-1">
                {candidates.filter((c) => c.status === 'IN_INTERVIEW').length}
              </div>
              <span className="text-[10px] text-blue-300">Live Interviews</span>
            </div>
            <div className="p-4 bg-[#0B0B0D] card-dark dashboard-card border border-amber-500/30 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Waiting / Assigned
              </span>
              <div className="text-xl font-black text-amber-300 mt-1">
                {
                  candidates.filter(
                    (c) =>
                      c.status === 'WAITING' ||
                      c.status === 'ROOM_ASSIGNED' ||
                      c.status === 'ARRIVED' ||
                      c.status === 'With Kimmi Mam – Senior HR Interview'
                  ).length
                }
              </div>
              <span className="text-[10px] text-amber-300">In Pipeline</span>
            </div>
            <div className="p-4 bg-[#0B0B0D] card-dark dashboard-card border border-emerald-500/30 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Completed Today
              </span>
              <div className="text-xl font-black text-emerald-300 mt-1">
                {
                  candidates.filter(
                    (c) =>
                      c.status === 'CHECKED_OUT' ||
                      c.status === 'COMPLETED' ||
                      c.status === 'OFFERED' ||
                      c.status === 'REJECTED'
                  ).length
                }
              </div>
              <span className="text-[10px] text-emerald-300">Evaluated / Departed</span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search candidate by name, position, phone, department, or room..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={candidateStatusFilter}
                onChange={(e) => setCandidateStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden focus:border-amber-500"
              >
                <option value="ALL">All Statuses ({candidates.length})</option>
                <option value="IN_INTERVIEW">In Interview</option>
                <option value="ROOM_ASSIGNED">Room Assigned</option>
                <option value="WAITING">Waiting</option>
                <option value="ARRIVED">Arrived</option>
                <option value="COMPLETED">Completed</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="OFFERED">Offered</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button
                onClick={onRefresh}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition cursor-pointer"
                title="Sync authoritative live data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Candidates Full Table */}
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                <tr>
                  <th className="p-4 font-bold">Candidate & Position</th>
                  <th className="p-4 font-bold">Live Location / Room</th>
                  <th className="p-4 font-bold">Interview Stage & Interviewer</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold">Timestamps & Workflow</th>
                  <th className="p-4 font-bold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {candidates
                  .filter((c) => {
                    if (c.isDeleted) return false;
                    if (candidateStatusFilter !== 'ALL' && c.status !== candidateStatusFilter)
                      return false;
                    if (candidateSearch.trim()) {
                      const q = candidateSearch.toLowerCase();
                      const matchName = c.fullName?.toLowerCase().includes(q);
                      const matchPos = c.position?.toLowerCase().includes(q);
                      const matchDept = c.department?.toLowerCase().includes(q);
                      const matchLoc = c.currentLocation?.toLowerCase().includes(q);
                      const matchPhone = c.phone?.toLowerCase().includes(q);
                      const matchRoom = c.assignedRoomName?.toLowerCase().includes(q);
                      if (
                        !matchName &&
                        !matchPos &&
                        !matchDept &&
                        !matchLoc &&
                        !matchPhone &&
                        !matchRoom
                      )
                        return false;
                    }
                    return true;
                  })
                  .map((cand) => {
                    const intv = interviews.find(
                      (i) =>
                        i.id === cand.currentInterviewId ||
                        (i.candidateId === cand.id && i.status !== 'INTERVIEW_COMPLETED')
                    );
                    const isLiveSession = cand.status === 'IN_INTERVIEW';

                    return (
                      <tr key={cand.id} className="hover:bg-slate-800/30 transition">
                        {/* Candidate Name & Contact */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {cand.livePhoto ? (
                              <img
                                src={cand.livePhoto}
                                alt={cand.fullName}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold shrink-0">
                                {cand.fullName?.charAt(0) || 'C'}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                                {cand.fullName}
                                {isLiveSession && (
                                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                                )}
                              </h4>
                              <p className="text-[11px] text-amber-400 font-medium">
                                {cand.position}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {cand.phone && <span>📞 {cand.phone}</span>}
                                {cand.department && <span>• {cand.department}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Live Location & Room */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              {cand.assignedRoomName || cand.currentLocation || 'Reception Area'}
                            </span>
                            {cand.assignedRoomId && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                Room ID: {cand.assignedRoomId}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Interview Stage & Interviewer */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white text-xs">
                              {intv?.roundName || cand.interviewRound || 'Direct Evaluation'}
                            </p>
                            <p className="text-[11px] text-amber-300">
                              Interviewer:{' '}
                              <strong>{intv?.interviewerName || cand.interviewerName || 'Assigned Lead'}</strong>
                            </p>
                            {intv?.scheduledTime && (
                              <p className="text-[10px] text-slate-400">
                                Time: {intv.scheduledTime}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                              cand.status === 'IN_INTERVIEW'
                                ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 animate-pulse'
                                : cand.status === 'ROOM_ASSIGNED'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                : cand.status === 'WAITING' || cand.status === 'ARRIVED'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                                : cand.status === 'COMPLETED' || cand.status === 'CHECKED_OUT' || cand.status === 'OFFERED'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                            }`}
                          >
                            {cand.status}
                          </span>
                        </td>

                        {/* Timestamps & Workflow */}
                        <td className="p-4">
                          <div className="space-y-0.5 text-[10px] text-slate-400">
                            {cand.arrivalTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>
                                  Arrived:{' '}
                                  {new Date(cand.arrivalTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            )}
                            {cand.checkOutTime && (
                              <div className="text-slate-500">
                                Departed:{' '}
                                {new Date(cand.checkOutTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                            <div className="text-slate-500 font-mono">
                              Intake: {new Date(cand.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onAssignRoom && (
                              <button
                                onClick={() => onAssignRoom(cand.id, cand.currentInterviewId)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] rounded-xl border border-slate-700 hover:border-amber-500/50 transition cursor-pointer flex items-center gap-1"
                                title="Admin / HR Room Control: Change or assign room"
                              >
                                <DoorOpen className="w-3 h-3" />
                                <span>Room</span>
                              </button>
                            )}
                            {onOpenChatWithContext && (
                              <button
                                onClick={() =>
                                  onOpenChatWithContext({
                                    candidateId: cand.id,
                                    roomId: cand.assignedRoomId,
                                    initialMessage: `Status update regarding ${cand.fullName}.`,
                                  })
                                }
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 transition cursor-pointer"
                                title="Open Context Chat for candidate"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onOpenDossier && (
                              <button
                                onClick={() => onOpenDossier(cand.id)}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                              >
                                Dossier
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 1: STAFF USERS & FULL ACCESS CREDENTIALS OVERRIDE */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Staff Accounts & Full Access Credentials Override
              </h3>
              <p className="text-xs text-slate-400">
                Admin (Sameer Sir) has full authority to change ID/username, email, password, and access permissions for any staff member.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchUsers}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
                title="Refresh staff list"
              >
                <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowNewUserModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff User</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                <tr>
                  <th className="p-4 font-bold">Staff Member</th>
                  <th className="p-4 font-bold">Username / ID</th>
                  <th className="p-4 font-bold">Email Address</th>
                  <th className="p-4 font-bold">Role & Dept</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">{u.name}</h4>
                          <span className="text-[11px] text-amber-400">{u.designation || u.role}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 text-[11px]">
                        {u.username || u.userId}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="text-slate-300 font-mono text-[11px]">{u.email}</span>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          {u.role}
                        </span>
                        <p className="text-[10px] text-slate-400">{u.department}</p>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUserForCredentials(u)}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/40 hover:to-purple-600/40 text-purple-200 border border-purple-500/40 hover:border-purple-400 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Change ID / Password</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROOM MANAGEMENT & PANTRY CLEANING REAL-TIME MONITOR */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Room & Cleaning Status Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Rooms
              </span>
              <div className="text-xl font-black text-white mt-1">{rooms.length}</div>
              <span className="text-[10px] text-slate-500">Registry Total</span>
            </div>
            <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Available / Ready
              </span>
              <div className="text-xl font-black text-emerald-300 mt-1">
                {rooms.filter((r) => r.status === 'AVAILABLE' && r.isActive !== false).length}
              </div>
              <span className="text-[10px] text-emerald-400/70">Ready for Interviews</span>
            </div>
            <div className="p-4 bg-slate-900 border border-blue-500/30 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                Assigned / In Session
              </span>
              <div className="text-xl font-black text-blue-300 mt-1">
                {rooms.filter((r) => r.status === 'ASSIGNED' || r.status === 'OCCUPIED').length}
              </div>
              <span className="text-[10px] text-blue-400/70">Candidate in Room</span>
            </div>
            <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Pantry Cleaning Active
              </span>
              <div className="text-xl font-black text-amber-300 mt-1">
                {
                  rooms.filter(
                    (r) => r.status === 'CLEANING' || r.status === 'NEEDS_CLEANING'
                  ).length
                }
              </div>
              <span className="text-[10px] text-amber-400/70">Pending Reset & Sanitize</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-amber-400" />
                Office Meeting Rooms & Real-Time Pantry Cleaning Monitor
              </h3>
              <p className="text-xs text-slate-400">
                Live monitoring of all room assignments, sanitization status, and Pantry steward reset timestamps.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchRooms();
                  onRefresh();
                }}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer flex items-center gap-1 text-xs"
                title="Refresh rooms"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
              <button
                onClick={() => {
                  setNewRoomForm({ name: '', type: 'MEETING_ROOM', preferredFor: '' });
                  setRoomError(null);
                  setShowNewRoomModal(true);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Room</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                <tr>
                  <th className="p-4 font-bold">Room Name & Occupant</th>
                  <th className="p-4 font-bold">Room Type</th>
                  <th className="p-4 font-bold text-center">Live Status</th>
                  <th className="p-4 font-bold">Pantry Cleaning Monitor</th>
                  <th className="p-4 font-bold text-center">Active</th>
                  <th className="p-4 font-bold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rooms.map((room) => {
                  const isAvail = room.status === 'AVAILABLE';
                  const isAssigned = room.status === 'ASSIGNED';
                  const isOccupied = room.status === 'OCCUPIED';
                  const isCleaning =
                    room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING';

                  return (
                    <tr key={room.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <DoorOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                              {room.name}
                              {(room.id === 'room-lalit-cabin' ||
                                room.id === 'room-kimmi-cabin' ||
                                room.name === 'Elegance Suite' ||
                                room.name === 'Lalit Sir Cabin' ||
                                room.isReservedNextRound) && (
                                <span className="px-1.5 py-0.2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-sm text-[9px] font-bold">
                                  Next Round
                                </span>
                              )}
                            </h4>
                            {room.currentCandidateName ? (
                              <span className="text-[11px] text-amber-400 font-semibold">
                                Occupant: {room.currentCandidateName}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {room.id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium text-[11px]">
                            {room.type?.replace('_', ' ')}
                          </span>
                          {room.preferredFor && (
                            <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                              {room.preferredFor}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            isAvail
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isAssigned
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : isOccupied
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : isCleaning
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isCleaning ? 'CLEANING' : room.status}
                        </span>
                      </td>

                      {/* Pantry Cleaning Status & Timestamps */}
                      <td className="p-4">
                        {isCleaning ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              <span>Cleaning Pending (Pantry Task Active)</span>
                            </div>
                            {room.cleaningRequestedAt && (
                              <p className="text-[10px] text-slate-400">
                                Requested:{' '}
                                {new Date(room.cleaningRequestedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                            <button
                              onClick={() => handleAdminCleanOverride(room.id)}
                              disabled={cleaningOverrideRoomId === room.id}
                              className="mt-1 px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded-md transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              title="Mark room cleaned immediately and make available"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                {cleaningOverrideRoomId === room.id
                                  ? 'Marking...'
                                  : 'Mark Cleaned / Ready'}
                              </span>
                            </button>
                          </div>
                        ) : room.lastCleanedAt ? (
                          <div className="space-y-0.5 text-[11px]">
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Cleaned & Ready
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {new Date(room.lastCleanedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {room.lastCleanedBy && (
                                <span className="text-slate-500"> • by {room.lastCleanedBy}</span>
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Ready / Operational</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleRoomActive(room.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition ${
                            room.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {room.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRoomForEdit(room);
                              setEditRoomForm({
                                name: room.name,
                                type: room.type || 'MEETING_ROOM',
                                preferredFor: room.preferredFor || '',
                                status: room.status || 'AVAILABLE',
                                isActive: room.isActive !== false,
                              });
                              setRoomError(null);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                            title="Edit Room Configuration"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg transition cursor-pointer"
                            title="Delete Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PASSWORD RESET QUEUE & APPROVALS */}
      {activeTab === 'resets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Staff Password Reset Requests & Token Verification Queue
              </h3>
              <p className="text-xs text-slate-400">
                Staff 'Forgot Password' recovery requests awaiting Admin approval or token verification within 30-minute TTL.
              </p>
            </div>
            <button
              onClick={fetchResets}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingResets ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {resetRequests.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Pending Password Reset Requests</h4>
              <p className="text-xs text-slate-400">
                All staff accounts are secure. When staff submit a forgot-password request, it appears here for Admin approval.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                  <tr>
                    <th className="p-4 font-bold">Requester</th>
                    <th className="p-4 font-bold">Verification Token</th>
                    <th className="p-4 font-bold">Requested At</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {resetRequests.map((req) => {
                    const isPending = req.status === 'PENDING_APPROVAL';
                    const isApproved = req.status === 'APPROVED';
                    const isUsed = req.status === 'USED';

                    return (
                      <tr key={req.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-4">
                          <div>
                            <h4 className="font-bold text-white text-xs">{req.userName}</h4>
                            <span className="text-[11px] text-slate-400 font-mono">{req.userEmail}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                                {req.userRole}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-mono text-amber-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] select-all block truncate max-w-xs">
                              {req.token}
                            </span>
                            <button
                              onClick={() => copyResetUrl(req.resetLink, req.id)}
                              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedTokenId === req.id ? 'Copied Full Link!' : 'Copy Direct URL'}</span>
                            </button>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="text-[11px] text-slate-300 space-y-0.5">
                            <p>{new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[10px] text-slate-500">{new Date(req.requestedAt).toLocaleDateString()}</p>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isPending
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                                : isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : isUsed
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                          {req.approvedByName && (
                            <p className="text-[10px] text-slate-400 mt-1">by {req.approvedByName}</p>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApproveReset(req.id)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectReset(req.id)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 text-xs rounded-xl border border-slate-700 hover:border-rose-700 transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {req.resetLink && (
                              <a
                                href={req.resetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                                title="Open Reset Link in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FIELD VISIBILITY MATRIX */}
      {activeTab === 'visibility' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                Dynamic Field-Level Visibility & Confidentiality Engine
              </h3>
              <p className="text-xs text-slate-400">
                Click any checkbox to grant or revoke field access for that role in real time.
              </p>
            </div>
            {saveSuccess && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Changes Persisted to Database
              </span>
            )}
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-300">
                <tr>
                  <th className="p-4 font-bold">Field / Information</th>
                  {rolesList.map((r) => (
                    <th key={r} className="p-4 font-bold text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                        {r}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fieldsList.map((f) => (
                  <tr key={f.key} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-semibold text-white">{f.label}</td>
                    {rolesList.map((r) => {
                      const isChecked = visibilitySettings ? visibilitySettings[r]?.[f.key] : false;
                      const isLocked = r === 'ADMIN' || r === 'CEO';

                      return (
                        <td key={r} className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked || false}
                            disabled={isLocked || savingSettings}
                            onChange={() => toggleField(r, f.key)}
                            className="w-4 h-4 rounded-md accent-amber-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: REAL-TIME ACTION ALERTS & TASKS OPERATIONS (ADMIN ACCESS) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Live Operational Action Alerts & Task Monitor ({actionTasks.length})
              </h3>
              <p className="text-xs text-slate-400">
                Full real-time visibility across Reception candidate escorts, Pantry room preparations & cleans, and staff instructions.
              </p>
            </div>

            <button
              onClick={onRefresh}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Tasks</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Role:</span>
              {(['ALL', 'RECEPTION', 'PANTRY', 'CUSTOM'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTaskRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    taskRoleFilter === r
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
              {(['ALL', 'PENDING', 'ACKNOWLEDGED', 'COMPLETED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setTaskStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    taskStatusFilter === s
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Task Cards Grid */}
          {(() => {
            const filtered = actionTasks.filter((t) => {
              if (taskRoleFilter === 'RECEPTION' && t.targetRole !== 'RECEPTION' && t.taskType !== 'ESCORT_CANDIDATE') return false;
              if (taskRoleFilter === 'PANTRY' && t.targetRole !== 'PANTRY' && t.taskType !== 'PREPARE_ROOM' && t.taskType !== 'CLEAN_ROOM') return false;
              if (taskRoleFilter === 'CUSTOM' && (t.targetRole === 'RECEPTION' || t.targetRole === 'PANTRY')) return false;

              if (taskStatusFilter !== 'ALL' && t.status !== taskStatusFilter) return false;
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No matching action tasks found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Action tasks appear in real time whenever staff send instructions like "Bring candidate to room" or "Prepare room" in chat.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filtered.map((task) => {
                  const isPending = task.status === 'PENDING';
                  const isAcknowledged = task.status === 'ACKNOWLEDGED' || task.status === 'IN_PROGRESS';
                  const isCompleted = task.status === 'COMPLETED';

                  return (
                    <div
                      key={task.id}
                      className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3 transition shadow-lg flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {task.targetRole} TASK
                            </span>
                            <span className="text-xs font-bold text-white">From: {task.senderName} ({task.senderRole})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(task.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div>
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              PENDING
                            </span>
                          )}
                          {isAcknowledged && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              ACKNOWLEDGED
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              COMPLETED
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white">{task.title}</h4>
                        <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          "{task.instruction}"
                        </p>

                        {(task.candidateName || task.destinationRoomName) && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {task.candidateName && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 font-semibold border border-slate-700">
                                👤 {task.candidateName}
                              </span>
                            )}
                            {task.destinationRoomName && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 font-semibold border border-slate-700">
                                🏢 {task.destinationRoomName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <div className="text-[10px] text-slate-400">
                          {task.acknowledgedBy && (
                            <span>Ack by <strong>{task.acknowledgedBy}</strong></span>
                          )}
                          {task.completedBy && (
                            <span className="ml-2">Done by <strong>{task.completedBy}</strong></span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isPending && onAcknowledgeActionTask && (
                            <button
                              onClick={() => onAcknowledgeActionTask(task.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                            >
                              Acknowledge
                            </button>
                          )}
                          {!isCompleted && onCompleteActionTask && (
                            <button
                              onClick={() => onCompleteActionTask(task.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 5: AUDIT LOG TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                Immutable System Audit Trail
              </h3>
              <p className="text-xs text-slate-400">
                Chronological ledger of security events, administrative credentials overrides, password changes, room allocations, and check-ins.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl max-h-[500px] overflow-y-auto space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {log.action}
                    </span>
                    <span className="font-semibold text-white">{log.actorName}</span>
                    {log.actorRole && (
                      <span className="text-[10px] text-amber-400">({log.actorRole})</span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{log.details}</p>
                </div>
                <div className="text-slate-500 text-[10px] font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })},{' '}
                  {new Date(log.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: OFFICE & WORKFLOW SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              Office Operations Workflow Rules
            </h3>
            {saveSuccess && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settings Saved
              </span>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* QR Expiry Setting */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">QR Token Expiration Window</h4>
                  <span className="text-xs font-mono text-amber-400 font-bold">{qrExpiryMinutes} mins</span>
                </div>
                <p className="text-xs text-slate-400">
                  Time-to-live for self-registration QR pass tokens before requiring front desk reissue.
                </p>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={qrExpiryMinutes}
                  onChange={(e) => setQrExpiryMinutes(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Requirement: Live Photo */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Mandatory Live Photo Capture</h4>
                  <input
                    type="checkbox"
                    checked={reqLivePhoto}
                    onChange={(e) => setReqLivePhoto(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Require candidate live webcam/phone snapshot for digital access badge creation and escort recognition.
                </p>
              </div>

              {/* Requirement: Resume Upload */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Mandatory Resume Document</h4>
                  <input
                    type="checkbox"
                    checked={reqResume}
                    onChange={(e) => setReqResume(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Require candidate to attach PDF/Doc resume before advancing past review stage.
                </p>
              </div>

              {/* Requirement: Pantry Auto-Assign */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Auto Pantry Room Prep</h4>
                  <input
                    type="checkbox"
                    checked={autoPantry}
                    onChange={(e) => setAutoPantry(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Automatically dispatch water & beverage preparation tasks to pantry stewards whenever an interview room is allocated.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveOfficeSettings}
                disabled={savingSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Operations Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ROOM (NO FLOOR, NO CAPACITY) */}
      {showNewRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowNewRoomModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Configure New Room / Pod</h3>
                <p className="text-xs text-slate-400">Office Room Registration (Single Source of Truth)</p>
              </div>
            </div>

            {roomError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{roomError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Room Name *</label>
                <input
                  type="text"
                  required
                  value={newRoomForm.name}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
                  placeholder="e.g. The Boardroom or Cabin 5"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Room Type</label>
                <select
                  value={newRoomForm.type}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, type: e.target.value as RoomType })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                >
                  <option value="MEETING_ROOM">Meeting Room</option>
                  <option value="CABIN">Executive Cabin</option>
                  <option value="EXECUTIVE_BOARDROOM">Executive Boardroom</option>
                  <option value="WAITING_AREA">Waiting Lounge</option>
                  <option value="POD">Interview Pod</option>
                  <option value="OTHER">Other Purpose</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Preferred Purpose / Allocation Note</label>
                <input
                  type="text"
                  value={newRoomForm.preferredFor}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, preferredFor: e.target.value })}
                  placeholder="e.g. Sales Panel & Leadership Interviews"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewRoomModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoom}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingRoom ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Add Room</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ROOM (NO FLOOR, NO CAPACITY) */}
      {selectedRoomForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedRoomForEdit(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Edit Room Configuration</h3>
                <p className="text-xs text-slate-400">Renaming will automatically cascade to all modules</p>
              </div>
            </div>

            {roomError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{roomError}</span>
              </div>
            )}

            <form onSubmit={handleEditRoomSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Room Name *</label>
                <input
                  type="text"
                  required
                  value={editRoomForm.name}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Room Type</label>
                  <select
                    value={editRoomForm.type}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, type: e.target.value as RoomType })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="CABIN">Executive Cabin</option>
                    <option value="EXECUTIVE_BOARDROOM">Executive Boardroom</option>
                    <option value="WAITING_AREA">Waiting Lounge</option>
                    <option value="POD">Interview Pod</option>
                    <option value="OTHER">Other Purpose</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={editRoomForm.status}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, status: e.target.value as RoomStatus })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="NEEDS_CLEANING">Needs Cleaning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Preferred Purpose</label>
                <input
                  type="text"
                  value={editRoomForm.preferredFor}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, preferredFor: e.target.value })}
                  placeholder="e.g. Sales Panel & Leadership Interviews"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editRoomActive"
                  checked={editRoomForm.isActive}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded-md accent-amber-500 cursor-pointer"
                />
                <label htmlFor="editRoomActive" className="text-slate-300 font-semibold cursor-pointer">
                  Room Active and Available for Allocation
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedRoomForEdit(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoom}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingRoom ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN CHANGE CREDENTIALS */}
      {selectedUserForCredentials && (
        <AdminChangeCredentialsModal
          targetUser={selectedUserForCredentials}
          adminUserId="usr-admin-sameer"
          adminName="Sameer Sir (Admin)"
          onClose={() => setSelectedUserForCredentials(null)}
          onSuccess={() => {
            fetchUsers();
            fetchLogs();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* MODAL: CREATE NEW STAFF USER */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowNewUserModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Provision New Staff Account</h3>
                <p className="text-xs text-slate-400">Individual Staff Account Configuration</p>
              </div>
            </div>

            {newUserError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{newUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="e.g. Vikas Sharma"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username / ID</label>
                  <input
                    type="text"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    placeholder="e.g. vikas.hr"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="name@whitecollarrealty.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="Min 5 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="HR">HR Executive</option>
                    <option value="ADMIN">Admin</option>
                    <option value="INTERVIEWER">Interviewer</option>
                    <option value="RECEPTION">Reception & Escort</option>
                    <option value="PANTRY">Pantry Steward</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserForm.department}
                    onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {creatingUser ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
