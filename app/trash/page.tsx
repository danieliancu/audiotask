"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AppHeader from '@/components/AppHeader';
import { Language, TodoItem } from '@/types';
const LANGUAGE_STORAGE_KEY = 'voicetask.language';

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
  notes: string;
  tasks: string;
  all: string;
  deleteAll: string;
  loginRequired: string;
  login: string;
  empty: string;
  restore: string;
  deleteForever: string;
  deletedAt: string;
  confirmDelete: string;
  confirmDeleteAll: string;
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
    notes: 'Notes',
    tasks: 'Tasks',
    all: 'All',
    deleteAll: 'Delete all',
    loginRequired: 'You need to log in.',
    login: 'Login',
    empty: 'Trash is empty.',
    restore: 'Restore',
    deleteForever: 'Delete forever',
    deletedAt: 'Deleted',
    confirmDelete: 'Delete this item permanently?',
    confirmDeleteAll: 'Delete all items permanently from trash?'
  },
  ro: {
    appTitle: 'VoiceTask',
    menuHome: 'Acasa',
    menuFeatures: 'Functionalitati',
    menuPricing: 'Preturi',
    menuBlog: 'Blog',
    menuTrash: 'Cos',
    languages: 'Limbi',
    close: 'Inchide',
    title: 'Cos',
    notes: 'Notite',
    tasks: 'Taskuri',
    all: 'Toate',
    deleteAll: 'Sterge tot',
    loginRequired: 'Trebuie sa te loghezi.',
    login: 'Login',
    empty: 'Cosul este gol.',
    restore: 'Restaureaza',
    deleteForever: 'Sterge definitiv',
    deletedAt: 'Sters',
    confirmDelete: 'Stergi definitiv acest element?',
    confirmDeleteAll: 'Stergi definitiv toate elementele din cos?'
  },
  fr: {
    appTitle: 'VoiceTask',
    menuHome: 'Accueil',
    menuFeatures: 'Fonctionnalites',
    menuPricing: 'Tarifs',
    menuBlog: 'Blog',
    menuTrash: 'Corbeille',
    languages: 'Langues',
    close: 'Fermer',
    title: 'Corbeille',
    notes: 'Notes',
    tasks: 'Taches',
    all: 'Tout',
    deleteAll: 'Tout supprimer',
    loginRequired: 'Vous devez vous connecter.',
    login: 'Connexion',
    empty: 'La corbeille est vide.',
    restore: 'Restaurer',
    deleteForever: 'Supprimer definitivement',
    deletedAt: 'Supprime',
    confirmDelete: 'Supprimer definitivement cet element ?',
    confirmDeleteAll: 'Supprimer definitivement tous les elements de la corbeille ?'
  },
  de: {
    appTitle: 'VoiceTask',
    menuHome: 'Startseite',
    menuFeatures: 'Funktionen',
    menuPricing: 'Preise',
    menuBlog: 'Blog',
    menuTrash: 'Papierkorb',
    languages: 'Sprachen',
    close: 'Schliessen',
    title: 'Papierkorb',
    notes: 'Notizen',
    tasks: 'Aufgaben',
    all: 'Alle',
    deleteAll: 'Alles loeschen',
    loginRequired: 'Bitte einloggen.',
    login: 'Login',
    empty: 'Papierkorb ist leer.',
    restore: 'Wiederherstellen',
    deleteForever: 'Endgueltig loeschen',
    deletedAt: 'Geloescht',
    confirmDelete: 'Dieses Element dauerhaft loeschen?',
    confirmDeleteAll: 'Alle Elemente im Papierkorb dauerhaft loeschen?'
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
    notes: 'Notas',
    tasks: 'Tareas',
    all: 'Todo',
    deleteAll: 'Eliminar todo',
    loginRequired: 'Necesitas iniciar sesion.',
    login: 'Login',
    empty: 'La papelera esta vacia.',
    restore: 'Restaurar',
    deleteForever: 'Eliminar definitivamente',
    deletedAt: 'Eliminado',
    confirmDelete: 'Eliminar este elemento definitivamente?',
    confirmDeleteAll: 'Eliminar definitivamente todos los elementos de la papelera?'
  }
};

const languageNames: Record<Language, string> = {
  en: 'English',
  ro: 'Romana',
  fr: 'Francais',
  de: 'Deutsch',
  es: 'Espanol'
};

const languageFlags: Record<Language, string> = {
  en: 'US',
  ro: 'RO',
  fr: 'FR',
  de: 'DE',
  es: 'ES'
};

