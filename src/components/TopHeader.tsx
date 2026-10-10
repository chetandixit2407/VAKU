import React from 'react';
import {
  Bell,
  MessageSquare,
  QrCode,
  UserCheck,
  Building,
  Menu,
  Shield,
  Search,
  Wifi,
  Sparkles,
  Smartphone,
  X,
  MoreHorizontal,
  Coffee,
  Clock,
} from 'lucide-react';
import type { UserRole } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { useSettings } from '../context/SettingsContext.tsx';

export interface OpenPanelItem {
  id: string;
  label: string;
  onClose: () => void;
}

interface TopHeaderProps {
  pageTitle?: string;
  currentRole: UserRole;
  unreadCount: number;
  unreadChatCount?: number;
  isRealtimeConnected: boolean;
  openPanels?: OpenPanelItem[];
  onOpenNotifications: () => void;
  onOpenChat: () => void;
  onOpenQRPasses: () => void;
  onOpenCheckIn: () => void;
  onOpenWalkIn?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenMore?: () => void;
  isMoreActive?: boolean;
  onOpenCreatePantryTask?: () => void;
  onOpenPantryMonitor?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  pageTitle = 'Operations Command Center',
  currentRole,
  unreadCount,
  unreadChatCount = 0,
  isRealtimeConnected,
  openPanels = [],
  onOpenNotifications,
  onOpenChat,
  onOpenQRPasses,
  onOpenCheckIn,
  onOpenWalkIn,
  onToggleMobileMenu,
  onOpenMore,
  isMoreActive = false,
  onOpenCreatePantryTask,
  onOpenPantryMonitor,
}) => {
  const { t } = useSettings();

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7 border-b border-[#252A32] bg-[#0B0F14]/95 backdrop-blur-md transition-all shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-6">
        {/* Left: Mobile trigger & Page Context */}
        <div className="flex items-center gap-3 sm:gap-4">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2.5 rounded-xl bg-[#141820] border border-[#252A32] text-[#AEB7C4] hover:text-[#F5F6F8] transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#F5F6F8] tracking-tight leading-snug">
              {pageTitle}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#AEB7C4] hidden md:block">
              White Collar Realty Operations &middot; Role: <strong className="text-[#F5F6F8] font-bold">{currentRole}</strong>
            </p>
          </div>
        </div>

        {/* Right: Quick Terminals & Communications */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Real-time Connection Capsule */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isRealtimeConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{isRealtimeConnected ? t('app_live_realtime') : t('app_reconnecting')}</span>
          </div>

          {/* Quick Intake Button (Hidden for Pantry) */}
          {currentRole !== 'PANTRY' && (
            <button
              onClick={onOpenCheckIn}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141820] hover:bg-[#1B2028] border border-[#252A32] text-amber-300 font-semibold text-xs sm:text-[13px] transition cursor-pointer shadow-xs"
              title="Candidate Self Check-In Form"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Check-In</span>
            </button>
          )}

          {/* QR Station (Hidden for Pantry) */}
          {currentRole !== 'PANTRY' && (
            <button
              onClick={onOpenQRPasses}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141820] hover:bg-[#1B2028] border border-[#252A32] text-[#AEB7C4] hover:text-[#F5F6F8] font-medium text-xs sm:text-[13px] transition cursor-pointer shadow-xs"
              title="WCR QR Codes & Passes"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>QR Station</span>
            </button>
          )}

          {/* Create Pantry Task for All Authorised Users */}
          {onOpenCreatePantryTask && currentRole !== 'PANTRY' && (
            <button
              onClick={onOpenCreatePantryTask}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs sm:text-[13px] transition cursor-pointer shadow-xs"
              title="Create Pantry or Hospitality Task"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>+ Pantry Task</span>
            </button>
          )}

          {/* Pantry Realtime Monitor for Supervisors */}
          {onOpenPantryMonitor && (currentRole === 'ADMIN' || currentRole === 'CEO' || currentRole === 'HR' || currentRole === 'SENIOR_HR') && (
            <button
              onClick={onOpenPantryMonitor}
              className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141820] hover:bg-[#1B2028] border border-[#252A32] text-[#AEB7C4] hover:text-[#F5F6F8] font-medium text-xs sm:text-[13px] transition cursor-pointer shadow-xs"
              title="Pantry Live Progress Monitor"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Pantry Monitor</span>
            </button>
          )}

          {/* More Navigation Button for Laptop, Desktop & Tablet (Hidden for Pantry) */}
          {onOpenMore && currentRole !== 'PANTRY' && (
            <button
              onClick={onOpenMore}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-[13px] font-semibold transition cursor-pointer shadow-xs ${
                isMoreActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md ring-2 ring-amber-400/40'
                  : 'bg-[#141820] hover:bg-[#1B2028] border-[#252A32] text-[#AEB7C4] hover:text-[#F5F6F8]'
              }`}
              title="Secondary Dashboard Sections (Lounge, Active Meetings, Physical Check-Out)"
            >
              <MoreHorizontal className="w-4 h-4 text-amber-400" />
              <span>More</span>
            </button>
          )}

          {/* Office Internal Chat */}
          <button
            onClick={onOpenChat}
            className="relative p-2.5 rounded-xl bg-[#141820] hover:bg-[#1B2028] border border-[#252A32] text-[#AEB7C4] hover:text-amber-300 transition cursor-pointer flex items-center gap-2 shadow-xs"
            title="Internal Office Chat"
          >
            <MessageSquare className="w-4.5 h-4.5 text-amber-400" />
            <span className="hidden xl:inline text-xs sm:text-[13px] font-semibold">Office Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-lg">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-xl bg-[#141820] hover:bg-[#1B2028] border border-[#252A32] text-[#AEB7C4] hover:text-[#F5F6F8] transition cursor-pointer shadow-xs"
            title="Alert Feed"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* PWA Install */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
