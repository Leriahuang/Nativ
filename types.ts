
export type LearningLanguage = 'French' | 'Spanish';

export interface ExampleSentence {
  original: string;
  translation: string;
  source: 'YouTube' | 'Podcast' | 'Informal';
  formality: 'casual' | 'neutral' | 'formal';
}

export interface Expression {
  original: string;
  translation: string;
  note?: string;
}

export interface DictionaryEntry {
  word: string;
  ipa: string;
  meaning: string;
  partOfSpeech: string;
  gender?: string;
  expressions: Expression[];
  synonyms: { word: string; translation: string }[];
  examples: ExampleSentence[];
}

export interface SavedWord extends DictionaryEntry {
  id: string;
  savedAt: number;
  nextReviewDate: number; // timestamp
  interval: number; // days
  stability: number; // SRS factor
  mastery: number; // 0-100
}

export interface PodcastStory {
  title: string;
  text: string;
  wordsUsed: string[];
}

export enum AppTab {
  Search = 'search',
  Notebook = 'notebook',
  Improv = 'improv',
  Settings = 'settings'
}
