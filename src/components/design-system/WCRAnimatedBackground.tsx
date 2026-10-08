import React from 'react';

export const WCRAnimatedBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Light Warm Ivory / Architectural White Foundational Base */}
      <div className="absolute inset-0 bg-[#FAF9F6]" />

      {/* Layer 1: Subtle warm caramel ambient sunlight glow (top right) */}
      <div
        className="absolute -top-[20%] -right-[10%] w-[75vw] h-[75vw] max-w-[1000px] max-h-[1000px] rounded-full blur-[140px] opacity-45 animate-caramel-drift-1"
        style={{
          background: 'radial-gradient(circle, rgba(201, 154, 104, 0.22) 0%, rgba(228, 204, 175, 0.12) 50%, transparent 75%)',
        }}
      />

      {/* Layer 2: Soft beige champagne sunlight glow (bottom left) */}
      <div
        className="absolute top-[40%] -left-[15%] w-[80vw] h-[80vw] max-w-[1100px] max-h-[1100px] rounded-full blur-[160px] opacity-35 animate-caramel-drift-2"
        style={{
          background: 'radial-gradient(circle, rgba(239, 224, 204, 0.5) 0%, rgba(214, 178, 138, 0.15) 55%, transparent 80%)',
        }}
      />

      {/* Layer 3: Extremely gentle warm caramel warmth (center / bottom right) */}
      <div
        className="absolute -bottom-[20%] right-[15%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full blur-[150px] opacity-30 animate-caramel-drift-3"
        style={{
          background: 'radial-gradient(circle, rgba(196, 154, 107, 0.18) 0%, rgba(248, 246, 242, 0.1) 60%, transparent 80%)',
        }}
      />

      {/* Layer 4: Minimal architectural micro-grain for tactile depth */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
