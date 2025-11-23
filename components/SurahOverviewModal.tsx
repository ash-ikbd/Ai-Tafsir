import React from 'react';
import ReactMarkdown from 'react-markdown';
import { SurahOverviewData, Language } from '../types';
import { Icons } from './Icons';

interface SurahOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SurahOverviewData | null;
  isLoading: boolean;
  language: Language;
}

export const SurahOverviewModal: React.FC<SurahOverviewModalProps> = ({ isOpen, onClose, data, isLoading, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Icons.BookOpen className="w-5 h-5 text-emerald-600" />
            {language === 'bn' ? 'সূরা পরিচিতি' : 'Surah Overview'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400 animate-pulse">
                {language === 'bn' ? 'তথ্য সংগ্রহ করা হচ্ছে...' : 'Gathering information...'}
              </p>
            </div>
          ) : data ? (
            <div className="space-y-8">
              {/* Title */}
              <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{data.surahName}</h2>
              </div>

              {/* Grid Layout for Desktop */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Introduction */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide text-xs">
                    <Icons.Info className="w-4 h-4" />
                    {language === 'bn' ? 'ভূমিকা' : 'Introduction'}
                  </h4>
                  <div className={`prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-300 ${language === 'bn' ? 'font-bengali' : ''}`}>
                    <ReactMarkdown>{data.introduction}</ReactMarkdown>
                  </div>
                </div>

                {/* History */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide text-xs">
                    <Icons.BookHeart className="w-4 h-4" />
                    {language === 'bn' ? 'ঐতিহাসিক প্রেক্ষাপট' : 'Historical Context'}
                  </h4>
                  <div className={`prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-300 ${language === 'bn' ? 'font-bengali' : ''}`}>
                    <ReactMarkdown>{data.historicalContext}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Themes & Lessons */}
              <div className="grid md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl">
                 <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-gold-500"></span>
                       {language === 'bn' ? 'মূল বিষয়বস্তু' : 'Key Themes'}
                    </h4>
                    <ul className="space-y-2">
                      {data.keyThemes.map((theme, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 ${language === 'bn' ? 'font-bengali' : ''}`}>
                           <span className="mt-1.5 w-1 h-1 bg-slate-400 rounded-full shrink-0"></span>
                           {theme}
                        </li>
                      ))}
                    </ul>
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                       {language === 'bn' ? 'শিক্ষা' : 'Key Lessons'}
                    </h4>
                    <ul className="space-y-2">
                      {data.keyLessons.map((lesson, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 ${language === 'bn' ? 'font-bengali' : ''}`}>
                           <span className="mt-1.5 w-1 h-1 bg-slate-400 rounded-full shrink-0"></span>
                           {lesson}
                        </li>
                      ))}
                    </ul>
                 </div>
              </div>

            </div>
          ) : (
             <div className="text-center text-slate-500">
                {language === 'bn' ? 'কিছু ভুল হয়েছে।' : 'Something went wrong.'}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};