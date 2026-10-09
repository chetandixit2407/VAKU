// Translation Dictionary and Helpers for WCR Operations HR Console
// Supports English ('en') and Hindi ('hi')

export type SupportedLanguage = 'en' | 'hi';

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Brand & Header
    app_brand: 'White Collar Realty',
    app_subbrand: 'Operations Command Center',
    app_active_console: 'Active Console',
    app_live_synced: 'SSE Live Synced',
    app_reconnecting: 'Reconnecting',
    app_live_realtime: 'Live Real-Time',

    // Navigation Items
    nav_dashboard: 'Dashboard',
    nav_reception: 'Reception',
    nav_visitors: 'Visitors',
    nav_interviews: 'Interviews',
    nav_candidates: 'Candidates',
    nav_rooms: 'Rooms',
    nav_hospitality: 'Hospitality',
    nav_notifications: 'Notifications',
    nav_settings: 'Settings',
    nav_more: 'More',
    nav_more_desc: 'Secondary Sections & Utilities',

    // Quick Actions
    btn_qr_standee: 'QR Station Standee',
    btn_blank_register: 'Blank Intake Form',
    btn_switch_role: 'Switch Active Role',
    btn_sign_out: 'Sign out',
    btn_more: 'More',
    btn_save_changes: 'Save Changes',
    btn_saved_success: 'Settings Saved Successfully',
    btn_reset_defaults: 'Reset to Defaults',
    btn_back_to_dashboard: 'Back to Dashboard',
    btn_cancel: 'Cancel',
    btn_apply: 'Apply',

    // Quick Launcher
    quick_test_blank: 'Test Blank Registration',
    quick_scheduled_checkin: 'Scheduled Check-In',
    quick_qr_standees: 'QR Standees',
    quick_staff_login: 'Staff Login',
    quick_architecture_title: 'WCR Dual QR Architecture & Desk Photo Verification',

    // Common Headings
    heading_general_settings: 'General Preferences',
    heading_language_settings: 'Language & Localization',
    heading_appearance_settings: 'Appearance & Theme',
    heading_notifications_settings: 'Notifications & Alerts',
    heading_accessibility_settings: 'Accessibility & Font Sizing',
    heading_privacy_settings: 'Data & Privacy',
    heading_about: 'About WCR Console',
    heading_system_settings: 'System & Defaults',
    heading_live_queue: 'Live Candidate Intake & Room Allocation Queue',

    // Secondary Sections
    sec_lounge_waiting: 'Lounge Waiting Area',
    sec_in_active_meetings: 'In Active Meetings',
    sec_physical_checkout: 'Physical Check-Out',
    sec_all_secondary: 'All Secondary Sections',
    sec_hidden_desc: 'Secondary dashboard sections are hidden by default to keep the console uncluttered. Access them through More.',

    // Filter Tabs
    filter_all_active: 'All Active',
    filter_waiting_lounge: 'Waiting Lounge',
    filter_in_meetings: 'In Meetings',
    filter_ready_checkout: 'Ready Checkout',
    filter_search_placeholder: 'Search candidates by name, role, phone...',

    // Candidate Card Actions & Statuses
    btn_assign_room: 'Assign Room',
    btn_route_kimmi: 'Route to Kimmi Mam',
    btn_view_dossier: 'View Full Dossier',
    badge_arrived: 'ARRIVED',
    badge_waiting: 'WAITING',
    badge_in_interview: 'IN INTERVIEW',
    badge_completed: 'COMPLETED',
    label_experience: 'Experience',
    label_notice_period: 'Notice',
    label_location: 'Location',

    // Settings fields
    setting_app_name: 'Application Title',
    setting_app_name_desc: 'Name displayed across browser header and title bar.',
    setting_landing_page: 'Default Landing Page',
    setting_landing_page_desc: 'Initial view when launching the operations console.',
    setting_date_format: 'Date Display Format',
    setting_date_format_desc: 'Standardized date representation across logs and cards.',
    setting_time_format: 'Time Format',
    setting_time_format_desc: 'Choose between 12-hour (AM/PM) and 24-hour military clock.',
    setting_timezone: 'Operational Time Zone',
    setting_timezone_desc: 'Reference time zone for candidate check-in timestamps and logs.',
    setting_lang_choice: 'Interface Language',
    setting_lang_choice_desc: 'Select preferred display language for UI labels and navigation.',
    setting_lang_note: 'Candidate personal names, resumes, and office addresses will remain in their original form without unwanted translation.',
    setting_theme: 'Display Mode',
    setting_theme_desc: 'Toggle between Dark and Light mode. Black high-contrast cards with white-to-black hover are preserved across all modes.',
    setting_audio_alerts: 'Audio Chimes for Arrival',
    setting_audio_alerts_desc: 'Play subtle acoustic signal when candidate completes QR check-in.',
    setting_live_banner: 'Realtime Alert Banners',
    setting_live_banner_desc: 'Show floating alert banners upon new visitor arrivals.',

    // Roles
    role_hr: 'HR Lead',
    role_senior_hr: 'Senior HR',
    role_admin: 'Admin Ops',
    role_ceo: 'CEO Suite',
    role_interviewer: 'Interviewer',
    role_reception: 'Front Desk',
    role_pantry: 'Pantry Steward',

    // Greetings
    greet_morning: 'Good Morning',
    greet_afternoon: 'Good Afternoon',
    greet_evening: 'Good Evening',
    kpi_waiting_lobby: 'Waiting in Lobby',
    kpi_candidates_awaiting: 'Candidates awaiting escort',
    kpi_live_interviews: 'Live Interviews',
    kpi_available_rooms: 'Available Rooms',
    kpi_pending_pantry: 'Pantry Orders',
    kpi_active_visitors: 'Active Visitors',
  },
  hi: {
    // Brand & Header
    app_brand: 'व्हाइट कॉलर रियल्टी',
    app_subbrand: 'संचालन नियंत्रण केंद्र',
    app_active_console: 'सक्रिय कंसोल',
    app_live_synced: 'लाइव कनेक्टेड',
    app_reconnecting: 'पुनः कनेक्ट हो रहा है',
    app_live_realtime: 'रीयल-टाइम लाइव',

    // Navigation Items
    nav_dashboard: 'डैशबोर्ड',
    nav_reception: 'स्वागत कक्ष (रिसेप्शन)',
    nav_visitors: 'आगंतुक (विज़िटर्स)',
    nav_interviews: 'साक्षात्कार (इंटरव्यू)',
    nav_candidates: 'उम्मीदवार (कैंडिडेट्स)',
    nav_rooms: 'कक्ष (कमरे)',
    nav_hospitality: 'आतिथ्य सत्कार (पैंट्री)',
    nav_notifications: 'सूचनाएं (नोटिफ़िकेशन)',
    nav_settings: 'सेटिंग्स (प्राथमिकताएं)',
    nav_more: 'अधिक (More)',
    nav_more_desc: 'द्वितीयक अनुभाग और सुविधाएं',

    // Quick Actions
    btn_qr_standee: 'क्यूआर स्टेशन स्टैंडी',
    btn_blank_register: 'नया पंजीकरण फॉर्म',
    btn_switch_role: 'सक्रिय भूमिका बदलें',
    btn_sign_out: 'लॉगआउट',
    btn_more: 'अधिक (More)',
    btn_save_changes: 'परिवर्तन सहेजें',
    btn_saved_success: 'सेटिंग्स सफलतापूर्वक सहेजी गईं',
    btn_reset_defaults: 'डिफ़ॉल्ट पर रीसेट करें',
    btn_back_to_dashboard: 'डैशबोर्ड पर वापस जाएं',
    btn_cancel: 'रद्द करें',
    btn_apply: 'लागू करें',

    // Quick Launcher
    quick_test_blank: 'खाली पंजीकरण फॉर्म जांचें',
    quick_scheduled_checkin: 'निर्धारित चेक-इन',
    quick_qr_standees: 'क्यूआर स्टैंडीज',
    quick_staff_login: 'कर्मचारी लॉगिन',
    quick_architecture_title: 'WCR दोहरा क्यूआर सिस्टम और डेस्क फोटो सत्यापन',

    // Common Headings
    heading_general_settings: 'सामान्य प्राथमिकताएं',
    heading_language_settings: 'भाषा व स्थानीयकरण',
    heading_appearance_settings: 'दिखावट व थीम',
    heading_notifications_settings: 'सूचनाएं और अलर्ट',
    heading_accessibility_settings: 'अभिगम्यता और टेक्स्ट आकार',
    heading_privacy_settings: 'डेटा और गोपनीयता',
    heading_about: 'कंसोल विवरण',
    heading_system_settings: 'सिस्टम व डिफ़ॉल्ट्स',
    heading_live_queue: 'लाइव उम्मीदवार आगमन व कमरा आवंटन कतार',

    // Secondary Sections
    sec_lounge_waiting: 'लाउंज प्रतीक्षा क्षेत्र',
    sec_in_active_meetings: 'सक्रिय बैठकों में',
    sec_physical_checkout: 'भौतिक चेक-आउट',
    sec_all_secondary: 'सभी द्वितीयक अनुभाग',
    sec_hidden_desc: 'कंसोल को स्वच्छ रखने के लिए द्वितीयक अनुभाग डिफ़ॉल्ट रूप से छिपे हुए हैं। अधिक (More) विकल्प से देखें।',

    // Filter Tabs
    filter_all_active: 'सभी सक्रिय',
    filter_waiting_lounge: 'प्रतीक्षा कक्ष',
    filter_in_meetings: 'साक्षात्कार में',
    filter_ready_checkout: 'चेकआउट के लिए तैयार',
    filter_search_placeholder: 'नाम, पद, फोन नंबर से खोजें...',

    // Candidate Card Actions & Statuses
    btn_assign_room: 'कमरा आवंटित करें',
    btn_route_kimmi: 'किम्मी मैम को भेजें',
    btn_view_dossier: 'पूर्ण प्रोफ़ाइल देखें',
    badge_arrived: 'पहुंच चुके हैं',
    badge_waiting: 'प्रतीक्षा में',
    badge_in_interview: 'साक्षात्कार जारी',
    badge_completed: 'पूर्ण',
    label_experience: 'अनुभव',
    label_notice_period: 'नोटिस अवधि',
    label_location: 'स्थान',

    // Settings fields
    setting_app_name: 'एप्लिकेशन शीर्षक',
    setting_app_name_desc: 'ब्राउज़र हेडर और टाइटल बार में प्रदर्शित नाम।',
    setting_landing_page: 'डिफ़ॉल्ट लैंडिंग पृष्ठ',
    setting_landing_page_desc: 'कंसोल शुरू होने पर सबसे पहले दिखने वाला दृश्य।',
    setting_date_format: 'तारीख प्रदर्शन प्रारूप',
    setting_date_format_desc: 'कार्ड्स और लॉग्स में तारीख का मानकीकृत रूप।',
    setting_time_format: 'समय प्रारूप',
    setting_time_format_desc: '12-घंटे (AM/PM) या 24-घंटे का सैन्य प्रारूप चुनें।',
    setting_timezone: 'परिचालन समय क्षेत्र (Time Zone)',
    setting_timezone_desc: 'उम्मीदवार आगमन और लॉग्स के लिए संदर्भ समय क्षेत्र।',
    setting_lang_choice: 'इंटरफ़ेस भाषा',
    setting_lang_choice_desc: 'नेविगेशन और बटनों के लिए पसंदीदा भाषा चुनें।',
    setting_lang_note: 'उम्मीदवारों के व्यक्तिगत नाम, रिज्यूमे और पते बिना किसी अनुवाद के उनके मूल रूप में सुरक्षित रहेंगे।',
    setting_theme: 'प्रदर्शन मोड',
    setting_theme_desc: 'डार्क और लाइट मोड के बीच स्विच करें। काले हाई-कंट्रास्ट कार्ड्स दोनों मोड में सुरक्षित रहते हैं।',
    setting_audio_alerts: 'आगमन पर ध्वनि सूचना',
    setting_audio_alerts_desc: 'उम्मीदवार के क्यूआर चेक-इन पर हल्की घंटी बजाएं।',
    setting_live_banner: 'रीयल-टाइम अलर्ट बैनर',
    setting_live_banner_desc: 'नया उम्मीदवार आने पर स्क्रीन पर अलर्ट बैनर दिखाएं।',

    // Roles
    role_hr: 'एचआर लीड',
    role_senior_hr: 'सीनियर एचआर',
    role_admin: 'एडमिन ऑप्स',
    role_ceo: 'सीईओ सुइट',
    role_interviewer: 'साक्षात्कारकर्ता',
    role_reception: 'फ्रंट डेस्क',
    role_pantry: 'पैंट्री स्टीवर्ड',

    // Greetings
    greet_morning: 'सुप्रभात',
    greet_afternoon: 'शुभ दोपहर',
    greet_evening: 'शुभ संध्या',
    kpi_waiting_lobby: 'लॉबी में प्रतीक्षा',
    kpi_candidates_awaiting: 'एस्कॉर्ट की प्रतीक्षा कर रहे उम्मीदवार',
    kpi_live_interviews: 'सक्रिय साक्षात्कार',
    kpi_available_rooms: 'उपलब्ध कक्ष',
    kpi_pending_pantry: 'पैंट्री ऑर्डर',
    kpi_active_visitors: 'सक्रिय आगंतुक',
  },
};

