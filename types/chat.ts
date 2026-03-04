export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  page: string;
  role: string;
  user_id: string;
  owner_id?: string;
}
