import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  User,
  DoorOpen,
  Coffee,
} from 'lucide-react';
import type { Notification, UserRole } from '../types/index.ts';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  role: UserRole;
  onActionClick: (actionKey: string, payload?: any) => void;
  onMarkRead: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  role,
  onActionClick,
  onMarkRead,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-screen max-w-md glass-panel-elevated border-l border-white/10 shadow-2xl flex flex-col text-slate-100 pointer-events-auto backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/8 flex items-center justify-between bg-black/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Role-Based Alert Feed</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Filtered for: <strong className="text-amber-400">{role}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/6 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List of Notifications */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">No alerts for this role right now.</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      When automated office events occur, role-filtered alerts appear here in real-time.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isHigh = notif.priority === 'HIGH' || notif.priority === 'CRITICAL';
                    const candidateId = notif.entityId || notif.payload?.candidateId;
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          if (candidateId) {
                            onActionClick('VIEW_CANDIDATE', { candidateId });
                            onMarkRead(notif.id);
                            onClose();
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition text-xs space-y-2 relative ${
                          candidateId ? 'cursor-pointer hover:border-amber-500/60' : ''
                        } ${
                          notif.read
                            ? 'bg-black/20 border-white/5 text-slate-300'
                            : isHigh
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-lg ring-1 ring-amber-500/20 text-slate-100'
                            : 'bg-white/4 border-white/8 text-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                notif.read
                                  ? 'bg-slate-600'
                                  : isHigh
                                  ? 'bg-amber-400 animate-ping'
                                  : 'bg-blue-400'
                              }`}
                            />
                            <h4 className="font-bold text-white text-xs">{notif.title}</h4>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed">{notif.message}</p>

                        {/* Role Filtered Payload Info */}
                        {notif.payload && (
                          <div className="p-2 rounded-xl bg-black/40 border border-white/6 text-[10px] text-slate-400 space-y-1">
                            {notif.payload.candidateName && (
                              <div className="flex justify-between">
                                <span>Candidate:</span>
                                <strong className="text-slate-200">{notif.payload.candidateName}</strong>
                              </div>
                            )}
                            {notif.payload.room && (
                              <div className="flex justify-between">
                                <span>Room:</span>
                                <strong className="text-amber-400">{notif.payload.room}</strong>
                              </div>
                            )}
                            {notif.payload.required && (
                              <div className="flex justify-between">
                                <span>Required:</span>
                                <strong className="text-emerald-400">{notif.payload.required}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/6">
                          <div className="flex gap-1.5">
                            {notif.actionButtons?.map((btn, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  onActionClick(btn.actionKey, btn.payload);
                                  onMarkRead(notif.id);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shadow-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <span>{btn.label}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            ))}
                          </div>

                          {!notif.read && (
                            <button
                              onClick={() => onMarkRead(notif.id)}
                              className="text-[10px] text-slate-400 hover:text-white transition cursor-pointer"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/8 bg-black/30 text-center">
                <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Real-time SSE event alerts • Persistent
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
