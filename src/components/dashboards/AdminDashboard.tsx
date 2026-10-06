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
} from 'lucide-react';
import type {
  AuditLog,
  RoleFieldVisibility,
  UserRole,
  PasswordResetRequest,
  Room,
  RoomType,
  RoomStatus,
} from '../../types/index.ts';
import { AdminChangeCredentialsModal } from '../AdminChangeCredentialsModal.tsx';

interface AdminDashboardProps {
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'rooms' | 'resets' | 'visibility' | 'audit' | 'settings'>('users');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Operations & Security Administration
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full Access Credentials Manager (Sameer Sir), Room Configuration, Password Reset Approvals, and Central Audit Trail.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
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
            <span>Meeting Rooms ({rooms.length})</span>
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

      {/* TAB 2: ROOM MANAGEMENT (CLEAN SINGLE DATA SOURCE - NO FLOOR, NO CAPACITY) */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-amber-400" />
                Office Meeting Rooms & Interview Pods Management
              </h3>
              <p className="text-xs text-slate-400">
                Single centralized room registry used across Room Allocation, Interview Scheduling, Reception, and Pantry hospitality.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchRooms}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
                title="Refresh rooms"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRooms ? 'animate-spin' : ''}`} />
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
                  <th className="p-4 font-bold">Room Name</th>
                  <th className="p-4 font-bold">Room Type</th>
                  <th className="p-4 font-bold">Preferred Purpose</th>
                  <th className="p-4 font-bold text-center">Live Status</th>
                  <th className="p-4 font-bold text-center">Active</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rooms.map((room) => {
                  const isAvail = room.status === 'AVAILABLE';
                  const isAssigned = room.status === 'ASSIGNED';
                  const isOccupied = room.status === 'OCCUPIED';

                  return (
                    <tr key={room.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <DoorOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs">{room.name}</h4>
                            {room.currentCandidateName ? (
                              <span className="text-[11px] text-amber-400 font-semibold">
                                Occupant: {room.currentCandidateName}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">ID: {room.id}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium text-[11px]">
                          {room.type?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-4 text-slate-300">
                        <span className="text-[11px]">{room.preferredFor || 'Interviews & Meetings'}</span>
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAvail
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isAssigned
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : isOccupied
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {room.status}
                        </span>
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
