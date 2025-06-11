export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  attachment?: ChatAttachment;
}

export interface ChatAttachment {
  name: string;
  mime: string;
  contentString: string; // Base64 encoded data URL format
}

export interface ApiResponse {
  id: string;
  type: 'abort' | 'textResponse';
  textResponse: string;
  sources: Source[];
  close: boolean;
  error: string | null;
}

export interface Source {
  title: string;
  chunk: string;
}

// API isteği için tip tanımları
export interface ApiRequestBody {
  message: string;
  mode: 'query' | 'chat';
  sessionId: string;
  attachments?: ChatAttachment[];
  reset: boolean;
}

// API hata yanıtları için tip tanımları
export interface ApiErrorResponse {
  error?: string;
  message?: string;
}