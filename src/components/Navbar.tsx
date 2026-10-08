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
  Search,
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
  onOpenSearch?: () => void;
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
  onOpenSearch,
}) => {
  const allRoles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'HR', label: 'HR Lead', icon: Users, color: 'text-[#e8c89b]' },
    { role: 'SENIOR_HR', label: 'Senior HR', icon: Award, color: 'text-amber-300' },
    { role: 'ADMIN', label: 'Admin Ops', icon: Shield, color: 'text-purple-300' },
    { role: 'CEO', label: 'CEO Suite', icon: Award, color: 'text-emerald-300' },
    { role: 'INTERVIEWER', label: 'Interviewer', icon: UserCheck, color: 'text-sky-300' },
    { role: 'RECEPTION', label: 'Front Desk', icon: Building, color: 'text-cyan-300' },
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
    <header className="sticky top-0 z-40 bg-white/92 backdrop-blur-2xl border-b border-[#EFE0CC] px-4 sm:px-6 py-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] text-[#171717] transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#171717] text-[#D6B28A] flex items-center justify-center font-black text-sm shadow-md border border-[#2D2D2D]">
              WCR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#171717] text-sm tracking-tight">
                  White Collar Realty
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#FAF4ED] border border-[#E4CCAF] text-[10px] font-black text-[#8C6033] uppercase tracking-widest">
                  COMMAND CENTER
                </span>
              </div>
              <p className="text-[10px] text-[#77716B] font-medium hidden md:block">
                Operations & Candidate Intake Architecture
              </p>
            </div>
          </div>

          {/* Real-time Indicator */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isRealtimeConnected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
            title={isRealtimeConnected ? 'Live Server-Sent Events Connected' : 'Connecting to Realtime stream'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{isRealtimeConnected ? 'LIVE SYNC' : 'RECONNECTING'}</span>
          </div>
        </div>

        {/* Role View Switcher */}
        {visibleRoles.length > 1 && (
          <div className="flex items-center bg-[#FAF9F6] border border-[#EFE0CC] rounded-2xl p-1 gap-1 overflow-x-auto max-w-full">
            {visibleRoles.map(({ role, label, icon: Icon, color }) => {
              const active = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => onSelectRole(role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#FAF4ED] text-[#171717] font-extrabold shadow-xs border border-[#E4CCAF]'
                      : 'text-[#77716B] hover:text-[#171717] hover:bg-[#F3EFE9]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#8C6033]' : 'text-[#8A847D]'}`} />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{role}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Action Controls, User Info, & Notifications */}
        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#EFE0CC] text-[#171717] text-xs font-semibold transition cursor-pointer shadow-2xs"
              title="Global Command Palette (Cmd + K / Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-[#8C6033]" />
              <span className="hidden xl:inline text-[#77716B]">Search</span>
              <kbd className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FAF9F6] border border-[#EFE0CC] text-[#8A847D]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Quick Intake buttons */}
          <button
            onClick={onOpenCheckIn}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#E4CCAF] text-[#171717] font-semibold text-xs transition cursor-pointer shadow-2xs"
            title="Candidate Arrival Self Check-In Form"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#8C6033]" />
            <span>Check-In</span>
          </button>

          <button
            onClick={onOpenQRPasses}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#EFE0CC] text-[#171717] font-semibold text-xs transition cursor-pointer shadow-2xs"
            title="WCR QR Codes & Passes"
          >
            <QrCode className="w-3.5 h-3.5 text-[#8C6033]" />
            <span className="hidden sm:inline">QR Station</span>
          </button>

          {/* Internal Office Chat */}
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-xl bg-white border border-[#EFE0CC] text-[#171717] hover:bg-[#FAF9F6] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Internal Office Chat"
          >
            <MessageSquare className="w-4 h-4 text-[#8C6033]" />
            <span className="hidden lg:inline text-xs font-semibold">Office Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C99A68] text-white text-[10px] font-black flex items-center justify-center shadow-md">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-white border border-[#EFE0CC] text-[#77716B] hover:text-[#171717] hover:bg-[#FAF9F6] transition cursor-pointer shadow-2xs"
            title="Alert Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C99A68] text-white text-[10px] font-black flex items-center justify-center shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#EFE0CC]">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-[#171717] leading-tight">{currentUser.name}</span>
                <span className="text-[10px] font-mono text-[#8C6033] font-medium">{currentUser.role}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-[#EFE0CC] hover:border-rose-200 text-[#77716B] hover:text-rose-600 transition cursor-pointer shadow-2xs"
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
