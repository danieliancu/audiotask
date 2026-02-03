
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { TodoItem, ToolNames, Language, ItemType, Priority } from '../types';
import { generateAssistantResponse, generateTTS, todoTools } from '../services/geminiService';

type FilterMode = 'all' | 'completed' | 'low' | 'normal' | 'high' | 'outdated';

// Translation strings for professional i18n
const translations = {
  en: {
    tasks: "Tasks",
    events: "Events",
    clear: "Clear",
    listening: "Listening...",
    placeholder: "Meeting at 5, buy bread...",
    noTasks: "No tasks found",
    noEvents: "No events found",
    settings: "Settings",
    language: "Language",
    languages: "Languages",
    close: "Close",
    appTitle: "VoiceTask",
    idLabel: "ID",
    dateLabel: "Date",
    timeLabel: "Time",
    searchPlaceholder: "Search tasks or say a command...",
    filterAll: "All",
    filterCompleted: "Completed",
    filterLow: "Low priority",
    filterNormal: "Normal priority",
    filterHigh: "High priority",
    filterOutdated: "Overdue",
    prioLow: "Low",
    prioNormal: "Normal",
    prioHigh: "High",
    outdated: "Overdue",
    save: "Save",
    clearFilter: "Clear date filter",
    selectDates: "Select these dates",
    location: "Location",
    subtasks: "Subtasks",
    subevents: "Subevents",
    subitemsPlaceholder: "One per line",
    menuHome: "Home",
    menuBlog: "Blog",
    menuFeatures: "Features",
    menuPricing: "Pricing"
  },
  ro: {
    tasks: "Tasks",
    events: "Events",
    clear: "Curăță",
    listening: "Se ascultă...",
    placeholder: "Scrie o comandă...",
    noTasks: "Nicio sarcină găsită",
    noEvents: "Niciun eveniment găsit",
    settings: "Setări",
    language: "Limbă",
    languages: "Limbi",
    close: "Închide",
    appTitle: "VoiceTask",
    idLabel: "ID",
    dateLabel: "Data",
    timeLabel: "Ora",
    searchPlaceholder: "Caută sarcini sau zi o comandă...",
    filterAll: "Toate",
    filterCompleted: "Bifate",
    filterLow: "Prioritate mică",
    filterNormal: "Prioritate normală",
    filterHigh: "Prioritate mare",
    filterOutdated: "Depășite",
    prioLow: "Mică",
    prioNormal: "Normală",
    prioHigh: "Mare",
    outdated: "Depășit",
    save: "Salvează",
    clearFilter: "Resetează data",
    selectDates: "Selectează aceste date",
    location: "Locație",
    subtasks: "Subtask-uri",
    subevents: "Subevenimente",
    subitemsPlaceholder: "Câte unul pe linie",
    menuHome: "Acasă",
    menuBlog: "Blog",
    menuFeatures: "Funcționalități",
    menuPricing: "Prețuri"
  },
  fr: {
    tasks: "Tâches",
    events: "Événements",
    clear: "Effacer",
    listening: "Écoute...",
    placeholder: "Réunion à 17h, acheter du pain...",
    noTasks: "Aucune tâche",
    noEvents: "Aucun événement",
    settings: "Paramètres",
    language: "Langue",
    languages: "Langues",
    close: "Fermer",
    appTitle: "VoiceTask",
    idLabel: "ID",
    dateLabel: "Date",
    timeLabel: "Heure",
    searchPlaceholder: "Rechercher ou parler...",
    filterAll: "Tout",
    filterCompleted: "Terminé",
    filterLow: "Basse priorité",
    filterNormal: "Priorité normale",
    filterHigh: "Haute priorité",
    filterOutdated: "En retard",
    prioLow: "Basse",
    prioNormal: "Normale",
    prioHigh: "Haute",
    outdated: "En retard",
    save: "Enregistrer",
    clearFilter: "Effacer la date",
    selectDates: "Sélectionner ces dates",
    location: "Lieu",
    subtasks: "Sous-tâches",
    subevents: "Sous-événements",
    subitemsPlaceholder: "Une par ligne",
    menuHome: "Accueil",
    menuBlog: "Blog",
    menuFeatures: "Fonctionnalités",
    menuPricing: "Tarifs"
  },
  de: {
    tasks: "Aufgaben",
    events: "Termine",
    clear: "Bereinigen",
    listening: "Zuhören...",
    placeholder: "Meeting um 17 Uhr, Brot kaufen...",
    noTasks: "Keine Aufgaben",
    noEvents: "Keine Termine",
    settings: "Einstellungen",
    language: "Sprache",
    languages: "Sprachen",
    close: "Schließen",
    appTitle: "VoiceTask",
    idLabel: "ID",
    dateLabel: "Datum",
    timeLabel: "Uhrzeit",
    searchPlaceholder: "Suchen oder Befehl sagen...",
    filterAll: "Alle",
    filterCompleted: "Erledigt",
    filterLow: "Niedrig",
    filterNormal: "Normal",
    filterHigh: "Hoch",
    filterOutdated: "Überfällig",
    prioLow: "Niedrig",
    prioNormal: "Normal",
    prioHigh: "Hoch",
    outdated: "Überfällig",
    save: "Speichern",
    clearFilter: "Datum löschen",
    selectDates: "Diese Daten auswählen",
    location: "Ort",
    subtasks: "Unteraufgaben",
    subevents: "Untertermine",
    subitemsPlaceholder: "Eine pro Zeile",
    menuHome: "Startseite",
    menuBlog: "Blog",
    menuFeatures: "Funktionen",
    menuPricing: "Preise"
  },
  es: {
    tasks: "Tareas",
    events: "Eventos",
    clear: "Limpiar",
    listening: "Escuchando...",
    placeholder: "Reunión a las 5, comprar pan...",
    noTasks: "No se encontraron tareas",
    noEvents: "No se encontraron eventos",
    settings: "Ajustes",
    language: "Idioma",
    languages: "Idiomas",
    close: "Cerrar",
    appTitle: "VoiceTask",
    idLabel: "ID",
    dateLabel: "Fecha",
    timeLabel: "Hora",
    searchPlaceholder: "Buscar tareas o decir un comando...",
    filterAll: "Todo",
    filterCompleted: "Completado",
    filterLow: "Baja",
    filterNormal: "Normal",
    filterHigh: "Alta",
    filterOutdated: "Atrasados",
    prioLow: "Baja",
    prioNormal: "Normal",
    prioHigh: "Alta",
    outdated: "Atrasado",
    save: "Guardar",
    clearFilter: "Borrar fecha",
    selectDates: "Seleccionar estas fechas",
    location: "Ubicación",
    subtasks: "Subtareas",
    subevents: "Subeventos",
    subitemsPlaceholder: "Una por línea",
    menuHome: "Inicio",
    menuBlog: "Blog",
    menuFeatures: "Funcionalidades",
    menuPricing: "Precios"
  }
};

