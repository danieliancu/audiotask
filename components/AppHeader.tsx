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
      <header className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VT</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg text-gray-900">{t.appTitle}</span>
              {nowLabel && (
                <span className="text-[12px] font-semibold text-gray-500" suppressHydrationWarning>
                  {nowLabel}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-1.5 md:gap-3">
            <nav className="hidden md:flex items-center gap-4">
              <Link href={externalLinks.home} className="text-sm text-gray-700 hover:text-purple-600 transition-colors">
                {t.menuHome}
              </Link>
              <a href={externalLinks.features} className="text-sm text-gray-700 hover:text-purple-600 transition-colors" target="_blank" rel="noreferrer">
                {t.menuFeatures}
              </a>
              <a href={externalLinks.pricing} className="text-sm text-gray-700 hover:text-purple-600 transition-colors" target="_blank" rel="noreferrer">
                {t.menuPricing}
              </a>
              <a href={externalLinks.blog} className="text-sm text-gray-700 hover:text-purple-600 transition-colors" target="_blank" rel="noreferrer">
                {t.menuBlog}
              </a>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLanguageMenuOpen(prev => !prev)}
                  className="flex items-center gap-1 text-sm text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <span>{t.languages}</span>
                  <i className="fas fa-chevron-down text-[11px]"></i>
                </button>
                {isLanguageMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50">
                    {Object.entries(languageNames).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => { setLanguage(code as Language); setIsLanguageMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          language === code ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <Link
              href="/trash"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative text-gray-600"
              title={t.menuTrash || 'Trash'}
            >
              <i className="far fa-trash-alt text-base"></i>
              <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] text-white leading-none">
                {trashCount}
              </span>
            </Link>
            <Link
              href={userId ? '/settings' : '/auth'}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${userId ? 'text-emerald-600' : 'text-gray-600'}`}
              title={userId ? (userEmail || 'Profile') : 'Login'}
            >
              <i className={`${userId ? 'fas fa-user' : 'far fa-user'} text-base`}></i>
            </Link>
            <Link href="/reminders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative text-gray-600">
              <i className="far fa-bell text-base"></i>
              <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] text-white leading-none">
                {userId ? reminderCount : bellCount}
              </span>
            </Link>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <i className="fas fa-bars text-base"></i>
            </button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/35" onClick={() => setIsMenuOpen(false)}></div>
        <aside className={`absolute right-0 top-0 bottom-0 w-[88%] max-w-[360px] bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="p-5 pt-14 flex flex-col space-y-5">
              <div className="flex flex-col space-y-2">
                <Link href={externalLinks.home} className="text-sm text-slate-700 hover:text-purple-600 transition-colors" onClick={() => setIsMenuOpen(false)}>{t.menuHome}</Link>
                <a href={externalLinks.features} target="_blank" rel="noreferrer" className="text-sm text-slate-700 hover:text-purple-600 transition-colors">{t.menuFeatures}</a>
                <a href={externalLinks.pricing} target="_blank" rel="noreferrer" className="text-sm text-slate-700 hover:text-purple-600 transition-colors">{t.menuPricing}</a>
                <a href={externalLinks.blog} target="_blank" rel="noreferrer" className="text-sm text-slate-700 hover:text-purple-600 transition-colors">{t.menuBlog}</a>
                <Link href="/trash" className="text-sm text-slate-700 hover:text-purple-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  {t.menuTrash || 'Trash'}
                </Link>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                  <span className="flex items-center"><i className="fas fa-globe mr-2"></i> {t.languages}</span>
                </div>
                <div className="mt-3 flex flex-col space-y-2">
                  {Object.entries(languageNames).map(([code, name]) => (
                    <button 
                      key={code} 
                      onClick={() => { setLanguage(code as Language); setIsMenuOpen(false); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                        language === code ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{name}</span>
                      <span>{languageFlags[code as Language]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
        </aside>
      </div>
    </>
  );
}
