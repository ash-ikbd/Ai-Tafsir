// Al-Quran Cloud API Types

export interface QuranApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Edition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

export interface AyahContent {
  text: string;
  edition: Edition;
  surah: Surah;
  numberInSurah: number;
  hizbQuarter: number;
  ruku: number;
  manzil: number;
}

// The response structure when requesting multiple editions for a single ayah
export type SingleAyahResponse = AyahContent[];

// App Types
export type Language = 'bn' | 'en';

export interface SearchResult {
  surahNumber: number;
  ayahNumber: number;
  reasoning: string;
  confidenceScore: number;
}

export interface AyahDisplayData {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  textBn: string;
  textEn: string;
  surahNameEnglish: string;
  surahNameArabic: string;
}

// AI Response Types
export interface TafsirData {
  ayahReference: string;
  arabicSnippet: string;
  tafsirText: string; // Markdown formatted
  keyThemes: string[];
}

export interface SurahOverviewData {
  surahName: string;
  introduction: string;
  historicalContext: string;
  keyThemes: string[];
  keyLessons: string[];
}