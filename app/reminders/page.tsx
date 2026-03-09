"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AppHeader from '@/components/AppHeader';
import type { Language } from '@/types';

type ReminderItem = {
  id: string;
  localId?: string;
  title?: string;
  text: string;
  dueTime?: string;
  sortTimestamp: number;
  dueAt: number;
  reminderAt: number;
  reminderMinutesBefore: number;
  reminderChannel?: 'email' | 'sms' | 'push';
};

const LANGUAGE_STORAGE_KEY = 'voicetask.language';

const translations: Record<Language, {
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
  channel: string;
  before: string;
  dueAt: string;
  remaining: string;
}> = {
  en: {
    appTitle: 'VoiceTask', menuHome: 'Home', menuFeatures: 'Features', menuPricing: 'Pricing', menuBlog: 'Blog', menuTrash: 'Trash', languages: 'Languages', close: 'Close',
    title: 'Reminders', loginRequired: 'You need to log in.', login: 'Login', empty: 'No active reminders.',
    channel: 'Channel', before: 'Before', dueAt: 'Due at', remaining: 'Time left'
  },
  ro: {
    appTitle: 'VoiceTask', menuHome: 'Acasa', menuFeatures: 'Functionalitati', menuPricing: 'Preturi', menuBlog: 'Blog', menuTrash: 'Cos', languages: 'Limbi', close: 'Inchide',
    title: 'Remindere', loginRequired: 'Trebuie sa te loghezi.', login: 'Login', empty: 'Nu exista remindere active.',
    channel: 'Canal', before: 'Inainte cu', dueAt: 'Scadenta', remaining: 'Timp ramas'
  },
  fr: {
    appTitle: 'VoiceTask', menuHome: 'Accueil', menuFeatures: 'Fonctionnalites', menuPricing: 'Tarifs', menuBlog: 'Blog', menuTrash: 'Corbeille', languages: 'Langues', close: 'Fermer',
    title: 'Rappels', loginRequired: 'Vous devez vous connecter.', login: 'Connexion', empty: 'Aucun rappel actif.',
    channel: 'Canal', before: 'Avant', dueAt: 'Echeance', remaining: 'Temps restant'
  },
  de: {
    appTitle: 'VoiceTask', menuHome: 'Startseite', menuFeatures: 'Funktionen', menuPricing: 'Preise', menuBlog: 'Blog', menuTrash: 'Papierkorb', languages: 'Sprachen', close: 'Schliessen',
    title: 'Erinnerungen', loginRequired: 'Bitte einloggen.', login: 'Login', empty: 'Keine aktiven Erinnerungen.',
    channel: 'Kanal', before: 'Davor', dueAt: 'Fällig am', remaining: 'Verbleibende Zeit'
  },
  es: {
    appTitle: 'VoiceTask', menuHome: 'Inicio', menuFeatures: 'Funcionalidades', menuPricing: 'Precios', menuBlog: 'Blog', menuTrash: 'Papelera', languages: 'Idiomas', close: 'Cerrar',
    title: 'Recordatorios', loginRequired: 'Necesitas iniciar sesion.', login: 'Login', empty: 'No hay recordatorios activos.',
    channel: 'Canal', before: 'Antes', dueAt: 'Vence', remaining: 'Tiempo restante'
  }
};

const languageNames: Record<Language, string> = { en: 'English', ro: 'Romana', fr: 'Francais', de: 'Deutsch', es: 'Espanol' };
const languageFlags: Record<Language, string> = { en: 'US', ro: 'RO', fr: 'FR', de: 'DE', es: 'ES' };

