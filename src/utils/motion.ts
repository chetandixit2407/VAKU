import type { Variants, Transition } from 'motion/react';

// Smooth luxury easing curve
export const luxuryEase = [0.16, 1, 0.3, 1] as const;

export const pageMotion: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: luxuryEase,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.25 },
  },
};

export const containerStagger: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const cardMotion: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: luxuryEase,
    },
  },
};

export const hoverCardTransition: Transition = {
  duration: 0.2,
  ease: luxuryEase,
};

export const modalBackdropMotion: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalContentMotion: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: luxuryEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.2 },
  },
};

export const drawerMotion: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 260,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.25 },
  },
};

export const toastMotion: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: luxuryEase,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};
