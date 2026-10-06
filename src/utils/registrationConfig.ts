import type { VisitorType } from '../types/index.ts';

export type VisitPurpose =
  | 'Interview / Candidate'
  | 'Client / Property'
  | 'Vendor / Service / Delivery'
  | 'Business Meeting'
  | 'General Visitor'
  | 'Other'
  | 'Interview'
  | 'Client / Property Consultation'
  | 'General Inquiry';

export interface PurposeOption {
  key: VisitPurpose;
  label: string;
  tagline: string;
  iconName: string;
  defaultHostId: string;
  isInterview: boolean;
}

export const VISIT_PURPOSE_OPTIONS: PurposeOption[] = [
  {
    key: 'Interview / Candidate',
    label: 'Interview / Candidate',
    tagline: 'Candidate assessment, job interviews & hiring',
    iconName: 'Briefcase',
    defaultHostId: 'usr-hr-nisha',
    isInterview: true,
  },
  {
    key: 'Client / Property',
    label: 'Client / Property',
    tagline: 'Commercial leasing, property consultation & investment',
    iconName: 'Building2',
    defaultHostId: 'usr-sales-vikram',
    isInterview: false,
  },
  {
    key: 'Vendor / Service / Delivery',
    label: 'Vendor / Service / Delivery',
    tagline: 'Supplies, couriers, technical maintenance & contractors',
    iconName: 'Truck',
    defaultHostId: 'usr-admin-sameer',
    isInterview: false,
  },
  {
    key: 'Business Meeting',
    label: 'Business Meeting',
    tagline: 'Strategic partners, corporate leadership & executive discussions',
    iconName: 'Users',
    defaultHostId: 'usr-ceo-lalit',
    isInterview: false,
  },
  {
    key: 'General Visitor',
    label: 'General Visitor',
    tagline: 'General office visit, inquiries & front desk assistance',
    iconName: 'HelpCircle',
    defaultHostId: 'usr-rec-ananya',
    isInterview: false,
  },
  {
    key: 'Other',
    label: 'Other',
    tagline: 'Custom visit purpose or specialized reception requirement',
    iconName: 'FileText',
    defaultHostId: 'RECEPTION_ASSISTANCE',
    isInterview: false,
  },
];

export interface StaffHostOption {
  id: string;
  name: string;
  role: string;
  department: string;
  team: string;
  isGeneralReception?: boolean;
}

export const CONFIGURED_STAFF_HOSTS: StaffHostOption[] = [
  {
    id: 'RECEPTION_ASSISTANCE',
    name: 'Front Desk / Reception Assistance',
    role: 'Front Desk Team',
    department: 'Front Desk & Reception',
    team: 'Reception & Visitor Assistance',
    isGeneralReception: true,
  },
  {
    id: 'usr-sales-vikram',
    name: 'Vikram Malhotra',
    role: 'Sales Director',
    department: 'Sales & Real Estate',
    team: 'Client & Property Advisory Team',
  },
  {
    id: 'usr-ceo-lalit',
    name: 'Lalit Sir',
    role: 'CEO',
    department: 'Executive Leadership',
    team: 'Executive Leadership',
  },
  {
    id: 'usr-cofounder-kimmi',
    name: 'Kimmi Mam',
    role: 'Co-Founder & Senior HR',
    department: 'HR & Senior Leadership',
    team: 'Leadership & Senior HR',
  },
  {
    id: 'usr-admin-sameer',
    name: 'Sameer Sir',
    role: 'Operations Admin',
    department: 'Administration & Operations',
    team: 'Administration & Facilities',
  },
  {
    id: 'usr-hr-nisha',
    name: 'Nisha',
    role: 'Senior HR Manager',
    department: 'HR',
    team: 'HR & Talent Acquisition',
  },
  {
    id: 'usr-hr-shriyanshi',
    name: 'Shriyanshi',
    role: 'HR Executive',
    department: 'HR',
    team: 'HR & Talent Acquisition',
  },
  {
    id: 'usr-rec-ananya',
    name: 'Ananya Sen',
    role: 'Front Desk Coordinator',
    department: 'Front Desk & Reception',
    team: 'Front Desk & Reception',
  },
  {
    id: 'usr-pan-ramesh',
    name: 'Ramesh Kumar',
    role: 'Hospitality Executive',
    department: 'Pantry & Hospitality',
    team: 'Pantry & Hospitality Services',
  },
];

export const STAFF_HOST_OPTIONS = CONFIGURED_STAFF_HOSTS;

export function isInterviewPurpose(purpose?: string): boolean {
  if (!purpose) return false;
  const p = purpose.toLowerCase().trim();
  return p === 'interview' || p.includes('candidate') || p.startsWith('interview');
}

