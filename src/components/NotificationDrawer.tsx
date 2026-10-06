import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Role-Based Alert Feed</h3>
                <p className="text-[11px] text-slate-400">
                  Filtered for role: <strong className="text-amber-400">{role}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
                <p className="text-[11px] text-slate-600">
                  When automated office events occur, role-filtered alerts appear here in real-time.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isHigh = notif.priority === 'HIGH' || notif.priority === 'CRITICAL';
                const candidateId = notif.entityId || notif.payload?.candidateId;
                return (
                  <div
                    key={notif.id}
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
                        ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                        : isHigh
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/20 text-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-100'
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
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
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
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
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
                          className="text-[10px] text-slate-400 hover:text-white transition"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 text-center">
            <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Event-driven notifications • Persisted authoritatively in database
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
