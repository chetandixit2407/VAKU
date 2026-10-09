import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Coffee,
  Sparkles,
  MapPin,
  Clock,
  User,
  Users,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type { Room, Candidate, NotificationPriority, PantryTaskCategory } from '../types/index.ts';

interface CreatePantryTaskModalProps {
  rooms: Room[];
  candidates?: Candidate[];
  currentUserName: string;
  currentUserRole: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_ITEMS = [
  '2x Bottled Mineral Water (500ml)',
  'Sanitized Glassware & Coasters',
  'Green Tea & Hot Water Kettle',
  'Espresso / Cappuccino Coffee',
  'Notepad & Executive Pens',
  'Sanitization & Table Reset',
  'Fruit & Biscuit Platter',
];

const STEWARD_TEAMS = [
  { id: 'stew-suresh', name: 'Suresh Kumar (Floor 2 Pantry Steward)', team: 'Pantry Team Alpha' },
  { id: 'stew-ramesh', name: 'Ramesh Patel (Ground Floor Pantry)', team: 'Pantry Team Beta' },
  { id: 'team-alpha', name: 'Pantry Team Alpha (Executive Wing)', team: 'Pantry Team Alpha' },
  { id: 'team-all', name: 'All Available Pantry Stewards', team: 'All Pantry Staff' },
];

export const CreatePantryTaskModal: React.FC<CreatePantryTaskModalProps> = ({
  rooms,
  candidates = [],
  currentUserName,
  currentUserRole,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<PantryTaskCategory>('HOSPITALITY');
  const [candidateName, setCandidateName] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [priority, setPriority] = useState<NotificationPriority>('HIGH');
  const [selectedSteward, setSelectedSteward] = useState<string>(STEWARD_TEAMS[0].name);
  const [dueTime, setDueTime] = useState<string>('Within 15 mins');
  const [selectedItems, setSelectedItems] = useState<string[]>([
    '2x Bottled Mineral Water (500ml)',
    'Sanitized Glassware & Coasters',
  ]);
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemQuantity, setCustomItemQuantity] = useState<string>('1');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeRooms = rooms.filter((r) => r.isActive !== false);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      setCustomLocation(room.name);
      if (room.currentCandidateName && !candidateName) {
        setCandidateName(room.currentCandidateName);
      }
    }
  };

  const togglePresetItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const addCustomItem = () => {
    if (!customItemName.trim()) return;
    const formatted = `${customItemQuantity.trim()}x ${customItemName.trim()}`;
    if (!selectedItems.includes(formatted)) {
      setSelectedItems([...selectedItems, formatted]);
    }
    setCustomItemName('');
    setCustomItemQuantity('1');
  };

  const removeSelectedItem = (item: string) => {
    setSelectedItems(selectedItems.filter((i) => i !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const room = rooms.find((r) => r.id === selectedRoomId);
    const destinationName = customLocation.trim() || room?.name || 'Executive Cabin';

    if (!instructions.trim()) {
      setError('Please provide task instructions describing what needs to be done.');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please specify at least one item or service requirement.');
      return;
    }

    const stewardObj = STEWARD_TEAMS.find((s) => s.name === selectedSteward) || STEWARD_TEAMS[0];

    setSubmitting(true);
    try {
      const res = await fetch('/api/pantry/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category,
          taskType: category === 'HOSPITALITY' ? 'WATER_BEVERAGE' : 'ROOM_PREP',
          candidateName: candidateName.trim() || undefined,
          roomId: room?.id || 'room-custom',
          roomName: destinationName,
          location: destinationName,
          instructions: instructions.trim(),
          description: instructions.trim(),
          requiredItems: selectedItems,
          itemsWithQuantities: selectedItems.map((item) => ({ item, quantity: 1 })),
          priority,
          assignedSteward: stewardObj.name,
          assignedTeam: stewardObj.team,
          dueTime: dueTime.trim() || 'Immediate',
          actorId: currentUserId,
          actorName: currentUserName,
          actorRole: currentUserRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch hospitality task.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="glass-panel-elevated rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-white/12 text-slate-100 max-h-[92vh] overflow-y-auto space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Create Pantry & Hospitality Task</h2>
              <p className="text-[11px] text-slate-400">
                Authorized dispatch &bull; Instant staff alert &bull; Real-time tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/6 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Task Category Toggle */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Task Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('HOSPITALITY')}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                  category === 'HOSPITALITY'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                    : 'glass-input text-slate-300 hover:bg-white/5 border-white/10'
                }`}
              >
                Hospitality & Beverages
              </button>
              <button
                type="button"
                onClick={() => setCategory('PANTRY')}
                className={`py-2 px-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                  category === 'PANTRY'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                    : 'glass-input text-slate-300 hover:bg-white/5 border-white/10'
                }`}
              >
                Pantry & Room Prep
              </button>
            </div>
          </div>

          {/* Candidate / Visitor Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Candidate / Visitor Name <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Harsh Vardhan"
                list="candidate-names-list"
                className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
              />
              <datalist id="candidate-names-list">
                {candidates.map((c) => (
                  <option key={c.id} value={c.fullName} />
                ))}
              </datalist>
            </div>

            {/* Room / Cabin Selection */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Room or Cabin</label>
              <select
                value={selectedRoomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
              >
                {activeRooms.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.name} ({r.status})
                  </option>
                ))}
                <option value="custom" className="bg-slate-900 text-white">
                  Other / Custom Location
                </option>
              </select>
            </div>
          </div>

          {/* Exact Destination / Location */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Exact Destination / Location <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g. Boardroom Alpha, 2nd Floor Executive Wing"
                className="w-full pl-8 pr-3 py-2.5 glass-input rounded-xl text-white text-xs"
                required
              />
            </div>
          </div>

          {/* Task Instructions */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Task Instructions <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Prepare the room and provide two bottles of mineral water before guest arrival."
              className="w-full p-2.5 glass-input rounded-xl text-white text-xs resize-none"
              required
            />
          </div>

          {/* Required Items & Quantities */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">
              Required Items & Quantities <span className="text-amber-400">*</span>
            </label>

            {/* Preset Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/8 max-h-36 overflow-y-auto">
              {PRESET_ITEMS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => togglePresetItem(item)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="truncate">{item}</span>
                </label>
              ))}
            </div>

            {/* Custom Item Adder */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={customItemQuantity}
                onChange={(e) => setCustomItemQuantity(e.target.value)}
                placeholder="Qty"
                className="w-16 p-2 glass-input rounded-xl text-white text-xs text-center"
              />
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Add custom item (e.g. Sparkling water, Cookies)"
                className="flex-1 p-2 glass-input rounded-xl text-white text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomItem}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Selected Items Tags */}
            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px]"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedItem(item)}
                      className="hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Priority & Due Time & Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
              >
                <option value="NORMAL" className="bg-slate-900 text-white">Normal</option>
                <option value="HIGH" className="bg-slate-900 text-white">High</option>
                <option value="CRITICAL" className="bg-slate-900 text-white">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Due Time</label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="e.g. Within 15 mins, 11:30 AM"
                className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assigned Staff / Team</label>
              <select
                value={selectedSteward}
                onChange={(e) => setSelectedSteward(e.target.value)}
                className="w-full p-2.5 glass-input rounded-xl text-white text-xs"
              >
                {STEWARD_TEAMS.map((s) => (
                  <option key={s.id} value={s.name} className="bg-slate-900 text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Creator Footer Info */}
          <div className="p-3 bg-white/[0.02] border border-white/6 rounded-xl flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assigned by: <strong className="text-white">{currentUserName}</strong> ({currentUserRole})</span>
            </span>
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/6 hover:bg-white/10 text-slate-300 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Coffee className="w-4 h-4" />
              <span>{submitting ? 'Dispatching...' : 'Dispatch Task Now'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