export function getRecommendedHostForPurpose(purpose: VisitPurpose): StaffHostOption {
  switch (purpose) {
    case 'Interview / Candidate':
    case 'Interview':
      return CONFIGURED_STAFF_HOSTS.find((h) => h.id === 'usr-hr-nisha') || CONFIGURED_STAFF_HOSTS[0];
    case 'Client / Property':
    case 'Client / Property Consultation':
      return CONFIGURED_STAFF_HOSTS.find((h) => h.id === 'usr-sales-vikram') || CONFIGURED_STAFF_HOSTS[0];
    case 'Vendor / Service / Delivery':
      return CONFIGURED_STAFF_HOSTS.find((h) => h.id === 'usr-admin-sameer') || CONFIGURED_STAFF_HOSTS[0];
    case 'Business Meeting':
      return CONFIGURED_STAFF_HOSTS.find((h) => h.id === 'usr-ceo-lalit') || CONFIGURED_STAFF_HOSTS[0];
    case 'General Visitor':
    case 'General Inquiry':
      return CONFIGURED_STAFF_HOSTS.find((h) => h.id === 'usr-rec-ananya') || CONFIGURED_STAFF_HOSTS[0];
    case 'Other':
    default:
      return CONFIGURED_STAFF_HOSTS.find((h) => h.id === 'RECEPTION_ASSISTANCE') || CONFIGURED_STAFF_HOSTS[0];
  }
}

/**
 * Robust Name Validation:
 * - Reject numeric-only names such as 12345
 * - Allow valid Hindi & English names
 * - Allow initials (e.g. R. K. Sharma, A. P. J. Abdul Kalam, J.D.)
 * - Allow apostrophes and hyphens (e.g. O'Connor, Jean-Pierre)
 * - Reject clearly invalid names
 */
export function validatePersonName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full Name is required.' };
  }

  // Reject purely numeric or names with any digits (e.g. 12345, John123)
  if (/\d/.test(trimmed)) {
    return { isValid: false, error: 'Name cannot contain numbers.' };
  }

  // Allow English letters (a-z, A-Z), Hindi Devanagari (\u0900-\u097F), spaces, dots, apostrophes, hyphens, and optional parentheses
  const validCharsRegex = /^[\u0900-\u097Fa-zA-Z\s.'’,\(\)-]+$/;
  if (!validCharsRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Name contains invalid characters. Please use letters (English or Hindi), spaces, hyphens, or periods.',
    };
  }

  // Count actual alphabetic letters (Devanagari or Latin)
  const lettersOnly = trimmed.match(/[\u0900-\u097Fa-zA-Z]/g) || [];
  if (lettersOnly.length < 2) {
    return {
      isValid: false,
      error: 'Please enter a valid full name with at least 2 letters.',
    };
  }

  // Reject string containing only punctuation/spaces
  if (/^[.\s'-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a genuine name.' };
  }

  return { isValid: true };
}

/**
 * Indian Mobile Validator (10 digits starting with 6, 7, 8, or 9)
 */
export function validateIndianMobile(phone: string): { isValid: boolean; error?: string } {
  const clean = phone.trim().replace(/[\s-]/g, '').replace(/^\+91/, '').replace(/^0/, '');

  if (!clean) {
    return { isValid: false, error: 'Mobile number is required.' };
  }

  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'Mobile number must contain digits only.' };
  }

  if (clean.length !== 10) {
    return { isValid: false, error: 'Mobile number must be exactly 10 digits.' };
  }

  if (!/^[6-9]/.test(clean)) {
    return { isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9.' };
  }

  // Reject repeated numbers (e.g. 0000000000, 1111111111, 9999999999)
  if (/^(\d)\1{9}$/.test(clean)) {
    return { isValid: false, error: 'Please enter a genuine mobile number, not repeated digits.' };
  }

  // Reject obvious sequential digits
  if (clean === '1234567890' || clean === '0123456789' || clean === '9876543210') {
    return { isValid: false, error: 'Please enter a genuine mobile number.' };
  }

  return { isValid: true };
}

/**
 * Basic Email Validator
 */
export function validateEmail(email: string, isRequired = false): { isValid: boolean; error?: string } {
  const clean = email.trim();
  if (!clean) {
    if (isRequired) {
      return { isValid: false, error: 'Email address is required.' };
    }
    return { isValid: true };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }
  return { isValid: true };
}

/**
 * Validate Date and Time for scheduled visits
 */
export function validateAppointmentDateTime(dateStr: string, timeStr: string): { isValid: boolean; error?: string } {
  if (!dateStr || !dateStr.trim()) {
    return { isValid: false, error: 'Appointment date is required for scheduled visits.' };
  }
  if (!timeStr || !timeStr.trim()) {
    return { isValid: false, error: 'Appointment time is required for scheduled visits.' };
  }

  const parsedDate = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Please select a valid appointment date and time.' };
  }

  return { isValid: true };
}
