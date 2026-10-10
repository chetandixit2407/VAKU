import React from 'react';
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
  X,
  LogOut,
  QrCode,
  Smartphone,
  Shield,
  Award,
  Layers,
  MoreHorizontal,
} from 'lucide-react';
import type { UserRole, User } from '../types/index.ts';
import type { NavSection } from './SidebarNav.tsx';
import { useSettings } from '../context/SettingsContext.tsx';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentUser?: User | null;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenQRPasses: () => void;
  onOpenCheckIn: () => void;
  onLogout?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  currentRole,
  onSelectRole,
  currentUser,
  unreadCount,
  onOpenNotifications,
  onOpenQRPasses,
  onOpenCheckIn,
  onLogout,
}) => {
  const { t } = useSettings();
  const isPantry = currentRole === 'PANTRY';

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = isPantry
    ? [{ id: 'dashboard', label: 'Pantry Tasks', icon: Coffee }]
    : [
        { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
        { id: 'reception', label: t('nav_reception'), icon: Building2 },
        { id: 'candidates', label: t('nav_candidates'), icon: UserCheck },
        { id: 'interviews', label: t('nav_interviews'), icon: CalendarClock },
        { id: 'more', label: 'Secondary Sections', icon: Layers },
        { id: 'visitors', label: t('nav_visitors'), icon: Users2 },
        { id: 'rooms', label: t('nav_rooms'), icon: DoorOpen },
        { id: 'hospitality', label: t('nav_hospitality'), icon: Coffee },
        { id: 'notifications', label: t('nav_notifications'), icon: Bell, badge: unreadCount },
        { id: 'settings', label: t('nav_settings'), icon: Settings },
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

  return (
    <>
      {/* Mobile Glass Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B0F14] border-t border-[#252A32] px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => onSelectSection('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeSection === 'dashboard' ? 'text-amber-400 font-bold' : 'text-[#AEB7C4]'
          }`}
        >
          {isPantry ? <Coffee className="w-4 h-4 text-amber-400" /> : <LayoutDashboard className="w-4 h-4" />}
          <span className="text-[10px] font-semibold mt-0.5">{isPantry ? 'Pantry Tasks' : 'Dashboard'}</span>
        </button>

        {!isPantry && (
          <>
            <button
              onClick={() => onSelectSection('reception')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeSection === 'reception' ? 'text-amber-400 font-bold' : 'text-[#AEB7C4]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">Reception</span>
            </button>

            <button
              onClick={onOpenQRPasses}
              className="flex flex-col items-center py-1 px-3 rounded-xl text-amber-400 font-bold"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1B2028] border border-[#252A32] flex items-center justify-center -mt-2 shadow-lg">
                <QrCode className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">QR Pass</span>
            </button>

            <button
              onClick={() => onSelectSection('candidates')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeSection === 'candidates' ? 'text-amber-400 font-bold' : 'text-[#AEB7C4]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">Candidates</span>
            </button>

            <button
              onClick={() => onSelectSection('more')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeSection === 'more' ? 'text-amber-400 font-bold' : 'text-[#AEB7C4] hover:text-[#F5F6F8]'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">More</span>
            </button>
          </>
        )}
      </nav>

      {/* Mobile Drawer (When Open) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="relative w-72 max-w-[85vw] h-full bg-[#0B0F14] text-[#F5F6F8] p-4 flex flex-col border-r border-[#252A32] z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252A32]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xs">
                    WCR
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#F5F6F8]">White Collar Realty</h3>
                    <p className="text-[10px] text-amber-400 font-mono">Operations Console</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#AEB7C4] hover:text-[#F5F6F8] hover:bg-[#1B2028]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 py-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-[#1B2028] text-[#F5F6F8] font-bold border-l-2 border-amber-400'
                          : 'text-[#AEB7C4] hover:text-[#F5F6F8] hover:bg-[#1B2028]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-[#AEB7C4]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* HR Sub-Profiles Section (Strictly hidden for Pantry) */}
                {!isPantry && (
                  <div className="pt-2 border-t border-[#252A32] space-y-1">
                    <div className="text-[10px] font-bold text-amber-400 px-3 py-1 uppercase tracking-wider font-mono">
                      HR Profiles
                    </div>
                    <button
                      onClick={() => {
                        onSelectSection('hr-nisha');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                        activeSection === 'hr-nisha'
                          ? 'bg-[#1B2028] text-amber-300 font-bold border-l-2 border-amber-400'
                          : 'text-[#AEB7C4] hover:text-[#F5F6F8] hover:bg-[#1B2028]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-amber-400/20 text-amber-300 font-bold text-[10px] flex items-center justify-center">
                          N
                        </div>
                        <span>Nisha (Senior HR)</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono">Active</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectSection('hr-shriyanshi');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                        activeSection === 'hr-shriyanshi'
                          ? 'bg-[#1B2028] text-amber-300 font-bold border-l-2 border-amber-400'
                          : 'text-[#AEB7C4] hover:text-[#F5F6F8] hover:bg-[#1B2028]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-sky-400/20 text-sky-300 font-bold text-[10px] flex items-center justify-center">
                          S
                        </div>
                        <span>Shriyanshi (Intake HR)</span>
                      </div>
                      <span className="text-[10px] text-sky-400 font-mono">Active</span>
                    </button>
                  </div>
                )}

                <div className="pt-3 border-t border-[#252A32]">
                  <div className="text-[10px] font-bold text-[#AEB7C4] px-3 py-1 uppercase tracking-wider">
                    Role Views
                  </div>
                  {allRoles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        onSelectRole(r.role);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition ${
                        currentRole === r.role
                          ? 'bg-[#1B2028] text-amber-300 font-bold'
                          : 'text-[#AEB7C4] hover:text-[#F5F6F8] hover:bg-[#1B2028]/60'
                      }`}
                    >
                      <r.icon className={`w-3.5 h-3.5 ${r.color}`} />
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Logout */}
              {currentUser && (
                <div className="pt-3 border-t border-[#252A32] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[#F5F6F8] truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-[#AEB7C4] font-mono truncate">{currentUser.role}</p>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-1.5 rounded-lg text-[#AEB7C4] hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
