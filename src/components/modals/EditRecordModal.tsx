import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Edit3,
  X,
  Check,
  AlertCircle,
  Loader2,
  Building2,
  User,
  Calendar,
  DoorOpen,
  ClipboardList,
  Bell,
  Shield,
} from 'lucide-react';
import { authenticatedFetch } from '../../utils/apiClient.ts';
import type { DeleteRecordType } from './DeleteConfirmModal.tsx';

interface EditRecordModalProps {
  isOpen: boolean;
  recordType: DeleteRecordType;
  record: any;
  onClose: () => void;
  onSuccess: (updatedRecord?: any) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  recordType,
  record,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
      setError(null);
    }
  }, [record, recordType, isOpen]);

  if (!isOpen || !record) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    if (recordType === 'VISITOR') {
      if (!formData.fullName || !formData.fullName.trim()) {
        setError('Visitor full name is required.');
        return false;
      }
      if (!formData.phone || !formData.phone.trim()) {
        setError('Visitor phone number is required.');
        return false;
      }
    } else if (recordType === 'CANDIDATE') {
      if (!formData.fullName || !formData.fullName.trim()) {
        setError('Candidate full name is required.');
        return false;
      }
      if (!formData.phone || !formData.phone.trim()) {
        setError('Candidate contact phone is required.');
        return false;
      }
      if (!formData.position || !formData.position.trim()) {
        setError('Candidate position is required.');
        return false;
      }
    } else if (recordType === 'INTERVIEW') {
      if (!formData.interviewerName || !formData.interviewerName.trim()) {
        setError('Interviewer name is required.');
        return false;
      }
      if (!formData.roundName || !formData.roundName.trim()) {
        setError('Interview round name is required.');
        return false;
      }
    } else if (recordType === 'ROOM') {
      if (!formData.name || !formData.name.trim()) {
        setError('Room name is required.');
        return false;
      }
    } else if (recordType === 'ACTION_TASK') {
      if (!formData.title || !formData.title.trim()) {
        setError('Task title is required.');
        return false;
      }
    } else if (recordType === 'NOTIFICATION') {
      if (!formData.title || !formData.title.trim()) {
        setError('Notification title is required.');
        return false;
      }
      if (!formData.message || !formData.message.trim()) {
        setError('Notification message body is required.');
        return false;
      }
    } else if (recordType === 'USER') {
      if (!formData.name || !formData.name.trim()) {
        setError('Staff name is required.');
        return false;
      }
      if (!formData.email || !formData.email.trim()) {
        setError('Staff corporate email is required.');
        return false;
      }
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    let endpoint = '';
    const id = record.id;

    switch (recordType) {
      case 'VISITOR':
        endpoint = `/api/visitors/${id}`;
        break;
      case 'CANDIDATE':
        endpoint = `/api/candidates/${id}`;
        break;
      case 'INTERVIEW':
        endpoint = `/api/interviews/${id}`;
        break;
      case 'ROOM':
        endpoint = `/api/rooms/${id}`;
        break;
      case 'ACTION_TASK':
        endpoint = `/api/action-tasks/${id}`;
        break;
      case 'NOTIFICATION':
        endpoint = `/api/notifications/${id}`;
        break;
      case 'USER':
        endpoint = `/api/users/${id}`;
        break;
      default:
        setError('Unsupported record edit.');
        setLoading(false);
        return;
    }

    try {
      const res = await authenticatedFetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to save changes to the database.');
      }

      onSuccess(data.visitor || data.candidate || data.interview || data.room || data.task || data.notification || data.user || formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving record.');
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (recordType) {
      case 'VISITOR':
        return 'Edit Visitor Record';
      case 'CANDIDATE':
        return 'Edit Candidate Information';
      case 'INTERVIEW':
        return 'Edit Interview Schedule';
      case 'ROOM':
        return 'Edit Room Configuration';
      case 'ACTION_TASK':
        return 'Edit Hospitality / Action Task';
      case 'NOTIFICATION':
        return 'Edit System Alert Notification';
      case 'USER':
        return 'Edit Staff Profile';
      default:
        return 'Edit Record';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-[#0F141C] border border-white/12 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{getTitle()}</h3>
              <p className="text-[11px] text-slate-400 font-mono">ID: {record.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/6 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* VISITOR FIELDS */}
          {recordType === 'VISITOR' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Visitor Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Host Staff Name</label>
                  <input
                    type="text"
                    value={formData.hostName || ''}
                    onChange={(e) => handleChange('hostName', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Host Department</label>
                  <input
                    type="text"
                    value={formData.hostDepartment || ''}
                    onChange={(e) => handleChange('hostDepartment', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Purpose of Visit</label>
                  <input
                    type="text"
                    value={formData.purpose || ''}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status || 'CHECKED_IN'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="CHECKED_IN">Checked-In (Lobby)</option>
                    <option value="MEETING">In Meeting Room</option>
                    <option value="CHECKED_OUT">Checked-Out</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* CANDIDATE FIELDS */}
          {recordType === 'CANDIDATE' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Position *</label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => handleChange('position', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status || 'ARRIVED'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="ARRIVED">Arrived</option>
                    <option value="WAITING">Waiting in Reception</option>
                    <option value="IN_INTERVIEW">In Interview</option>
                    <option value="With Kimmi Mam – Senior HR Interview">With Kimmi Mam – Senior HR Interview</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="OFFERED">Offered</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Room</label>
                  <input
                    type="text"
                    value={formData.assignedRoomName || ''}
                    onChange={(e) => handleChange('assignedRoomName', e.target.value)}
                    placeholder="e.g. Elegance Suite"
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Interviewer</label>
                  <input
                    type="text"
                    value={formData.assignedInterviewerName || ''}
                    onChange={(e) => handleChange('assignedInterviewerName', e.target.value)}
                    placeholder="e.g. Nisha Verma / Shriyanshi"
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Experience</label>
                  <input
                    type="text"
                    value={formData.totalExperience || ''}
                    onChange={(e) => handleChange('totalExperience', e.target.value)}
                    placeholder="e.g. 4 Years"
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* INTERVIEW FIELDS */}
          {recordType === 'INTERVIEW' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={formData.candidateName || ''}
                    disabled
                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 text-xs cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Interviewer Name *</label>
                  <input
                    type="text"
                    value={formData.interviewerName || ''}
                    onChange={(e) => handleChange('interviewerName', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Interview Round *</label>
                  <input
                    type="text"
                    value={formData.roundName || ''}
                    onChange={(e) => handleChange('roundName', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    value={formData.scheduledTime || ''}
                    onChange={(e) => handleChange('scheduledTime', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Interview Room</label>
                  <input
                    type="text"
                    value={formData.roomName || ''}
                    onChange={(e) => handleChange('roomName', e.target.value)}
                    placeholder="e.g. Elegance Suite"
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status || 'SCHEDULED'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Interviewer Feedback / Notes</label>
                <textarea
                  value={formData.interviewerFeedback || ''}
                  onChange={(e) => handleChange('interviewerFeedback', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </>
          )}

          {/* ROOM FIELDS */}
          {recordType === 'ROOM' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Type</label>
                  <select
                    value={formData.type || 'INTERVIEW_ROOM'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="INTERVIEW_ROOM">Interview Room</option>
                    <option value="EXECUTIVE_CABIN">Executive Cabin</option>
                    <option value="BOARDROOM">Boardroom</option>
                    <option value="DISCUSSION_POD">Discussion Pod</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity (Persons)</label>
                  <input
                    type="number"
                    value={formData.capacity || 4}
                    onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status || 'AVAILABLE'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="NEEDS_CLEANING">Needs Cleaning</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ACTION TASK FIELDS */}
          {recordType === 'ACTION_TASK' && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Instruction / Details</label>
                <textarea
                  value={formData.instruction || ''}
                  onChange={(e) => handleChange('instruction', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={formData.priority || 'NORMAL'}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status || 'PENDING'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ACKNOWLEDGED">Acknowledged</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* NOTIFICATION FIELDS */}
          {recordType === 'NOTIFICATION' && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notification Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Message Body *</label>
                <textarea
                  value={formData.message || ''}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={formData.priority || 'NORMAL'}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Recipient Role</label>
                  <select
                    value={formData.recipientRole || 'HR'}
                    onChange={(e) => handleChange('recipientRole', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="HR">HR</option>
                    <option value="SENIOR_HR">Senior HR</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CEO">CEO</option>
                    <option value="RECEPTION">Reception</option>
                    <option value="INTERVIEWER">Interviewer</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* USER FIELDS */}
          {recordType === 'USER' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Staff Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation || ''}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-[#07090C] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/8">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white/6 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