export default function TrashPage() {
  const { data: session } = useSession();
  const [pageLanguage, setPageLanguage] = useState<Language>('en');
  const [nowLabel, setNowLabel] = useState('');
  const [items, setItems] = useState<TodoItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'task' | 'event'>('all');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const t = useMemo(() => translations[pageLanguage], [pageLanguage]);
  const getTypeLabel = (type: TodoItem['type']) => (type === 'task' ? t.notes : t.tasks);
  const filteredItems = useMemo(
    () => (filterType === 'all' ? items : items.filter(item => item.type === filterType)),
    [items, filterType]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['en', 'ro', 'fr', 'de', 'es'].includes(saved)) {
      setPageLanguage(saved as Language);
    }
  }, []);

  useEffect(() => {
    const formatNow = (d: Date) => {
      const dateParts = new Intl.DateTimeFormat(pageLanguage, { day: '2-digit', month: 'short' }).formatToParts(d);
      const dateLabel = dateParts
        .map((part) => {
          if (part.type !== 'month') return part.value;
          const lettersRaw = part.value.match(/\p{L}+/gu)?.join('') || part.value;
          const monthLetters = lettersRaw.slice(0, 3);
          const first = lettersRaw.charAt(0);
          const isUpper = first && first === first.toLocaleUpperCase(pageLanguage) && first !== first.toLocaleLowerCase(pageLanguage);
          const normalized = isUpper
            ? `${monthLetters.charAt(0).toLocaleUpperCase(pageLanguage)}${monthLetters.slice(1).toLocaleLowerCase(pageLanguage)}`
            : monthLetters.toLocaleLowerCase(pageLanguage);
          return `${normalized}.`;
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      const timeLabel = d.toLocaleTimeString(pageLanguage, { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' });
      return `${dateLabel} • ${timeLabel}`;
    };
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

  const handleLanguageChange = (lang: Language) => {
    setPageLanguage(lang);
    if (typeof window !== 'undefined') localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (!session?.user?.id) return;
    void fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang })
    }).catch(() => {});
  };

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

  const deleteAll = async () => {
    if (!confirm(t.confirmDeleteAll)) return;
    setIsDeletingAll(true);
    const res = await fetch('/api/todos/trash', { method: 'DELETE', credentials: 'include' });
    setIsDeletingAll(false);
    if (res.ok) {
      loadTrash();
      window.dispatchEvent(new Event('trash-count-refresh'));
    }
  };

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-[#FDF5E6] text-slate-900 selection:bg-blue-100 pb-20">
        <AppHeader
          t={t}
          language={pageLanguage}
          setLanguage={handleLanguageChange}
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
          <Link href="/auth" className="inline-flex rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100">
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
        setLanguage={handleLanguageChange}
        languageNames={languageNames}
        languageFlags={languageFlags}
        nowLabel={nowLabel}
        userId={session?.user?.id}
        userEmail={session?.user?.email}
        bellCount={0}
      />

      <div className="mx-auto max-w-4xl px-6 space-y-5">
        <h1 className="text-[32px] md:text-xl font-black uppercase tracking-widest text-slate-800">{t.title}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-300'}`}
          >
            {t.all}
          </button>
          <button
            onClick={() => setFilterType('task')}
            className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${filterType === 'task' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-300'}`}
          >
            {t.notes}
          </button>
          <button
            onClick={() => setFilterType('event')}
            className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${filterType === 'event' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-300'}`}
          >
            {t.tasks}
          </button>
          <button
            onClick={deleteAll}
            disabled={isDeletingAll || items.length === 0}
            className="rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {t.deleteAll}
          </button>
        </div>

        {loading ? (
          <p className="text-sm font-semibold text-slate-500">...</p>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[28px] border border-slate-300 bg-slate-100 p-8 text-sm font-semibold text-slate-500 shadow-sm">
            {t.empty}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <div key={item.id} className="rounded-[28px] border border-slate-300 bg-slate-100 p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      #{item.id} • {getTypeLabel(item.type)}
                    </div>
                    <p className="text-base font-bold text-slate-800 leading-tight">{item.title || item.text}</p>
                    {item.title && item.text && (
                      <p className="text-sm font-semibold text-slate-600 whitespace-pre-wrap">{item.text}</p>
                    )}
                    <p className="text-xs font-semibold text-slate-400">
                      {t.deletedAt}: {item.deletedAt ? new Date(item.deletedAt).toLocaleString(pageLanguage) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreItem(item.id)}
                      disabled={busyId === item.id}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      {t.restore}
                    </button>
                    <button
                      onClick={() => deleteForever(item.id)}
                      disabled={busyId === item.id}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
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
