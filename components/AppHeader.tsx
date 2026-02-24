"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type HeaderTranslations = {
  appTitle: string;
  menuHome: string;
  menuFeatures: string;
  menuPricing: string;
  menuBlog: string;
  menuTrash?: string;
  languages: string;
  // menuTitle: string;
  close: string;
};

type Language = 'en' | 'ro' | 'fr' | 'de' | 'es';

type Props = {
  t: HeaderTranslations;
  language: Language;
  setLanguage: (lang: Language) => void;
  languageNames: Record<Language, string>;
  languageFlags: Record<Language, string>;
  nowLabel?: string;
  userId?: string;
  userEmail?: string | null;
  bellCount?: number;
};

const externalLinks = {
  home: "/",
  blog: "#",
  features: "#",
  pricing: "#"
};

export default function AppHeader({
  t,
  language,
  setLanguage,
  languageNames,
  languageFlags,
  nowLabel,
  userId,
  userEmail,
  bellCount = 0
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);

  const refreshTrashCount = useCallback(() => {
    if (!userId) {
      setTrashCount(0);
      return;
    }
    void fetch('/api/todos/trash?count=1', { credentials: 'include', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { count: 0 }))
      .then(data => setTrashCount(Number(data?.count) || 0))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    refreshTrashCount();
    if (!userId) return;
    const onRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ delta?: number }>).detail;
      if (typeof detail?.delta === 'number') {
        setTrashCount(prev => Math.max(0, prev + detail.delta));
      }
      setTimeout(() => refreshTrashCount(), 120);
    };
    window.addEventListener('trash-count-refresh', onRefresh);
    const timer = setInterval(refreshTrashCount, 15000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('trash-count-refresh', onRefresh);
    };
  }, [refreshTrashCount, userId]);

  const refreshReminderCount = useCallback(() => {
    if (!userId) {
      setReminderCount(0);
      return;
    }
    void fetch('/api/todos/reminders?count=1', { credentials: 'include', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { count: 0 }))
      .then(data => setReminderCount(Number(data?.count) || 0))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    refreshReminderCount();
    if (!userId) return;
    const onRefresh = () => {
      setTimeout(() => refreshReminderCount(), 120);
    };
    window.addEventListener('reminder-count-refresh', onRefresh);
    const timer = setInterval(refreshReminderCount, 15000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('reminder-count-refresh', onRefresh);
    };
  }, [refreshReminderCount, userId]);

  return (
    <>
      <div className="max-[767px]:pt-3">
        <header className="max-w-7xl mx-auto px-6 py-8 max-[767px]:mx-3 max-[767px]:px-4 max-[767px]:py-4 flex items-center justify-between bg-transparent max-[767px]:bg-white max-[767px]:border max-[767px]:border-slate-200 max-[767px]:border-b max-[767px]:rounded-t-[22px] relative z-50">
          <Link href="/" className="flex items-center space-x-3 max-[767px]:space-x-2.5">
          <div className="w-11 h-11 max-[767px]:w-12 max-[767px]:h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-100">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 12h2" />
              <path d="M8 8v8" />
              <path d="M12 5v14" />
              <path d="M16 8v8" />
              <path d="M20 12h-2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-800">{t.appTitle}</h1>
            {nowLabel && (
              <span className="text-[11px] font-semibold text-slate-400" suppressHydrationWarning>
                {nowLabel}
              </span>
            )}
          </div>
        </Link>
        <div className="flex items-center space-x-3 max-[767px]:space-x-1">
          <div className="hidden md:flex items-center space-x-6 text-xs font-black text-slate-500">
            <Link href={externalLinks.home} className="hover:text-blue-600 transition-colors">{t.menuHome}</Link>
            <a href={externalLinks.features} className="hover:text-blue-600 transition-colors" target="_blank" rel="noreferrer">{t.menuFeatures}</a>
            <a href={externalLinks.pricing} className="hover:text-blue-600 transition-colors" target="_blank" rel="noreferrer">{t.menuPricing}</a>
            <a href={externalLinks.blog} className="hover:text-blue-600 transition-colors" target="_blank" rel="noreferrer">{t.menuBlog}</a>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen(prev => !prev)}
                className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
              >
                <span>{t.languages}</span>
                <i className="fas fa-chevron-down text-[10px] text-slate-400"></i>
              </button>
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                  {Object.entries(languageNames).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => { setLanguage(code as Language); setIsLanguageMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black transition-all ${language === code ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 max-[767px]:space-x-0">
            <Link
              href="/trash"
              className="relative w-11 h-11 max-[767px]:w-10 max-[767px]:h-10 text-slate-600 flex items-center justify-center"
              title={t.menuTrash || 'Trash'}
            >
              <i className="far fa-trash-alt" style={{ fontSize:22 }}></i>
              <span
                className="absolute flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal"
                style={{ top: "3px", right: "4px" }}
              >
                {trashCount}
              </span>
            </Link>
            <Link
              href={userId ? '/settings' : '/auth'}
              className={`w-11 h-11 max-[767px]:w-10 max-[767px]:h-10 flex items-center justify-center ${userId ? 'text-emerald-600' : 'text-slate-600'}`}
              title={userId ? (userEmail || 'Logged in') : 'Login'}
            >
              <i className={`${userId ? 'fas fa-lock' : 'far fa-user'}`} style={{ fontSize:22 }}></i>
            </Link>
            <Link href="/reminders" className="relative w-11 h-11 max-[767px]:w-10 max-[767px]:h-10 text-slate-600 flex items-center justify-center">
              <i className="far fa-bell" style={{ fontSize:22 }}></i>
              <span
                className="absolute flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal"
                style={{ top: "3px", right: "4px" }}
              >
                {userId ? reminderCount : bellCount}
              </span>
            </Link>
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden w-11 h-11 max-[767px]:w-10 max-[767px]:h-10 text-slate-600 flex items-center justify-center">
              <i className="fas fa-bars" style={{ fontSize:24 }}></i>
            </button>
          </div>
          </div>
        </header>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-4 md:pt-8">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 animate-in slide-in-from-bottom-8 fade-in duration-300 max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-3">
                <Link href={externalLinks.home} className="hover:border-blue-300" onClick={() => setIsMenuOpen(false)}>{t.menuHome}</Link>
                <a href={externalLinks.features} target="_blank" rel="noreferrer" className="hover:border-blue-300">{t.menuFeatures}</a>
                <a href={externalLinks.pricing} target="_blank" rel="noreferrer" className="hover:border-blue-300">{t.menuPricing}</a>
                <a href={externalLinks.blog} target="_blank" rel="noreferrer" className="hover:border-blue-300">{t.menuBlog}</a>
                <Link href="/trash" className="hover:border-blue-300" onClick={() => setIsMenuOpen(false)}>
                  {t.menuTrash || 'Trash'}
                </Link>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
                  <span className="flex items-center"><i className="fas fa-globe mr-2"></i> {t.languages}</span>
                </div>
                <div className="mt-3 flex flex-col space-y-2">
                  {Object.entries(languageNames).map(([code, name]) => (
                    <button 
                      key={code} 
                      onClick={() => { setLanguage(code as Language); setIsMenuOpen(false); }}
                      className={`flex items-center justify-between px-4 py-2 rounded-2xl border transition-all font-bold text-xs ${language === code ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                    >
                      <span>{name}</span>
                      <span>{languageFlags[code as Language]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