/**
 * Format a Date or ISO string according to the user's time settings
 */
export function formatAppTime(
  dateOrIso: Date | string | number | undefined,
  timeFormat: '12h' | '24h' = '12h',
  timeZone: string = 'Asia/Kolkata'
): string {
  if (!dateOrIso) return '';
  const date = typeof dateOrIso === 'string' || typeof dateOrIso === 'number' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(date.getTime())) return String(dateOrIso);

  try {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: timeFormat === '12h',
      timeZone,
    };
    return new Intl.DateTimeFormat('en-IN', options).format(date);
  } catch {
    // Fallback if timezone invalid
    return date.toLocaleTimeString([], { hour12: timeFormat === '12h' });
  }
}

/**
 * Format a Date or ISO string according to the user's date format
 */
export function formatAppDate(
  dateOrIso: Date | string | number | undefined,
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY',
  timeZone: string = 'Asia/Kolkata'
): string {
  if (!dateOrIso) return '';
  const date = typeof dateOrIso === 'string' || typeof dateOrIso === 'number' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(date.getTime())) return String(dateOrIso);

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone,
    }).formatToParts(date);

    const day = parts.find((p) => p.type === 'day')?.value || '01';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const year = parts.find((p) => p.type === 'year')?.value || '2026';

    if (dateFormat === 'MM/DD/YYYY') {
      return `${month}/${day}/${year}`;
    } else if (dateFormat === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }
    return `${day}/${month}/${year}`;
  } catch {
    return date.toLocaleDateString();
  }
}
