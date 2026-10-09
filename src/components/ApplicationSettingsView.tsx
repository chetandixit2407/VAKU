import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Globe2,
  Moon,
  Sun,
  Clock,
  Calendar,
  Layers,
  Save,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Laptop,
  Bell,
  Volume2,
  Sparkles,
  Info,
  Type,
  Eye,
  Lock,
  Trash2,
  AlertTriangle,
  Building2,
  Radio,
  Check,
} from 'lucide-react';
import { useSettings, type AppSettings } from '../context/SettingsContext.tsx';
import type { NavSection } from './SidebarNav.tsx';

interface ApplicationSettingsViewProps {
  onBackToDashboard: () => void;
}

type SettingsSectionTab =
  | 'general'
  | 'language'
  | 'appearance'
  | 'notifications'
  | 'accessibility'
  | 'privacy'
  | 'about';

export const ApplicationSettingsView: React.FC<ApplicationSettingsViewProps> = ({
  onBackToDashboard,
}) => {
  const { settings, updateSettings, resetSettings, t, formatTime, formatDate } = useSettings();

  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<SettingsSectionTab>('general');
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState<boolean>(false);
  const [audioTesting, setAudioTesting] = useState<boolean>(false);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings(formData);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleReset = () => {
    resetSettings();
    setFormData(settings);
    setShowResetConfirm(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('wcr_operations_app_settings');
      resetSettings();
      setFormData(settings);
      setShowClearCacheConfirm(false);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (err) {
      console.warn('Could not clear cache', err);
    }
  };

  // Web Audio chime test
  const handleTestAudioChime = () => {
    setAudioTesting(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      // Fallback
    }
    setTimeout(() => setAudioTesting(false), 800);
  };

  const now = new Date();

  const landingOptions: { id: NavSection; label: string }[] = [
    { id: 'dashboard', label: 'Main Operations Dashboard' },
    { id: 'reception', label: 'Reception & Front Desk' },
    { id: 'more', label: 'More Operations & Secondary Sections' },
    { id: 'candidates', label: 'HR Candidate Intake' },
    { id: 'interviews', label: 'Interviewer Evaluations' },
    { id: 'rooms', label: 'Rooms & Facilities Monitor' },
    { id: 'hospitality', label: 'Pantry & Hospitality Desk' },
  ];

  const timeZones = [
    { id: 'Asia/Kolkata', label: 'India Standard Time (IST - Asia/Kolkata, GMT+5:30)' },
    { id: 'UTC', label: 'Coordinated Universal Time (UTC / GMT)' },
    { id: 'Asia/Dubai', label: 'Gulf Standard Time (GST - Asia/Dubai, GMT+4:00)' },
    { id: 'Europe/London', label: 'British Summer / GMT (Europe/London)' },
    { id: 'America/New_York', label: 'Eastern Time (US / Canada - America/New_York)' },
    { id: 'America/Los_Angeles', label: 'Pacific Time (US / Canada - America/Los_Angeles)' },
  ];

  const tabs: { id: SettingsSectionTab; label: string; icon: any }[] = [
    { id: 'general', label: t('heading_general_settings'), icon: Layers },
    { id: 'language', label: t('heading_language_settings'), icon: Globe2 },
    { id: 'appearance', label: t('heading_appearance_settings'), icon: Moon },
    { id: 'notifications', label: t('heading_notifications_settings'), icon: Bell },
    { id: 'accessibility', label: t('heading_accessibility_settings'), icon: Type },
    { id: 'privacy', label: t('heading_privacy_settings'), icon: Shield },
    { id: 'about', label: t('heading_about'), icon: Info },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title={t('btn_back_to_dashboard')}
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{t('btn_back_to_dashboard')}</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>{t('nav_settings')} &bull; Application Preferences</span>
              </h1>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              White Collar Realty Operations Console &middot; Operational Controls & Accessibility
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/80 hover:text-rose-300 border border-white/10 transition text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('btn_reset_defaults')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{t('btn_save_changes')}</span>
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs font-semibold shadow-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{t('btn_saved_success')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs for Settings Sections A through G */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`wcr-filter-tab px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 border shrink-0 ${
                isActive
                  ? 'is-active bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md ring-2 ring-amber-400/40'
                  : 'bg-[#0B0B0D] text-white border-white/15 hover:bg-[#1A1D24] hover:text-white hover:border-white/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'language' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 uppercase font-mono">
                  {formData.language}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Settings Sections */}
      <div className="space-y-6">
        {/* SECTION A: GENERAL PREFERENCES */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Card 1: Application Title */}
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t('setting_app_name')}</h2>
                  <p className="text-xs text-white/70">{t('setting_app_name_desc')}</p>
                </div>
              </div>

              <div className="pt-2">
                <input
                  type="text"
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  placeholder="White Collar Realty Operations HR Console"
                  className="w-full max-w-xl px-4 py-2.5 rounded-xl bg-[#141820] border border-white/15 text-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
            </div>

            {/* Card 2: Default Landing Page */}
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t('setting_landing_page')}</h2>
                  <p className="text-xs text-white/70">{t('setting_landing_page_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {landingOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultLandingPage: opt.id })}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                      formData.defaultLandingPage === opt.id
                        ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-2 ring-amber-400/30'
                        : 'bg-[#141820] border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                    {formData.defaultLandingPage === opt.id && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 3: Date & Time Formats and Time Zone */}
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">Time, Date & Regional Standards</h2>
                  <p className="text-xs text-white/70">
                    Control display of timestamps, candidate queues, and operational logs.
                  </p>
                </div>
              </div>

              {/* Time Format */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('setting_time_format')}</span>
                </label>
                <p className="text-[11px] text-white/70">{t('setting_time_format_desc')}</p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timeFormat: '12h' })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-2 ${
                      formData.timeFormat === '12h'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-[#141820] text-white border-white/15 hover:bg-white/10'
                    }`}
                  >
                    <span>12-Hour (AM / PM)</span>
                    <span className="text-[10px] opacity-75 font-mono">e.g. 02:45 PM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timeFormat: '24h' })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-2 ${
                      formData.timeFormat === '24h'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-[#141820] text-white border-white/15 hover:bg-white/10'
                    }`}
                  >
                    <span>24-Hour (Military Clock)</span>
                    <span className="text-[10px] opacity-75 font-mono">e.g. 14:45</span>
                  </button>
                </div>
              </div>

              {/* Date Format */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('setting_date_format')}</span>
                </label>
                <p className="text-[11px] text-white/70">{t('setting_date_format_desc')}</p>
                <div className="flex flex-wrap gap-3 pt-1">
                  {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormData({ ...formData, dateFormat: fmt })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-2 ${
                        formData.dateFormat === fmt
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                          : 'bg-[#141820] text-white border-white/15 hover:bg-white/10'
                      }`}
                    >
                      <span>{fmt}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({fmt === 'DD/MM/YYYY' ? 'India / UK' : fmt === 'MM/DD/YYYY' ? 'US' : 'ISO 8601'})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Zone */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('setting_timezone')}</span>
                </label>
                <p className="text-[11px] text-white/70">{t('setting_timezone_desc')}</p>
                <select
                  value={formData.timeZone}
                  onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                  className="w-full max-w-xl px-3.5 py-2.5 rounded-xl bg-[#141820] border border-white/15 text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
                >
                  {timeZones.map((tz) => (
                    <option key={tz.id} value={tz.id} className="bg-[#141820] text-white">
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-[#141820] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-mono font-bold tracking-wider block">
                    Live Clock & Date Preview
                  </span>
                  <div className="text-sm font-black text-white mt-0.5">
                    {formatTime(now)} &bull; {formatDate(now)}
                  </div>
                </div>
                <div className="text-[11px] text-white/70 font-mono">
                  Zone: <span className="text-white font-semibold">{formData.timeZone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: LANGUAGE & LOCALIZATION */}
        {activeTab === 'language' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t('heading_language_settings')}</h2>
                  <p className="text-xs text-white/70">{t('setting_lang_choice_desc')}</p>
                </div>
              </div>

              {/* Language Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* English */}
                <div
                  onClick={() => {
                    const updated = { ...formData, language: 'en' as const };
                    setFormData(updated);
                    updateSettings({ language: 'en' });
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    formData.language === 'en'
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-[#141820] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">English (Default)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white">
                          EN
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        Full international English operations interface.
                      </p>
                    </div>
                    {formData.language === 'en' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/70 space-y-1">
                    <div><strong>Navigation:</strong> Dashboard &bull; Reception &bull; Interviews</div>
                    <div><strong>Action:</strong> Assign Room &bull; Route to Kimmi Mam</div>
                  </div>
                </div>

                {/* Hindi */}
                <div
                  onClick={() => {
                    const updated = { ...formData, language: 'hi' as const };
                    setFormData(updated);
                    updateSettings({ language: 'hi' });
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    formData.language === 'hi'
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-[#141820] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">हिन्दी (Hindi)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 font-bold">
                          HI
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        भारतीय परिचालन हेतु सम्पूर्ण हिन्दी इंटरफेस।
                      </p>
                    </div>
                    {formData.language === 'hi' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/70 space-y-1">
                    <div><strong>नेविगेशन:</strong> डैशबोर्ड &bull; स्वागत कक्ष &bull; साक्षात्कार</div>
                    <div><strong>कार्रवाई:</strong> कमरा आवंटित करें &bull; किम्मी मैम को भेजें</div>
                  </div>
                </div>
              </div>

              {/* Informative Note regarding preservation of candidate records */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>{t('setting_lang_note')}</p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: APPEARANCE & THEME */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  {formData.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t('heading_appearance_settings')}</h2>
                  <p className="text-xs text-white/70">{t('setting_theme_desc')}</p>
                </div>
              </div>

              {/* Theme Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Dark Mode */}
                <div
                  onClick={() => {
                    const updated = { ...formData, theme: 'dark' as const };
                    setFormData(updated);
                    updateSettings({ theme: 'dark' });
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    formData.theme === 'dark'
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-[#141820] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white">
                        <Moon className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Dark Operations Mode</h3>
                        <p className="text-xs text-white/70">Deep slate background with black cards</p>
                      </div>
                    </div>
                    {formData.theme === 'dark' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#0B0B0D] border border-white/10 text-white text-xs">
                    <div className="font-bold flex items-center justify-between">
                      <span>Card Contrast Sample</span>
                      <span className="text-[10px] text-amber-400">#0B0B0D</span>
                    </div>
                    <p className="text-[11px] text-white/70 mt-1">
                      Black background &bull; White typography &bull; Hover turns white with black text.
                    </p>
                  </div>
                </div>

                {/* Light Mode */}
                <div
                  onClick={() => {
                    const updated = { ...formData, theme: 'light' as const };
                    setFormData(updated);
                    updateSettings({ theme: 'light' });
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    formData.theme === 'light'
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-[#141820] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900">
                        <Sun className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Light Canvas Mode</h3>
                        <p className="text-xs text-white/70">Light backdrop while preserving black cards</p>
                      </div>
                    </div>
                    {formData.theme === 'light' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#0B0B0D] border border-white/10 text-white text-xs">
                    <div className="font-bold flex items-center justify-between">
                      <span>Card Contrast Sample</span>
                      <span className="text-[10px] text-amber-400">#0B0B0D</span>
                    </div>
                    <p className="text-[11px] text-white/70 mt-1">
                      High contrast preserved: solid black cards with white text & hover effect.
                    </p>
                  </div>
                </div>
              </div>

              {/* Accent Color Selection */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Accent Color Theme</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'amber', name: 'Transit Orange (Amber)', color: '#F36515', bg: 'bg-[#F36515]' },
                    { id: 'blue', name: 'Corporate Sky (Blue)', color: '#3B82F6', bg: 'bg-[#3B82F6]' },
                    { id: 'emerald', name: 'Executive Mint (Emerald)', color: '#10B981', bg: 'bg-[#10B981]' },
                    { id: 'purple', name: 'Director Violet (Purple)', color: '#8B5CF6', bg: 'bg-[#8B5CF6]' },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, accentColor: acc.id as any };
                        setFormData(updated);
                        updateSettings({ accentColor: acc.id as any });
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        formData.accentColor === acc.id
                          ? 'border-amber-400 bg-white/10 ring-2 ring-amber-400/40'
                          : 'border-white/10 bg-[#141820] hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${acc.bg} shrink-0`} />
                      <span className="text-xs font-semibold text-white truncate">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION D: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t('heading_notifications_settings')}</h2>
                  <p className="text-xs text-white/70">Configure supported in-app audio and visual alerts.</p>
                </div>
              </div>

              {/* Supported In-App Notification Controls */}
              <div className="space-y-4 pt-2">
                {/* Audio Chime */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-[#141820] border border-white/10 gap-3">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{t('setting_audio_alerts')}</h4>
                      <p className="text-[11px] text-white/70">{t('setting_audio_alerts_desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleTestAudioChime}
                      disabled={audioTesting}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Radio className={`w-3 h-3 ${audioTesting ? 'animate-pulse text-amber-400' : ''}`} />
                      <span>{audioTesting ? 'Playing Chime...' : 'Test Sound'}</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={formData.soundAlerts}
                      onChange={(e) => {
                        const updated = { ...formData, soundAlerts: e.target.checked };
                        setFormData(updated);
                        updateSettings({ soundAlerts: e.target.checked });
                      }}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Realtime Candidate Alert Banner */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141820] border border-white/10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{t('setting_live_banner')}</h4>
                      <p className="text-[11px] text-white/70">{t('setting_live_banner_desc')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.liveIntakeBanner}
                    onChange={(e) => {
                      const updated = { ...formData, liveIntakeBanner: e.target.checked };
                      setFormData(updated);
                      updateSettings({ liveIntakeBanner: e.target.checked });
                    }}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Task Toasts */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141820] border border-white/10">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">In-App Immediate Task Toasts</h4>
                      <p className="text-[11px] text-white/70">
                        Pop-up notification on urgent candidate escort tasks and pantry deliveries.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.taskToastAlerts}
                    onChange={(e) => {
                      const updated = { ...formData, taskToastAlerts: e.target.checked };
                      setFormData(updated);
                      updateSettings({ taskToastAlerts: e.target.checked });
                    }}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Integration Disclaimer */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Notice:</strong> This console currently triggers in-app Web Audio signals and real-time visual banners. External WhatsApp, SMS, or Email gateways are not configured in this deployment and will require backend telecom API credentials.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION E: ACCESSIBILITY */}
        {activeTab === 'accessibility' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t('heading_accessibility_settings')}</h2>
                  <p className="text-xs text-white/70">Fine-tune text scaling, focus rings, and high contrast visibility.</p>
                </div>
              </div>

              {/* Text Size Controls */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-amber-400" />
                  <span>Text Sizing</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'small', label: 'Small', desc: 'Compact font for high-density radar screens', size: '14px' },
                    { id: 'medium', label: 'Medium (Default)', desc: 'Standard WCR operational typography', size: '16px' },
                    { id: 'large', label: 'Large', desc: 'Enhanced legibility for tablets & reception standees', size: '18px' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, textSize: s.id as any };
                        setFormData(updated);
                        updateSettings({ textSize: s.id as any });
                      }}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        formData.textSize === s.id
                          ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-2 ring-amber-400/40'
                          : 'bg-[#141820] border-white/10 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{s.label}</span>
                        <span className="text-[10px] font-mono text-amber-400">{s.size}</span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Indicators & High Contrast */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141820] border border-white/10">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Enhanced Focus Indicators</h4>
                      <p className="text-[11px] text-white/70">
                        Display thick, high-contrast gold outline on keyboard navigation (Tab/Shift+Tab).
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.highContrast}
                    onChange={(e) => {
                      const updated = { ...formData, highContrast: e.target.checked };
                      setFormData(updated);
                      updateSettings({ highContrast: e.target.checked });
                    }}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Contrast Assurance Box */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>WCAG AA Compliance:</strong> Solid black cards (#0B0B0D) paired with crisp white text (#FFFFFF) provide a contrast ratio exceeding 18:1, well above standard requirements.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION F: DATA & PRIVACY */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t('heading_privacy_settings')}</h2>
                  <p className="text-xs text-white/70">Client-side storage management, security audit, and cache hygiene.</p>
                </div>
              </div>

              {/* Security Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#141820] border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Lock className="w-4 h-4" />
                    <span>Frontend Security Guaranteed</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    No passwords, server API secrets, or candidate documents are stored in browser localStorage.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#141820] border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Shield className="w-4 h-4" />
                    <span>Candidate Record Safety</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Opening or saving Settings does not erase or modify candidate intake records, room assignments, or visitors.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white">Data Management Options</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowClearCacheConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Local UI Preference Cache</span>
                  </button>
                </div>
              </div>

              {/* Diagnostics JSON */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-mono text-white/60 uppercase">
                  Configuration State (Non-Sensitive)
                </span>
                <pre className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-amber-300 overflow-x-auto max-h-36">
                  {JSON.stringify(
                    {
                      appName: formData.appName,
                      language: formData.language,
                      theme: formData.theme,
                      timeZone: formData.timeZone,
                      timeFormat: formData.timeFormat,
                      dateFormat: formData.dateFormat,
                      textSize: formData.textSize,
                      accentColor: formData.accentColor,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* SECTION G: ABOUT */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#0B0B0D] dashboard-card card-dark rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{t('heading_about')}</h2>
                  <p className="text-xs text-white/70">WCR Operations Platform Specifications & Architecture</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#141820] border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                    Product Identity
                  </span>
                  <h3 className="text-sm font-black text-white">White Collar Realty Operations Console</h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Integrated enterprise operations suite managing visitor intake, live WebRTC desk photos, appointment passes, interviewer room assignment, and pantry hospitality tasks.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#141820] border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                    Version & Runtime
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                      v2.4.0 Production Build
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      SSE Synced
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60">
                    Built with React 19, TypeScript, Tailwind CSS, WebRTC Camera Capture, and HTML5 Canvas PDF Renderer.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141820] border border-white/10 text-xs text-white/70 space-y-1">
                <div><strong>Copyright:</strong> &copy; {now.getFullYear()} White Collar Realty. All rights reserved.</div>
                <div><strong>Operational Hub:</strong> Corporate Headquarters &bull; Golf Course Road, Gurugram.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 bg-[#0B0B0D] rounded-3xl border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">Reset Application Settings?</h3>
            </div>
            <p className="text-xs text-white/80">
              This will restore English interface language, 12-hour time, Asia/Kolkata timezone, and default branding. Candidate and visitor database records will remain completely untouched.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
              >
                {t('btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Confirmation Dialog */}
      {showClearCacheConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 bg-[#0B0B0D] rounded-3xl border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">Clear UI Preference Cache?</h3>
            </div>
            <p className="text-xs text-white/80">
              This clears stored theme, text size, and language settings from browser localStorage and returns to system defaults. No database records will be deleted.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearCacheConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
              >
                {t('btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
