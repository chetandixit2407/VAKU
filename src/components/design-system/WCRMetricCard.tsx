import React, { useEffect, useState, useRef } from 'react';
import { WCRGlassCard } from './WCRGlassCard.tsx';

interface WCRMetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  total?: number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: 'caramel' | 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';
  onClick?: () => void;
  trend?: string;
}

export const WCRMetricCard: React.FC<WCRMetricCardProps> = ({
  label,
  value,
  suffix = '',
  total,
  subtitle,
  icon,
  accentColor = 'caramel',
  onClick,
  trend,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [isUpdated, setIsUpdated] = useState<boolean>(false);
  const prevValueRef = useRef<number>(value);

  // Animated number counter
  useEffect(() => {
    const startVal = displayValue;
    const endVal = value;
    if (startVal === endVal) return;

    // Trigger highlight pulse on update
    setIsUpdated(true);
    const pulseTimer = setTimeout(() => setIsUpdated(false), 1200);

    const duration = 650;
    const startTime = performance.now();

    const animateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      } else {
        setDisplayValue(endVal);
      }
    };

    requestAnimationFrame(animateNumber);
    prevValueRef.current = value;

    return () => clearTimeout(pulseTimer);
  }, [value]);

  const colorStyles = {
    caramel: {
      badgeBg: 'bg-[#FBF6EE]',
      badgeBorder: 'border-[#EADAC4]',
      iconText: 'text-[#B88957]',
      textAccent: 'text-[#8A6A45]',
    },
    amber: {
      badgeBg: 'bg-[#FFFBEB]',
      badgeBorder: 'border-[#FDE68A]',
      iconText: 'text-[#B45309]',
      textAccent: 'text-[#92400E]',
    },
    emerald: {
      badgeBg: 'bg-[#ECFDF5]',
      badgeBorder: 'border-[#A7F3D0]',
      iconText: 'text-[#047857]',
      textAccent: 'text-[#065F46]',
    },
    blue: {
      badgeBg: 'bg-[#F0F9FF]',
      badgeBorder: 'border-[#BAE6FD]',
      iconText: 'text-[#0369A1]',
      textAccent: 'text-[#075985]',
    },
    purple: {
      badgeBg: 'bg-[#FAF5FF]',
      badgeBorder: 'border-[#E9D5FF]',
      iconText: 'text-[#7E22CE]',
      textAccent: 'text-[#6B21A8]',
    },
    rose: {
      badgeBg: 'bg-[#FFF1F2]',
      badgeBorder: 'border-[#FECDD3]',
      iconText: 'text-[#BE123C]',
      textAccent: 'text-[#9F1239]',
    },
  }[accentColor];

  return (
    <WCRGlassCard
      enableTilt={true}
      onClick={onClick}
      className={`p-4 sm:p-5 overflow-hidden transition-all duration-500 ${
        isUpdated
          ? 'ring-2 ring-[#C99A68]/60 bg-white shadow-[0_12px_40px_rgba(201,154,104,0.18)]'
          : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-[#77716B] uppercase tracking-wider truncate">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl ${colorStyles.badgeBg} border ${colorStyles.badgeBorder} flex items-center justify-center ${colorStyles.iconText} shadow-xs shrink-0`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
          {displayValue}
          {suffix}
        </span>
        {typeof total === 'number' && (
          <span className="text-xs sm:text-sm font-semibold text-[#8A847D]">
            / {total}
          </span>
        )}
        {trend && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FBF6EE] text-[#8A6A45] border border-[#EADAC4]">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className={`text-[11px] font-medium mt-1 truncate ${colorStyles.textAccent}`}>
          {subtitle}
        </p>
      )}
    </WCRGlassCard>
  );
};