const languageFlags: Record<Language, string> = {
  en: "🇺🇸",
  ro: "🇷🇴",
  fr: "🇫🇷",
  de: "🇩🇪",
  es: "🇪🇸"
};

const languageNames: Record<Language, string> = {
  en: "English",
  ro: "Română",
  fr: "Français",
  de: "Deutsch",
  es: "Español"
};

const externalLinks = {
  home: "#",
  blog: "#",
  features: "#",
  pricing: "#"
};

// Encoding/Decoding Utilities
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
const localeByLanguage: Record<Language, string> = {
  en: 'en-US',
  ro: 'ro-RO',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES'
};
const smallWordsByLanguage: Record<Language, Set<string>> = {
  en: new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to']),
  ro: new Set(['a', 'al', 'ale', 'ai', 'cu', 'de', 'din', 'fara', 'fără', 'in', 'în', 'la', 'pe', 'pentru', 'si', 'și', 'spre', 'sau', 'ori']),
  fr: new Set(['a', 'à', 'au', 'aux', 'd', 'de', 'des', 'du', 'en', 'et', 'l', 'la', 'le', 'les', 'ou']),
  de: new Set(['am', 'an', 'auf', 'bei', 'das', 'der', 'die', 'im', 'in', 'mit', 'oder', 'und', 'von', 'zu', 'für']),
  es: new Set(['a', 'al', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'o', 'por', 'para', 'y'])
};
const titleCaseWithLocale = (value: string, language: Language) => {
  const locale = localeByLanguage[language];
  const lower = value.toLocaleLowerCase(locale);
  const smallWords = smallWordsByLanguage[language];
  const words = lower.split(' ');
  let nextIsFirst = true;

  return words.map((word) => {
    if (!word) return word;
    const isFirst = nextIsFirst;
    nextIsFirst = /[,;:]$/.test(word);
    const base = word.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
    if (!isFirst && base && smallWords.has(base)) {
      return word;
    }
    return word.replace(/(^|[-'’])(\p{L})/gu, (m, sep, ch) => `${sep}${ch.toLocaleUpperCase(locale)}`);
  }).join(' ');
};
const formatShortDateLabel = (dateKey: string, language: Language) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month, day);
  const locale = localeByLanguage[language];
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric'
  }).formatToParts(date);
  const weekday = (parts.find(p => p.type === 'weekday')?.value || '').replace(/[.,]$/u, '');
  const dayPart = parts.find(p => p.type === 'day')?.value || '';
  const monthPart = parts.find(p => p.type === 'month')?.value || '';
  const weekdayLabel = weekday ? weekday.charAt(0).toLocaleUpperCase(locale) + weekday.slice(1) : '';
  return `${weekdayLabel} ${dayPart}/${monthPart}`.trim();
};
const dateKeyToDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month, day);
};
const buildDateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const getDateRangeKeys = (startKey: string, endKey: string) => {
  const start = dateKeyToDate(startKey);
  const end = dateKeyToDate(endKey);
  const from = start.getTime() <= end.getTime() ? start : end;
  const to = start.getTime() <= end.getTime() ? end : start;
  const keys: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (cursor.getTime() <= to.getTime()) {
    keys.push(buildDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};
const normalizeRomanianNumberWord = (word: string) => word
  .toLocaleLowerCase('ro-RO')
  .normalize('NFD')
  .replace(/\p{M}/gu, '');
const normalizeLocation = (value: string, language: Language) => {
  let cleaned = value.trim().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ');
  if (language === 'ro') {
    cleaned = cleaned.replace(/^\s*(aleea|alea)\s+/i, '');
    cleaned = cleaned.replace(/^\s*(strada|str\.?)\s+/i, '');
    cleaned = cleaned.replace(/\b(num[ăa]r(ul|u)?|nr\.?)\s+(\d+)\b/gi, '$3');
    cleaned = cleaned.replace(/\b(num[ăa]r(ul|u)?|nr\.?)\s+([^\d\W]+)\b/gi, (match, _label, _suffix, rawWord) => {
      const key = normalizeRomanianNumberWord(rawWord);
      const map: Record<string, string> = {
        un: '1',
        unu: '1',
        doi: '2',
        doua: '2',
        trei: '3',
        patru: '4',
        cinci: '5',
        sase: '6',
        sapte: '7',
        opt: '8',
        noua: '9',
        zece: '10'
      };
      return map[key] ?? rawWord;
    });
    const match = cleaned.match(/^(.*?)(?:\s+)(în|in)(?:\s+)(.+)$/i);
    if (match) {
      const left = match[1].trim();
      const right = match[3].trim();
      if (left && right) {
        return `${titleCaseWithLocale(left, language)}, ${titleCaseWithLocale(right, language)}`;
      }
    }
  }
  return titleCaseWithLocale(cleaned, language);
};
const normalizeSubitems = (value: unknown) => {
  if (!value) return undefined;
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\r?\n/)
      : [];
  const cleaned = items
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .map((item) => capitalize(item));
  return cleaned.length ? cleaned : undefined;
};

function parseTaskDate(dateStr: string | undefined): number {
  if (!dateStr) return Date.now();
  
  const now = new Date();
  const str = dateStr.toLowerCase().trim();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const relativePatterns = [
    { keys: ['azi', 'today', 'aujourd', 'heute', 'hoy'], val: 0 },
    { keys: ['mâine', 'tomorrow', 'demain', 'morgen', 'mañana'], val: 86400000 },
    { keys: ['saptamana', 'week', 'semaine', 'woche', 'semana'], val: 7 * 86400000 }
  ];

  for (const p of relativePatterns) {
    if (p.keys.some(k => str.includes(k))) return todayStart + p.val;
  }

  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return parsed;

  return Date.now();
}

function isItemOverdue(item: TodoItem): boolean {
  if (item.completed) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (item.sortTimestamp < todayStart) return true;
  if (item.sortTimestamp > todayStart) return false;
  if (!item.dueTime) return false;
  const [hStr, mStr] = item.dueTime.split(':');
  const hours = Number(hStr);
  const minutes = Number(mStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;
  const dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).getTime();
  return now.getTime() > dueTime;
}

function getItemDateTime(item: TodoItem): number {
  const base = new Date(item.sortTimestamp);
  let hours = 0;
  let minutes = 0;
  if (item.dueTime) {
    const [hStr, mStr] = item.dueTime.split(':');
    const parsedHours = Number(hStr);
    const parsedMinutes = Number(mStr);
    if (!Number.isNaN(parsedHours) && !Number.isNaN(parsedMinutes)) {
      hours = parsedHours;
      minutes = parsedMinutes;
    }
  }
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes).getTime();
}

