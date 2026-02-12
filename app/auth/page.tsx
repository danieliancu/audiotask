"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { signIn, useSession } from 'next-auth/react';
import AppHeader from '@/components/AppHeader';

export default function AuthPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [pageLanguage, setPageLanguage] = useState<'en' | 'ro' | 'fr' | 'de' | 'es'>('en');
  const [nowLabel, setNowLabel] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const headerTranslations = {
    en: { appTitle: 'VoiceTask', menuHome: 'Home', menuFeatures: 'Features', menuPricing: 'Pricing', menuBlog: 'Blog', languages: 'Languages', menuTitle: 'Menu', close: 'Close' },
    ro: { appTitle: 'VoiceTask', menuHome: 'Acasă', menuFeatures: 'Funcționalități', menuPricing: 'Prețuri', menuBlog: 'Blog', languages: 'Limbi', menuTitle: 'Meniu', close: 'Închide' },
    fr: { appTitle: 'VoiceTask', menuHome: 'Accueil', menuFeatures: 'Fonctionnalités', menuPricing: 'Tarifs', menuBlog: 'Blog', languages: 'Langues', menuTitle: 'Menu', close: 'Fermer' },
    de: { appTitle: 'VoiceTask', menuHome: 'Startseite', menuFeatures: 'Funktionen', menuPricing: 'Preise', menuBlog: 'Blog', languages: 'Sprachen', menuTitle: 'Menü', close: 'Schließen' },
    es: { appTitle: 'VoiceTask', menuHome: 'Inicio', menuFeatures: 'Funcionalidades', menuPricing: 'Precios', menuBlog: 'Blog', languages: 'Idiomas', menuTitle: 'Menú', close: 'Cerrar' }
  };

  const languageFlags = {
    en: '🇺🇸',
    ro: '🇷🇴',
    fr: '🇫🇷',
    de: '🇩🇪',
    es: '🇪🇸'
  } as const;

  const languageNames = {
    en: 'English',
    ro: 'Română',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español'
  } as const;

  const headerT = useMemo(() => headerTranslations[pageLanguage], [pageLanguage]);

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

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    await signIn('credentials', {
      email: loginEmail,
      password: loginPassword,
      callbackUrl: '/'
    });
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Signup failed');
      return;
    }
    await signIn('credentials', {
      email: signupEmail,
      password: signupPassword,
      callbackUrl: '/'
    });
  };

  return (
    <main className="min-h-screen bg-[#FDF5E6] text-slate-900 selection:bg-blue-100 pb-20">
      <AppHeader
        t={headerT}
        language={pageLanguage}
        setLanguage={setPageLanguage}
        languageNames={languageNames}
        languageFlags={languageFlags}
        nowLabel={nowLabel}
        userId={userId}
        userEmail={session?.user?.email}
        bellCount={0}
      />
      <div className="mx-auto max-w-3xl px-6 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-800">VoiceTask</h1>
          <p className="text-sm font-semibold text-slate-500">Login or create your account</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Login</h2>
            <form className="space-y-3" onSubmit={handleLogin}>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100">
                Login
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Sign Up</h2>
            <form className="space-y-3" onSubmit={handleSignup}>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                required
                minLength={6}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Password (min 6)"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                required
                minLength={6}
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100">
                Create Account
              </button>
            </form>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Social Login</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:border-blue-300"
            >
              Continue with Google
            </button>
            <button
              onClick={() => signIn('facebook', { callbackUrl: '/' })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:border-blue-300"
            >
              Continue with Facebook
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="text-center text-xs font-semibold text-slate-400">
          OAuth setup needed? Open <a className="underline" href="/setup">/setup</a>.
        </div>
      </div>
    </main>
  );
}
