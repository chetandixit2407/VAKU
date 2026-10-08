import React, { useState, useRef, useEffect } from 'react';

interface WCRGlassCardProps {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  elevation?: 'subtle' | 'standard' | 'high';
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const WCRGlassCard: React.FC<WCRGlassCardProps> = ({
  children,
  className = '',
  enableTilt = false,
  elevation = 'standard',
  onClick,
  hoverEffect = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || isTouch || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Extremely subtle tilt: max ~2 degrees
    const rotateX = ((y - centerY) / centerY) * -2;
    const rotateY = ((x - centerX) / centerX) * 2;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    if (!enableTilt || isTouch) return;
    setTilt({ x: 0, y: 0 });
  };

  const elevationClasses = {
    subtle: 'bg-white/80 border-[#EFE0CC]/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)]',
    standard: 'bg-white/92 border-[#E4CCAF]/60 shadow-[0_14px_45px_rgba(0,0,0,0.05),0_2px_8px_rgba(201,154,104,0.04)]',
    high: 'bg-white/98 border-[#D6B28A]/50 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(201,154,104,0.08)]',
  }[elevation];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={
        enableTilt && !isTouch && (tilt.x !== 0 || tilt.y !== 0)
          ? {
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(4px)`,
              transition: 'transform 0.12s ease-out',
            }
          : undefined
      }
      className={`
        relative rounded-3xl border backdrop-blur-xl
        transition-all duration-300
        ${elevationClasses}
        ${hoverEffect ? 'hover:border-[#C99A68]/50 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(0,0,0,0.08),0_0_20px_rgba(201,154,104,0.12)]' : ''}
        ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${className}
      `}
    >
      {/* Top subtle warm highlight reflection line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.9)] to-transparent rounded-t-3xl pointer-events-none" />
      {children}
    </div>
  );
};
