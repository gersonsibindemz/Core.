import { LanguageOption } from './types';

export const LANGUAGES: LanguageOption[] = [
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'English', label: 'English' },
  { value: 'Changana', label: 'Changana' },
  { value: 'Chuwabu', label: 'Chuwabu' },
  { value: 'Lomwe', label: 'Lomwe' },
  { value: 'Makhuwa', label: 'Makhuwa' },
  { value: 'Makonde', label: 'Makonde' },
  { value: 'Ndau', label: 'Ndau' },
  { value: 'Nyungwe', label: 'Nyungwe' },
  { value: 'Ronga', label: 'Ronga' },
  { value: 'Sena', label: 'Sena' },
  { value: 'Shona', label: 'Shona' },
  { value: 'Swahili', label: 'Swahili' },
  { value: 'Tswa', label: 'Tswa' },
  { value: 'Yao', label: 'Yao' },
];

/**
 * The list of allowed origins for the cross-domain (postMessage) API is now managed
 * dynamically via the "API Docs" interface within the application.
 * This provides better security and flexibility than a hardcoded list.
 * The configuration is stored in the browser's localStorage.
 */
