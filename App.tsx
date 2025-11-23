import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuranService } from './services/quranService';
import { GeminiService } from './services/geminiService';
import { Surah, AyahDisplayData, SearchResult, TafsirData, Language, SurahOverviewData } from './types';
import { Icons } from './components/Icons';
import { AyahView } from './components/AyahView';
import { TafsirModal } from './components/TafsirModal';
import { SurahOverviewModal } from './components/SurahOverviewModal';

type ViewMode = 'reader' | 'search';

function App() {
  // Config State
  const [language, setLanguage] = useState<Language>('bn');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [arabicFontSize, setArabicFontSize] = useState(() => parseInt(localStorage.getItem('arabicFontSize') || '36'));
  const [translationFontSize, setTranslationFontSize] = useState(() => parseInt(localStorage.getItem('translationFontSize') || '18'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Data State
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [currentAyahNum, setCurrentAyahNum] = useState<number>(1);
  const [ayahData, setAyahData] = useState<AyahDisplayData | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [surahQuery, setSurahQuery] = useState(''); // Sidebar filter
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('search');

  // Tafsir State
  const [isTafsirOpen, setIsTafsirOpen] = useState(false);
  const [tafsirData, setTafsirData] = useState<TafsirData | null>(null);
  const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);

  // Surah Overview State
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [overviewData, setOverviewData] = useState<SurahOverviewData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingAyah, setIsLoadingAyah] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Touch/Swipe Refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Scroll Refs
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Apply Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Persist Fonts
  useEffect(() => {
    localStorage.setItem('arabicFontSize', arabicFontSize.toString());
    localStorage.setItem('translationFontSize', translationFontSize.toString());
  }, [arabicFontSize, translationFontSize]);

  // Initial Load
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const list = await QuranService.getAllSurahs();
        setSurahs(list);
      } catch (e) {
        setError("Failed to load Surah list. Please check your connection.");
      }
    };
    fetchSurahs();
  }, []);

  // Scroll to active surah in sidebar
  useEffect(() => {
    if ((isSidebarOpen || window.innerWidth >= 1024) && currentSurah) {
       const el = document.getElementById(`surah-${currentSurah.number}`);
       el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isSidebarOpen, currentSurah]);

  // Scroll main view top on ayah change
  useEffect(() => {
    if (viewMode === 'reader') {
       mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [ayahData, viewMode]);

  // Fetch Ayah when navigation changes
  const loadAyah = useCallback(async (surahNum: number, ayahNum: number) => {
    setIsLoadingAyah(true);
    setError(null);
    try {
      const data = await QuranService.getAyah(surahNum, ayahNum);
      setAyahData(data);
      setCurrentAyahNum(ayahNum);
      
      if (!currentSurah || currentSurah.number !== surahNum) {
        const foundSurah = surahs.find(s => s.number === surahNum);
        if (foundSurah) setCurrentSurah(foundSurah);
      }
    } catch (e) {
      setError("Could not load Ayah. It might not exist or network is down.");
    } finally {
      setIsLoadingAyah(false);
    }
  }, [surahs, currentSurah]);

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setError(null);
    try {
      const results = await GeminiService.searchQuran(searchQuery, language);
      setSearchResults(results);
      if (results.length === 0) {
        setError(language === 'bn' ? "কোনো আয়াত পাওয়া যায়নি।" : "No relevant ayahs found.");
      }
    } catch (e) {
      setError(language === 'bn' ? "অনুসন্ধান ব্যর্থ হয়েছে।" : "Search failed. Please check connection.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Tafsir Generation
  const handleViewTafsir = async () => {
    if (!ayahData) return;
    setIsTafsirOpen(true);
    
    setIsLoadingTafsir(true);
    setTafsirData(null);
    try {
      const tafsir = await GeminiService.generateTafsir(ayahData, language);
      setTafsirData(tafsir);
    } catch (e) {
      setError("Failed to generate Tafsir.");
      setIsTafsirOpen(false);
    } finally {
      setIsLoadingTafsir(false);
    }
  };

  // Handle Surah Overview
  const handleSurahOverview = async () => {
    if (!currentSurah) return;
    setIsOverviewOpen(true);
    
    setIsLoadingOverview(true);
    setOverviewData(null);
    try {
      const data = await GeminiService.generateSurahOverview(currentSurah.englishName, currentSurah.number, language);
      setOverviewData(data);
    } catch (e) {
      setError("Failed to load overview.");
      setIsOverviewOpen(false);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  // Navigation Handlers
  const handleNextAyah = () => {
    if (!currentSurah) return;
    if (currentAyahNum < currentSurah.numberOfAyahs) {
      loadAyah(currentSurah.number, currentAyahNum + 1);
    } else if (currentSurah.number < 114) {
      loadAyah(currentSurah.number + 1, 1);
    }
  };

  const handlePrevAyah = () => {
    if (!currentSurah) return;
    if (currentAyahNum > 1) {
      loadAyah(currentSurah.number, currentAyahNum - 1);
    } else if (currentSurah.number > 1) {
       loadAyah(currentSurah.number - 1, 1);
    }
  };

  const handleJumpToAyah = (e: React.ChangeEvent<HTMLInputElement>) => {
     const num = parseInt(e.target.value);
     if (!currentSurah || isNaN(num)) return;
     if (num > 0 && num <= currentSurah.numberOfAyahs) {
        loadAyah(currentSurah.number, num);
     }
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const xDist = touchStartX.current - touchEndX.current;
    const yDist = (touchStartY.current || 0) - (touchEndY.current || 0);
    const minSwipeDistance = 50;

    // Dominant horizontal swipe check
    if (Math.abs(xDist) > minSwipeDistance && Math.abs(xDist) > Math.abs(yDist)) {
      if (xDist > 0) {
        handleNextAyah();
      } else {
        handlePrevAyah();
      }
    }
  };

  const selectSearchResult = (surahNum: number, ayahNum: number) => {
    setViewMode('reader');
    loadAyah(surahNum, ayahNum);
    setIsSidebarOpen(false);
  };

  const selectSurahFromList = (surah: Surah) => {
    setViewMode('reader');
    setCurrentSurah(surah);
    loadAyah(surah.number, 1);
    setIsSidebarOpen(false);
  };

  // Filter Surahs Logic
  const filteredSurahs = surahs.filter(s => 
    s.number.toString().includes(surahQuery) || 
    s.englishName.toLowerCase().includes(surahQuery.toLowerCase()) || 
    s.englishNameTranslation.toLowerCase().includes(surahQuery.toLowerCase()) ||
    s.name.includes(surahQuery)
  );

  return (
    <div className={`flex h-screen overflow-hidden ${language === 'bn' ? 'font-bengali' : 'font-sans'} bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold text-xl">
             <Icons.BookOpen className="w-6 h-6" />
             <span className="font-sans">Nur Al-Quran</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Language Toggle in Sidebar */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-900">
           <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
             <button 
               onClick={() => setLanguage('bn')}
               className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-all ${language === 'bn' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
             >
               বাংলা
             </button>
             <button 
               onClick={() => setLanguage('en')}
               className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-all ${language === 'en' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
             >
               English
             </button>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2">
           <button 
             onClick={() => setViewMode('search')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-colors ${viewMode === 'search' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
           >
             <Icons.Search className="w-5 h-5" />
             {language === 'bn' ? 'এআই অনুসন্ধান' : 'AI Search'}
           </button>
           
           <div className="px-4 pb-2">
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  value={surahQuery}
                  onChange={(e) => setSurahQuery(e.target.value)}
                  placeholder={language === 'bn' ? "সূরা খুঁজুন..." : "Filter Surahs..."}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border-none rounded-lg focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-700 dark:text-slate-300 font-sans"
                />
              </div>
           </div>
           
           <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
             Surahs
           </div>
           
           <div className="space-y-1">
             {filteredSurahs.map(surah => {
               const isActive = currentSurah?.number === surah.number && viewMode === 'reader';
               return (
                 <button
                   key={surah.number}
                   id={`surah-${surah.number}`}
                   onClick={() => selectSurahFromList(surah)}
                   className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all ${isActive ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                 >
                   <div className="flex items-center gap-3">
                     <span className={`flex items-center justify-center w-6 h-6 text-xs rounded-full border font-sans ${isActive ? 'border-white/30 bg-white/10' : 'border-slate-300 dark:border-slate-700 text-slate-500'}`}>
                       {surah.number}
                     </span>
                     <div className="flex flex-col items-start font-sans">
                        <span className="font-medium">{surah.englishName}</span>
                        <div className="flex gap-2 items-center">
                          <span className={`text-[10px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>{surah.englishNameTranslation}</span>
                          {isActive && (
                            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                               Ayah {currentAyahNum}
                            </span>
                          )}
                        </div>
                     </div>
                   </div>
                   <span className="font-arabic text-lg opacity-80">{surah.name.replace('سورة', '')}</span>
                 </button>
               );
             })}
             {filteredSurahs.length === 0 && (
               <div className="px-4 py-4 text-center text-xs text-slate-400">
                 No Surah found.
               </div>
             )}
           </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-slate-950 z-20">
          <div className="flex items-center gap-2">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300">
               <Icons.Menu className="w-6 h-6" />
             </button>
             <span className="font-bold text-lg text-slate-800 dark:text-white font-sans lg:hidden">Nur Al-Quran</span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-slate-100 dark:bg-slate-800 text-emerald-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Icons.Settings className="w-5 h-5" />
            </button>

            {/* Settings Popover */}
            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Icons.Settings className="w-4 h-4" /> Appearance
                </h4>
                
                {/* Theme Toggle */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button 
                      onClick={() => setDarkMode(false)}
                      className={`p-1.5 rounded-md transition-all ${!darkMode ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}
                    >
                      <Icons.Sun className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDarkMode(true)}
                      className={`p-1.5 rounded-md transition-all ${darkMode ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-400'}`}
                    >
                      <Icons.Moon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Arabic Font Size */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Arabic Size</span>
                    <span className="text-xs text-slate-400 font-mono">{arabicFontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="24" 
                    max="60" 
                    value={arabicFontSize} 
                    onChange={(e) => setArabicFontSize(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Translation Font Size */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Translation Size</span>
                    <span className="text-xs text-slate-400 font-mono">{translationFontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="14" 
                    max="30" 
                    value={translationFontSize} 
                    onChange={(e) => setTranslationFontSize(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div 
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative"
        >
          {error && (
             <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
               <Icons.Info className="w-5 h-5" />
               {error}
             </div>
          )}

          {viewMode === 'search' ? (
            <div className="max-w-3xl mx-auto mt-8 md:mt-16 text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white mb-6 shadow-xl shadow-emerald-500/20">
                  <Icons.Sparkles className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                  {language === 'bn' ? 'কুরআন জিজ্ঞাসা করুন' : 'Ask the Quran'}
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                  {language === 'bn' 
                    ? 'বাংলা বা ইংরেজিতে অনুসন্ধান করুন। এআই এর মাধ্যমে জানুন সঠিক তথ্য।' 
                    : 'Search with natural language. Discover guidance through AI-powered semantic search.'}
                </p>
              </div>

              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-12">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'bn' ? "উদাহরণ: ধৈর্য সম্পর্কে কুরআন কি বলে?" : "Example: What does Quran say about patience?"}
                  className="w-full pl-6 pr-14 py-4 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg shadow-sm focus:border-emerald-500 focus:ring-0 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-2 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors disabled:bg-slate-400"
                >
                  {isSearching ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icons.Search className="w-6 h-6" />
                  )}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="text-left space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">
                    {language === 'bn' ? 'প্রস্তাবিত আয়াতসমূহ' : 'Suggested Verses'}
                  </h2>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectSearchResult(result.surahNumber, result.ayahNumber)}
                      className="w-full group bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all hover:shadow-md text-left"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2 items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-sans">
                            Surah {result.surahNumber}, Ayah {result.ayahNumber}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${result.confidenceScore > 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                             {result.confidenceScore}% Match
                          </span>
                        </div>
                        <Icons.ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <p className={`text-slate-600 dark:text-slate-300 text-sm leading-relaxed ${language === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                        {result.reasoning}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Reader Mode
            <div 
              className="max-w-4xl mx-auto pb-24 min-h-[60vh] outline-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {isLoadingAyah ? (
                <div className="flex flex-col items-center justify-center h-64">
                   <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-slate-400">{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading Ayah...'}</p>
                </div>
              ) : ayahData ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <button 
                       onClick={() => setViewMode('search')}
                       className="text-slate-500 hover:text-emerald-600 flex items-center gap-1 text-sm font-medium transition-colors font-sans"
                    >
                      <Icons.ChevronLeft className="w-4 h-4" /> {language === 'bn' ? 'অনুসন্ধানে ফিরে যান' : 'Back to Search'}
                    </button>
                    
                    {currentSurah && (
                      <button 
                         onClick={handleSurahOverview}
                         className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 px-3 py-2 rounded-lg transition-colors font-sans"
                      >
                        <Icons.Info className="w-4 h-4" />
                        {language === 'bn' ? 'সূরা পরিচিতি' : 'Surah Overview'}
                      </button>
                    )}
                  </div>

                  <AyahView 
                    data={ayahData} 
                    language={language}
                    isActive={true}
                    isLoadingTafsir={isLoadingTafsir}
                    onTafsirClick={handleViewTafsir}
                    arabicFontSize={arabicFontSize}
                    translationFontSize={translationFontSize}
                  />

                  {/* Pagination Controls */}
                  <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-10 px-6 md:px-12 font-sans">
                     <button 
                       onClick={handlePrevAyah}
                       className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                     >
                       <Icons.ChevronLeft className="w-5 h-5" />
                       <span className="hidden sm:inline">Prev</span>
                     </button>

                     <div className="flex flex-col items-center">
                       <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                         {currentSurah?.englishName} {currentSurah?.number}
                       </span>
                       <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-md px-2 py-0.5">
                         <span className="text-xs text-slate-400">Ayah</span>
                         <input 
                            type="number" 
                            value={currentAyahNum}
                            onChange={handleJumpToAyah}
                            className="w-10 text-center bg-transparent text-sm font-bold text-slate-800 dark:text-white border-none p-0 focus:ring-0"
                         />
                         <span className="text-[10px] text-slate-400">/ {currentSurah?.numberOfAyahs}</span>
                       </div>
                     </div>

                     <button 
                       onClick={handleNextAyah}
                       className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                     >
                       <span className="hidden sm:inline">Next</span>
                       <Icons.ChevronRight className="w-5 h-5" />
                     </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-slate-400 font-sans">
                  Select a Surah or Search to begin.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Tafsir Modal */}
      <TafsirModal 
        isOpen={isTafsirOpen} 
        onClose={() => setIsTafsirOpen(false)} 
        data={tafsirData} 
        isLoading={isLoadingTafsir} 
      />

      {/* Surah Overview Modal */}
      <SurahOverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        data={overviewData}
        isLoading={isLoadingOverview}
        language={language}
      />
    </div>
  );
}

export default App;