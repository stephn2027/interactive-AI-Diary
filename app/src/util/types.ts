export type LanguageKey = "it" | "ko"|"ja"|"fr"|"zh"|'en';

export type Retry = {
  message: Message;
  transcript: string | null;
  feedback: string | undefined;
  score: number | undefined;
};

export type Option = {
  response: string;
  cloze?: string;
  romanized?: string;
  romanizedCloze?: string;
  nextIndex?: number | -1;
};

export interface Message {
  id: number;
  role: string;
  content: string;
  romanized?: string;
  options?: Option[];
  hint?:string[]|null;
}

export interface SummaryData {
  pronunciationScore:number[];
  fluencyScore:number[];
  grammarScore:number[];
  vocabularyScore:number[];
  feedbackSummary:string[];
  pronunciationLowScoreFeedbacks:string[],
  fluencyLowScoreFeedbacks:string[],
  grammarLowScoreFeedbacks:string[],
  vocabularyLowScoreFeedbacks:string[],
}

export type ChatDescriptionProps = {
  role:string,
  description: string,
    lang: string,
    conversation: string,
}


export type LanguageConfig = {
  speaker: string;
  description: string;
};

export interface TranscriptObject {
  text: string;
  metadata: [Object];
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