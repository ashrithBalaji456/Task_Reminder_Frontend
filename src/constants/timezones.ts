export interface TimezoneOption {
  value: string;
  label: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - India Standard Time)' },
  { value: 'Asia/Calcutta', label: 'Asia/Calcutta (IST - India)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT - Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT - Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT - Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT - Pacific Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST - UK Time)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST - Central Europe)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST - Germany)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - Japan Standard Time)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST - China Standard Time)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - Gulf Standard Time)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - Singapore Time)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST - Sydney)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST - New Zealand)' },
];
