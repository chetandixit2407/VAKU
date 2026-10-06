import React from 'react';
import {
  Bell,
  QrCode,
  UserCheck,
  Building,
  Shield,
  Coffee,
  Users,
  Award,
  ChevronDown,
  Sparkles,
  Wifi,
  WifiOff,
  LogOut,
  User as UserIcon,
  MessageSquare,
} from 'lucide-react';
import type { UserRole, User } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  unreadCount: number;
  unreadChatCount?: number;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
  onOpenQRPasses: () => void;
  onOpenCheckIn: () => void;
  onOpenWalkIn: () => void;
  isRealtimeConnected: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  unreadCount,
  unreadChatCount = 0,
  onOpenNotifications,
  onOpenChat,
  onOpenQRPasses,
  onOpenCheckIn,
  onOpenWalkIn,
  isRealtimeConnected,
  currentUser,
  onLogout,
}) => {
  const allRoles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'HR', label: 'HR Lead', icon: Users, color: 'text-amber-400' },
    { role: 'SENIOR_HR', label: 'Senior HR', icon: Award, color: 'text-amber-300' },
    { role: 'ADMIN', label: 'Admin Ops', icon: Shield, color: 'text-purple-400' },
    { role: 'CEO', label: 'CEO Suite', icon: Award, color: 'text-emerald-400' },
    { role: 'INTERVIEWER', label: 'Interviewer', icon: UserCheck, color: 'text-blue-400' },
    { role: 'RECEPTION', label: 'Front Desk', icon: Building, color: 'text-cyan-400' },
    { role: 'PANTRY', label: 'Pantry Steward', icon: Coffee, color: 'text-amber-300' },
  ];

  // Only Admin, CEO, and CO_FOUNDER have multi-view capability
  const canSwitchViews =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'CEO' ||
    currentUser.role === 'CO_FOUNDER';

  const visibleRoles = canSwitchViews
    ? allRoles
    : allRoles.filter((r) => r.role === currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-amber-500/10">
              WCR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm tracking-tight">
                  White Collar Realty
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-sm bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  Ops PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">
                Fully Automated Office & Candidate Management
              </p>
            </div>
          </div>

          {/* Real-time Indicator */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isRealtimeConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
            title={isRealtimeConnected ? 'Live Server-Sent Events Connected' : 'Connecting to Realtime stream'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{isRealtimeConnected ? 'Live Real-Time' : 'Reconnecting'}</span>
          </div>
        </div>

        {/* Role View Switcher */}
        {visibleRoles.length > 1 && (
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1 overflow-x-auto max-w-full">
            {visibleRoles.map(({ role, label, icon: Icon, color }) => {
              const active = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => onSelectRole(role)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-slate-950' : color}`} />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{role}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Action Controls, User Info, & Notifications */}
        <div className="flex items-center gap-2">
          {/* Quick Intake buttons */}
          <button
            onClick={onOpenCheckIn}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-semibold text-xs transition cursor-pointer"
            title="Candidate Arrival Self Check-In Form"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Candidate Check-In</span>
          </button>

          <button
            onClick={onOpenQRPasses}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
            title="WCR QR Codes & Passes"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">QR Station</span>
          </button>

          {/* Internal Office Chat */}
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
            title="Internal Office Chat"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline text-xs font-semibold">Office Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Alert Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">{currentUser.name}</span>
                <span className="text-[10px] font-mono text-amber-400">{currentUser.role}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                title="Sign out of staff console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
