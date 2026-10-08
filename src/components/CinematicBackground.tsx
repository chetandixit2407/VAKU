import React from 'react';

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

/**
 * Background is solid static #8F94A1 with no particles, video, or animations.
 */
export const CinematicBackground: React.FC<CinematicBackgroundProps> = () => {
  return null;
};

export default CinematicBackground;
