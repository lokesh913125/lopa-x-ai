export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  credits: number;
  subscription_status: 'free' | 'premium';
  created_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  systemPrompt: string;
  starters: string[];
}

export interface Tool {
  id: string;
  name: string;
  category: 'Writing' | 'Business' | 'Coding' | 'Lifestyle';
  description: string;
  icon: string;
  prompt: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
