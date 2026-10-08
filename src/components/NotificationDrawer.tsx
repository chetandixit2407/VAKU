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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F6] border-l border-[#EFE0CC] shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col text-[#171717] animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-[#EFE0CC] flex items-center justify-between bg-white/95">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center text-[#8C6033] shadow-xs">
                <Bell className="w-4 h-4 text-[#C99A68]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#171717]">Role-Based Alert Feed</h3>
                <p className="text-[11px] text-[#77716B]">
                  Filtered for role: <strong className="text-[#8C6033]">{role}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#77716B] hover:text-[#171717] hover:bg-[#F3EFE9] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF4ED] border border-[#E4CCAF] flex items-center justify-center mx-auto text-[#C99A68]">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs text-[#171717] font-semibold">No alerts for this role right now.</p>
                <p className="text-[11px] text-[#77716B] max-w-xs mx-auto">
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
                    className={`p-4 rounded-2xl border transition-all duration-300 text-xs space-y-2 relative shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${
                      candidateId ? 'cursor-pointer hover:border-[#C99A68] hover:shadow-md' : ''
                    } ${
                      notif.read
                        ? 'bg-white/70 border-[#EFE0CC] text-[#77716B]'
                        : 'bg-white border-[#E4CCAF] text-[#171717]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Critical notification uses a small red indicator only, standard uses caramel/green */}
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            notif.read
                              ? 'bg-[#8A847D]/50'
                              : isHigh
                              ? 'bg-rose-500 animate-pulse'
                              : 'bg-[#C99A68]'
                          }`}
                        />
                        <h4 className="font-bold text-[#171717] text-xs leading-snug">{notif.title}</h4>
                      </div>
                      <span className="text-[10px] text-[#8A847D] font-mono shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#77716B] leading-relaxed">{notif.message}</p>

                    {/* Role Filtered Payload Info */}
                    {notif.payload && (
                      <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EFE0CC] text-[10px] text-[#77716B] space-y-1">
                        {notif.payload.candidateName && (
                          <div className="flex justify-between">
                            <span>Candidate:</span>
                            <strong className="text-[#171717]">{notif.payload.candidateName}</strong>
                          </div>
                        )}
                        {notif.payload.room && (
                          <div className="flex justify-between">
                            <span>Room:</span>
                            <strong className="text-[#8C6033]">{notif.payload.room}</strong>
                          </div>
                        )}
                        {notif.payload.required && (
                          <div className="flex justify-between">
                            <span>Required:</span>
                            <strong className="text-emerald-700">{notif.payload.required}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action button if actionable */}
                    <div className="flex items-center justify-between pt-1">
                      {candidateId && (
                        <span className="text-[10px] font-bold text-[#8C6033] hover:text-[#171717] flex items-center gap-1">
                          View Dossier <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(notif.id);
                          }}
                          className="text-[10px] text-[#8A847D] hover:text-[#171717] underline ml-auto cursor-pointer"
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
        </div>
      </div>
    </div>
  );
};