const formatDurationWords = (totalMinutes: number, language: Language) => {
  const minutesTotal = Math.max(0, Math.floor(totalMinutes));
  const days = Math.floor(minutesTotal / (24 * 60));
  const hours = Math.floor((minutesTotal % (24 * 60)) / 60);
  const minutes = minutesTotal % 60;
  const useDaysAndHours = minutesTotal >= 24 * 60;
  const shouldUseRomanianDeForHourMinute = (value: number) => {
    const abs = Math.abs(value);
    if (abs < 20) return false;
    const lastTwo = abs % 100;
    return !(lastTwo > 0 && lastTwo < 20);
  };
  const formatUnit = (value: number, unit: 'day' | 'hour' | 'minute') => {
    switch (language) {
      case 'ro': {
        if (unit === 'day') return value === 1 ? 'o zi' : `${value} zile`;
        if (unit === 'hour') return value === 1 ? 'o ora' : (shouldUseRomanianDeForHourMinute(value) ? `${value} de ore` : `${value} ore`);
        return value === 1 ? 'un minut' : (shouldUseRomanianDeForHourMinute(value) ? `${value} de minute` : `${value} minute`);
      }
      case 'fr': {
        if (unit === 'day') return value === 1 ? '1 jour' : `${value} jours`;
        if (unit === 'hour') return value === 1 ? '1 heure' : `${value} heures`;
        return value === 1 ? '1 minute' : `${value} minutes`;
      }
      case 'de': {
        if (unit === 'day') return value === 1 ? '1 Tag' : `${value} Tage`;
        if (unit === 'hour') return value === 1 ? '1 Stunde' : `${value} Stunden`;
        return value === 1 ? '1 Minute' : `${value} Minuten`;
      }
      case 'es': {
        if (unit === 'day') return value === 1 ? '1 dia' : `${value} dias`;
        if (unit === 'hour') return value === 1 ? '1 hora' : `${value} horas`;
        return value === 1 ? '1 minuto' : `${value} minutos`;
      }
      default: {
        if (unit === 'day') return value === 1 ? '1 day' : `${value} days`;
        if (unit === 'hour') return value === 1 ? '1 hour' : `${value} hours`;
        return value === 1 ? '1 minute' : `${value} minutes`;
      }
    }
  };
  if (useDaysAndHours) {
    const parts = [
      days > 0 ? formatUnit(days, 'day') : '',
      hours > 0 ? formatUnit(hours, 'hour') : ''
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : formatUnit(0, 'hour');
  }
  const parts = [
    hours > 0 ? formatUnit(hours, 'hour') : '',
    minutes > 0 ? formatUnit(minutes, 'minute') : ''
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : formatUnit(0, 'minute');
};

export default function RemindersPage() {
  const { data: session } = useSession();
  const [pageLanguage, setPageLanguage] = useState<Language>('en');
  const [nowLabel, setNowLabel] = useState('');
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useMemo(() => translations[pageLanguage], [pageLanguage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['en', 'ro', 'fr', 'de', 'es'].includes(saved)) setPageLanguage(saved as Language);
  }, []);

  useEffect(() => {
    const formatNow = (d: Date) => {
      const dateLabel = d.toLocaleDateString(pageLanguage, { day: '2-digit', month: 'short' });
      const timeLabel = d.toLocaleTimeString(pageLanguage, { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' });
      return `${dateLabel} • ${timeLabel}`;
    };
    setNowLabel(formatNow(new Date()));
    const timer = setInterval(() => setNowLabel(formatNow(new Date())), 60000);
    return () => clearInterval(timer);
  }, [pageLanguage]);

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

  const loadReminders = useCallback(() => {
    if (!session?.user?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    void fetch('/api/todos/reminders', { credentials: 'include', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  useEffect(() => {
    const timer = setInterval(loadReminders, 30000);
    return () => clearInterval(timer);
  }, [loadReminders]);

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-gray-50 text-slate-900 selection:bg-purple-100 pb-20">
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
        <div className="mx-auto max-w-lg px-4 text-center space-y-4">
          <h1 className="text-2xl font-black text-slate-900">{t.title}</h1>
          <p className="text-sm font-semibold text-slate-500">{t.loginRequired}</p>
          <Link href="/auth" className="inline-flex rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-purple-200">
            {t.login}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 selection:bg-purple-100 pb-20">
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

      <div className="mx-auto max-w-4xl px-4 space-y-5">
        <h1 className="text-2xl font-black text-slate-900">{t.title}</h1>

        {loading ? (
          <p className="text-sm font-semibold text-slate-500">...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-300/70 bg-[#f2f2f3] p-8 text-sm font-semibold text-slate-500 shadow-sm">
            {t.empty}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="rounded-xl border border-gray-300/70 bg-[#f2f2f3] p-5 shadow-sm">
                <div className="space-y-2">
                  <div className="text-xs font-black tracking-wide text-slate-500">
                    #{item.localId || item.id}
                  </div>
                  <p className="text-base font-bold text-slate-800 leading-tight">{item.title || item.text}</p>
                  <p className="text-xs font-semibold text-slate-500">
  <i className="far fa-envelope mr-2 text-[11px] opacity-70"></i>
  {t.channel}: {(item.reminderChannel || 'email').toUpperCase()}
</p>
<p className="text-xs font-semibold text-slate-500">
  <i className="far fa-clock mr-2 text-[11px] opacity-70"></i>
  {t.before}: {formatDurationWords(item.reminderMinutesBefore, pageLanguage)}
</p>
<p className="text-xs font-semibold text-slate-500">
  <i className="far fa-calendar mr-2 text-[11px] opacity-70"></i>
  {t.dueAt}: {new Date(item.dueAt).toLocaleTimeString(pageLanguage, { hour: 'numeric', minute: '2-digit' })}
</p>
<p className="text-xs font-black text-purple-600">
  <i className="far fa-bell mr-2 text-[11px] opacity-70"></i>
  {t.remaining}: {formatDurationWords(Math.floor((item.dueAt - Date.now()) / 60000), pageLanguage)}
</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
