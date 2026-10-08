import React from 'react';
import { Home, Users, CheckSquare, MessageSquare, MoreHorizontal } from 'lucide-react';

export type MobileNavTab = 'home' | 'candidates' | 'tasks' | 'chat' | 'more';

interface WCRBottomNavigationProps {
  activeTab: MobileNavTab;
  onTabChange: (tab: MobileNavTab) => void;
  unreadChatCount?: number;
  unreadTasksCount?: number;
  waitingCount?: number;
}

export const WCRBottomNavigation: React.FC<WCRBottomNavigationProps> = ({
  activeTab,
  onTabChange,
  unreadChatCount = 0,
  unreadTasksCount = 0,
  waitingCount = 0,
}) => {
  const tabs: { id: MobileNavTab; label: string; icon: any; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'candidates', label: 'Candidates', icon: Users, badge: waitingCount },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: unreadTasksCount },
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadChatCount },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav
      className="fixed bottom-3 inset-x-3 z-40 sm:hidden bg-white/92 backdrop-blur-2xl border border-[#EFE0CC] rounded-2xl p-1.5 shadow-[0_14px_45px_rgba(0,0,0,0.08)] flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 cursor-pointer ${
              isActive
                ? 'bg-[#FAF4ED] text-[#171717] shadow-xs border border-[#E4CCAF] scale-105'
                : 'text-[#77716B] hover:text-[#171717]'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? 'text-[#8C6033] scale-110' : ''
                }`}
              />
              {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#C99A68] text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight font-bold ${
                isActive ? 'text-[#171717]' : 'text-[#77716B]'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
