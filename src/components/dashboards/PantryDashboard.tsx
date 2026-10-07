import React, { useState } from 'react';
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
  Plus,
  X,
  AlertCircle,
  CupSoda,
  CheckSquare,
  MessageSquare,
} from 'lucide-react';
import type { PantryTask, Room, Candidate, PantryTaskType, NotificationPriority, ActionTask } from '../../types/index.ts';

interface PantryDashboardProps {
  tasks: PantryTask[];
  rooms: Room[];
  candidates?: Candidate[];
  actionTasks?: ActionTask[];
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
  onAcknowledgeTask,
  onCompleteTask,
  onCompleteActionTask,
  onMarkRoomCleaned,
  onOpenChat,
  onRefresh,
}) => {
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const [markingRoomId, setMarkingRoomId] = useState<string | null>(null);

  // Filter real-time operational action alerts for Pantry
  const pantryActionTasks = actionTasks.filter(
    (t) => (t.targetRole === 'PANTRY' || t.taskType === 'PREPARE_ROOM' || t.taskType === 'CLEAN_ROOM') && t.status !== 'DISMISSED'
  );

  // Assign Task Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState<PantryTaskType>('WATER_BEVERAGE');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCandidateName, setTaskCandidateName] = useState('');
  const [taskPriority, setTaskPriority] = useState<NotificationPriority>('HIGH');
  const [selectedItems, setSelectedItems] = useState<string[]>([
    '2x Bottled Mineral Water',
    'Sanitized Glassware & Coasters',
  ]);
  const [customItemInput, setCustomItemInput] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Filter active rooms from Room Management (Single Source of Truth)
  const activeRooms = rooms.filter((r) => r.isActive !== false);

  // Operational rooms strictly exclude reserved Next Round cabins (Lalit Sir Cabin & Elegance Suite)
  const operationalRooms = activeRooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.roomId !== 'room-lalit-cabin' &&
      r.roomId !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );

  // Single authoritative source of truth for resolving current room names from Room records
  const resolveRoomName = (roomId?: string, fallbackName?: string, candidateId?: string): string => {
    // 1. Primary lookup by stable roomId against Room Management
    if (roomId) {
      const matched = rooms.find((r) => r.id === roomId || r.roomId === roomId);
      if (matched) return matched.name;
    }

    // 2. Candidate room assignment lookup if candidateId or candidate is found
    if (candidateId) {
      const cand = candidates.find((c) => c.id === candidateId);
      if (cand?.assignedRoomId) {
        const matched = rooms.find((r) => r.id === cand.assignedRoomId || r.roomId === cand.assignedRoomId);
        if (matched) return matched.name;
      }
    }

    // 3. Fallback name ONLY if it matches a valid current room in Room Management
    if (fallbackName && fallbackName.trim()) {
      const matchedByName = rooms.find((r) => r.name.toLowerCase() === fallbackName.trim().toLowerCase());
      if (matchedByName) return matchedByName.name;

      if (
        fallbackName.toLowerCase().includes('waiting') ||
        fallbackName.toLowerCase().includes('lobby') ||
        fallbackName.toLowerCase().includes('reception') ||
        fallbackName.toLowerCase().includes('lounge')
      ) {
        return 'Waiting Lounge';
      }
    }

    return 'Room Not Assigned';
  };

  const getTaskDescription = (task: PantryTask, resolvedRoomName: string) => {
    if (!task.description) {
      return `Hospitality preparation for ${resolvedRoomName}`;
    }
    let desc = task.description;
    if (task.roomName && task.roomName !== resolvedRoomName && desc.includes(task.roomName)) {
      desc = desc.split(task.roomName).join(resolvedRoomName);
    }
    const legacyDemoNames = ['Boardroom Alpha', 'Meeting Room 1', 'Meeting Room 2', 'Interview Pod A', 'Interview Pod B'];
    legacyDemoNames.forEach((demo) => {
      if (desc.includes(demo)) {
        desc = desc.split(demo).join(resolvedRoomName);
      }
    });
    return desc;
  };

  // When room is selected in Assign Task modal, auto-detect candidate occupant if any
  const handleRoomSelectChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = rooms.find((r) => r.id === roomId || r.roomId === roomId);
    if (room && room.currentCandidateName) {
      setTaskCandidateName(room.currentCandidateName);
    } else if (room && room.currentCandidateId) {
      const cand = candidates.find((c) => c.id === room.currentCandidateId);
      if (cand) {
        setTaskCandidateName(cand.fullName);
      }
    }
  };

  const handleToggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleAddCustomItem = () => {
    if (!customItemInput.trim()) return;
    if (!selectedItems.includes(customItemInput.trim())) {
      setSelectedItems([...selectedItems, customItemInput.trim()]);
    }
    setCustomItemInput('');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      setAssignError('Please select a room from Room Management');
      return;
    }

    setSubmittingTask(true);
    setAssignError(null);

    const room = rooms.find((r) => r.id === selectedRoomId || r.roomId === selectedRoomId);
    const generatedDesc =
      taskDescription.trim() ||
      (selectedTaskType === 'WATER_BEVERAGE'
        ? `Serve beverages and water in ${room?.name || 'room'}`
        : selectedTaskType === 'ROOM_RESET'
        ? `Sanitize and reset ${room?.name || 'room'} for next session`
        : `Prepare hospitality setup in ${room?.name || 'room'}`);

    try {
      const res = await fetch('/api/pantry/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId: selectedRoomId,
          taskType: selectedTaskType,
          description: generatedDesc,
          requiredItems: selectedItems,
          candidateName: taskCandidateName.trim() || undefined,
          priority: taskPriority,
          actorName: 'Suresh Kumar (Pantry)',
          actorRole: 'PANTRY',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create pantry task');
      }

      // Reset modal state
      setShowAssignModal(false);
      setSelectedRoomId('');
      setTaskDescription('');
      setTaskCandidateName('');
      setTaskPriority('HIGH');
      setSelectedItems(['2x Bottled Mineral Water', 'Sanitized Glassware & Coasters']);
      onRefresh();
    } catch (err: any) {
      setAssignError(err.message || 'Failed to create pantry task');
    } finally {
      setSubmittingTask(false);
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
          body: JSON.stringify({ stewardName: 'Suresh Kumar (Pantry)' }),
        });
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to mark room cleaned', err);
    } finally {
      setMarkingRoomId(null);
    }
  };

  // Get active candidates currently assigned to rooms for hospitality
  const roomAssignedCandidates = candidates.filter(
    (c) =>
      !c.isDeleted &&
      c.status !== 'CHECKED_OUT' &&
      c.status !== 'REJECTED' &&
      (c.status === 'ROOM_ASSIGNED' || c.status === 'IN_INTERVIEW' || c.assignedRoomId)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Steward Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-300" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Pantry & Hospitality Operations
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged-in steward: <strong className="text-amber-400">Suresh Kumar</strong> • Central Hospitality Station
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAssignError(null);
              if (activeRooms.length > 0 && !selectedRoomId) {
                setSelectedRoomId(activeRooms[0].id);
              }
              setShowAssignModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Task</span>
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            {pendingTasks.length} Active Tasks
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            {completedTasks.length} Done Today
          </span>
        </div>
      </div>

      {/* Strict Information Rule Alert */}
      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Confidentiality Enforced:</strong> Pantry display strictly contains{' '}
            <strong className="text-amber-400">WHAT, WHERE, and WHEN</strong>. Candidate resumes, contact details, and compensation remarks are suppressed.
          </span>
        </div>
      </div>

      {/* 🚨 PROMINENT REAL-TIME ACTION ALERTS & ROOM SERVICE TASKS */}
      {pantryActionTasks.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border-2 border-amber-500/60 rounded-3xl space-y-3 shadow-2xl shadow-amber-500/10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-amber-500/30">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
              <div>
                <h2 className="text-sm font-black text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Immediate Pantry Action Alerts ({pantryActionTasks.length})</span>
                </h2>
                <p className="text-[11px] text-slate-300">
                  Room preparation, beverage service & cleaning requests synchronized in real time from Staff Chat.
                </p>
              </div>
            </div>

            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Pantry Chat</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-1">
            {pantryActionTasks.map((task) => {
              const isPending = task.status === 'PENDING';
              const isAcknowledged = task.status === 'ACKNOWLEDGED' || task.status === 'IN_PROGRESS';
              const isCompleted = task.status === 'COMPLETED';
              const resolvedRoom = task.destinationRoomName || task.roomName || 'Meeting Room';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition shadow-lg relative flex flex-col justify-between ${
                    isPending
                      ? 'bg-slate-900/95 border-amber-400 ring-2 ring-amber-500/30'
                      : isAcknowledged
                      ? 'bg-slate-900/95 border-sky-400/80 ring-1 ring-sky-500/30'
                      : 'bg-slate-900/80 border-emerald-500/40 opacity-80'
                  }`}
                >
                  {/* Top Header: Sender, Time & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs border border-amber-500/30 shrink-0">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>Requested by: {task.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-amber-400 border border-slate-700">
                            {task.senderRole}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          ACTION REQUIRED
                        </span>
                      )}
                      {isAcknowledged && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-sky-400" />
                          IN PROGRESS
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          COMPLETED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-white">
                        Room: <strong className="text-cyan-300 font-mono">{resolvedRoom}</strong>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Required Action
                      </span>
                      <p className="text-xs text-amber-300 font-semibold leading-relaxed">
                        {task.instruction || task.title || 'Prepare room for meeting'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => onAcknowledgeTask && onAcknowledgeTask(task.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ACKNOWLEDGE</span>
                        </button>
                      )}

                      {!isCompleted && (
                        <button
                          onClick={() => {
                            if (onCompleteActionTask) {
                              onCompleteActionTask(task.id);
                            } else if (onAcknowledgeTask) {
                              onAcknowledgeTask(task.id);
                            }
                            if (task.roomId && onMarkRoomCleaned) {
                              onMarkRoomCleaned(task.roomId);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MARK COMPLETED</span>
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Serviced at {task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Preparation & Reset Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                Hospitality Tasks Queue ({pendingTasks.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAssignError(null);
                    if (activeRooms.length > 0 && !selectedRoomId) {
                      setSelectedRoomId(activeRooms[0].id);
                    }
                    setShowAssignModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Task</span>
                </button>
                <button
                  onClick={onRefresh}
                  className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer p-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="p-10 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">All rooms prepped & serviced</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Hospitality tasks are generated dynamically when HR assigns candidates to rooms, or you can manually assign a task using the "Assign Task" button.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => {
                  const resolvedName = resolveRoomName(task.roomId, task.roomName, task.candidateId);
                  const displayDesc = getTaskDescription(task, resolvedName);

                  return (
                    <div
                      key={task.id}
                      className="p-5 bg-slate-900 border-2 border-amber-500/50 hover:border-amber-400 rounded-2xl shadow-xl space-y-3.5 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            {task.taskType === 'ROOM_RESET' ? (
                              <RefreshCw className="w-5 h-5" />
                            ) : task.taskType === 'WATER_BEVERAGE' ? (
                              <CupSoda className="w-5 h-5" />
                            ) : (
                              <Droplet className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                                {task.taskType === 'ROOM_RESET'
                                  ? 'Sanitization Reset'
                                  : task.taskType === 'WATER_BEVERAGE'
                                  ? 'Beverage Delivery'
                                  : 'Hospitality Setup'}
                              </span>
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-white">{resolvedName}</h3>
                            {task.candidateName && (
                              <p className="text-xs text-slate-300 font-medium">
                                For: <strong className="text-amber-400">{task.candidateName}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                          Pending Action
                        </span>
                      </div>

                      <p className="text-xs text-slate-200">{displayDesc}</p>

                      {/* Checklist of required items */}
                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Required Hospitality Checklist:
                        </span>
                        <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                          {task.requiredItems?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Complete Action Button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => onCompleteTask(task.id)}
                          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {task.taskType === 'ROOM_RESET'
                              ? 'Mark Cleaned & Ready (Make Available)'
                              : 'Confirm Ready & Mark Completed'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real-time Candidate Room Allocation Live Status */}
          {roomAssignedCandidates.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Active Candidates In Assigned Rooms ({roomAssignedCandidates.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roomAssignedCandidates.map((cand) => {
                  // Single source of truth room lookup
                  const assignedRoom = rooms.find(
                    (r) =>
                      r.currentCandidateId === cand.id ||
                      (cand.assignedRoomId && (r.id === cand.assignedRoomId || r.roomId === cand.assignedRoomId))
                  );

                  const displayRoomName = assignedRoom
                    ? assignedRoom.name
                    : resolveRoomName(cand.assignedRoomId, cand.currentLocation);

                  return (
                    <div
                      key={cand.id}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-white">{cand.fullName}</h4>
                        <span className="text-[10px] text-slate-400">{cand.position}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Assigned Room:</span>
                        <span className="font-bold text-amber-400 text-xs flex items-center gap-1 justify-end">
                          <DoorOpen className="w-3.5 h-3.5" />
                          {displayRoomName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Office Rooms Live Status Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-amber-400" />
            Office Meeting Rooms & Pods
          </h2>

          <div className="space-y-2">
            {operationalRooms.map((room) => {
              const isAvailable = room.status === 'AVAILABLE';
              const isAssigned = room.status === 'ASSIGNED';
              const isOccupied = room.status === 'OCCUPIED';
              const isCleaning = room.status === 'CLEANING' || room.status === 'NEEDS_CLEANING';

              return (
                <div
                  key={room.id}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white">{room.name}</h4>
                    {room.currentCandidateName ? (
                      <p className="text-[11px] text-amber-400 font-semibold">
                        Occupant: {room.currentCandidateName}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {room.type?.replace('_', ' ') || 'Room'}
                      </p>
                    )}
                    {room.lastCleanedAt && !isCleaning && (
                      <p className="text-[9px] text-slate-500">
                        Cleaned: {new Date(room.lastCleanedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isAssigned
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : isCleaning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : isOccupied
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isCleaning ? 'Cleaning / Reset' : room.status}
                    </span>
                    {isCleaning && (
                      <button
                        onClick={() => handleMarkCleaned(room.id)}
                        disabled={markingRoomId === room.id}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Mark room cleaned and make it available"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{markingRoomId === room.id ? 'Marking...' : 'Ready'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completed History Today */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Completed Hospitality Logs ({completedTasks.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {completedTasks.map((t) => {
                  const resolvedName = resolveRoomName(t.roomId, t.roomName, t.candidateId);
                  return (
                    <div
                      key={t.id}
                      className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px] text-slate-400"
                    >
                      <span className="font-medium text-slate-300">{resolvedName}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ASSIGN TASK MODAL (DYNAMIC ROOM MANAGEMENT SOURCE OF TRUTH) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Pantry → Assign Task</h3>
                  <p className="text-xs text-slate-400">
                    Direct dynamic room sync from Room Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Room Selection Dropdown (Single Source of Truth) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Room (From Room Management) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedRoomId}
                    onChange={(e) => handleRoomSelectChange(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-amber-400 focus:outline-none appearance-none cursor-pointer"
                  >
                    {activeRooms.length === 0 ? (
                      <option value="">No rooms configured in Room Management</option>
                    ) : (
                      activeRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.currentCandidateName ? `(Occupied: ${r.currentCandidateName})` : `(${r.status})`}
                        </option>
                      ))
                    )}
                  </select>
                  <DoorOpen className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rooms are retrieved dynamically from centralized Room Management.
                </p>
              </div>

              {/* Task Type */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Hospitality Task Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'WATER_BEVERAGE' as PantryTaskType, label: 'Water & Tea', icon: CupSoda },
                    { type: 'ROOM_PREP' as PantryTaskType, label: 'Room Setup', icon: Droplet },
                    { type: 'ROOM_RESET' as PantryTaskType, label: 'Reset & Clean', icon: RefreshCw },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = selectedTaskType === t.type;
                    return (
                      <button
                        type="button"
                        key={t.type}
                        onClick={() => setSelectedTaskType(t.type)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Candidate Name / Occupant (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Candidate / Occupant Name (Optional)
                </label>
                <input
                  type="text"
                  value={taskCandidateName}
                  onChange={(e) => setTaskCandidateName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Checklist Items */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Checklist Items
                </label>
                <div className="space-y-2 mb-2">
                  {[
                    '2x Bottled Mineral Water',
                    'Sanitized Glassware & Coasters',
                    'Hot Coffee / Masala Tea Service',
                    'Fresh Whiteboard Marker & Duster',
                    'Stationery & Notepad Set',
                  ].map((item) => {
                    const isChecked = selectedItems.includes(item);
                    return (
                      <label
                        key={item}
                        onClick={() => handleToggleItem(item)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-amber-400 rounded cursor-pointer"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Add Custom Item */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customItemInput}
                    onChange={(e) => setCustomItemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomItem();
                      }
                    }}
                    placeholder="Add custom hospitality item..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Additional Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Task Note / Special Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="e.g. VIP guest, serve immediately"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['NORMAL', 'HIGH', 'CRITICAL'] as NotificationPriority[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setTaskPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                        taskPriority === p
                          ? p === 'CRITICAL'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                            : 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask || activeRooms.length === 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingTask ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Coffee className="w-4 h-4" />
                  )}
                  <span>Dispatch Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