const App: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const nextIdRef = useRef(1);
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<ItemType>('task');
  const [filterModeByType, setFilterModeByType] = useState<Record<ItemType, FilterMode>>({
    task: 'all',
    event: 'all'
  });
  const [isLive, setIsLive] = useState(false);
  const isLiveRef = useRef(false);
  const [isWriteMode, setIsWriteMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [transcription, setTranscription] = useState('');
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  
  // Date filter from calendar
  const [activeDateFilters, setActiveDateFilters] = useState<string[]>([]);
  const [pendingDateStart, setPendingDateStart] = useState<string | null>(null);
  const [pendingDateEnd, setPendingDateEnd] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [formType, setFormType] = useState<ItemType>('task');
  const [formPriority, setFormPriority] = useState<Priority>('normal');
  const [formText, setFormText] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSubtasks, setFormSubtasks] = useState('');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [nowLabel, setNowLabel] = useState<string>('');
  const [expandedSubitems, setExpandedSubitems] = useState<Set<string>>(new Set());

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const t = useMemo(() => translations[language], [language]);

  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    const formatNow = (d: Date) => (
      `${d.toLocaleDateString(language, { day: '2-digit', month: 'long' })}. ${d.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' })}`
    );
    setNowLabel(formatNow(new Date()));
    const timer = setInterval(() => {
      setNowLabel(formatNow(new Date()));
    }, 60000);
    return () => clearInterval(timer);
  }, [language]);
  const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);
  const firstDayOfMonth = useMemo(() => {
    let day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; 
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, TodoItem[]> = {};
    todos.forEach(item => {
      const d = new Date(item.sortTimestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [todos]);

  const taskCount = useMemo(() => todos.filter(item => item.type === 'task').length, [todos]);
  const eventCount = useMemo(() => todos.filter(item => item.type === 'event').length, [todos]);
  const totalCount = useMemo(() => taskCount + eventCount, [taskCount, eventCount]);

  const activeDateFilterSet = useMemo(() => new Set(activeDateFilters), [activeDateFilters]);
  const selectedDateLabel = useMemo(() => {
    if (!activeDateFilters.length) return '';
    const sorted = [...activeDateFilters].sort((a, b) => {
      const [aYear, aMonth, aDay] = a.split('-').map(Number);
      const [bYear, bMonth, bDay] = b.split('-').map(Number);
      return new Date(aYear, aMonth, aDay).getTime() - new Date(bYear, bMonth, bDay).getTime();
    });
    if (sorted.length === 1) return formatShortDateLabel(sorted[0], language);
    return `${formatShortDateLabel(sorted[0], language)} - ${formatShortDateLabel(sorted[sorted.length - 1], language)}`;
  }, [activeDateFilters, language]);
  const activeDateBounds = useMemo(() => {
    if (!activeDateFilters.length) return { start: null, end: null };
    const sorted = [...activeDateFilters].sort((a, b) => {
      const [aYear, aMonth, aDay] = a.split('-').map(Number);
      const [bYear, bMonth, bDay] = b.split('-').map(Number);
      return new Date(aYear, aMonth, aDay).getTime() - new Date(bYear, bMonth, bDay).getTime();
    });
    return { start: sorted[0], end: sorted[sorted.length - 1] };
  }, [activeDateFilters]);

  const filteredItems = useMemo(() => {
    const filterMode = filterModeByType[activeTab];
    let base = todos;
    
    // Apply date filter if set
    if (activeDateFilters.length) {
      base = base.filter(item => {
        const d = new Date(item.sortTimestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return activeDateFilterSet.has(key);
      });
    }

    return base
      .filter(item => item.type === activeTab)
      .filter(item => {
        if (filterMode === 'completed') return item.completed;
        if (filterMode === 'low') return item.priority === 'low';
        if (filterMode === 'normal') return item.priority === 'normal';
        if (filterMode === 'high') return item.priority === 'high';
        if (filterMode === 'outdated') return isItemOverdue(item);
        return true;
      })
      .sort((a, b) => {
        const aTime = getItemDateTime(a);
        const bTime = getItemDateTime(b);
        if (aTime !== bTime) return aTime - bTime;
        return String(a.id).localeCompare(String(b.id));
      });
  }, [todos, activeTab, filterModeByType, activeDateFilters, activeDateFilterSet]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, TodoItem[]>();
    filteredItems.forEach(item => {
      const d = new Date(item.sortTimestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    const sortedGroups = Array.from(groups.entries())
      .map(([key, items]) => {
        items.sort((a, b) => {
          const aTime = getItemDateTime(a);
          const bTime = getItemDateTime(b);
          if (aTime !== bTime) return aTime - bTime;
          return String(a.id).localeCompare(String(b.id));
        });
        const first = items[0];
        const date = new Date(first.sortTimestamp);
        const dateLabel = date.toLocaleDateString(language, { weekday: 'long', day: '2-digit', month: 'long' });
        return { key, dateLabel, items };
      })
      .sort((a, b) => {
        const [aYear, aMonth, aDay] = a.key.split('-').map(Number);
        const [bYear, bMonth, bDay] = b.key.split('-').map(Number);
        const aTime = new Date(aYear, aMonth, aDay).getTime();
        const bTime = new Date(bYear, bMonth, bDay).getTime();
        return aTime - bTime;
      });
    return sortedGroups;
  }, [filteredItems, language]);

  const scrollToTask = useCallback((id: string, type: ItemType) => {
    setActiveTab(type);
    setHighlightedTaskId(id);
    setActiveDateFilters([]); // Clear date filter when jumping to a specific task
    setPendingDateStart(null);
    setPendingDateEnd(null);
    setTimeout(() => {
      const el = document.getElementById(`todo-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    if (!isLive) setTimeout(() => setHighlightedTaskId(prev => prev === id ? null : prev), 5000);
  }, [isLive]);

  const toggleSubitems = useCallback((id: string) => {
    setExpandedSubitems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDateClick = useCallback((dateKey: string) => {
    setPendingDateStart(prevStart => {
      if (!prevStart || (prevStart && pendingDateEnd)) {
        if (activeDateFilters.length) setActiveDateFilters([]);
        setPendingDateEnd(null);
        return dateKey;
      }
      setPendingDateEnd(dateKey);
      return prevStart;
    });
  }, [pendingDateEnd, activeDateFilters.length]);

  const applyPendingDates = useCallback(() => {
    if (!pendingDateStart) return;
    const nextKeys = pendingDateEnd
      ? getDateRangeKeys(pendingDateStart, pendingDateEnd)
      : [pendingDateStart];
    setActiveDateFilters(nextKeys);
    setPendingDateStart(null);
    setPendingDateEnd(null);

    const firstKey = nextKeys[0];
    const dayItems = firstKey ? (tasksByDate[firstKey] || []) : [];
    if (dayItems.length > 0) {
      const hasTasks = dayItems.some(i => i.type === 'task');
      const hasEvents = dayItems.some(i => i.type === 'event');
      if (activeTab === 'task' && !hasTasks && hasEvents) {
        setActiveTab('event');
      } else if (activeTab === 'event' && !hasEvents && hasTasks) {
        setActiveTab('task');
      }
    }
  }, [pendingDateStart, pendingDateEnd, tasksByDate, activeTab]);

  const executeTool = useCallback((name: string, args: any) => {
    switch (name) {
      case ToolNames.ADD_TODO:
        const id = String(nextIdRef.current++);
        const ts = parseTaskDate(args.date);
        const newItem: TodoItem = {
          id,
          text: capitalize(args.text),
          type: (args.type as ItemType) || 'task',
          completed: false,
          createdAt: Date.now(),
          dueDate: new Date(ts).toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' }),
          dueTime: args.time || undefined,
          location: args.location ? normalizeLocation(args.location, language) : undefined,
          subtasks: normalizeSubitems(args.subtasks),
          sortTimestamp: ts,
          priority: (args.priority as Priority) || 'normal'
        };
        setTodos(prev => [newItem, ...prev]);
        setActiveTab(newItem.type);
        setHighlightedTaskId(id);
        if (newItem.subtasks?.length) {
          setExpandedSubitems(prev => new Set(prev).add(id));
        }
        break;
      case ToolNames.EDIT_TODO:
        const editId = String(args.id);
        setHighlightedTaskId(editId);
        if (typeof args.showSubtasks === 'boolean') {
          setExpandedSubitems(prev => {
            const next = new Set(prev);
            if (args.showSubtasks) next.add(editId);
            else next.delete(editId);
            return next;
          });
        }
        setTodos(prev => prev.map(todo => {
          if (todo.id === editId) {
            const newTs = args.date ? parseTaskDate(args.date) : todo.sortTimestamp;
            const newType = (args.type as ItemType) || todo.type;
            if (newType !== activeTab) setActiveTab(newType);
            const newLocation = args.location !== undefined
              ? (args.location ? normalizeLocation(args.location, language) : undefined)
              : todo.location;
            const newSubtasks = args.subtasks !== undefined
              ? normalizeSubitems(args.subtasks)
              : todo.subtasks;
            return {
              ...todo,
              text: args.text ? capitalize(args.text) : todo.text,
              type: newType,
              dueDate: args.date ? new Date(newTs).toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' }) : todo.dueDate,
              dueTime: args.time !== undefined ? (args.time || undefined) : todo.dueTime,
              location: newLocation,
              subtasks: newSubtasks,
              priority: (args.priority as Priority) || todo.priority,
              sortTimestamp: newTs
            };
          }
          return todo;
        }));
        break;
      case ToolNames.ADD_SUBTASK:
        const parentId = String(args.id);
        const addItems = normalizeSubitems(args.subtasks ?? args.text ?? args.subtask);
        if (!addItems?.length) break;
        setTodos(prev => prev.map(todo => {
          if (todo.id !== parentId) return todo;
          const existing = todo.subtasks || [];
          return { ...todo, subtasks: [...existing, ...addItems] };
        }));
        setExpandedSubitems(prev => new Set(prev).add(parentId));
        break;
      case ToolNames.DELETE_TODO:
        setTodos(prev => prev.filter(t => t.id !== String(args.id)));
        break;
      case ToolNames.TOGGLE_TODO:
        setTodos(prev => prev.map(t => t.id === String(args.id) ? { ...t, completed: !t.completed } : t));
        break;
      case ToolNames.CLEAR_COMPLETED:
        setTodos(prev => prev.filter(t => !t.completed));
        break;
    }
    return "OK";
  }, [language, activeTab]);

  const stopLiveSession = useCallback(() => {
    isLiveRef.current = false;
    if (liveSessionRef.current) { try { liveSessionRef.current.close(); } catch(e) {} liveSessionRef.current = null; }
    if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null; }
    if (inputAudioContextRef.current) { try { inputAudioContextRef.current.close(); } catch(e) {} inputAudioContextRef.current = null; }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null; }
    audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsLive(false);
    isConnectingRef.current = false;
    setTranscription('');
    setHighlightedTaskId(null);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => stopLiveSession(), 10000);
  }, [stopLiveSession]);

  const startLiveSession = async () => {
    if (isLive) return stopLiveSession();
    if (isConnectingRef.current) return;
    
    isConnectingRef.current = true;
    if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    
    isLiveRef.current = true;
    setIsLive(true);
    setTranscription('');
    resetInactivityTimer();
    
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    const inputCtx = new AudioContext({ sampleRate: 16000 });
    inputAudioContextRef.current = inputCtx;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            isConnectingRef.current = false;
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              if (rms > 0.015) resetInactivityTimer();
              if (!isLiveRef.current) return;
              sessionPromise.then(s => {
                if (!isLiveRef.current || !s) return;
                s.sendRealtimeInput({ media: createBlob(inputData) });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (m: LiveServerMessage) => {
            resetInactivityTimer();
            if (m.serverContent?.inputTranscription) {
              const text = m.serverContent.inputTranscription.text.toLowerCase();
              setTranscription(prev => prev + m.serverContent.inputTranscription.text);
              const idMatch = text.match(/id\s+(\d+)|item\s+(\d+)|sarcina\s+(\d+)|task\s+(\d+)|tarea\s+(\d+)/);
              if (idMatch) setHighlightedTaskId(idMatch[1] || idMatch[2] || idMatch[3] || idMatch[4] || idMatch[5]);
            }
            if (m.serverContent?.turnComplete) {
              setTranscription('');
              setTimeout(() => setHighlightedTaskId(null), 3000);
            }
            
            m.serverContent?.modelTurn?.parts?.forEach(async (part) => {
              const base64Audio = part.inlineData?.data;
              if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
              }
            });

            if (m.toolCall) {
              for (const fc of m.toolCall.functionCalls) {
                const res = executeTool(fc.name, fc.args);
                if (!isLiveRef.current) continue;
                sessionPromise.then(s => {
                  if (!isLiveRef.current || !s) return;
                  s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: res } } });
                });
              }
            }
            if (m.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setHighlightedTaskId(null);
            }
          },
          onerror: (e) => { console.error(e); stopLiveSession(); },
          onclose: stopLiveSession,
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: todoTools }],
          inputAudioTranscription: {},
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) { isConnectingRef.current = false; isLiveRef.current = false; setIsLive(false); }
  };

  const Calendar = ({ isModal = false }: { isModal?: boolean }) => (
    <div>
      <div className="flex items-center justify-start gap-3 mb-8">
        <div className="flex space-x-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all"><i className="fas fa-chevron-left text-[10px]"></i></button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all"><i className="fas fa-chevron-right text-[10px]"></i></button>
        </div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
          {currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}
        </h2>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-6">
        {(['en', 'ro', 'fr', 'de', 'es'].includes(language) ? [0,1,2,3,4,5,6] : [0]).map(i => {
           const d = new Date(2021, 0, 4 + i).toLocaleString(language, { weekday: 'short' });
           return <div key={i} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">{d.slice(0, 2)}</div>
        })}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
          const dayItems = tasksByDate[dateKey] || [];
          const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
          const isSelected = activeDateFilterSet.has(dateKey);
          const isSelectedEdge = isSelected && (dateKey === activeDateBounds.start || dateKey === activeDateBounds.end);
          const pendingStart = pendingDateStart === dateKey;
          const pendingEnd = pendingDateEnd === dateKey;
          let isPendingRange = false;
          if (pendingDateStart && pendingDateEnd) {
            const rangeKeys = getDateRangeKeys(pendingDateStart, pendingDateEnd);
            isPendingRange = rangeKeys.includes(dateKey);
          }

          return (
            <div key={day} className="flex flex-col items-center">
              <button 
                onClick={() => handleDateClick(dateKey)}
                className={`relative w-full aspect-square rounded-[16px] flex items-center justify-center text-sm font-black transition-all ${isSelected ? `bg-blue-600 text-white ${isSelectedEdge ? 'shadow-xl scale-110 z-10' : ''}` : pendingStart || pendingEnd ? 'bg-blue-500 text-white shadow-lg scale-105 z-10' : isPendingRange ? 'bg-blue-200 text-blue-800' : isToday ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}
              >
                {day}
              </button>
              <div className="mt-2 flex flex-wrap justify-center gap-1 min-h-[12px] w-full px-1">
                {dayItems.map(item => (
                  <button 
                    key={item.id}
                    title={item.text}
                    onClick={(e) => { e.stopPropagation(); scrollToTask(item.id, item.type); }}
                    className={`w-2 h-2 rounded-full shadow-sm transition-all duration-300 hover:scale-150 active:scale-95 ${item.type === 'task' ? 'bg-emerald-500' : 'bg-blue-500'} ${highlightedTaskId === item.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-125 z-10' : 'hover:ring-1 hover:ring-slate-300'}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center">
        <button
          type="button"
          onClick={() => { applyPendingDates(); if (isModal) setIsCalendarOpen(false); }}
          disabled={!pendingDateStart}
          className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${pendingDateStart ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
        >
          {t.selectDates}
        </button>
      </div>
    </div>
  );

  const handleSendPrompt = async () => {
    if (!inputValue.trim()) return;
    const response = await generateAssistantResponse(inputValue, [], language);
    response.functionCalls?.forEach(c => executeTool(c.name, c.args));
    setInputValue('');
    setIsWriteMode(false);
  };

  const openAddModal = () => {
    const today = new Date();
    setModalMode('add');
    setModalItemId(null);
    setFormType(activeTab);
    setFormPriority('normal');
    setFormText('');
    setFormDate(today.toISOString().split('T')[0]);
    setFormTime('');
    setFormLocation('');
    setFormSubtasks('');
  };

  const openEditModal = (item: TodoItem) => {
    setModalMode('edit');
    setModalItemId(item.id);
    setFormType(item.type);
    setFormPriority(item.priority);
    setFormText(item.text);
    const dateObj = new Date(item.sortTimestamp);
    setFormDate(dateObj.toISOString().split('T')[0]);
    setFormTime(item.dueTime || '');
    setFormLocation(item.location || '');
    setFormSubtasks((item.subtasks || []).join('\n'));
  };

  const closeModal = () => {
    setModalMode(null);
    setModalItemId(null);
    setFormSubtasks('');
  };

  const saveModal = () => {
    if (!modalMode) return;
    if (!formText.trim()) return;
    if (modalMode === 'edit') {
      if (!modalItemId) return;
      executeTool(ToolNames.EDIT_TODO, {
        id: modalItemId,
        text: formText,
        date: formDate,
        time: formTime || null,
        location: formLocation || null,
        priority: formPriority,
        type: formType,
        subtasks: formSubtasks
      });
    } else {
      executeTool(ToolNames.ADD_TODO, {
        text: formText,
        type: formType,
        date: formDate,
        time: formTime || null,
        location: formLocation || null,
        priority: formPriority,
        subtasks: formSubtasks
      });
    }
    closeModal();
  };

  const priorityColors = {
    low: 'text-slate-500 bg-slate-100',
    normal: 'text-blue-600 bg-blue-50',
    high: 'text-amber-900 bg-amber-200'
  };

  return (
    <div className="min-h-screen bg-[#FDF5E6] text-slate-900 selection:bg-blue-100 pb-20">
      <header className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between bg-transparent relative z-50">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-100">
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
            <span className="text-[11px] font-semibold text-slate-400" suppressHydrationWarning>
              {nowLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-6 text-xs font-black uppercase tracking-widest text-slate-500">
            <a href={externalLinks.home} className="hover:text-blue-600 transition-colors" target="_blank" rel="noreferrer">{t.menuHome}</a>
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
                      className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${language === code ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button className="w-11 h-11 text-slate-600 flex items-center justify-center"><i className="far fa-user"></i></button>
            <button className="relative w-11 h-11 text-slate-600 flex items-center justify-center">
              <i className="far fa-bell"></i>
              <span
                className="absolute flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal"
                style={{ top:"5px", right:"5px" }}
              >
                0
              </span>
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden w-11 h-11 text-slate-600 flex items-center justify-center"><i className="fas fa-bars"></i></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto sticky top-0 z-40 bg-[#FDF5E6] backdrop-blur-xl px-6 py-6 mb-8 border-b border-slate-200/50">
        <div>
          {/* Desktop Interaction Bar */}
          <div className="hidden md:flex items-center space-x-4 bg-white p-4 rounded-[32px] shadow-sm border border-slate-200 transition-all hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500/10">
            <button 
              disabled={isConnectingRef.current}
              onClick={startLiveSession} 
              className={`flex-shrink-0 w-14 h-14 rounded-[20px] flex items-center justify-center transition-all ${isLive ? 'bg-red-500 text-white animate-pulse shadow-xl shadow-red-100' : 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105'} ${isConnectingRef.current ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <i className={`fas ${isLive ? 'fa-stop text-lg' : 'fa-microphone text-xl'}`}></i>
            </button>
            <div className="flex-grow bg-slate-50 rounded-[24px] px-4 py-3 border border-slate-100 min-h-[56px] flex items-center relative gap-2">
              {isLive ? (
                <div className="text-sm font-bold text-blue-600 italic leading-relaxed break-words line-clamp-2">
                  {transcription || t.listening}
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    value={inputValue} 
                    onChange={e => setInputValue(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendPrompt()} 
                    placeholder={t.placeholder} 
                    className="w-full bg-transparent text-sm font-bold focus:outline-none placeholder:text-slate-300 block" 
                  />
                  <button
                    type="button"
                    onClick={handleSendPrompt}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                    aria-label="Send"
                  >
                    <i className="fas fa-paper-plane text-[12px]"></i>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Interaction Bar - STICKY GROUP */}
          <div className="md:hidden">
            {!isWriteMode ? (
              <div className="flex items-center justify-center space-x-4 bg-white p-4 rounded-[32px] shadow-sm border border-slate-200 animate-in fade-in zoom-in duration-300">
                <button 
                  disabled={isConnectingRef.current}
                  onClick={startLiveSession} 
                  className={`flex-1 max-w-[80px] h-14 rounded-[20px] flex items-center justify-center transition-all ${isLive ? 'bg-red-500 text-white animate-pulse shadow-xl shadow-red-100' : 'bg-blue-600 text-white shadow-xl shadow-blue-100 active:scale-95'} ${isConnectingRef.current ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <i className={`fas ${isLive ? 'fa-stop text-lg' : 'fa-microphone text-xl'}`}></i>
                </button>
                
                <button 
                  onClick={() => setIsCalendarOpen(true)} 
                  className="flex-1 max-w-[80px] h-14 rounded-[20px] bg-slate-100 text-slate-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                >
                  <i className="fas fa-calendar-alt text-lg"></i>
                </button>

                <button 
                  onClick={() => { setIsWriteMode(false); openAddModal(); }} 
                  className="flex-1 max-w-[80px] h-14 rounded-[20px] bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                >
                  <i className="fas fa-pen text-lg"></i>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 bg-white p-4 rounded-[32px] shadow-sm border border-slate-200 animate-in slide-in-from-right duration-300">
                <div className="flex-grow bg-slate-50 rounded-[20px] px-5 py-3 border border-slate-100 flex items-center">
                  <input 
                    autoFocus
                    type="text" 
                    value={inputValue} 
                    onChange={e => setInputValue(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendPrompt()} 
                    placeholder={t.placeholder} 
                    className="w-full bg-transparent text-sm font-bold focus:outline-none placeholder:text-slate-400 block" 
                  />
                </div>
                <button 
                  onClick={() => setIsWriteMode(false)} 
                  className="w-12 h-12 rounded-[20px] bg-slate-100 text-slate-400 flex items-center justify-center active:scale-90 transition-all"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-0 overflow-x-auto no-scrollbar">
            <div className="flex space-x-8">
              <button onClick={() => setActiveTab('task')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'task' ? 'text-blue-600' : 'text-slate-400'}`}>
                {t.tasks}
                <span className="absolute -top-[5px] -right-[12px] flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal">
                  {taskCount}
                </span>
                {activeTab === 'task' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
              </button>
              <button onClick={() => setActiveTab('event')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'event' ? 'text-blue-600' : 'text-slate-400'}`}>
                {t.events}
                <span className="absolute -top-[5px] -right-[12px] flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal">
                  {eventCount}
                </span>
                {activeTab === 'event' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
              </button>
            </div>
            
            <div className="mb-4 flex items-center space-x-2">
              <div className="relative group">
                <div className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm hover:border-blue-300 transition-all cursor-pointer">
                  <i className="fas fa-filter text-[10px] text-slate-400 mr-2"></i>
                  <select 
                    value={filterModeByType[activeTab]} 
                    onChange={(e) => setFilterModeByType(prev => ({ ...prev, [activeTab]: e.target.value as FilterMode }))}
                    className="bg-transparent text-[10px] font-black text-blue-500 tracking-widest appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-2 py-0.5"
                  >
                    <option value="all">{t.filterAll}</option>
                    <option value="completed">{t.filterCompleted}</option>
                    <option value="normal">{t.filterNormal}</option>
                    <option value="low">{t.filterLow}</option>
                    <option value="high">{t.filterHigh}</option>
                    <option value="outdated">{t.filterOutdated}</option>
                  </select>
                  <i className="fas fa-chevron-down text-[10px] text-slate-400 ml-1"></i>
                </div>
              </div>
            </div>
          </div>


          <div className="space-y-4">
            {groupedItems.length === 0 ? (
              <div className="py-10 flex flex-col items-center">
                {activeDateFilters.length > 0 && (
                  <button
                    onClick={() => { setActiveDateFilters([]); setPendingDateStart(null); setPendingDateEnd(null); }}
                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-blue-600 text-white transition-all inline-flex items-center"
                    title={t.clearFilter}
                  >
                    <span className="mr-2 text-[9px] leading-none">×</span>
                    <span className="whitespace-nowrap">{selectedDateLabel}</span>
                  </button>
                )}
                <div className="py-24 text-center flex flex-col items-center opacity-10">
                  <i className={`fas ${activeTab === 'task' ? 'fa-feather' : 'fa-calendar-check'} text-6xl mb-4`}></i>
                  <p className="text-lg font-bold uppercase tracking-widest">{activeTab === 'task' ? t.noTasks : t.noEvents}</p>
                </div>
              </div>
            ) : groupedItems.map((group, index) => (
              <div key={group.key} className="space-y-3">
                <div
                  className="text-blue-600 sticky top-24 z-20 -mx-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-[#FDF5E6] backdrop-blur-md flex items-center justify-between"
                  style ={{ top:"138px", zIndex:1 }}
                  >
                  <span>{group.dateLabel}</span>
                  {index === 0 && activeDateFilters.length > 0 && (
                    <button
                      onClick={() => { setActiveDateFilters([]); setPendingDateStart(null); setPendingDateEnd(null); }}
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200  bg-blue-600 text-white transition-all inline-flex items-center"
                      title={t.clearFilter}
                    >
                      <span className="mr-2 text-[9px] leading-none">×</span>
                      <span className="whitespace-nowrap">{selectedDateLabel}</span>
                    </button>
                  )}
                </div>
                {group.items.map(item => (
                  <div key={item.id} id={`todo-${item.id}`} className={`transition-all duration-300 ${highlightedTaskId === item.id ? 'scale-[1.03] ring-4 ring-blue-500/50 rounded-[32px] shadow-2xl z-10 relative' : ''}`}>
                    <div className={`flex items-start justify-between p-6 bg-white rounded-[32px] shadow-sm border border-slate-100 transition-all ${item.completed ? 'bg-slate-50 opacity-60' : 'hover:border-blue-200 hover:shadow-md'} ${highlightedTaskId === item.id ? 'border-blue-400' : ''}`}>
                      <div className="flex items-start space-x-5 w-full">
                        <button onClick={() => executeTool(ToolNames.TOGGLE_TODO, { id: item.id })} className={`mt-10 flex-shrink-0 w-7 h-7 rounded-xl border-2 transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-200'}`}>
                          {item.completed && <i className="fas fa-check text-xs"></i>}
                        </button>
                        <div className="flex flex-col flex-grow leading-tight overflow-hidden">
                          {/* Line 1: Time + Type + Priority */}
                          <div className="flex items-center justify-between mb-4 max-[450px]:flex-col max-[450px]:items-start max-[450px]:gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-[13px] font-black uppercase tracking-tighter text-slate-600 max-[450px]:grid max-[450px]:grid-cols-2 max-[450px]:gap-2 max-[450px]:w-full">
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg w-fit max-[450px]:w-full ${item.type === 'task' ? 'text-blue-600 bg-blue-50' : 'text-blue-700 bg-blue-100'}`}>
                                <span className="mr-1">#{item.id}</span>
                                <select
                                  value={item.type}
                                  onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, type: e.target.value as ItemType })}
                                  className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-1.5 py-0.5"
                                >
                                  <option value="task">{t.tasks}</option>
                                  <option value="event">{t.events}</option>
                                </select>
                                <i className="fas fa-chevron-down text-[10px] opacity-60"></i>
                              </div>
                              {item.dueTime && (
                                <span className="flex items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit max-[450px]:w-full">
                                  <i className="far fa-clock mr-1.5 opacity-60"></i> {item.dueTime}
                                </span>
                              )}
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border border-transparent transition-all w-fit max-[450px]:w-full ${priorityColors[item.priority]}`}>
                                <i className="fas fa-circle text-[6px] mr-1.5 opacity-60"></i>
                                <select 
                                  value={item.priority}
                                  onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, priority: e.target.value as Priority })}
                                  className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-1.5 py-0.5"
                                >
                                  <option value="low">{t.prioLow}</option>
                                  <option value="normal">{t.prioNormal}</option>
                                  <option value="high">{t.prioHigh}</option>
                                </select>
                                <i className="fas fa-chevron-down text-[10px] opacity-60"></i>
                              </div>
                              {isItemOverdue(item) && (
                                <span className="px-3 py-1 rounded-lg text-[13px] font-black uppercase tracking-tighter bg-red-50 text-red-600 border border-red-100 w-fit max-[450px]:w-full">
                                  {t.outdated}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                  <button onClick={() => openEditModal(item)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                    <i className="fas fa-pen text-base"></i>
                  </button>
                              <button onClick={() => executeTool(ToolNames.DELETE_TODO, { id: item.id })} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <i className="fas fa-trash-alt text-base"></i>
                              </button>
                            </div>
                          </div>


                          {/* Text */}
                          <div
                            className={`text-lg font-bold break-words leading-relaxed flex items-center gap-2 ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'} ${item.subtasks?.length ? 'cursor-pointer' : ''}`}
                            onClick={() => item.subtasks?.length && toggleSubitems(item.id)}
                          >
                            <span className="flex-1">{item.text}</span>
                            {item.subtasks?.length ? (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleSubitems(item.id); }}
                                className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                aria-label="Toggle subtasks"
                              >
                                <i className={`fas fa-chevron-down text-[10px] transition-transform ${expandedSubitems.has(item.id) ? 'rotate-180' : ''}`}></i>
                              </button>
                            ) : null}
                          </div>
                          {item.subtasks?.length && expandedSubitems.has(item.id) && (
                            <ul className="mt-1 mb-3 space-y-2 pl-4 text-sm font-semibold text-slate-600">
                              {item.subtasks.map((subtask, index) => (
                                <li key={`${item.id}-subtask-${index}`} className="relative">
                                  <span className="absolute -left-3 top-2 h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                  {subtask}
                                </li>
                              ))}
                            </ul>
                          )}                          
                          {item.location && (
                            <div className="mt-2 flex items-center text-sm font-semibold text-slate-500">
                              <i className="fas fa-map-marker-alt mr-2 text-[12px] text-slate-400"></i>
                              <span className="truncate">{item.location}</span>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                aria-label="Open in Google Maps"
                                title="Open in Google Maps"
                              >
                                <i className="fas fa-external-link-alt text-[10px]"></i>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="hidden md:block sticky h-fit" style={{ top:"165px" }}>
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl p-10">
            <Calendar />
          </div>
        </section>
      </main>

      {/* Add/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-4 md:pt-8">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-6 md:p-8 animate-in zoom-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top right-4 w-10 h-10 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="flex flex-wrap items-center gap-3 mb-6 text-[13px] font-black uppercase tracking-tighter text-slate-600">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${formType === 'task' ? 'text-blue-600 bg-blue-50' : 'text-blue-700 bg-blue-100'}`}>
                {modalMode === 'edit' && modalItemId && <span className="mr-1">#{modalItemId}</span>}
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as ItemType)}
                  className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-1.5 py-0.5"
                >
                  <option value="task">{t.tasks}</option>
                  <option value="event">{t.events}</option>
                </select>
                <i className="fas fa-chevron-down text-[10px] opacity-60"></i>
              </div>
              <div className={`flex items-center px-3 py-1 rounded-lg border border-transparent ${priorityColors[formPriority]}`}>
                <i className="fas fa-circle text-[6px] mr-1.5 opacity-60"></i>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as Priority)}
                  className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-1.5 py-0.5"
                >
                  <option value="low">{t.prioLow}</option>
                  <option value="normal">{t.prioNormal}</option>
                  <option value="high">{t.prioHigh}</option>
                </select>
                <i className="fas fa-chevron-down text-[10px] opacity-60"></i>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                autoFocus
                className="text-base font-bold bg-white border border-slate-200 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 min-h-[140px] resize-none"
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="Descriere..."
              />
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {formType === 'event' ? t.subevents : t.subtasks}
                </label>
                <textarea
                  className="text-sm font-semibold bg-white border border-slate-200 rounded-2xl outline-none w-full px-4 py-3 text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 min-h-[90px] resize-none"
                  value={formSubtasks}
                  onChange={(e) => setFormSubtasks(e.target.value)}
                  placeholder={t.subitemsPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {t.location}
                </label>
                <input
                  type="text"
                  className="text-sm font-semibold bg-white border border-slate-200 rounded-2xl outline-none w-full px-4 py-3 text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500/20"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ex: Splaiul Unirii 45"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  type="date"
                  className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none shadow-sm flex-grow"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
                <input
                  type="time"
                  className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none shadow-sm w-32"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
                <button
                  onClick={saveModal}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-4 md:pt-8">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCalendarOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-8 animate-in zoom-in fade-in duration-300 max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setIsCalendarOpen(false)}
              className="absolute top right-4 w-10 h-10 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times"></i>
            </button>
            <Calendar isModal />
          </div>
        </div>
      )}

      {/* Menu Modal */}
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
                <a href={externalLinks.home} target="_blank" rel="noreferrer" className="hover:border-blue-300 pb-2">{t.menuHome}</a>
                <a href={externalLinks.features} target="_blank" rel="noreferrer" className="hover:border-blue-300 pb-2">{t.menuFeatures}</a>
                <a href={externalLinks.pricing} target="_blank" rel="noreferrer" className="hover:border-blue-300 pb-2">{t.menuPricing}</a>
                <a href={externalLinks.blog} target="_blank" rel="noreferrer" className="hover:border-blue-300 pb-2">{t.menuBlog}</a>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">{t.languages}</span>
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
    </div>
  );
};

export default App;
