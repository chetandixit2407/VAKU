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
  Plus,
  X,
  AlertCircle,
  CupSoda,
  CheckSquare,
  MessageSquare,
  Check,
} from 'lucide-react';
import type {
  PantryTask,
  Room,
  Candidate,
  PantryTaskType,
  NotificationPriority,
  ActionTask,
} from '../../types/index.ts';

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
    (t) =>
      (t.targetRole === 'PANTRY' || t.taskType === 'PREPARE_ROOM' || t.taskType === 'CLEAN_ROOM') &&
      t.status !== 'DISMISSED'
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

  const activeRooms = rooms.filter((r) => r.isActive !== false);

  const operationalRooms = activeRooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );

  const resolveRoomName = (roomId?: string, fallbackName?: string, candidateId?: string): string => {
    if (roomId) {
      const matched = rooms.find((r) => r.id === roomId || r.roomId === roomId);
      if (matched) return matched.name;
    }

    if (candidateId) {
      const cand = candidates.find((c) => c.id === candidateId);
      if (cand?.assignedRoomId) {
        const matched = rooms.find((r) => r.id === cand.assignedRoomId || r.roomId === cand.assignedRoomId);
        if (matched) return matched.name;
      }
    }

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

  const getTaskDescription = (task: PantryTask, resolvedRoomName: string): string => {
    let desc = task.description || '';
    const legacyDemoNames = ['Boardroom Alpha', 'Executive Pod 1', 'Conference Room B', 'Interview Room A'];
    legacyDemoNames.forEach((demo) => {
      if (desc.includes(demo)) {
        desc = desc.split(demo).join(resolvedRoomName);
      }
    });
    return desc;
  };

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
        ? `Serve beverages and mineral water in ${room?.name || 'room'}`
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

  const roomAssignedCandidates = candidates.filter(
    (c) =>
      !c.isDeleted &&
      c.status !== 'CHECKED_OUT' &&
      c.status !== 'REJECTED' &&
      (c.status === 'ROOM_ASSIGNED' || c.status === 'IN_INTERVIEW' || c.assignedRoomId)
  );

  return (
    <div className="space-y-6">
      {/* Hospitality Header */}
      <div className="p-6 card-dark bg-[#0B0B0D] text-white rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Hospitality & Pantry Operations Desk
            </h1>
          </div>
          <p className="text-xs text-[#E0E0E0] mt-1">
            Dynamic room preparation, mineral water & beverage service, sanitization reset queue.
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
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Hospitality Task</span>
          </button>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="px-3 py-2 bg-white/6 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl border border-white/8 transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Office Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Realtime Action Tasks Queue */}
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
            <span className="text-[10px] text-[#BDBDBD]">Live request channel</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pantryActionTasks.map((task) => {
              const isPending = task.status === 'PENDING';
              const resolvedRoom = resolveRoomName(task.destinationRoomId || task.roomId, task.destinationRoomName);

              return (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.99 }}
                  className="p-4 dashboard-card card-dark bg-[#0B0B0D] rounded-2xl border border-amber-400/60 flex flex-col justify-between space-y-3 shadow-xl hover:shadow-2xl hover:shadow-amber-500/15"
                >
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                    <span className="font-bold text-white truncate">{task.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 font-mono">
                      {task.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] text-[#BDBDBD]">Target Room:</span>
                    <strong className="text-amber-400 block font-mono text-sm">{resolvedRoom}</strong>
                    <p className="text-xs text-[#E0E0E0] mt-1">{task.instruction || 'Serve refreshments'}</p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-end gap-2">
                    {isPending && onAcknowledgeTask && (
                      <button
                        onClick={() => onAcknowledgeTask(task.id)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (onCompleteActionTask) onCompleteActionTask(task.id);
                        if (task.roomId && onMarkRoomCleaned) onMarkRoomCleaned(task.roomId);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Mark Completed</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main Hospitality Task Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Task Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-black/10">
            <h2 className="text-base font-bold text-[#111318] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Hospitality Task Queue ({pendingTasks.length})</span>
            </h2>
            <button
              onClick={onRefresh}
              className="text-xs text-[#252A32] hover:text-[#111318] flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="p-12 text-center card-dark bg-[#0B0B0D] rounded-3xl space-y-2 border border-white/10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">All meeting cabins prepped & sanitized</h3>
              <p className="text-xs text-[#E0E0E0] max-w-sm mx-auto leading-relaxed">
                Hospitality tasks generate automatically when HR assigns candidates to cabins.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pendingTasks.map((task) => {
                const resolvedName = resolveRoomName(task.roomId, task.roomName, task.candidateId);
                const displayDesc = getTaskDescription(task, resolvedName);

                return (
                  <motion.div
                    key={task.id}
                    whileHover={{ scale: 1.02, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                    whileTap={{ scale: 0.99 }}
                    className="p-5 rounded-2xl space-y-3.5 transition shadow-xl card-dark bg-[#0B0B0D] text-white border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          {task.taskType === 'ROOM_RESET' ? (
                            <RefreshCw className="w-5 h-5" />
                          ) : task.taskType === 'WATER_BEVERAGE' ? (
                            <CupSoda className="w-5 h-5" />
                          ) : (
                            <Coffee className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-amber-400">
                              {task.taskType === 'ROOM_RESET'
                                ? 'Sanitization Reset'
                                : task.taskType === 'WATER_BEVERAGE'
                                ? 'Beverage Delivery'
                                : 'Hospitality Setup'}
                            </span>
                            <span className="text-[#BDBDBD]">&bull;</span>
                            <span className="text-[11px] font-mono text-[#E0E0E0]">
                              {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold tracking-tight text-white">{resolvedName}</h3>
                          {task.candidateName && (
                            <p className="text-xs font-medium text-[#E0E0E0]">
                              For: <strong className="text-amber-400">{task.candidateName}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono animate-pulse bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Pending Action
                      </span>
                    </div>

                    <p className="text-xs text-[#E0E0E0]">{displayDesc}</p>

                    {/* Checklist of required items */}
                    <div className="p-3 card-inner inner-box bg-[#25272B] border border-white/10 text-[#E0E0E0] rounded-xl space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider block font-mono text-[#BDBDBD]">
                        Hospitality Checklist:
                      </span>
                      <ul className="space-y-1 pl-4 list-disc text-[11px]">
                        {task.requiredItems?.map((item, i) => (
                          <li key={i}>{item}</li>
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
                            ? 'Mark Cleaned & Available'
                            : 'Confirm Ready & Mark Completed'}
                        </span>
                      </button>
                    </div>
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
            <p className="text-xs text-[#252A32] mt-0.5">Real-time room occupancy and cleanliness.</p>
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

          {/* Completed History Today */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-white/8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Completed Serviced Logs ({completedTasks.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {completedTasks.map((t) => {
                  const resolvedName = resolveRoomName(t.roomId, t.roomName, t.candidateId);
                  return (
                    <div
                      key={t.id}
                      className="p-2.5 glass-panel-subtle rounded-xl flex items-center justify-between text-[11px] text-slate-400 border border-white/6"
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

      {/* ASSIGN TASK MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-white/12 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Hospitality Task</h3>
                  <p className="text-xs text-slate-400">
                    Assign beverage or sanitization prep for meetings
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-full bg-white/6 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {assignError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Cabin / Room</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => handleRoomSelectChange(e.target.value)}
                  className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
                  required
                >
                  <option value="" disabled className="bg-slate-900">Choose meeting room...</option>
                  {operationalRooms.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.name} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskType('WATER_BEVERAGE')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      selectedTaskType === 'WATER_BEVERAGE'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'glass-input hover:bg-white/5'
                    }`}
                  >
                    Water & Beverage
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTaskType('ROOM_RESET')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      selectedTaskType === 'ROOM_RESET'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'glass-input hover:bg-white/5'
                    }`}
                  >
                    Sanitization
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTaskType('CLEANING')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      selectedTaskType === 'CLEANING'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'glass-input hover:bg-white/5'
                    }`}
                  >
                    Cabin Prep
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Candidate / Guest Name</label>
                <input
                  type="text"
                  value={taskCandidateName}
                  onChange={(e) => setTaskCandidateName(e.target.value)}
                  placeholder="e.g. Amit Trivedi (Optional)"
                  className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Items Checklist</label>
                <div className="space-y-1.5 p-3 glass-panel-subtle rounded-xl border border-white/6">
                  {['2x Bottled Mineral Water', 'Sanitized Glassware & Coasters', 'Premium Green Tea / Coffee', 'Notebook & Executive Pen'].map(
                    (item) => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item)}
                          onChange={() => handleToggleItem(item)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                        />
                        <span>{item}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-white/6 hover:bg-white/10 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                >
                  {submittingTask ? 'Creating...' : 'Dispatch Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
