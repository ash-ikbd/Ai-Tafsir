import React from 'react';
import { AyahDisplayData, Language } from '../types';
import { Icons } from './Icons';

interface AyahViewProps {
  data: AyahDisplayData;
  language: Language;
  onTafsirClick: () => void;
  isLoadingTafsir: boolean;
  isActive: boolean; // Is this the currently focused ayah?
}

export const AyahView: React.FC<AyahViewProps> = ({ data, language, onTafsirClick, isLoadingTafsir, isActive }) => {
  const translation = language === 'bn' ? data.textBn : data.textEn;

  return (
    <div className={`p-6 rounded-2xl transition-all duration-300 border ${isActive ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-lg ring-1 ring-emerald-500/50' : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">
          {data.surahNameEnglish} {data.surahNumber}:{data.ayahNumber}
        </span>
        <div className="flex gap-2">
           <button 
             onClick={onTafsirClick}
             disabled={isLoadingTafsir}
             className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
           >
             {isLoadingTafsir ? (
               <span className="animate-pulse">Loading...</span> 
             ) : (
               <>
                 <Icons.BookHeart className="w-4 h-4" />
                 {language === 'bn' ? 'তাফসীর পড়ুন' : 'Read Tafsir'}
               </>
             )}
           </button>
        </div>
      </div>

      {/* Arabic Text */}
      <div className="text-right mb-6" dir="rtl">
        <p className="font-arabic text-3xl md:text-4xl leading-[2.2] text-slate-800 dark:text-slate-100 font-normal">
          {data.arabicText}
        </p>
      </div>

      {/* Translation */}
      <div className="text-left">
        <p className={`text-lg text-slate-600 dark:text-slate-300 leading-relaxed ${language === 'bn' ? 'font-bengali' : 'font-sans'}`}>
          {translation}
        </p>
      </div>
    </div>
  );
};