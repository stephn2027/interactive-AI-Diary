

export interface Message {
  id: number;
  role: string;
  content: string;
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
  topic: string;
  speaker: string;
}



export interface FeedbackResponse {
  classification?: string;
  feedback: string;
  allCriteriaMet: boolean;
}

export interface Feedback {
  title: string;
  items: FeedbackItem[];
}

export interface FeedbackItem {
  category: string;
  value: string;
}
