import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, TafsirData, AyahDisplayData, SurahOverviewData, Language } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; // Ensure this is available in your environment
const ai = new GoogleGenAI({ apiKey });

const MODEL_ID = "gemini-2.5-flash";

export const GeminiService = {
  /**
   * Uses Gemini to perform a semantic search.
   * Converts natural language (Bangla/English) into a list of specific Surah:Ayah references.
   */
  async searchQuran(query: string, language: Language): Promise<SearchResult[]> {
    if (!apiKey) throw new Error("API Key missing");

    const prompt = `
      You are a Quranic Scholar AI assistant.
      The user is searching for concepts or specific verses in the Quran using the following query: "${query}".
      
      Identify the most relevant Ayahs (verses) that match this query.
      Prioritize verses that directly address the core meaning and intent of the user's inquiry.
      
      Return a JSON array of up to 5 best matches.
      Each match must include:
      - surahNumber (integer)
      - ayahNumber (integer)
      - reasoning (string, a detailed explanation in ${language === 'bn' ? 'Bengali (Bangla)' : 'English'} explaining why this ayah matches. Focus on the meaning.)
      - confidenceScore (integer, 0-100)

      Strictly adhere to the JSON schema.
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                surahNumber: { type: Type.INTEGER },
                ayahNumber: { type: Type.INTEGER },
                reasoning: { type: Type.STRING },
                confidenceScore: { type: Type.INTEGER },
              },
              required: ["surahNumber", "ayahNumber", "reasoning", "confidenceScore"],
            },
          },
        },
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text) as SearchResult[];
    } catch (error) {
      console.error("Gemini Search Error:", error);
      return [];
    }
  },

  /**
   * Generates a detailed Tafsir for a specific Ayah in the requested language.
   */
  async generateTafsir(ayahData: AyahDisplayData, language: Language): Promise<TafsirData> {
    if (!apiKey) throw new Error("API Key missing");

    const langName = language === 'bn' ? 'Bengali (Bangla)' : 'English';
    const translation = language === 'bn' ? ayahData.textBn : ayahData.textEn;

    const prompt = `
      You are a respectful and knowledgeable Quranic Scholar AI.
      Provide a detailed Tafsir (exegesis) for the following Ayah in ${langName}.
      
      Surah: ${ayahData.surahNameEnglish} (${ayahData.surahNumber})
      Ayah Number: ${ayahData.ayahNumber}
      Arabic Text: ${ayahData.arabicText}
      Translation: ${translation}

      Instructions:
      1. Provide a clear and easy-to-understand explanation of the Ayah's meaning in ${langName}.
      2. Reference authentic sources like Tafsir Ibn Kathir, Tafsir Jalalayn, or Ma'ariful Quran.
      3. Highlight key themes or lessons.
      4. Ensure the tone is respectful and spiritually uplifting.
      
      Output Format (JSON):
      {
        "ayahReference": "String (e.g. Surah Al-Mulk 67:2)",
        "arabicSnippet": "String (first few words of ayah)",
        "tafsirText": "String (The full tafsir content in Markdown format)",
        "keyThemes": ["String", "String"] (Array of 3-5 keywords/themes)
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ayahReference: { type: Type.STRING },
              arabicSnippet: { type: Type.STRING },
              tafsirText: { type: Type.STRING },
              keyThemes: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
            },
            required: ["ayahReference", "tafsirText", "keyThemes"],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text) as TafsirData;
    } catch (error) {
      console.error("Gemini Tafsir Error:", error);
      throw error;
    }
  },

  /**
   * Generates a comprehensive overview of a Surah.
   */
  async generateSurahOverview(surahName: string, surahNumber: number, language: Language): Promise<SurahOverviewData> {
    if (!apiKey) throw new Error("API Key missing");

    const langName = language === 'bn' ? 'Bengali (Bangla)' : 'English';

    const prompt = `
      You are a Quranic Scholar AI.
      Provide a comprehensive overview of Surah ${surahName} (Chapter ${surahNumber}) in ${langName}.

      Include:
      1. Introduction: Summary of the Surah.
      2. Historical Context: When and why it was revealed (Asbab al-Nuzul if applicable), Makki or Madani.
      3. Key Themes: The main topics discussed.
      4. Key Lessons: Practical lessons for a believer.

      Output Format (JSON):
      {
        "surahName": "String",
        "introduction": "String (Markdown)",
        "historicalContext": "String (Markdown)",
        "keyThemes": ["String"],
        "keyLessons": ["String"]
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              surahName: { type: Type.STRING },
              introduction: { type: Type.STRING },
              historicalContext: { type: Type.STRING },
              keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyLessons: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["surahName", "introduction", "historicalContext", "keyThemes", "keyLessons"],
          },
        },
      });
      
      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text) as SurahOverviewData;
    } catch (error) {
       console.error("Gemini Surah Overview Error:", error);
       throw error;
    }
  }
};