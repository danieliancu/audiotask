"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getProviders, signIn, useSession } from 'next-auth/react';
import AppHeader from '@/components/AppHeader';
type Language = 'en' | 'ro' | 'fr' | 'de' | 'es';
const LANGUAGE_STORAGE_KEY = 'voicetask.language';

const authTranslations: Record<Language, {
  subtitle: string;
  loginTitle: string;
  signupTitle: string;
  loginButton: string;
  createAccountButton: string;
  socialTitle: string;
  continueGoogle: string;
  continueFacebook: string;
  passwordsDoNotMatch: string;
  signupFailed: string;
  email: string;
  password: string;
  fullName: string;
  passwordMin: string;
  confirmPassword: string;
}> = {
  en: {
    subtitle: 'Login or create your account',
    loginTitle: 'Login',
    signupTitle: 'Sign Up',
    loginButton: 'Login',
    createAccountButton: 'Create Account',
    socialTitle: 'Social Login',
    continueGoogle: 'Continue with Google',
    continueFacebook: 'Continue with Facebook',
    passwordsDoNotMatch: 'Passwords do not match',
    signupFailed: 'Signup failed',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    passwordMin: 'Password (min 6)',
    confirmPassword: 'Confirm password'
  },
  ro: {
    subtitle: 'Autentifica-te sau creeaza cont',
    loginTitle: 'Login',
    signupTitle: 'Inregistrare',
    loginButton: 'Login',
    createAccountButton: 'Creeaza cont',
    socialTitle: 'Login social',
    continueGoogle: 'Continua cu Google',
    continueFacebook: 'Continua cu Facebook',
    passwordsDoNotMatch: 'Parolele nu coincid',
    signupFailed: 'Inregistrarea a esuat',
    email: 'Email',
    password: 'Parola',
    fullName: 'Nume complet',
    passwordMin: 'Parola (minim 6)',
    confirmPassword: 'Confirma parola'
  },
  fr: {
    subtitle: 'Connectez-vous ou creez votre compte',
    loginTitle: 'Connexion',
    signupTitle: 'Inscription',
    loginButton: 'Connexion',
    createAccountButton: 'Creer un compte',
    socialTitle: 'Connexion sociale',
    continueGoogle: 'Continuer avec Google',
    continueFacebook: 'Continuer avec Facebook',
    passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',
    signupFailed: "Echec de l'inscription",
    email: 'Email',
    password: 'Mot de passe',
    fullName: 'Nom complet',
    passwordMin: 'Mot de passe (min 6)',
    confirmPassword: 'Confirmer le mot de passe'
  },
  de: {
    subtitle: 'Melde dich an oder erstelle ein Konto',
    loginTitle: 'Login',
    signupTitle: 'Registrieren',
    loginButton: 'Login',
    createAccountButton: 'Konto erstellen',
    socialTitle: 'Social Login',
    continueGoogle: 'Mit Google fortfahren',
    continueFacebook: 'Mit Facebook fortfahren',
    passwordsDoNotMatch: 'Passworter stimmen nicht uberein',
    signupFailed: 'Registrierung fehlgeschlagen',
    email: 'E-Mail',
    password: 'Passwort',
    fullName: 'Vollstandiger Name',
    passwordMin: 'Passwort (min 6)',
    confirmPassword: 'Passwort bestatigen'
  },
  es: {
    subtitle: 'Inicia sesion o crea tu cuenta',
    loginTitle: 'Login',
    signupTitle: 'Registro',
    loginButton: 'Iniciar sesion',
    createAccountButton: 'Crear cuenta',
    socialTitle: 'Login social',
    continueGoogle: 'Continuar con Google',
    continueFacebook: 'Continuar con Facebook',
    passwordsDoNotMatch: 'Las contrasenas no coinciden',
    signupFailed: 'El registro fallo',
    email: 'Email',
    password: 'Contrasena',
    fullName: 'Nombre completo',
    passwordMin: 'Contrasena (min 6)',
    confirmPassword: 'Confirmar contrasena'
  }
};

export default function AuthPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [pageLanguage, setPageLanguage] = useState<Language>('en');
  const [nowLabel, setNowLabel] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [availableOauthProviders, setAvailableOauthProviders] = useState<Record<string, boolean>>({});

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
  const authT = useMemo(() => authTranslations[pageLanguage], [pageLanguage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['en', 'ro', 'fr', 'de', 'es'].includes(saved)) {
      setPageLanguage(saved as Language);
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setPageLanguage(lang);
    if (typeof window !== 'undefined') localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (!userId) return;
    void fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang })
    }).catch(() => {});
  };

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
    let mounted = true;
    void getProviders()
      .then((providers) => {
        if (!mounted) return;
        setAvailableOauthProviders({
          google: Boolean(providers?.google),
          facebook: Boolean(providers?.facebook)
        });
      })
      .catch(() => {
        if (!mounted) return;
        setAvailableOauthProviders({});
      });
    return () => {
      mounted = false;
    };
  }, []);

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
      setError(authT.passwordsDoNotMatch);
      return;
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || authT.signupFailed);
      return;
    }
    await signIn('credentials', {
      email: signupEmail,
      password: signupPassword,
      callbackUrl: '/'
    });
  };

  return (
    <main className="min-h-screen bg-[#FFF9EE] text-slate-900 selection:bg-blue-100 pb-20">
      <AppHeader
        t={headerT}
        language={pageLanguage}
        setLanguage={handleLanguageChange}
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
          <p className="text-sm font-semibold text-slate-500">{authT.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{authT.loginTitle}</h2>
            <form className="space-y-3" onSubmit={handleLogin}>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={authT.email}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={authT.password}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100">
                {authT.loginButton}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{authT.signupTitle}</h2>
            <form className="space-y-3" onSubmit={handleSignup}>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder={authT.fullName}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder={authT.email}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                required
                minLength={6}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder={authT.passwordMin}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="password"
                required
                minLength={6}
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                placeholder={authT.confirmPassword}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100">
                {authT.createAccountButton}
              </button>
            </form>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{authT.socialTitle}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {availableOauthProviders.google && (
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:border-blue-300"
              >
                {authT.continueGoogle}
              </button>
            )}
            {availableOauthProviders.facebook && (
              <button
                onClick={() => signIn('facebook', { callbackUrl: '/' })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:border-blue-300"
              >
                {authT.continueFacebook}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

      </div>
    </main>
  );
}
