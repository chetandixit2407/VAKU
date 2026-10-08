import React from 'react';
import { WCRGlassCard } from './WCRGlassCard.tsx';

interface WCRFloatingPanelProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const WCRFloatingPanel: React.FC<WCRFloatingPanelProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  children,
  className = '',
  headerClassName = '',
}) => {
  return (
    <WCRGlassCard className={`p-5 sm:p-7 ${className}`} elevation="standard">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#EFE0CC] ${headerClassName}`}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-2xl bg-[#F8F4EE] border border-[#E4CCAF] flex items-center justify-center text-[#B88957] shadow-xs shrink-0">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#171717] tracking-tight">{title}</h3>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-[#77716B] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div>{children}</div>
    </WCRGlassCard>
  );
};
