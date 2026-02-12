"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AppHeader from '@/components/AppHeader';
import { Language, TodoItem } from '@/types';

type TrashCopy = {
  appTitle: string;
  menuHome: string;
  menuFeatures: string;
  menuPricing: string;
  menuBlog: string;
  menuTrash: string;
  languages: string;
  close: string;
  title: string;
  loginRequired: string;
  login: string;
  empty: string;
  restore: string;
  deleteForever: string;
  deletedAt: string;
  confirmDelete: string;
};

const translations: Record<Language, TrashCopy> = {
  en: {
    appTitle: 'VoiceTask',
    menuHome: 'Home',
    menuFeatures: 'Features',
    menuPricing: 'Pricing',
    menuBlog: 'Blog',
    menuTrash: 'Trash',
    languages: 'Languages',
    close: 'Close',
    title: 'Trash',
    loginRequired: 'You need to log in.',
    login: 'Login',
    empty: 'Trash is empty.',
    restore: 'Restore',
    deleteForever: 'Delete forever',
    deletedAt: 'Deleted',
    confirmDelete: 'Delete this item permanently?'
  },
  ro: {
    appTitle: 'VoiceTask',
    menuHome: 'Acasă',
    menuFeatures: 'Funcționalități',
    menuPricing: 'Prețuri',
    menuBlog: 'Blog',
    menuTrash: 'Coș',
    languages: 'Limbi',
    close: 'Închide',
    title: 'Coș de gunoi',
    loginRequired: 'Trebuie să te loghezi.',
    login: 'Login',
    empty: 'Coșul este gol.',
    restore: 'Restore',
    deleteForever: 'Șterge definitiv',
    deletedAt: 'Șters la',
    confirmDelete: 'Ștergi definitiv acest element?'
  },
  fr: {
    appTitle: 'VoiceTask',
    menuHome: 'Accueil',
    menuFeatures: 'Fonctionnalités',
    menuPricing: 'Tarifs',
    menuBlog: 'Blog',
    menuTrash: 'Corbeille',
    languages: 'Langues',
    close: 'Fermer',
    title: 'Corbeille',
    loginRequired: 'Vous devez vous connecter.',
    login: 'Connexion',
    empty: 'La corbeille est vide.',
    restore: 'Restaurer',
    deleteForever: 'Supprimer définitivement',
    deletedAt: 'Supprimé',
    confirmDelete: 'Supprimer définitivement cet élément ?'
  },
  de: {
    appTitle: 'VoiceTask',
    menuHome: 'Startseite',
    menuFeatures: 'Funktionen',
    menuPricing: 'Preise',
    menuBlog: 'Blog',
    menuTrash: 'Papierkorb',
    languages: 'Sprachen',
    close: 'Schließen',
    title: 'Papierkorb',
    loginRequired: 'Bitte einloggen.',
    login: 'Login',
    empty: 'Papierkorb ist leer.',
    restore: 'Wiederherstellen',
    deleteForever: 'Endgültig löschen',
    deletedAt: 'Gelöscht',
    confirmDelete: 'Dieses Element dauerhaft löschen?'
  },
  es: {
    appTitle: 'VoiceTask',
    menuHome: 'Inicio',
    menuFeatures: 'Funcionalidades',
    menuPricing: 'Precios',
    menuBlog: 'Blog',
    menuTrash: 'Papelera',
    languages: 'Idiomas',
    close: 'Cerrar',
    title: 'Papelera',
    loginRequired: 'Necesitas iniciar sesión.',
    login: 'Login',
    empty: 'La papelera está vacía.',
    restore: 'Restaurar',
    deleteForever: 'Eliminar definitivamente',
    deletedAt: 'Eliminado',
    confirmDelete: '¿Eliminar este elemento definitivamente?'
  }
};

const languageNames: Record<Language, string> = {
  en: 'English',
  ro: 'Română',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español'
};

const languageFlags: Record<Language, string> = {
  en: '🇺🇸',
  ro: '🇷🇴',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸'
};

export default function TrashPage() {
  const { data: session } = useSession();
  const [pageLanguage, setPageLanguage] = useState<Language>('en');
  const [nowLabel, setNowLabel] = useState('');
  const [items, setItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const t = useMemo(() => translations[pageLanguage], [pageLanguage]);

  useEffect(() => {
    const formatNow = (d: Date) => (
      `${d.toLocaleDateString(pageLanguage, { day: '2-digit', month: 'long' })}. ${d.toLocaleTimeString(pageLanguage, { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' })}`
    );
    setNowLabel(formatNow(new Date()));
    const timer = setInterval(() => {
      setNowLabel(formatNow(new Date()));
    }, 60000);
    return () => clearInterval(timer);
  }, [pageLanguage]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/settings')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        const persistedLanguage = ['en', 'ro', 'fr', 'de', 'es'].includes(data.language) ? data.language : '';
        const lang = ['en', 'ro', 'fr', 'de', 'es'].includes(data.defaultLanguage) ? data.defaultLanguage : 'en';
        setPageLanguage((persistedLanguage || lang) as Language);
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const loadTrash = useCallback(() => {
    if (!session?.user?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    void fetch('/api/todos/trash', { credentials: 'include', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const restoreItem = async (id: string) => {
    setBusyId(id);
    const res = await fetch(`/api/todos/${id}/restore`, { method: 'POST', credentials: 'include' });
    setBusyId(null);
    if (res.ok) {
      loadTrash();
      window.dispatchEvent(new CustomEvent('trash-count-refresh', { detail: { delta: -1 } }));
    }
  };

  const deleteForever = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    setBusyId(id);
    const res = await fetch(`/api/todos/${id}/permanent`, { method: 'DELETE', credentials: 'include' });
    setBusyId(null);
    if (res.ok) {
      loadTrash();
      window.dispatchEvent(new CustomEvent('trash-count-refresh', { detail: { delta: -1 } }));
    }
  };

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-[#FDF5E6] text-slate-900 selection:bg-blue-100 pb-20">
        <AppHeader
          t={t}
          language={pageLanguage}
          setLanguage={setPageLanguage}
          languageNames={languageNames}
          languageFlags={languageFlags}
          nowLabel={nowLabel}
          userId={session?.user?.id}
          userEmail={session?.user?.email}
          bellCount={0}
        />
        <div className="mx-auto max-w-lg px-6 text-center space-y-4">
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">{t.title}</h1>
          <p className="text-sm font-semibold text-slate-500">{t.loginRequired}</p>
          <Link href="/auth" className="inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100">
            {t.login}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF5E6] text-slate-900 selection:bg-blue-100 pb-20">
      <AppHeader
        t={t}
        language={pageLanguage}
        setLanguage={setPageLanguage}
        languageNames={languageNames}
        languageFlags={languageFlags}
        nowLabel={nowLabel}
        userId={session?.user?.id}
        userEmail={session?.user?.email}
        bellCount={0}
      />

      <div className="mx-auto max-w-4xl px-6 space-y-5">
        <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">{t.title}</h1>
        {loading ? (
          <p className="text-sm font-semibold text-slate-500">...</p>
        ) : items.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
            {t.empty}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      #{item.id} • {item.type}
                    </div>
                    <p className="text-base font-bold text-slate-800">{item.text}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {t.deletedAt}: {item.deletedAt ? new Date(item.deletedAt).toLocaleString(pageLanguage) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreItem(item.id)}
                      disabled={busyId === item.id}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      {t.restore}
                    </button>
                    <button
                      onClick={() => deleteForever(item.id)}
                      disabled={busyId === item.id}
                      className="rounded-xl bg-red-600 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      {t.deleteForever}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
