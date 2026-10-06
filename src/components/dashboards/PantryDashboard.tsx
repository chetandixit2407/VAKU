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
} from 'lucide-react';
import type { PantryTask, Room, Candidate, PantryTaskType, NotificationPriority } from '../../types/index.ts';

interface PantryDashboardProps {
  tasks: PantryTask[];
  rooms: Room[];
  candidates?: Candidate[];
  onCompleteTask: (taskId: string) => void;
  onRefresh: () => void;
}

export const PantryDashboard: React.FC<PantryDashboardProps> = ({
  tasks,
  rooms,
  candidates = [],
  onCompleteTask,
  onRefresh,
}) => {
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

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
                          <span>Confirm Ready & Mark Completed</span>
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
            {rooms.map((room) => {
              const isAvailable = room.status === 'AVAILABLE';
              const isAssigned = room.status === 'ASSIGNED';
              const isOccupied = room.status === 'OCCUPIED';

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
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isAssigned
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : isOccupied
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {room.status}
                  </span>
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
