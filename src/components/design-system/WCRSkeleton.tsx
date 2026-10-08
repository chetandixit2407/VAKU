import React from 'react';

interface WCRSkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'card';
}

export const WCRSkeleton: React.FC<WCRSkeletonProps> = ({
  className = '',
  variant = 'rectangular',
}) => {
  if (variant === 'circular') {
    return (
      <div
        className={`rounded-full bg-[#F3EFE9] animate-pulse border border-[#EFE0CC] shrink-0 ${className}`}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`p-5 rounded-3xl bg-white/90 border border-[#EFE0CC] space-y-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EFE9] animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-1/3 rounded-md bg-[#F3EFE9] animate-pulse" />
            <div className="h-3 w-1/4 rounded-md bg-[#F3EFE9] animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-3/4 rounded-md bg-[#F3EFE9] animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-[#F3EFE9] animate-pulse border border-[#EFE0CC] ${className}`}
    />
  );
};
