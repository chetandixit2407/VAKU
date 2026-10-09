import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Building2,
  Users2,
  CalendarClock,
  UserCheck,
  DoorOpen,
  Coffee,
  Bell,
  Settings,
  Shield,
  Award,
  ChevronDown,
  LogOut,
  QrCode,
  UserPlus,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { UserRole, User } from '../types/index.ts';

export type NavSection =
  | 'dashboard'
  | 'reception'
  | 'visitors'
  | 'interviews'
  | 'candidates'
  | 'rooms'
  | 'hospitality'
  | 'notifications'
  | 'settings';

interface SidebarNavProps {
  currentRole: UserRole;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onSelectRole: (role: UserRole) => void;
  currentUser?: User | null;
  unreadCount: number;
  unreadChatCount?: number;
  isRealtimeConnected: boolean;
  onOpenNotifications: () => void;
  onOpenQRPasses: () => void;
  onOpenWalkIn: () => void;
  onOpenBlankRegister: () => void;
  onLogout?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentRole,
  activeSection,
  onSelectSection,
  onSelectRole,
  currentUser,
  unreadCount,
  unreadChatCount = 0,
  isRealtimeConnected,
  onOpenNotifications,
  onOpenQRPasses,
  onOpenWalkIn,
  onOpenBlankRegister,
  onLogout,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reception', label: 'Reception', icon: Building2 },
    { id: 'visitors', label: 'Visitors', icon: Users2 },
    { id: 'interviews', label: 'Interviews', icon: CalendarClock },
    { id: 'candidates', label: 'Candidates', icon: UserCheck },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen },
    { id: 'hospitality', label: 'Hospitality', icon: Coffee },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const allRoles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'HR', label: 'HR Lead', icon: Users2, color: 'text-amber-400' },
    { role: 'SENIOR_HR', label: 'Senior HR', icon: Award, color: 'text-amber-300' },
    { role: 'ADMIN', label: 'Admin Ops', icon: Shield, color: 'text-purple-400' },
    { role: 'CEO', label: 'CEO Suite', icon: Award, color: 'text-emerald-400' },
    { role: 'INTERVIEWER', label: 'Interviewer', icon: UserCheck, color: 'text-blue-400' },
    { role: 'RECEPTION', label: 'Front Desk', icon: Building2, color: 'text-cyan-400' },
    { role: 'PANTRY', label: 'Pantry Steward', icon: Coffee, color: 'text-amber-300' },
  ];

  const canSwitchViews =
    !currentUser ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'CEO' ||
    currentUser.role === 'CO_FOUNDER';

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-[100dvh] fixed top-0 left-0 z-30 bg-[#0B0F14] border-r border-[#252A32] select-none text-[#F5F6F8]">
      <div className="flex-1 flex flex-col p-3.5 bg-[#0B0F14] relative overflow-hidden">
        {/* Subtle Top Inner Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />

        {/* Brand Block */}
        <div className="px-2.5 py-3 border-b border-[#252A32] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg shadow-amber-500/15 tracking-wider">
                WCR
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0F14]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#F5F6F8] text-xs tracking-tight">
                  White Collar Realty
                </span>
              </div>
              <span className="text-[10px] text-amber-400/90 font-mono tracking-wider uppercase block">
                Command Center
              </span>
            </div>
          </div>

          {/* Real-time Status Light */}
          <div
            className={`w-2 h-2 rounded-full ${
              isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
            title={isRealtimeConnected ? 'SSE Live Synced' : 'Reconnecting'}
          />
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 py-3.5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'notifications') {
                    onOpenNotifications();
                  } else {
                    onSelectSection(item.id);
                  }
                }}
                className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#1B2028] text-[#F5F6F8] font-semibold'
                    : 'text-[#AEB7C4] hover:text-[#F5F6F8] hover:bg-[#1B2028]/60'
                }`}
              >
                {/* Active Indicator Accent Line */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 border-l-2 border-amber-400 rounded-xl pointer-events-none"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <div className="flex items-center gap-2.5 relative z-10">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-[#AEB7C4] group-hover:text-[#F5F6F8]'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="relative z-10 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Launch Terminals */}
        <div className="py-2.5 border-t border-[#252A32] space-y-1.5">
          <button
            onClick={onOpenQRPasses}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141820] hover:bg-[#1B2028] border border-[#252A32] text-[#F5F6F8] text-xs font-semibold transition cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">QR Station Standee</span>
          </button>

          <button
            onClick={onOpenBlankRegister}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Blank Intake Form</span>
          </button>
        </div>

        {/* Role Switcher & User Profile */}
        <div className="pt-3 border-t border-[#252A32] relative">
          {canSwitchViews && (
            <div className="mb-2 relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#141820] hover:bg-[#1B2028] border border-[#252A32] text-[11px] font-semibold text-[#F5F6F8] transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Shield className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Role: {currentRole}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#AEB7C4] shrink-0" />
              </button>

              <AnimatePresence>
                {roleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-1 bg-[#141820] rounded-2xl p-1.5 z-50 border border-[#252A32] shadow-2xl max-h-56 overflow-y-auto"
                  >
                    <div className="text-[10px] font-bold text-[#AEB7C4] px-2 py-1 uppercase tracking-wider">
                      Switch Active Role
                    </div>
                    {allRoles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          onSelectRole(r.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                          currentRole === r.role
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-[#AEB7C4] hover:text-[#F5F6F8] hover:bg-[#1B2028]'
                        }`}
                      >
                        <r.icon className={`w-3.5 h-3.5 ${r.color}`} />
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User profile card */}
          {currentUser && (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-[#141820] border border-[#252A32]">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-[#F5F6F8] truncate">{currentUser.name}</p>
                <p className="text-[10px] text-[#AEB7C4] font-mono truncate">{currentUser.email}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-[#AEB7C4] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
