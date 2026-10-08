import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export type CinematicVariant =
  | 'dashboard'
  | 'reception'
  | 'visitor'
  | 'interview'
  | 'room'
  | 'scanner'
  | 'candidate'
  | 'settings';

interface CinematicBackgroundProps {
  variant?: CinematicVariant;
  intensity?: 'normal' | 'subdued' | 'minimal';
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
  variant = 'dashboard',
  intensity = 'normal',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Variant palette config - European Smart City Central Terminal Palette
  // Arched Glass Canopy White (#FFFFFF), Transit Safety Orange (#F36515), Overcast Steel Slate (#8594A0)
  const getVariantGradients = () => {
    switch (variant) {
      case 'reception':
      case 'visitor':
        return {
          glow1: 'from-white/30 via-[#8594a0]/20 to-transparent',
          glow2: 'from-[#f36515]/28 via-[#ff7c26]/14 to-transparent',
          accent: 'rgba(200, 220, 238, 0.22)',
        };
      case 'scanner':
        return {
          glow1: 'from-[#f36515]/35 via-white/20 to-transparent',
          glow2: 'from-[#8594a0]/25 via-[#2e7d7a]/15 to-transparent',
          accent: 'rgba(243, 101, 21, 0.22)',
        };
      case 'interview':
        return {
          glow1: 'from-white/30 via-[#8ba0b2]/20 to-transparent',
          glow2: 'from-[#f36515]/25 via-[#ffa052]/12 to-transparent',
          accent: 'rgba(200, 220, 238, 0.18)',
        };
      case 'room':
        return {
          glow1: 'from-white/25 via-[#8594a0]/20 to-transparent',
          glow2: 'from-[#2e7d7a]/20 via-[#f36515]/15 to-transparent',
          accent: 'rgba(46, 125, 122, 0.16)',
        };
      case 'candidate':
      case 'settings':
      case 'dashboard':
      default:
        return {
          glow1: 'from-white/35 via-[#8594a0]/25 to-transparent',
          glow2: 'from-[#f36515]/30 via-[#ff7c26]/18 to-transparent',
          accent: 'rgba(200, 220, 238, 0.22)',
        };
    }
  };

  const { glow1, glow2, accent } = getVariantGradients();

  // Floating micro-particles: 50% crystalline white raindrops, 40% transit orange kinetic sparks, 10% teal path sparks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = intensity === 'minimal' ? 8 : intensity === 'subdued' ? 14 : 22;
    const particles = Array.from({ length: particleCount }, (_, idx) => {
      const type = idx % 5 === 0 ? 'teal' : idx % 2 === 0 ? 'orange' : 'white';
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.3 + 0.4,
        alpha: Math.random() * 0.35 + 0.08,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: -Math.random() * 0.2 - 0.05,
        type,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const alphaScale = p.alpha * (intensity === 'subdued' ? 0.6 : intensity === 'minimal' ? 0.35 : 1);
        if (p.type === 'orange') {
          ctx.fillStyle = `rgba(243, 101, 21, ${alphaScale})`;
        } else if (p.type === 'teal') {
          ctx.fillStyle = `rgba(46, 125, 122, ${alphaScale})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alphaScale * 1.2})`;
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  const opacityMultiplier = intensity === 'minimal' ? 'opacity-30' : intensity === 'subdued' ? 'opacity-60' : 'opacity-85';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-transparent"
    >
      {/* Upper Right Ambient Drift - Luminous Pure White & Slate-Mist Sheen */}
      <div
        className={`absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br ${glow1} blur-[120px] transition-opacity duration-1000 ${opacityMultiplier}`}
      />

      {/* Lower Left Warm Reflection - Transit Safety Orange Ambient Field */}
      <div
        className={`absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr ${glow2} blur-[140px] transition-opacity duration-1000 ${opacityMultiplier}`}
      />

      {/* Central Terminal Arched Hub Ambient Radiant Field - Canopy Glass Steel Blue & White Core */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[520px] rounded-full blur-[150px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(200, 220, 238, 0.22) 35%, rgba(243, 101, 21, 0.12) 60%, transparent 80%)',
          opacity: intensity === 'subdued' ? 0.6 : intensity === 'minimal' ? 0.3 : 0.85,
        }}
      />

      {/* Micro-Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-80 pointer-events-none"
      />
    </div>
  );
};
