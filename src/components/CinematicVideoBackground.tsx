import React, { useRef, useState, useEffect } from 'react';

interface CinematicVideoBackgroundProps {
  videoSrc?: string;
  posterSrc?: string;
  overlayOpacity?: number; // 0 to 1
  className?: string;
}

/**
 * Dedicated Cinematic Video Background Component
 * Styled with the EXACT color scheme from the Axle Smart City Reference:
 * - Overcast Slate Mist Sky: #8392A0 to #94A5B5
 * - Terminal Inner Radiant Amber: #FF6224 / #FFA559
 * - Axle Electric Kinetic Orange: #FF5F27
 * - Wet Reflective Pavement Steel: #70808F / #B0C0CE
 * - Obsidian Charcoal UI Base: #181C22 / #22272E
 */
export const CinematicVideoBackground: React.FC<CinematicVideoBackgroundProps> = ({
  videoSrc = '/videos/axle-parsi-hero.mp4',
  posterSrc = '/images/axle-bg.jpg',
  overlayOpacity = 0.10,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setVideoLoaded(false);
      });
    }
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#7a8894] select-none ${className}`}
    >
      {/* 1. Base Overcast Sky & Wet Asphalt Steel Foundation */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#667480] via-[#7d8b97] to-[#8d9ba7]" />

      {/* 2. Primary High-Definition Background Image */}
      <img
        src={posterSrc}
        alt="Central European Transit Terminal Background"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* 3. Looping Video Background */}
      {!prefersReducedMotion && !videoError && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 4. Atmospheric Overlays Matching the Central Station Scene */}
      {/* Overcast Stormy Sky Light Drift */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none" />

      {/* Grand Arched Glass Canopy Luminous Bloom (Center Atrium) */}
      <div
        className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[460px] rounded-full pointer-events-none blur-[110px]"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.42) 0%, rgba(205, 222, 238, 0.25) 30%, rgba(120, 140, 160, 0.10) 60%, transparent 80%)',
        }}
      />

      {/* Transit Safety Orange Ambient Drift (Tram Side-Stripe Accent) */}
      <div
        className="absolute bottom-28 left-1/4 w-[500px] h-[300px] rounded-full pointer-events-none blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(243, 101, 21, 0.24) 0%, rgba(255, 123, 43, 0.12) 40%, transparent 70%)',
        }}
      />

      {/* Wet Reflective Pavement Mirror Sheen */}
      <div
        className="absolute bottom-0 inset-x-0 h-[48%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(100, 114, 125, 0.65) 0%, rgba(255, 255, 255, 0.15) 45%, transparent 100%)',
        }}
      />

      {/* Light Atmospheric Mist Diffuser */}
      <div
        className="absolute inset-0 bg-[#7a8894]/15 pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />

      {/* Subtle Architectural Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
export default CinematicVideoBackground;
