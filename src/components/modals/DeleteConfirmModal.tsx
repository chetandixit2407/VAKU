import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { authenticatedFetch } from '../../utils/apiClient.ts';

export type DeleteRecordType =
  | 'VISITOR'
  | 'CANDIDATE'
  | 'INTERVIEW'
  | 'ROOM'
  | 'ACTION_TASK'
  | 'NOTIFICATION'
  | 'USER';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  recordType: DeleteRecordType;
  recordId: string;
  recordName: string;
  metadata?: Record<string, any>;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  recordType,
  recordId,
  recordName,
  metadata = {},
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Dependency evaluation to prevent accidental deletion of critical or linked records
  let dependencyBlockMessage: string | null = null;
  if (recordType === 'ROOM') {
    if (metadata.status === 'OCCUPIED' || metadata.status === 'ASSIGNED') {
      dependencyBlockMessage = `This room ("${recordName}") is currently marked as ${metadata.status}. A candidate or interview session is actively using it. Please relocate or complete the session before deleting.`;
    }
  } else if (recordType === 'CANDIDATE') {
    if (metadata.status === 'IN_INTERVIEW' || metadata.status === 'ROOM_ASSIGNED') {
      dependencyBlockMessage = `This candidate ("${recordName}") is currently in an active interview session. Please conclude the interview before archiving or deleting the record.`;
    }
  } else if (recordType === 'INTERVIEW') {
    if (metadata.status === 'IN_PROGRESS') {
      dependencyBlockMessage = `This interview session is currently in progress. Please finish the session or submit feedback before removing it.`;
    }
  } else if (recordType === 'USER') {
    if (metadata.role === 'CEO' || recordId === 'usr-ceo-lalit') {
      dependencyBlockMessage = 'Executive Leadership (CEO) account cannot be deleted from the operations console.';
    }
  }

  const handleDelete = async () => {
    if (dependencyBlockMessage) return;

    setLoading(true);
    setError(null);

    let endpoint = '';
    switch (recordType) {
      case 'VISITOR':
        endpoint = `/api/visitors/${recordId}`;
        break;
      case 'CANDIDATE':
        endpoint = `/api/candidates/${recordId}`;
        break;
      case 'INTERVIEW':
        endpoint = `/api/interviews/${recordId}`;
        break;
      case 'ROOM':
        endpoint = `/api/rooms/${recordId}`;
        break;
      case 'ACTION_TASK':
        endpoint = `/api/action-tasks/${recordId}`;
        break;
      case 'NOTIFICATION':
        endpoint = `/api/notifications/${recordId}`;
        break;
      case 'USER':
        endpoint = `/api/users/${recordId}`;
        break;
      default:
        setError('Unsupported record type.');
        setLoading(false);
        return;
    }

    try {
      const res = await authenticatedFetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to delete record. Please check dependencies.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while deleting.');
      setLoading(false);
    }
  };

  const getReadableTypeName = () => {
    switch (recordType) {
      case 'VISITOR':
        return 'Visitor Log';
      case 'CANDIDATE':
        return 'Candidate Profile';
      case 'INTERVIEW':
        return 'Interview Record';
      case 'ROOM':
        return 'Facility Room';
      case 'ACTION_TASK':
        return 'Hospitality / Action Task';
      case 'NOTIFICATION':
        return 'Alert Notification';
      case 'USER':
        return 'Staff Profile';
      default:
        return 'Record';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[#0F141C] border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Confirm Deletion
              </h3>
              <p className="text-xs text-rose-400/90 font-mono">
                Permanent {getReadableTypeName()} Action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/6 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-3.5 bg-rose-950/30 border border-rose-500/20 rounded-2xl text-xs space-y-2">
          <p className="text-slate-200">
            Are you sure you want to delete <strong className="text-white font-bold">"{recordName}"</strong>?
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            This action will update the operations database and remove associated schedule references.
          </p>
        </div>

        {/* Dependency Warning */}
        {dependencyBlockMessage && (
          <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300 block">Deletion Blocked: Active Dependency</span>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">{dependencyBlockMessage}</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/8">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white/6 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || !!dependencyBlockMessage}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
