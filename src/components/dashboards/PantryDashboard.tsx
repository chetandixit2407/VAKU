import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee,
  CheckCircle2,
  Clock,
  Sparkles,
  DoorOpen,
  RefreshCw,
  Droplet,
  ShieldCheck,
  Users,
  MapPin,
  AlertCircle,
  AlertTriangle,
  CupSoda,
  CheckSquare,
  MessageSquare,
  Check,
  Play,
  CheckCircle,
  X,
} from 'lucide-react';
import type {
  PantryTask,
  Room,
  Candidate,
  PantryTaskStatus,
  ActionTask,
} from '../../types/index.ts';

interface PantryDashboardProps {
  tasks: PantryTask[];
  rooms: Room[];
  candidates?: Candidate[];
  actionTasks?: ActionTask[];
  currentStewardName?: string;
  onAcknowledgeTask?: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onCompleteActionTask?: (taskId: string) => void;
  onMarkRoomCleaned?: (roomId: string) => void;
  onOpenChat?: () => void;
  onRefresh: () => void;
}

export const PantryDashboard: React.FC<PantryDashboardProps> = ({
  tasks,
  rooms,
  candidates = [],
  actionTasks = [],
  currentStewardName = 'Suresh Kumar (Floor 2 Pantry)',
  onAcknowledgeTask,
  onCompleteTask,
  onCompleteActionTask,
  onMarkRoomCleaned,
  onOpenChat,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');
  const [markingRoomId, setMarkingRoomId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Issue reporting modal state
  const [issueModalTaskId, setIssueModalTaskId] = useState<string | null>(null);
  const [issueReason, setIssueReason] = useState<string>('');
  const [submittingIssue, setSubmittingIssue] = useState<boolean>(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Filter real-time operational action alerts for Pantry
  const pantryActionTasks = actionTasks.filter(
    (t) =>
      (t.targetRole === 'PANTRY' || t.taskType === 'PREPARE_ROOM' || t.taskType === 'CLEAN_ROOM') &&
      t.status !== 'DISMISSED'
  );

  const pendingTasks = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS' || t.status === 'ISSUE_REPORTED'
  );
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  const visibleTasks = activeTab === 'PENDING'
    ? pendingTasks
    : activeTab === 'COMPLETED'
    ? completedTasks
    : tasks;

  const activeRooms = rooms.filter((r) => r.isActive !== false);
  const operationalRooms = activeRooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );

  const resolveRoomName = (roomId?: string, fallbackName?: string): string => {
    if (roomId) {
      const matched = rooms.find((r) => r.id === roomId || r.roomId === roomId);
      if (matched) return matched.name;
    }
    if (fallbackName && fallbackName.trim()) return fallbackName;
    return 'Assigned Cabin';
  };

  const handleAcceptTask = async (taskId: string) => {
    setActionLoadingId(taskId);
    try {
      const res = await fetch(`/api/pantry/tasks/${encodeURIComponent(taskId)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stewardName: currentStewardName }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to accept task', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartTask = async (taskId: string) => {
    setActionLoadingId(taskId);
    try {
      const res = await fetch(`/api/pantry/tasks/${encodeURIComponent(taskId)}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stewardName: currentStewardName }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to start task', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReportIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalTaskId || !issueReason.trim()) return;

    setSubmittingIssue(true);
    setIssueError(null);
    try {
      const res = await fetch(`/api/pantry/tasks/${encodeURIComponent(issueModalTaskId)}/report-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: issueReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to report issue');
      }

      setIssueModalTaskId(null);
      setIssueReason('');
      onRefresh();
    } catch (err: any) {
      setIssueError(err.message || 'Failed to report issue');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleMarkCleaned = async (roomId: string) => {
    setMarkingRoomId(roomId);
    try {
      if (onMarkRoomCleaned) {
        await onMarkRoomCleaned(roomId);
      } else {
        await fetch(`/api/pantry/rooms/${roomId}/cleaned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stewardName: currentStewardName }),
        });
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to mark room cleaned', err);
    } finally {
      setMarkingRoomId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hospitality Header (Task-Only View, No Create/Edit/Delete buttons) */}
      <div className="p-6 card-dark bg-[#0B0B0D] text-white rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shadow-md">
              <Coffee className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Hospitality & Pantry Task Execution Desk
            </h1>
          </div>
          <p className="text-xs text-[#E0E0E0] mt-1">
            Dedicated task-only view for Pantry stewards &bull; Accept, start, complete, and report issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="px-3.5 py-2 bg-white/6 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl border border-white/8 transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Office Chat</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="p-2 bg-white/6 hover:bg-white/10 text-slate-300 rounded-xl transition cursor-pointer"
            title="Sync Tasks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Realtime Urgent Action Tasks Alerts */}
      {pantryActionTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 card-dark bg-[#0B0B0D] rounded-3xl space-y-3 border border-amber-500/40 shadow-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-xs font-black text-amber-300 tracking-wide uppercase flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Urgent Service Requests ({pantryActionTasks.length})</span>
            </h2>
            <span className="text-[10px] text-[#BDBDBD]">Real-time request channel</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-1">
            {pantryActionTasks.map((task) => {
              const isPending = task.status === 'PENDING';
              const resolvedRoom = resolveRoomName(task.destinationRoomId || task.roomId, task.destinationRoomName);

              return (
                <div
                  key={task.id}
                  className="p-5 sm:p-6 dashboard-card card-dark bg-[#0B0B0D] rounded-2xl border border-amber-400/60 flex flex-col justify-between space-y-3.5 shadow-xl"
                >
                  <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/10">
                    <span className="font-bold text-sm sm:text-base text-white truncate">{task.title}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                      {task.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <span className="text-xs text-[#BDBDBD] font-mono">Target Room:</span>
                    <strong className="text-amber-400 block font-mono text-base font-bold">{resolvedRoom}</strong>
                    <p className="text-xs sm:text-sm text-[#E0E0E0] mt-1 leading-relaxed">{task.instruction || 'Serve refreshments'}</p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-end gap-2.5">
                    {isPending && onAcknowledgeTask && (
                      <button
                        onClick={() => onAcknowledgeTask(task.id)}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-[13px] rounded-xl transition cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (onCompleteActionTask) onCompleteActionTask(task.id);
                        if (task.roomId && onMarkRoomCleaned) onMarkRoomCleaned(task.roomId);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-[13px] rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Mark Completed</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main Task List & Room Status View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dedicated Pantry Tasks View */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs Filter */}
          <div className="flex items-center justify-between pb-1 border-b border-black/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab('PENDING')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'PENDING'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  Assigned / Active ({pendingTasks.length})
                </button>
                <button
                  onClick={() => setActiveTab('COMPLETED')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'COMPLETED'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  Completed ({completedTasks.length})
                </button>
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  All Tasks ({tasks.length})
                </button>
              </div>
            </div>

            <button
              onClick={onRefresh}
              className="text-xs text-[#252A32] hover:text-[#111318] flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="p-12 text-center card-dark bg-[#0B0B0D] rounded-3xl space-y-2 border border-white/10 shadow-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No tasks in this queue</h3>
              <p className="text-xs text-[#E0E0E0] max-w-sm mx-auto leading-relaxed">
                Hospitality and room preparation requests assigned to your team will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleTasks.map((task) => {
                const isPending = task.status === 'PENDING';
                const isAccepted = task.status === 'ACCEPTED';
                const isInProgress = task.status === 'IN_PROGRESS';
                const isCompleted = task.status === 'COMPLETED';
                const isIssueReported = task.status === 'ISSUE_REPORTED';

                return (
                  <motion.div
                    key={task.id}
                    whileHover={{ scale: 1.01, y: -2, transition: { duration: 0.2, ease: 'easeOut' } }}
                    className="p-5 rounded-2xl space-y-3.5 shadow-xl card-dark bg-[#0B0B0D] text-white border border-white/10"
                  >
                    {/* Top Row: Room, Candidate, and Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          {task.taskType === 'ROOM_RESET' ? (
                            <Droplet className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <Coffee className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white tracking-tight">
                              {task.roomName}
                            </h3>
                            <span className="text-[11px] font-mono text-amber-400">
                              ({task.category || 'Hospitality'})
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#E0E0E0] mt-0.5">
                            <span>
                              Candidate / Visitor: <strong className="text-white">{task.candidateName || 'Guest'}</strong>
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              <span>{task.location || task.roomName}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status and Priority Badges */}
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono animate-pulse bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Pending Acceptance
                            </span>
                          )}
                          {isAccepted && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              Accepted
                            </span>
                          )}
                          {isInProgress && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono animate-pulse bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              In Progress
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              Completed
                            </span>
                          )}
                          {isIssueReported && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              Issue Reported
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#AEB7C4]">
                          Due: <strong className="text-amber-300">{task.dueTime || 'Immediate'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* What task must be performed */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#BDBDBD] font-mono block">
                        Task Instructions:
                      </span>
                      <p className="text-xs text-white leading-relaxed bg-[#141820] p-3 rounded-xl border border-white/8">
                        {task.instructions || task.description}
                      </p>
                    </div>

                    {/* Where to go & Required Items & Quantities */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Destination */}
                      <div className="p-3 card-inner bg-[#25272B] border border-white/10 text-[#E0E0E0] rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider block font-mono text-[#BDBDBD]">
                          Where To Go:
                        </span>
                        <p className="font-semibold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{task.location || task.roomName}</span>
                        </p>
                      </div>

                      {/* Required Items & Quantities */}
                      <div className="p-3 card-inner bg-[#25272B] border border-white/10 text-[#E0E0E0] rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider block font-mono text-[#BDBDBD]">
                          Required Items & Quantities:
                        </span>
                        <ul className="space-y-0.5 list-disc pl-4 text-[11px] text-slate-200">
                          {task.requiredItems && task.requiredItems.length > 0 ? (
                            task.requiredItems.map((item, i) => <li key={i}>{item}</li>)
                          ) : (
                            <li>Mineral water setup</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Assignment & Creator Details */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-[#AEB7C4]">
                      <span>
                        Assigned by: <strong className="text-white">{task.createdByName}</strong> ({task.createdByRole}) &bull;{' '}
                        {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {task.completedAt && (
                        <span className="text-emerald-400 font-mono">
                          Completed: {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                          ({task.timeTakenFormatted || 'Done'})
                        </span>
                      )}
                    </div>

                    {/* Issue Banner if reported */}
                    {isIssueReported && task.issueReason && (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span><strong>Reported Issue:</strong> {task.issueReason}</span>
                      </div>
                    )}

                    {/* Action Buttons for Pantry Staff */}
                    {!isCompleted && (
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-white/10">
                        {/* Report Issue Button */}
                        <button
                          onClick={() => {
                            setIssueModalTaskId(task.id);
                            setIssueReason('');
                            setIssueError(null);
                          }}
                          className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Report Issue</span>
                        </button>

                        {/* Accept Task Button (if PENDING) */}
                        {isPending && (
                          <button
                            onClick={() => handleAcceptTask(task.id)}
                            disabled={actionLoadingId === task.id}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Accept Task</span>
                          </button>
                        )}

                        {/* Start Task Button (if ACCEPTED) */}
                        {isAccepted && (
                          <button
                            onClick={() => handleStartTask(task.id)}
                            disabled={actionLoadingId === task.id}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Service</span>
                          </button>
                        )}

                        {/* Mark Completed Button */}
                        <button
                          onClick={() => onCompleteTask(task.id)}
                          disabled={actionLoadingId === task.id}
                          className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Completed</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Live Rooms Status Grid */}
        <div className="space-y-4">
          <div className="pb-1 border-b border-black/10">
            <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-amber-500" />
              Office Cabins & Pods
            </h2>
            <p className="text-xs text-[#252A32] mt-0.5">Real-time room occupancy and cleanliness status.</p>
          </div>

          <div className="space-y-2.5">
            {operationalRooms.map((room) => {
              const isAvailable = room.status === 'AVAILABLE';
              const isAssigned = room.status === 'ASSIGNED';
              const isOccupied = room.status === 'OCCUPIED';
              const isCleaning = room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING';

              return (
                <div
                  key={room.id}
                  className="p-3.5 rounded-2xl flex items-center justify-between text-xs transition shadow-md card-dark bg-[#0B0B0D] border border-white/10 text-white"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white">{room.name}</h4>
                    {room.currentCandidateName ? (
                      <p className="text-[11px] font-semibold truncate max-w-[140px] text-amber-400">
                        Occupant: {room.currentCandidateName}
                      </p>
                    ) : (
                      <p className="text-[10px] uppercase tracking-wider text-[#E0E0E0]">
                        {room.type?.replace('_', ' ') || 'Room'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                        isAvailable
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isAssigned
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : isCleaning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : isOccupied
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isCleaning ? 'Cleaning' : room.status}
                    </span>
                    {isCleaning && (
                      <button
                        onClick={() => handleMarkCleaned(room.id)}
                        disabled={markingRoomId === room.id}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{markingRoomId === room.id ? '...' : 'Ready'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Serviced Logs */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-white/8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Completed Serviced Logs ({completedTasks.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {completedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 glass-panel-subtle rounded-xl flex items-center justify-between text-[11px] text-slate-400 border border-white/6"
                  >
                    <div>
                      <span className="font-medium text-slate-300 block">{t.roomName}</span>
                      <span className="text-[10px] text-slate-500">{t.timeTakenFormatted || 'Done'}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REPORT ISSUE MODAL */}
      {issueModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Report Task Issue</span>
              </h3>
              <button
                onClick={() => setIssueModalTaskId(null)}
                className="w-7 h-7 rounded-full bg-white/6 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {issueError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {issueError}
              </div>
            )}

            <form onSubmit={handleReportIssueSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-300">
                Please specify why this task cannot be fulfilled immediately so the supervisor can intervene:
              </p>
              <textarea
                rows={3}
                value={issueReason}
                onChange={(e) => setIssueReason(e.target.value)}
                placeholder="e.g. Mineral water bottles out of stock in Pantry, Cabin currently locked, Occupant requested delay..."
                className="w-full p-2.5 glass-input rounded-xl text-white text-xs resize-none"
                required
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIssueModalTaskId(null)}
                  className="px-4 py-2 bg-white/6 hover:bg-white/10 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow disabled:opacity-50"
                >
                  {submittingIssue ? 'Reporting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
