

export interface Message {
  id: number;
  role: string;
  content: string;
  romanized?: string;
  hint?:string[]|null;
  feedback?:Feedback|null;
}


export type ChatDescriptionProps = {
  role:string,
  description: string,
    lang: string,
    conversation: string,
}



export interface Conversation {
  id: string;
  title: string;
  setting: string;
  speaker: string;
  dialogue: Dialogue[];
}

export interface Dialogue {
  id: number;
  role: 'User' | 'System';
  content: string;
  hint?: string[]|null;
}

export interface FeedbackResponse {
  feedback: {
    'Coherence & Organization': string;
    'Content': string;
    'Structure': string;
    // Add other feedback categories if necessary
  };
}

export interface Feedback {
  title: string;
  items: FeedbackItem[];
}

export interface FeedbackItem {
  category: string;
  value: string;
}
