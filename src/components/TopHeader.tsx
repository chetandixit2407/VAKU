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
} from 'lucide-react';
import type { UserRole } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

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
}) => {
  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 py-3 border-b border-white/6 glass-panel backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile trigger & Page Context */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:text-white transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {pageTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/8 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Active Console</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              White Collar Realty Operations &middot; Role: <strong className="text-slate-200">{currentRole}</strong>
            </p>
          </div>
        </div>

        {/* Right: Quick Terminals & Communications */}
        <div className="flex items-center gap-2">
          {/* Real-time Connection Capsule */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
              isRealtimeConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{isRealtimeConnected ? 'Live Real-Time' : 'Syncing'}</span>
          </div>

          {/* Quick Intake Button */}
          <button
            onClick={onOpenCheckIn}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 font-semibold text-xs transition cursor-pointer"
            title="Candidate Self Check-In Form"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Check-In</span>
          </button>

          {/* QR Station */}
          <button
            onClick={onOpenQRPasses}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white font-medium text-xs transition cursor-pointer"
            title="WCR QR Codes & Passes"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>QR Station</span>
          </button>

          {/* Office Internal Chat */}
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-amber-300 transition cursor-pointer flex items-center gap-1.5"
            title="Internal Office Chat"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline text-xs font-semibold">Office Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-lg">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white transition cursor-pointer"
            title="Alert Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Active In-App Panel Status & Close Control (Replaces redundant top-right login info) */}
          {openPanels && openPanels.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/8">
              {openPanels.map((panel) => (
                <div
                  key={panel.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-semibold shadow-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="truncate max-w-[110px]">{panel.label}</span>
                  <button
                    onClick={panel.onClose}
                    className="p-0.5 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                    title={`Close ${panel.label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PWA Install */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
