import { QuranApiResponse, Surah, SingleAyahResponse, AyahDisplayData } from '../types';

const BASE_URL = 'https://api.alquran.cloud/v1';

export const QuranService = {
  /**
   * Fetches the list of all Surahs.
   */
  async getAllSurahs(): Promise<Surah[]> {
    try {
      const response = await fetch(`${BASE_URL}/surah`);
      if (!response.ok) throw new Error('Failed to fetch Surahs');
      const json: QuranApiResponse<Surah[]> = await response.json();
      return json.data;
    } catch (error) {
      console.error('Error fetching surahs:', error);
      throw error;
    }
  },

  /**
   * Fetches a specific Ayah with Arabic, Bengali, and English translations.
   */
  async getAyah(surahNumber: number, ayahNumber: number): Promise<AyahDisplayData> {
    // Requesting: Simple Quran (Arabic), Bengali Translation, English Translation (Sahih International)
    const editions = 'quran-simple,bn.bengali,en.sahih';
    const url = `${BASE_URL}/ayah/${surahNumber}:${ayahNumber}/editions/${editions}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
           throw new Error(`Ayah ${surahNumber}:${ayahNumber} not found.`);
        }
        throw new Error('Failed to fetch Ayah data');
      }

      const json: QuranApiResponse<SingleAyahResponse> = await response.json();
      const data = json.data;

      // Identify editions by language
      const arabicEntry = data.find(d => d.edition.language === 'ar') || data[0];
      const bengaliEntry = data.find(d => d.edition.language === 'bn');
      const englishEntry = data.find(d => d.edition.language === 'en');

      return {
        surahNumber: arabicEntry.surah.number,
        ayahNumber: arabicEntry.numberInSurah,
        arabicText: arabicEntry.text,
        textBn: bengaliEntry?.text || 'অনুবাদ অনুপলব্ধ',
        textEn: englishEntry?.text || 'Translation unavailable',
        surahNameEnglish: arabicEntry.surah.englishName,
        surahNameArabic: arabicEntry.surah.name,
      };
    } catch (error) {
      console.error('Error fetching ayah:', error);
      throw error;
    }
  },

  /**
   * Helper to get the total ayahs in a surah to prevent out-of-bounds queries.
   */
  isValidAyah(surah: Surah, ayahNumber: number): boolean {
    return ayahNumber > 0 && ayahNumber <= surah.numberOfAyahs;
  }
};