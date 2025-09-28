
export interface LanguageOption {
  value: string;
  label: string;
}

export interface Source {
  title: string;
  uri: string;
}

export interface TranslationResponse {
  translation: string;
  pronunciation: string | null;
  sources: Source[];
}

// --- Voice Translation API Types ---

export type VoiceSessionState = 'idle' | 'listening' | 'speaking' | 'error' | 'closed' | 'connecting';

export interface TranscriptionData {
  userInput: string;
  modelOutput: string;
  isFinal: boolean;
}

export interface VoiceSessionCallbacks {
  onStateChange: (state: VoiceSessionState) => void;
  onTranscriptionUpdate: (data: TranscriptionData) => void;
  onError: (error: Error) => void;
}

// --- External API Connection Logging ---

export interface ApiConnectionLog {
  id: string;
  timestamp: Date;
  origin: string;
  status: 'Success' | 'Failure';
  reason: string;
}
