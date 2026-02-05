"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';

type Language = 'en' | 'ro' | 'fr' | 'de' | 'es';

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

const translations = {
  en: {
    title: 'Settings',
    loginRequired: 'You need to log in.',
    login: 'Login',
    profile: 'Profile',
    username: 'Username',
    password: 'Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    save: 'Save',
    defaults: 'Defaults',
    defaultLanguage: 'Language',
    defaultActiveTab: 'Default tab',
    defaultShowSubtasks: 'Show subtasks by default',
    tasks: 'Tasks',
    events: 'Events',
    logout: 'Logout',
    saved: 'Saved',
    error: 'Something went wrong',
    appTitle: 'VoiceTask',
    menuHome: 'Home',
    menuFeatures: 'Features',
    menuPricing: 'Pricing',
    menuBlog: 'Blog',
    languages: 'Languages',
    menuTitle: 'Menu',
    close: 'Close'
  },
  ro: {
    title: 'Setări',
    loginRequired: 'Trebuie să te loghezi.',
    login: 'Login',
    profile: 'Profil',
    username: 'Username',
    password: 'Parolă',
    currentPassword: 'Parola curentă',
    newPassword: 'Parolă nouă',
    confirmPassword: 'Confirmă parola',
    save: 'Salvează',
    defaults: 'Setări implicite',
    defaultLanguage: 'Limbă',
    defaultActiveTab: 'Tab implicit',
    defaultShowSubtasks: 'Afișează subtask-uri implicit',
    tasks: 'Taskuri',
    events: 'Evenimente',
    logout: 'Logout',
    saved: 'Salvat',
    error: 'A apărut o eroare',
    appTitle: 'VoiceTask',
    menuHome: 'Acasă',
    menuFeatures: 'Funcționalități',
    menuPricing: 'Prețuri',
    menuBlog: 'Blog',
    languages: 'Limbi',
    menuTitle: 'Meniu',
    close: 'Închide'
  },
  fr: {
    title: 'Paramètres',
    loginRequired: 'Vous devez vous connecter.',
    login: 'Connexion',
    profile: 'Profil',
    username: 'Nom d’utilisateur',
    password: 'Mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    save: 'Enregistrer',
    defaults: 'Valeurs par défaut',
    defaultLanguage: 'Langue',
    defaultActiveTab: 'Onglet par défaut',
    defaultShowSubtasks: 'Afficher les sous-tâches par défaut',
    tasks: 'Tâches',
    events: 'Événements',
    logout: 'Déconnexion',
    saved: 'Enregistré',
    error: 'Une erreur est survenue',
    appTitle: 'VoiceTask',
    menuHome: 'Accueil',
    menuFeatures: 'Fonctionnalités',
    menuPricing: 'Tarifs',
    menuBlog: 'Blog',
    languages: 'Langues',
    menuTitle: 'Menu',
    close: 'Fermer'
  },
  de: {
    title: 'Einstellungen',
    loginRequired: 'Bitte einloggen.',
    login: 'Login',
    profile: 'Profil',
    username: 'Benutzername',
    password: 'Passwort',
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort bestätigen',
    save: 'Speichern',
    defaults: 'Standardwerte',
    defaultLanguage: 'Sprache',
    defaultActiveTab: 'Standard-Tab',
    defaultShowSubtasks: 'Unteraufgaben standardmäßig anzeigen',
    tasks: 'Aufgaben',
    events: 'Termine',
    logout: 'Logout',
    saved: 'Gespeichert',
    error: 'Ein Fehler ist aufgetreten',
    appTitle: 'VoiceTask',
    menuHome: 'Startseite',
    menuFeatures: 'Funktionen',
    menuPricing: 'Preise',
    menuBlog: 'Blog',
    languages: 'Sprachen',
    menuTitle: 'Menü',
    close: 'Schließen'
  },
  es: {
    title: 'Ajustes',
    loginRequired: 'Necesitas iniciar sesión.',
    login: 'Login',
    profile: 'Perfil',
    username: 'Usuario',
    password: 'Contraseña',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    save: 'Guardar',
    defaults: 'Valores por defecto',
    defaultLanguage: 'Idioma',
    defaultActiveTab: 'Pestaña por defecto',
    defaultShowSubtasks: 'Mostrar subtareas por defecto',
    tasks: 'Tareas',
    events: 'Eventos',
    logout: 'Logout',
    saved: 'Guardado',
    error: 'Ha ocurrido un error',
    appTitle: 'VoiceTask',
    menuHome: 'Inicio',
    menuFeatures: 'Funcionalidades',
    menuPricing: 'Precios',
    menuBlog: 'Blog',
    languages: 'Idiomas',
    menuTitle: 'Menú',
    close: 'Cerrar'
  }
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [pageLanguage, setPageLanguage] = useState<Language>('en');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('en');
  const [defaultActiveTab, setDefaultActiveTab] = useState<'task' | 'event'>('task');
  const [defaultShowSubtasks, setDefaultShowSubtasks] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [nowLabel, setNowLabel] = useState('');

  const t = useMemo(() => translations[pageLanguage], [pageLanguage]);

  useEffect(() => {
    if (session?.user?.name) setUsername(session.user.name);
  }, [session?.user?.name]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/settings')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        const lang = ['en', 'ro', 'fr', 'de', 'es'].includes(data.defaultLanguage) ? data.defaultLanguage : 'en';
        const tab = data.defaultActiveTab === 'event' ? 'event' : 'task';
        setDefaultLanguage(lang);
        setDefaultActiveTab(tab);
        setDefaultShowSubtasks(Boolean(data.defaultShowSubtasks));
        setPageLanguage(lang);
      })
      .catch(() => {});
  }, [session?.user?.id]);

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

  const saveProfile = async () => {
    setStatus('idle');
    const res = await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
        confirmPassword: confirmPassword || undefined
      })
    });
    setStatus(res.ok ? 'saved' : 'error');
    if (res.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const saveDefaults = async () => {
    setStatus('idle');
    const res = await fetch('/api/settings/defaults', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        defaultLanguage,
        defaultActiveTab,
        defaultShowSubtasks
      })
    });
    setStatus(res.ok ? 'saved' : 'error');
    if (res.ok) setPageLanguage(defaultLanguage);
  };

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-[#FDF5E6] text-slate-900 selection:bg-blue-100 pb-20">
        <AppHeader
          t={{
            appTitle: t.appTitle,
            menuHome: t.menuHome,
            menuFeatures: t.menuFeatures,
            menuPricing: t.menuPricing,
            menuBlog: t.menuBlog,
            languages: t.languages,
            close: t.close
          }}
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
        t={{
          appTitle: t.appTitle,
          menuHome: t.menuHome,
          menuFeatures: t.menuFeatures,
          menuPricing: t.menuPricing,
          menuBlog: t.menuBlog,
          languages: t.languages,
          close: t.close
        }}
        language={pageLanguage}
        setLanguage={setPageLanguage}
        languageNames={languageNames}
        languageFlags={languageFlags}
        nowLabel={nowLabel}
        userId={session?.user?.id}
        userEmail={session?.user?.email}
        bellCount={0}
      />
      <div className="mx-auto max-w-3xl px-6 space-y-10">
        <div className="space-y-1">
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">{t.title}</h1>
          <p className="text-sm font-semibold text-slate-500">{session?.user?.email}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">{t.profile}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.username}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t.currentPassword}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.newPassword}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPassword}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <button
            onClick={saveProfile}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100"
          >
            {t.save}
          </button>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">{t.defaults}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value as Language)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {Object.entries(languageNames).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={defaultActiveTab}
              onChange={(e) => setDefaultActiveTab(e.target.value as 'task' | 'event')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="task">{t.tasks}</option>
              <option value="event">{t.events}</option>
            </select>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={defaultShowSubtasks}
                onChange={(e) => setDefaultShowSubtasks(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
              />
              <span>{t.defaultShowSubtasks}</span>
            </label>
          </div>
          <button
            onClick={saveDefaults}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100"
          >
            {t.save}
          </button>
        </section>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="inline-flex rounded-2xl bg-slate-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200"
        >
          {t.logout}
        </button>

        {status === 'saved' && <div className="text-xs font-semibold text-emerald-600">{t.saved}</div>}
        {status === 'error' && <div className="text-xs font-semibold text-red-600">{t.error}</div>}
      </div>
    </main>
  );
}
