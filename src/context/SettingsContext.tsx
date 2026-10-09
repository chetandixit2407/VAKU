import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { NavSection } from '../components/SidebarNav.tsx';
import { translations, type SupportedLanguage, formatAppTime, formatAppDate } from '../utils/i18n.ts';

export interface AppSettings {
  appName: string;
  defaultLandingPage: NavSection;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  timeZone: string;
  language: SupportedLanguage;
  theme: 'dark' | 'light';
  accentColor: 'amber' | 'blue' | 'emerald' | 'purple';
  autoRefreshInterval: number; // in seconds
  soundAlerts: boolean;
  visualAlerts: boolean;
  liveIntakeBanner: boolean;
  taskToastAlerts: boolean;
  textSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  appName: 'White Collar Realty Operations HR Console',
  defaultLandingPage: 'dashboard',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  timeZone: 'Asia/Kolkata',
  language: 'en',
  theme: 'dark',
  accentColor: 'amber',
  autoRefreshInterval: 30,
  soundAlerts: true,
  visualAlerts: true,
  liveIntakeBanner: true,
  taskToastAlerts: true,
  textSize: 'medium',
  highContrast: false,
};

const SETTINGS_STORAGE_KEY = 'wcr_operations_app_settings';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  t: (key: string, fallback?: string) => string;
  formatTime: (dateOrIso?: Date | string | number) => string;
  formatDate: (dateOrIso?: Date | string | number) => string;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_APP_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load stored app settings', e);
    }
    return DEFAULT_APP_SETTINGS;
  });

  // Keep theme class, text size, and language on document root synced
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (settings.theme === 'light') {
        root.classList.add('theme-light');
        root.classList.remove('theme-dark');
        document.body.classList.add('bg-[#E5E7EB]');
        document.body.classList.remove('bg-[#8F94A1]');
      } else {
        root.classList.add('theme-dark');
        root.classList.remove('theme-light');
        document.body.classList.add('bg-[#8F94A1]');
        document.body.classList.remove('bg-[#E5E7EB]');
      }

      // Text size scaling
      if (settings.textSize === 'small') {
        root.style.fontSize = '14px';
      } else if (settings.textSize === 'large') {
        root.style.fontSize = '18px';
      } else {
        root.style.fontSize = '16px';
      }

      // High contrast toggle
      if (settings.highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }

      root.setAttribute('data-accent', settings.accentColor || 'amber');
      root.setAttribute('lang', settings.language);
      document.title = settings.appName;
    } catch (e) {
      console.warn('Could not sync root theme/lang/size', e);
    }
  }, [settings.theme, settings.language, settings.appName, settings.textSize, settings.highContrast, settings.accentColor]);

  // Persist to localStorage whenever settings change
  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save app settings to localStorage', e);
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_APP_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_APP_SETTINGS));
    } catch (e) {
      console.warn('Failed to reset app settings', e);
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const langDict = translations[settings.language] || translations.en;
      if (langDict && key in langDict) {
        return langDict[key];
      }
      const enDict = translations.en;
      if (enDict && key in enDict) {
        return enDict[key];
      }
      return fallback || key;
    },
    [settings.language]
  );

  const formatTime = useCallback(
    (dateOrIso?: Date | string | number) => {
      return formatAppTime(dateOrIso, settings.timeFormat, settings.timeZone);
    },
    [settings.timeFormat, settings.timeZone]
  );

  const formatDate = useCallback(
    (dateOrIso?: Date | string | number) => {
      return formatAppDate(dateOrIso, settings.dateFormat, settings.timeZone);
    },
    [settings.dateFormat, settings.timeZone]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        t,
        formatTime,
        formatDate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // Graceful fallback outside provider
    return {
      settings: DEFAULT_APP_SETTINGS,
      updateSettings: () => {},
      resetSettings: () => {},
      t: (k, fb) => fb || k,
      formatTime: (d) => (d ? new Date(d).toLocaleTimeString() : ''),
      formatDate: (d) => (d ? new Date(d).toLocaleDateString() : ''),
    };
  }
  return ctx;
}
