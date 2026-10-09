import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Coffee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  User,
  Users,
  ShieldCheck,
  RefreshCw,
  Plus,
  Ban,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import type { PantryTask, PantryTaskStatus } from '../types/index.ts';

interface PantryRealtimeMonitorModalProps {
  tasks: PantryTask[];
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  onClose: () => void;
  onOpenCreateTask: () => void;
  onRefresh: () => void;
}

export const PantryRealtimeMonitorModal: React.FC<PantryRealtimeMonitorModalProps> = ({
  tasks,
  currentUserId,
  currentUserRole,
  currentUserName,
  onClose,
  onOpenCreateTask,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [cancelModalTask, setCancelModalTask] = useState<PantryTask | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return t.status === 'PENDING' || t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS';
    if (filterStatus === 'COMPLETED') return t.status === 'COMPLETED';
    if (filterStatus === 'ISSUE') return t.status === 'ISSUE_REPORTED';
    if (filterStatus === 'CANCELLED') return t.status === 'CANCELLED';
    return true;
  });

  const handleVerify = async (taskId: string) => {
    setActionLoadingId(taskId);
    try {
      const res = await fetch(`/api/pantry/tasks/${encodeURIComponent(taskId)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verifierName: currentUserName, verifierRole: currentUserRole }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to verify task', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalTask) return;
    setActionLoadingId(cancelModalTask.id);
    try {
      const res = await fetch(`/api/pantry/tasks/${encodeURIComponent(cancelModalTask.id)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cancelledByName: currentUserName,
          reason: cancelReason.trim() || 'Cancelled by requester',
        }),
      });
      if (res.ok) {
        setCancelModalTask(null);
        setCancelReason('');
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to cancel task', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (task: PantryTask) => {
    switch (task.status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
            Accepted
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono animate-pulse">
            In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {task.isVerifiedCompleted ? 'Verified Complete' : 'Staff-Reported Complete'}
          </span>
        );
      case 'ISSUE_REPORTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Issue Reported
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/40 text-slate-400 border border-slate-600 font-mono">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const isAuthorisedToManage =
    currentUserRole === 'ADMIN' ||
    currentUserRole === 'CEO' ||
    currentUserRole === 'HR' ||
    currentUserRole === 'SENIOR_HR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="glass-panel-elevated rounded-3xl max-w-4xl w-full shadow-2xl border border-white/12 text-slate-100 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Pantry & Hospitality Real-Time Progress Monitor
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live SSE sync active" />
              </div>
              <p className="text-[11px] text-slate-400">
                Authoritative multi-stage tracking &bull; Zero-refresh live stream &bull; Completion verification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateTask}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-white/6 hover:bg-white/10 text-slate-300 transition cursor-pointer"
              title="Sync latest"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/6 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 bg-black/30 border-b border-white/6 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'ACTIVE', 'COMPLETED', 'ISSUE', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Total Tracked: {filteredTasks.length}
          </span>
        </div>

        {/* Task Cards List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/6 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No tasks matching filter</h3>
              <p className="text-xs text-slate-400">Create a new Pantry or Hospitality task anytime.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const isCreatorOrAdmin =
                isAuthorisedToManage ||
                task.createdById === currentUserId ||
                task.createdByName === currentUserName;

              return (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0B0B0D] border border-white/10 shadow-lg space-y-3 transition hover:border-white/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs">
                        {task.category === 'PANTRY' ? 'P' : 'H'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{task.roomName}</h4>
                          <span className="text-xs text-amber-400 font-mono">({task.location || task.roomName})</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Guest/Candidate: <strong className="text-white">{task.candidateName || 'Not specified'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300 font-mono">
                        Due: {task.dueTime || 'Normal'}
                      </span>
                    </div>
                  </div>

                  {/* Task Instructions */}
                  <p className="text-xs text-slate-200 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/6">
                    {task.instructions || task.description}
                  </p>

                  {/* Required Items */}
                  {task.requiredItems && task.requiredItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Items:</span>
                      {task.requiredItems.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300"
                        >
                          {it}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timeline Timestamps Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/6 text-[10px] font-mono text-slate-400">
                    <div>
                      <span className="block text-slate-500">Created:</span>
                      <strong className="text-slate-300">
                        {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Assigned To:</span>
                      <strong className="text-amber-300 truncate block">
                        {task.assignedSteward || 'Pantry Team'}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Started:</span>
                      <strong className="text-slate-300">
                        {task.startedAt
                          ? new Date(task.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending'}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Completed:</span>
                      <strong className="text-emerald-300">
                        {task.completedAt
                          ? `${new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${task.timeTakenFormatted || 'Done'})`
                          : 'In queue'}
                      </strong>
                    </div>
                  </div>

                  {/* Issue Reason Banner if reported */}
                  {task.status === 'ISSUE_REPORTED' && task.issueReason && (
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span><strong>Issue Reported:</strong> {task.issueReason}</span>
                    </div>
                  )}

                  {/* Footer Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/6">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      Created by <strong className="text-slate-200">{task.createdByName}</strong> ({task.createdByRole})
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Expand Audit Trail */}
                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Audit Log</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {/* Verify Completion Button */}
                      {task.status === 'COMPLETED' && !task.isVerifiedCompleted && isCreatorOrAdmin && (
                        <button
                          onClick={() => handleVerify(task.id)}
                          disabled={actionLoadingId === task.id}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify Completion</span>
                        </button>
                      )}

                      {/* Cancel Task Button */}
                      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && isCreatorOrAdmin && (
                        <button
                          onClick={() => setCancelModalTask(task)}
                          className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Audit Trail History */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 border-t border-white/6 space-y-1.5 text-[11px] overflow-hidden"
                      >
                        <h5 className="font-bold text-xs text-slate-300 font-mono">Status Audit Trail</h5>
                        {task.auditTrail && task.auditTrail.length > 0 ? (
                          <div className="space-y-1 pl-2 border-l border-white/10">
                            {task.auditTrail.map((entry, aIdx) => (
                              <div key={aIdx} className="text-slate-400 flex items-start gap-2">
                                <span className="font-mono text-[10px] text-slate-500">
                                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div>
                                  <strong className="text-white">{entry.status}:</strong>{' '}
                                  <span className="text-slate-300">{entry.note || 'Status updated'}</span>{' '}
                                  <span className="text-slate-500">by {entry.actorName} ({entry.actorRole})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-[10px]">No historical entries recorded.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Cancellation Submodal */}
        {cancelModalTask && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-slate-100">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-400" />
                <span>Cancel Task: {cancelModalTask.roomName}</span>
              </h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to cancel this hospitality task?
              </p>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Reason for Cancellation</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Candidate rescheduled, meeting cancelled"
                  className="w-full p-2 glass-input rounded-xl text-white text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCancelModalTask(null)}
                  className="px-3 py-1.5 bg-white/6 hover:bg-white/10 text-slate-300 rounded-xl text-xs"
                >
                  Keep Task
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
