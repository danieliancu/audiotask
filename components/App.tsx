
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import AppHeader from './AppHeader';
import { useSession } from 'next-auth/react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { TodoItem, ToolNames, Language, ItemType, Priority, ReminderChannel } from '../types';
import { generateAssistantResponse, generateTTS, systemInstructions, todoTools } from '../services/geminiService';
import { DEFAULT_LABEL_COLOR, LABEL_COLOR_PALETTE, normalizeLabelColor } from '@/lib/labelColors';

type StatusFilter = 'all' | 'closed' | 'open' | 'outdated' | 'in_time';
type PriorityFilterMode = 'all' | 'low' | 'normal' | 'high';
type LabelFilter = 'all' | `label:${string}`;
type ItemLabel = { id: string; name: string; color: string };
const LANGUAGE_STORAGE_KEY = 'voicetask.language';
const GUEST_STATE_STORAGE_KEY = 'voicetask.guest.state.v1';

// Translation strings for professional i18n
const translations = {
  en: {
    tasks: "Notes",
    events: "Tasks",
    clear: "Clear",
    listening: "Listening...",
    placeholder: "Meeting at 5, buy bread...",
    noTasks: "No notes found",
    noEvents: "No tasks found",
    settings: "Settings",
    language: "Language",
    languages: "Languages",
    close: "Close",
    appTitle: "VoiceTask",
    idLabel: "ID",
    dateLabel: "Date",
    timeLabel: "Time",
    searchPlaceholder: "Search tasks or say a command...",
    filterAll: "All tasks",
    filterAllPriorities: "All priorities",
    stopListening: "Stop",
    filterResolved: "Checked",
    filterUnresolved: "Active",
    filterOverdue: "Overdue",
    filterInTime: "In time",
    filterLow: "Low priority",
    filterNormal: "Normal priority",
    filterHigh: "High priority",
    labelsTitle: "Labels",
    allLabels: "All labels",
    addLabel: "Add label...",
    labelNamePlaceholder: "Label name",
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
    menuPricing: "Pricing",
    menuTrash: "Trash",
    reminderTitle: "Reminder",
    reminderNotifyBefore: "Notify me before",
    reminderDays: "Days",
    reminderHours: "Hours",
    reminderMinutes: "Minutes",
    reminderChannel: "Channel",
    reminderEmail: "Email",
    reminderSmsSoon: "SMS (soon)",
    reminderPushSoon: "Push (soon)",
    reminderSave: "Save reminder",
    reminderRemove: "Remove",
    reminderErrorInvalidTime: "Invalid reminder time.",
    reminderErrorBeforeTask: "Reminder must be before task time.",
    reminderErrorSave: "Failed to save reminder",
    reminderErrorRemove: "Failed to remove reminder"
  },
  ro: {
    tasks: "Notite",
    events: "Taskuri",
    clear: "Curăță",
    listening: "Se ascultă...",
    placeholder: "Scrie o comandă...",
    noTasks: "Nicio notita gasita",
    noEvents: "Niciun task gasit",
    settings: "Setări",
    language: "Limbă",
    languages: "Limbi",
    close: "Închide",
    appTitle: "VoiceTask",
    idLabel: "ID",
    dateLabel: "Data",
    timeLabel: "Ora",
    searchPlaceholder: "Caută sarcini sau zi o comandă...",
    filterAll: "Toate taskurile",
    filterAllPriorities: "Toate prioritatile",
    stopListening: "Opreste",
    filterResolved: "Bifate",
    filterUnresolved: "Active",
    filterOverdue: "Depășite",
    filterInTime: "În timp",
    filterLow: "Prioritate mică",
    filterNormal: "Prioritate normală",
    filterHigh: "Prioritate mare",
    labelsTitle: "Etichete",
    allLabels: "Toate etichetele",
    addLabel: "Adaugă etichetă...",
    labelNamePlaceholder: "Nume etichetă",
    prioLow: "Mică",
    prioNormal: "Normală",
    prioHigh: "Mare",
    outdated: "Depasit",
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
    menuPricing: "Prețuri",
    menuTrash: "Coș",
    reminderTitle: "Reminder",
    reminderNotifyBefore: "Anunta-ma inainte de",
    reminderDays: "Zile",
    reminderHours: "Ore",
    reminderMinutes: "Minute",
    reminderChannel: "Canal",
    reminderEmail: "Email",
    reminderSmsSoon: "SMS (curand)",
    reminderPushSoon: "Push (curand)",
    reminderSave: "Salveaza reminder",
    reminderRemove: "Sterge",
    reminderErrorInvalidTime: "Timpul reminder-ului este invalid.",
    reminderErrorBeforeTask: "Reminder-ul trebuie sa fie inainte de ora task-ului.",
    reminderErrorSave: "Nu am putut salva reminder-ul",
    reminderErrorRemove: "Nu am putut sterge reminder-ul"
  },
  fr: {
    tasks: "Notes",
    events: "Tâches",
    clear: "Effacer",
    listening: "Écoute...",
    placeholder: "Réunion à 17h, acheter du pain...",
    noTasks: "Aucune note",
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
    filterAll: "Toutes les tâches",
    filterAllPriorities: "Toutes les priorités",
    stopListening: "Arreter",
    filterResolved: "Cochées",
    filterUnresolved: "Actives",
    filterOverdue: "En retard",
    filterInTime: "À temps",
    filterLow: "Basse priorité",
    filterNormal: "Priorité normale",
    filterHigh: "Haute priorité",
    labelsTitle: "Étiquettes",
    allLabels: "Toutes les étiquettes",
    addLabel: "Ajouter une étiquette...",
    labelNamePlaceholder: "Nom de l'étiquette",
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
    menuPricing: "Tarifs",
    menuTrash: "Corbeille",
    reminderTitle: "Rappel",
    reminderNotifyBefore: "Me notifier avant",
    reminderDays: "Jours",
    reminderHours: "Heures",
    reminderMinutes: "Minutes",
    reminderChannel: "Canal",
    reminderEmail: "Email",
    reminderSmsSoon: "SMS (bientot)",
    reminderPushSoon: "Push (bientot)",
    reminderSave: "Enregistrer le rappel",
    reminderRemove: "Supprimer",
    reminderErrorInvalidTime: "Heure de rappel invalide.",
    reminderErrorBeforeTask: "Le rappel doit etre avant l'heure de la tache.",
    reminderErrorSave: "Echec de l'enregistrement du rappel",
    reminderErrorRemove: "Echec de la suppression du rappel"
  },
  de: {
    tasks: "Notizen",
    events: "Aufgaben",
    clear: "Bereinigen",
    listening: "Zuhören...",
    placeholder: "Meeting um 17 Uhr, Brot kaufen...",
    noTasks: "Keine Notizen gefunden",
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
    filterAll: "Alle Aufgaben",
    filterAllPriorities: "Alle Prioritäten",
    stopListening: "Stoppen",
    filterResolved: "Abgehakt",
    filterUnresolved: "Aktiv",
    filterOverdue: "Überfällig",
    filterInTime: "Pünktlich",
    filterLow: "Niedrig",
    filterNormal: "Normal",
    filterHigh: "Hoch",
    labelsTitle: "Labels",
    allLabels: "Alle Labels",
    addLabel: "Label hinzufügen...",
    labelNamePlaceholder: "Labelname",
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
    menuPricing: "Preise",
    menuTrash: "Papierkorb",
    reminderTitle: "Erinnerung",
    reminderNotifyBefore: "Benachrichtige mich vorher",
    reminderDays: "Tage",
    reminderHours: "Stunden",
    reminderMinutes: "Minuten",
    reminderChannel: "Kanal",
    reminderEmail: "E-Mail",
    reminderSmsSoon: "SMS (bald)",
    reminderPushSoon: "Push (bald)",
    reminderSave: "Erinnerung speichern",
    reminderRemove: "Entfernen",
    reminderErrorInvalidTime: "Ungultige Erinnerungszeit.",
    reminderErrorBeforeTask: "Erinnerung muss vor der Aufgabenzeit liegen.",
    reminderErrorSave: "Erinnerung konnte nicht gespeichert werden",
    reminderErrorRemove: "Erinnerung konnte nicht entfernt werden"
  },
  es: {
    tasks: "Notas",
    events: "Tareas",
    clear: "Limpiar",
    listening: "Escuchando...",
    placeholder: "Reunión a las 5, comprar pan...",
    noTasks: "No se encontraron notas",
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
    filterAll: "Todas las tareas",
    filterAllPriorities: "Todas las prioridades",
    stopListening: "Detener",
    filterResolved: "Marcadas",
    filterUnresolved: "Activas",
    filterOverdue: "Vencidas",
    filterInTime: "A tiempo",
    filterLow: "Baja",
    filterNormal: "Normal",
    filterHigh: "Alta",
    labelsTitle: "Etiquetas",
    allLabels: "Todas las etiquetas",
    addLabel: "Añadir etiqueta...",
    labelNamePlaceholder: "Nombre de etiqueta",
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
    menuPricing: "Precios",
    menuTrash: "Papelera",
    reminderTitle: "Recordatorio",
    reminderNotifyBefore: "Avisarme antes de",
    reminderDays: "Dias",
    reminderHours: "Horas",
    reminderMinutes: "Minutos",
    reminderChannel: "Canal",
    reminderEmail: "Email",
    reminderSmsSoon: "SMS (pronto)",
    reminderPushSoon: "Push (pronto)",
    reminderSave: "Guardar recordatorio",
    reminderRemove: "Eliminar",
    reminderErrorInvalidTime: "Tiempo de recordatorio invalido.",
    reminderErrorBeforeTask: "El recordatorio debe ser antes de la hora de la tarea.",
    reminderErrorSave: "No se pudo guardar el recordatorio",
    reminderErrorRemove: "No se pudo eliminar el recordatorio"
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
const normalizeLabelName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const cleaned = trimmed.replace(/\s+/g, ' ');
  return cleaned
    .split(' ')
    .map((part) => {
      const lower = part.toLocaleLowerCase();
      return `${lower.charAt(0).toLocaleUpperCase()}${lower.slice(1)}`;
    })
    .join(' ');
};

const splitMinutesToDhm = (value: number) => {
  const safe = Math.max(0, Math.floor(value));
  const days = Math.floor(safe / (24 * 60));
  const remainingAfterDays = safe % (24 * 60);
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;
  return { days, hours, minutes };
};
const formatRemainingDuration = (totalMs: number) => {
  const minutesTotal = Math.max(0, Math.floor(totalMs / 60000));
  const days = Math.floor(minutesTotal / (24 * 60));
  const hours = Math.floor((minutesTotal % (24 * 60)) / 60);
  const minutes = minutesTotal % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
};
const hexToRgba = (hex: string, alpha: number) => {
  const normalized = normalizeLabelColor(hex);
  const value = normalized.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const normalizeDateText = (value: string) => value
  .toLocaleLowerCase()
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .replace(/[’']/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const inferRelativeDateOffset = (value: string | undefined): number | null => {
  if (!value) return null;
  const str = normalizeDateText(value);
  const matchesAny = (phrases: string[]) => phrases.some((phrase) => str.includes(phrase));

  if (matchesAny([
    'poimaine',
    'day after tomorrow',
    'the day after tomorrow',
    'apres-demain',
    'ubermorgen',
    'uebermorgen',
    'pasado manana',
    'pasadomanana'
  ])) return 2;

  if (matchesAny([
    'maine',
    'tomorrow',
    'demain',
    'morgen',
    'manana'
  ])) return 1;

  if (matchesAny([
    'ieri',
    'yesterday',
    'hier',
    'gestern',
    'ayer'
  ])) return -1;

  if (matchesAny([
    'azi',
    'astazi',
    'today',
    "aujourd'hui",
    'aujourdhui',
    'heute',
    'hoy'
  ])) return 0;

  if (matchesAny([
    'saptamana viitoare',
    'next week',
    'semaine prochaine',
    'nachste woche',
    'naechste woche',
    'proxima semana',
    'semana que viene'
  ])) return 7;

  return null;
};

type ParsedTaskDate = {
  timestamp: number;
  usedFallback: boolean;
};

function parseTaskDate(dateStr: string | undefined): ParsedTaskDate {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (!dateStr) return { timestamp: todayStart, usedFallback: false };

  const str = normalizeDateText(dateStr);
  const dayMs = 86400000;
  const relativeOffset = inferRelativeDateOffset(str);
  if (relativeOffset !== null) return { timestamp: todayStart + (relativeOffset * dayMs), usedFallback: false };

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year
      && parsed.getMonth() === month - 1
      && parsed.getDate() === day
    ) {
      return { timestamp: parsed.getTime(), usedFallback: false };
    }
  }

  const numericMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]);
    const year = Number(numericMatch[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year
      && parsed.getMonth() === month - 1
      && parsed.getDate() === day
    ) {
      return { timestamp: parsed.getTime(), usedFallback: false };
    }
  }

  return { timestamp: todayStart, usedFallback: true };
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

function normalizeDueTime(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const raw = value.trim().toLowerCase();
  if (!raw) return undefined;

  const exact = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (exact) return `${exact[1].padStart(2, '0')}:${exact[2]}`;

  const onlyHour = raw.match(/\b([01]?\d|2[0-3])\b/);
  if (onlyHour) return `${onlyHour[1].padStart(2, '0')}:00`;

  return undefined;
}

const isStatusFilter = (value: string): value is StatusFilter => (
  ['all', 'closed', 'open', 'outdated', 'in_time'].includes(value)
);

const isPriorityFilterMode = (value: string): value is PriorityFilterMode => (
  ['all', 'low', 'normal', 'high'].includes(value)
);

const parseCombinedFilter = (
  rawValue: unknown,
  isEvent: boolean
): { status: StatusFilter; priority: PriorityFilterMode } => {
  const raw = String(rawValue || 'all').trim().toLowerCase();
  if (raw.includes('|')) {
    const [rawStatus, rawPriority] = raw.split('|');
    const status = isStatusFilter(rawStatus) ? rawStatus : 'all';
    const priority = isPriorityFilterMode(rawPriority) ? rawPriority : 'all';
    return {
      status: isEvent ? status : 'all',
      priority
    };
  }

  if (raw === 'resolved') return { status: isEvent ? 'closed' : 'all', priority: 'all' as PriorityFilterMode };
  if (raw === 'unresolved') return { status: isEvent ? 'open' : 'all', priority: 'all' as PriorityFilterMode };
  if (isStatusFilter(raw)) return { status: isEvent ? raw : 'all', priority: 'all' as PriorityFilterMode };
  if (isPriorityFilterMode(raw)) return { status: 'all' as StatusFilter, priority: raw };
  return { status: 'all' as StatusFilter, priority: 'all' as PriorityFilterMode };
};

const buildCombinedFilter = (status: StatusFilter, priority: PriorityFilterMode) => `${status}|${priority}`;

const App: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const nextIdRef = useRef(1);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const settingsLoadedRef = useRef(false);
  const settingsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const todosRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canceledTempIdsRef = useRef<Set<string>>(new Set());
  const pendingTempUpdatesRef = useRef<Map<string, Record<string, unknown>>>(new Map());
  const requestQueueByIdRef = useRef<Map<string, Promise<void>>>(new Map());
  const todosRef = useRef<TodoItem[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<ItemType>('task');
  const [showSubtasksDefault, setShowSubtasksDefault] = useState(false);
  const [statusFilterByType, setStatusFilterByType] = useState<Record<ItemType, StatusFilter>>({
    task: 'all',
    event: 'all'
  });
  const [priorityFilterByType, setPriorityFilterByType] = useState<Record<ItemType, PriorityFilterMode>>({
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
  const [reminderModalItemId, setReminderModalItemId] = useState<string | null>(null);
  const [reminderDays, setReminderDays] = useState('0');
  const [reminderHours, setReminderHours] = useState('0');
  const [reminderMinutes, setReminderMinutes] = useState('10');
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>('email');
  const [reminderError, setReminderError] = useState('');
  const [isReminderSaving, setIsReminderSaving] = useState(false);
  const [formType, setFormType] = useState<ItemType>('task');
  const [formPriority, setFormPriority] = useState<Priority>('normal');
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSubtasks, setFormSubtasks] = useState('');
  const [labels, setLabels] = useState<ItemLabel[]>([]);
  const labelsRef = useRef<ItemLabel[]>([]);
  const [labelFilter, setLabelFilter] = useState<LabelFilter>('all');
  const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<string>(DEFAULT_LABEL_COLOR);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const labelMenuRef = useRef<HTMLDivElement | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [editingLabelColor, setEditingLabelColor] = useState<string>(DEFAULT_LABEL_COLOR);
  const [labelBusyId, setLabelBusyId] = useState<string | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMobileMicModalOpen, setIsMobileMicModalOpen] = useState(false);
  const [nowLabel, setNowLabel] = useState<string>('');
  const [uiNotice, setUiNotice] = useState<string | null>(null);
  const uiNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserCommandRef = useRef<string>('');
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
  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (!userId) return;
    void fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang })
    }).catch(() => {});
  }, [userId]);
  const getInvalidDateMessage = useCallback((rawValue: string) => {
    const value = rawValue.trim().slice(0, 50);
    if (language === 'ro') return `Data "${value}" nu a fost inteleasa. Am setat azi.`;
    if (language === 'fr') return `La date "${value}" n'a pas ete comprise. J'ai defini aujourd'hui.`;
    if (language === 'de') return `Das Datum "${value}" wurde nicht verstanden. Ich habe heute gesetzt.`;
    if (language === 'es') return `La fecha "${value}" no se entendio. Se configuro hoy.`;
    return `Date "${value}" was not understood. I set it to today.`;
  }, [language]);
  const showUiNotice = useCallback((message: string) => {
    setUiNotice(message);
    if (uiNoticeTimerRef.current) clearTimeout(uiNoticeTimerRef.current);
    uiNoticeTimerRef.current = setTimeout(() => {
      setUiNotice(null);
      uiNoticeTimerRef.current = null;
    }, 5000);
  }, []);
  const getReminderLoginRequiredMessage = useCallback(() => {
    if (language === 'ro') return 'Reminder-ele sunt disponibile doar dupa autentificare.';
    if (language === 'fr') return "Les rappels sont disponibles uniquement apres connexion.";
    if (language === 'de') return 'Erinnerungen sind nur nach dem Login verfuegbar.';
    if (language === 'es') return 'Los recordatorios solo estan disponibles al iniciar sesion.';
    return 'Reminders are available only after login.';
  }, [language]);

  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['en', 'ro', 'fr', 'de', 'es'].includes(saved)) {
      setLanguage(saved as Language);
    }
  }, []);

  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);
  useEffect(() => () => {
    if (uiNoticeTimerRef.current) clearTimeout(uiNoticeTimerRef.current);
  }, []);

  useEffect(() => {
    const formatNow = (d: Date) => {
      const dateParts = new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short' }).formatToParts(d);
      const dateLabel = dateParts
        .map((part) => {
          if (part.type !== 'month') return part.value;
          const lettersRaw = part.value.match(/\p{L}+/gu)?.join('') || part.value;
          const monthLetters = lettersRaw.slice(0, 3);
          const first = lettersRaw.charAt(0);
          const isUpper = first && first === first.toLocaleUpperCase(language) && first !== first.toLocaleLowerCase(language);
          const normalized = isUpper
            ? `${monthLetters.charAt(0).toLocaleUpperCase(language)}${monthLetters.slice(1).toLocaleLowerCase(language)}`
            : monthLetters.toLocaleLowerCase(language);
          return `${normalized}.`;
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      const timeLabel = d.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' });
      return `${dateLabel} • ${timeLabel}`;
    };
    setNowLabel(formatNow(new Date()));
    const timer = setInterval(() => {
      setNowLabel(formatNow(new Date()));
    }, 60000);
    return () => clearInterval(timer);
  }, [language]);

  useEffect(() => {
    if (!userId) {
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(GUEST_STATE_STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : null;
          const storedTodos = Array.isArray(parsed?.todos) ? parsed.todos : [];
          const storedLabels = Array.isArray(parsed?.labels)
            ? parsed.labels.map((label: ItemLabel) => ({ ...label, color: normalizeLabelColor((label as any).color) }))
            : [];
          const storedSettings = parsed?.settings && typeof parsed.settings === 'object' ? parsed.settings : {};
          const nextLang = typeof storedSettings.language === 'string' && ['en', 'ro', 'fr', 'de', 'es'].includes(storedSettings.language)
            ? (storedSettings.language as Language)
            : null;
          const nextTab = storedSettings.activeTab === 'event' ? 'event' : storedSettings.activeTab === 'task' ? 'task' : null;
          const nextDates = Array.isArray(storedSettings.activeDateFilters)
            ? storedSettings.activeDateFilters.filter((value: unknown) => typeof value === 'string')
            : [];
          const nextTaskFilters = parseCombinedFilter(storedSettings.filterTask, false);
          const nextEventFilters = parseCombinedFilter(storedSettings.filterEvent, true);
          const monthStr = typeof storedSettings.calendarMonth === 'string' ? storedSettings.calendarMonth : '';
          const monthMatch = monthStr.match(/^(\d{4})-(\d{2})$/);
          const nextMonth = monthMatch
            ? new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1)
            : new Date();
          const nextLabelFilter = storedSettings.labelFilter === 'all'
            || (typeof storedSettings.labelFilter === 'string' && String(storedSettings.labelFilter).startsWith('label:'))
            ? (storedSettings.labelFilter as LabelFilter)
            : 'all';
          const nextShowSubtasksDefault = Boolean(storedSettings.showSubtasksDefault);
          setTodos(storedTodos);
          setLabels(storedLabels);
          if (nextLang) setLanguage(nextLang);
          if (nextTab) setActiveTab(nextTab as ItemType);
          setActiveDateFilters(nextDates);
          setStatusFilterByType({ task: nextTaskFilters.status, event: nextEventFilters.status });
          setPriorityFilterByType({ task: nextTaskFilters.priority, event: nextEventFilters.priority });
          setCurrentDate(nextMonth);
          setLabelFilter(nextLabelFilter);
          setShowSubtasksDefault(nextShowSubtasksDefault);
          const maxId = storedTodos.reduce((max: number, item: TodoItem) => {
            const parsedId = Number.parseInt(String(item.id), 10);
            return Number.isFinite(parsedId) ? Math.max(max, parsedId) : max;
          }, 0);
          const savedNextId = Number.parseInt(String(parsed?.nextId ?? ''), 10);
          nextIdRef.current = Number.isFinite(savedNextId) && savedNextId > 0 ? savedNextId : (maxId + 1);
        } catch {
          setTodos([]);
          setLabels([]);
        }
      } else {
        setTodos([]);
        setLabels([]);
      }
      settingsLoadedRef.current = false;
      return;
    }
    let active = true;
    fetch('/api/todos', { credentials: 'include', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (!active) return;
        setTodos(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetch('/api/labels', { credentials: 'include', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (!active) return;
        const normalized = Array.isArray(data)
          ? data.map((label: ItemLabel) => ({ ...label, color: normalizeLabelColor((label as any).color) }))
          : [];
        setLabels(normalized);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    labelsRef.current = labels;
  }, [labels]);

  useEffect(() => {
    if (!isLabelMenuOpen && !isFilterMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (labelMenuRef.current && !labelMenuRef.current.contains(target)) {
        setIsLabelMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isLabelMenuOpen, isFilterMenuOpen]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetch('/api/settings')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active || !data) return;
        const persistedLanguage = ['en', 'ro', 'fr', 'de', 'es'].includes(data.language) ? data.language : '';
        const defaultLanguage = ['en', 'ro', 'fr', 'de', 'es'].includes(data.defaultLanguage) ? data.defaultLanguage : '';
        const defaultActiveTab = data.defaultActiveTab === 'event' ? 'event' : data.defaultActiveTab === 'task' ? 'task' : '';
        const nextLanguage = persistedLanguage || defaultLanguage || 'en';
        const nextActiveTab = (defaultActiveTab || (data.activeTab === 'event' ? 'event' : 'task')) as ItemType;
        const nextDates = Array.isArray(data.activeDateFilters) ? data.activeDateFilters : [];
        const nextTaskFilters = parseCombinedFilter(data.filterTask, false);
        const nextEventFilters = parseCombinedFilter(data.filterEvent, true);
        const monthStr = typeof data.calendarMonth === 'string' ? data.calendarMonth : '';
        const monthMatch = monthStr.match(/^(\d{4})-(\d{2})$/);
        const nextMonth = monthMatch
          ? new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1)
          : new Date();
        const nextShowSubtasksDefault = Boolean(data.defaultShowSubtasks);
        setLanguage(nextLanguage as Language);
        setActiveTab(nextActiveTab as ItemType);
        setActiveDateFilters(nextDates);
        setStatusFilterByType({ task: nextTaskFilters.status, event: nextEventFilters.status });
        setPriorityFilterByType({ task: nextTaskFilters.priority, event: nextEventFilters.priority });
        setCurrentDate(nextMonth);
        setShowSubtasksDefault(nextShowSubtasksDefault);
        settingsLoadedRef.current = true;
      })
      .catch(() => {});
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId || !settingsLoadedRef.current) return;
    if (settingsSaveTimerRef.current) clearTimeout(settingsSaveTimerRef.current);
    settingsSaveTimerRef.current = setTimeout(() => {
      void fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeTab,
          language,
          activeDateFilters,
          filterTask: buildCombinedFilter(statusFilterByType.task, priorityFilterByType.task),
          filterEvent: buildCombinedFilter(statusFilterByType.event, priorityFilterByType.event),
          calendarMonth: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        })
      }).catch(() => {});
    }, 500);
  }, [userId, activeTab, language, activeDateFilters, statusFilterByType, priorityFilterByType, currentDate]);

  const persistGuestState = useCallback(() => {
    if (typeof window === 'undefined' || userId) return;
    const payload = {
      nextId: nextIdRef.current,
      todos,
      labels,
      settings: {
        activeTab,
        language,
        activeDateFilters,
        filterTask: buildCombinedFilter(statusFilterByType.task, priorityFilterByType.task),
        filterEvent: buildCombinedFilter(statusFilterByType.event, priorityFilterByType.event),
        calendarMonth: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
        labelFilter,
        showSubtasksDefault
      }
    };
    localStorage.setItem(GUEST_STATE_STORAGE_KEY, JSON.stringify(payload));
  }, [
    userId,
    todos,
    labels,
    activeTab,
    language,
    activeDateFilters,
    statusFilterByType,
    priorityFilterByType,
    currentDate,
    labelFilter,
    showSubtasksDefault
  ]);

  useEffect(() => {
    persistGuestState();
  }, [persistGuestState]);

  useEffect(() => {
    if (typeof window === 'undefined' || userId) return;
    const flushGuestState = () => persistGuestState();
    window.addEventListener('pagehide', flushGuestState);
    window.addEventListener('beforeunload', flushGuestState);
    return () => {
      flushGuestState();
      window.removeEventListener('pagehide', flushGuestState);
      window.removeEventListener('beforeunload', flushGuestState);
    };
  }, [userId, persistGuestState]);

  useEffect(() => {
    const maxId = todos.reduce((max, item) => {
      const parsedId = Number.parseInt(String(item.id), 10);
      return Number.isFinite(parsedId) ? Math.max(max, parsedId) : max;
    }, 0);
    if (maxId + 1 > nextIdRef.current) nextIdRef.current = maxId + 1;
  }, [todos]);

  useEffect(() => {
    if (!showSubtasksDefault) {
      setExpandedSubitems(new Set());
      return;
    }
    setExpandedSubitems(new Set(todos.filter(t => t.type === 'event' && t.subtasks?.length).map(t => t.id)));
  }, [showSubtasksDefault, todos]);
  const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);
  const firstDayOfMonth = useMemo(() => {
    let day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; 
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, TodoItem[]> = {};
    todos.filter(item => item.type === 'event').forEach(item => {
      const d = new Date(item.sortTimestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [todos]);

  const taskCount = useMemo(() => todos.filter(item => item.type === 'task').length, [todos]);
  const eventCount = useMemo(() => todos.filter(item => item.type === 'event').length, [todos]);
  const filteredEventCount = useMemo(() => {
    const statusFilter = statusFilterByType.event;
    const priorityFilter = priorityFilterByType.event;
    const dateFilterSet = new Set(activeDateFilters);
    return todos
      .filter(item => item.type === 'event')
      .filter(item => {
        if (!activeDateFilters.length) return true;
        const d = new Date(item.sortTimestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return dateFilterSet.has(key);
      })
      .filter(item => {
        if (labelFilter === 'all') return true;
        if (labelFilter.startsWith('label:')) return item.labelId === labelFilter.slice(6);
        return true;
      })
      .filter(item => {
        if (statusFilter === 'closed') return item.completed;
        if (statusFilter === 'open') return !item.completed;
        if (statusFilter === 'outdated') return isItemOverdue(item);
        if (statusFilter === 'in_time') return !item.completed && !isItemOverdue(item);
        return true;
      })
      .filter(item => {
        if (priorityFilter === 'low') return item.priority === 'low';
        if (priorityFilter === 'normal') return item.priority === 'normal';
        if (priorityFilter === 'high') return item.priority === 'high';
        return true;
      })
      .length;
  }, [todos, statusFilterByType.event, priorityFilterByType.event, activeDateFilters, labelFilter]);
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
    const statusFilter = statusFilterByType[activeTab];
    const priorityFilter = priorityFilterByType[activeTab];
    let base = todos.filter(item => item.type === activeTab);
    
    // Date filter applies only to tasks (former events)
    if (activeTab === 'event' && activeDateFilters.length) {
      base = base.filter(item => {
        const d = new Date(item.sortTimestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return activeDateFilterSet.has(key);
      });
    }

    return base
      .filter(item => {
        if (activeTab !== 'event') return true;
        if (labelFilter === 'all') return true;
        if (labelFilter.startsWith('label:')) return item.labelId === labelFilter.slice(6);
        return true;
      })
      .filter(item => {
        let statusMatches = true;
        if (activeTab === 'event') {
          if (statusFilter === 'closed') statusMatches = item.completed;
          else if (statusFilter === 'open') statusMatches = !item.completed;
          else if (statusFilter === 'outdated') statusMatches = isItemOverdue(item);
          else if (statusFilter === 'in_time') statusMatches = !item.completed && !isItemOverdue(item);
        }
        let priorityMatches = true;
        if (priorityFilter === 'low') priorityMatches = item.priority === 'low';
        else if (priorityFilter === 'normal') priorityMatches = item.priority === 'normal';
        else if (priorityFilter === 'high') priorityMatches = item.priority === 'high';
        return statusMatches && priorityMatches;
      })
      .sort((a, b) => {
        if (activeTab === 'task') {
          return b.createdAt - a.createdAt;
        }
        const aTime = getItemDateTime(a);
        const bTime = getItemDateTime(b);
        if (aTime !== bTime) return aTime - bTime;
        return String(a.id).localeCompare(String(b.id));
      });
  }, [todos, activeTab, statusFilterByType, priorityFilterByType, activeDateFilters, activeDateFilterSet, labelFilter]);

  const groupedItems = useMemo(() => {
    if (activeTab === 'task') {
      return [{ key: 'notes', dateLabel: t.tasks, items: filteredItems }];
    }
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
        const dayLabel = date.toLocaleDateString(language, { day: '2-digit' });
        const monthLabel = date.toLocaleDateString(language, { month: 'long' });
        const weekdayLabel = date.toLocaleDateString(language, { weekday: 'long' });
        const dateLabel = `${dayLabel} ${monthLabel} • ${weekdayLabel}`;
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
  }, [activeTab, filteredItems, language, t.tasks]);

  const labelNameById = useMemo(() => {
    const map = new Map<string, string>();
    labels.forEach(label => map.set(label.id, label.name));
    return map;
  }, [labels]);
  const labelById = useMemo(() => {
    const map = new Map<string, ItemLabel>();
    labels.forEach(label => map.set(label.id, label));
    return map;
  }, [labels]);
  const labelsPromptContext = useMemo(() => {
    if (!labels.length) return 'Available labels: none.';
    return `Available labels: ${labels.map(label => label.name).join(', ')}.`;
  }, [labels]);

  const reminderModalItem = useMemo(
    () => todos.find(item => item.id === reminderModalItemId) || null,
    [todos, reminderModalItemId]
  );
  const reminderMaxMinutes = useMemo(() => {
    if (!reminderModalItem) return 0;
    const dueAt = getItemDateTime(reminderModalItem);
    return Math.max(0, Math.floor((dueAt - Date.now()) / 60000));
  }, [reminderModalItem]);
  const reminderMaxParts = useMemo(() => splitMinutesToDhm(reminderMaxMinutes), [reminderMaxMinutes]);

  const createLabel = useCallback(async () => {
    const name = normalizeLabelName(newLabelName);
    if (!name) return;
    if (!userId) {
      const id = `label-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const localLabel = { id, name, color: normalizeLabelColor(newLabelColor) };
      setLabels(prev => [...prev, localLabel].sort((a, b) => a.name.localeCompare(b.name)));
      setLabelFilter(`label:${id}`);
      setNewLabelName('');
      setNewLabelColor(DEFAULT_LABEL_COLOR);
      setIsLabelMenuOpen(false);
      return;
    }
    setLabelBusyId('create');
    const res = await fetch('/api/labels', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color: newLabelColor })
    });
    setLabelBusyId(null);
    if (!res.ok) return;
    const label = await res.json();
    setLabels(prev => {
      const existing = prev.find(l => l.id === label.id);
      if (existing) {
        return prev.map(l => (l.id === label.id ? { ...label, color: normalizeLabelColor(label.color) } : l))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return [...prev, { ...label, color: normalizeLabelColor(label.color) }].sort((a, b) => a.name.localeCompare(b.name));
    });
    setLabelFilter(`label:${label.id}`);
    setNewLabelName('');
    setNewLabelColor(DEFAULT_LABEL_COLOR);
    setIsLabelMenuOpen(false);
  }, [newLabelName, newLabelColor, userId]);

  const startEditLabel = useCallback((label: ItemLabel) => {
    setEditingLabelId(label.id);
    setEditingLabelName(label.name);
    setEditingLabelColor(normalizeLabelColor(label.color));
  }, []);

  const saveEditLabel = useCallback(async () => {
    if (!editingLabelId) return;
    const name = normalizeLabelName(editingLabelName);
    if (!name) return;
    if (!userId) {
      setLabels(prev => prev
        .map(label => (label.id === editingLabelId ? { ...label, name, color: normalizeLabelColor(editingLabelColor) } : label))
        .sort((a, b) => a.name.localeCompare(b.name)));
      setEditingLabelId(null);
      setEditingLabelName('');
      setEditingLabelColor(DEFAULT_LABEL_COLOR);
      return;
    }
    setLabelBusyId(editingLabelId);
    const res = await fetch(`/api/labels/${editingLabelId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color: editingLabelColor })
    });
    setLabelBusyId(null);
    if (!res.ok) return;
    const updated = await res.json();
    setLabels(prev => prev
      .map(label => (label.id === updated.id ? { ...updated, color: normalizeLabelColor(updated.color) } : label))
      .sort((a, b) => a.name.localeCompare(b.name)));
    setEditingLabelId(null);
    setEditingLabelName('');
    setEditingLabelColor(DEFAULT_LABEL_COLOR);
  }, [editingLabelId, editingLabelName, editingLabelColor, userId]);

  const deleteLabel = useCallback(async (id: string) => {
    if (!userId) {
      setLabels(prev => prev.filter(label => label.id !== id));
      if (labelFilter === `label:${id}`) setLabelFilter('all');
      setTodos(prev => prev.map(item => (item.labelId === id ? { ...item, labelId: undefined } : item)));
      if (editingLabelId === id) {
        setEditingLabelId(null);
        setEditingLabelName('');
        setEditingLabelColor(DEFAULT_LABEL_COLOR);
      }
      return;
    }
    setLabelBusyId(id);
    const res = await fetch(`/api/labels/${id}`, { method: 'DELETE', credentials: 'include' });
    setLabelBusyId(null);
    if (!res.ok) return;
    setLabels(prev => prev.filter(label => label.id !== id));
    if (labelFilter === `label:${id}`) setLabelFilter('all');
    setTodos(prev => prev.map(item => (item.labelId === id ? { ...item, labelId: undefined } : item)));
    if (editingLabelId === id) {
      setEditingLabelId(null);
      setEditingLabelName('');
      setEditingLabelColor(DEFAULT_LABEL_COLOR);
    }
  }, [userId, labelFilter, editingLabelId]);

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
    if (!args || typeof args !== 'object') args = {};
    const isLoggedIn = Boolean(userId);
    const resolveLabelIdFromArgs = () => {
      const normalizeLoose = (value: string) => value
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[\s_-]+/g, '');
      const labelIdFromArgs = args.labelId;
      const labelFromArgs = typeof args.label === 'string' ? normalizeLabelName(args.label) : '';
      const clearLabel = Boolean(args.clearLabel);
      if (clearLabel) return null;
      if (labelIdFromArgs !== undefined) {
        const value = String(labelIdFromArgs || '').trim();
        return value ? value : null;
      }
      if (labelFromArgs) {
        const found = labelsRef.current.find(label => label.name.toLocaleLowerCase() === labelFromArgs.toLocaleLowerCase());
        if (found) return found.id;
        const normalizedLabelValue = normalizeLoose(labelFromArgs);
        if (new Set(['no', 'none', 'nolabel', 'fara', 'faraeticheta', 'withoutlabel']).has(normalizedLabelValue)) return null;
      }
      if (args.label !== undefined && !labelFromArgs) return null;
      return undefined;
    };
    const updateTodo = (id: string, updater: (todo: TodoItem) => TodoItem) => {
      setTodos(prev => prev.map(todo => (todo.id === id ? updater(todo) : todo)));
    };

    const refreshTodos = () => {
      if (!userId) return;
      void fetch('/api/todos', { credentials: 'include', cache: 'no-store' })
        .then(res => (res.ok ? res.json() : []))
        .then(data => setTodos(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    const scheduleRefreshTodos = () => {
      if (todosRefreshTimerRef.current) clearTimeout(todosRefreshTimerRef.current);
      todosRefreshTimerRef.current = setTimeout(() => {
        refreshTodos();
      }, 120);
    };

    const enqueueById = (id: string, job: () => Promise<void>) => {
      const prev = requestQueueByIdRef.current.get(id) ?? Promise.resolve();
      const next = prev
        .then(job)
        .catch(() => {})
        .finally(() => {
          if (requestQueueByIdRef.current.get(id) === next) {
            requestQueueByIdRef.current.delete(id);
          }
        });
      requestQueueByIdRef.current.set(id, next);
    };

    const syncUpdate = (id: string, payload: Record<string, unknown>) => {
      if (!isLoggedIn) return;
      enqueueById(id, async () => {
        const res = await fetch(`/api/todos/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) refreshTodos();
        else scheduleRefreshTodos();
      });
    };

    const syncDelete = (id: string) => {
      if (!isLoggedIn) return;
      enqueueById(id, async () => {
        const res = await fetch(`/api/todos/${id}`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) refreshTodos();
        else scheduleRefreshTodos();
      });
    };

    const syncCreate = (tempId: string, item: Omit<TodoItem, 'id'>) => {
      if (!isLoggedIn) return;
      void fetch('/api/todos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
        .then(async (res) => (res.ok ? res.json() : null))
        .then(serverItem => {
          if (!serverItem) {
            setTodos(prev => prev.filter(todo => todo.id !== tempId));
            scheduleRefreshTodos();
            return;
          }
          if (canceledTempIdsRef.current.has(tempId)) {
            canceledTempIdsRef.current.delete(tempId);
            syncDelete(serverItem.id);
            return;
          }
          const pending = pendingTempUpdatesRef.current.get(tempId);
          if (pending) {
            pendingTempUpdatesRef.current.delete(tempId);
            syncUpdate(serverItem.id, pending);
          }
          setTodos(prev => prev.map(todo => (todo.id === tempId ? serverItem : todo)));
          scheduleRefreshTodos();
      })
        .catch(() => {
          setTodos(prev => prev.filter(todo => todo.id !== tempId));
        });
    };

    switch (name) {
      case ToolNames.ADD_TODO: {
        const normalizedTime = normalizeDueTime(args.time);
        const isNote = ((args.type as ItemType) || 'task') === 'task';
        const parsedDate = parseTaskDate(args.date);
        const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
        const relativeOffsetFromUser = inferRelativeDateOffset(lastUserCommandRef.current);
        const forcedRelativeTs = relativeOffsetFromUser !== null ? todayStart + (relativeOffsetFromUser * 86400000) : null;
        const ts = (!isNote && forcedRelativeTs !== null) ? forcedRelativeTs : parsedDate.timestamp;
        if (!isNote && args.date !== undefined && parsedDate.usedFallback) {
          showUiNotice(getInvalidDateMessage(String(args.date)));
        }
        if (!isNote && forcedRelativeTs !== null && args.date !== undefined && Math.abs(parsedDate.timestamp - forcedRelativeTs) >= 86400000) {
          showUiNotice(language === 'ro'
            ? 'Am folosit data relativa ceruta de tine (azi/maine/poimaine), nu data trimisa gresit de AI.'
            : language === 'fr'
              ? "J'ai applique la date relative demandee (aujourd'hui/demain/apres-demain), pas la date incorrecte de l'IA."
              : language === 'de'
                ? 'Ich habe das von dir genannte relative Datum verwendet (heute/morgen/uebermorgen), nicht das falsche KI-Datum.'
                : language === 'es'
                  ? 'Aplique la fecha relativa que pediste (hoy/manana/pasado manana), no la fecha incorrecta de la IA.'
                  : 'I used your relative date (today/tomorrow/day after tomorrow), not the incorrect AI date.');
        }
        const noteTitle = isNote ? capitalize(String(args.title || args.text || '').trim()) : undefined;
        const normalizedSubtasks = isNote ? undefined : normalizeSubitems(args.subtasks);
        const resolvedLabelId = resolveLabelIdFromArgs();
        const baseItem: Omit<TodoItem, 'id'> = {
          title: noteTitle,
          text: isNote ? String(args.text || '').trim() : capitalize(args.text),
          labelId: !isNote && resolvedLabelId ? String(resolvedLabelId) : undefined,
          type: (args.type as ItemType) || 'task',
          completed: false,
          createdAt: Date.now(),
          dueDate: isNote ? undefined : new Date(ts).toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' }),
          dueTime: isNote ? undefined : normalizedTime,
          location: isNote ? undefined : (args.location ? normalizeLocation(args.location, language) : undefined),
          subtasks: normalizedSubtasks,
          sortTimestamp: isNote ? Date.now() : ts,
          priority: (args.priority as Priority) || 'normal'
        };

        if (!isLoggedIn) {
          const id = String(nextIdRef.current++);
          const newItem: TodoItem = { id, ...baseItem };
          setTodos(prev => [newItem, ...prev]);
          setActiveTab(newItem.type);
          setHighlightedTaskId(id);
          if (newItem.subtasks?.length) {
            setExpandedSubitems(prev => new Set(prev).add(id));
          }
          break;
        }

        const tempId = `tmp-${Date.now()}`;
        setTodos(prev => [{ id: tempId, ...baseItem }, ...prev]);
        setActiveTab(baseItem.type);
        setHighlightedTaskId(tempId);
        if (baseItem.subtasks?.length) {
          setExpandedSubitems(prev => new Set(prev).add(tempId));
        }
        syncCreate(tempId, baseItem);
        break;
      }
      case ToolNames.EDIT_TODO: {
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

        const existing = todosRef.current.find(todo => todo.id === editId);
        if (!existing) {
          refreshTodos();
          break;
        }
        const parsedDate = args.date !== undefined ? parseTaskDate(args.date) : null;
        const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
        const relativeOffsetFromUser = inferRelativeDateOffset(lastUserCommandRef.current);
        const forcedRelativeTs = relativeOffsetFromUser !== null ? todayStart + (relativeOffsetFromUser * 86400000) : null;
        const newTs = (parsedDate ? (forcedRelativeTs ?? parsedDate.timestamp) : existing.sortTimestamp);
        const newType = existing.type;
        const isNote = newType === 'task';
        if (!isNote && parsedDate?.usedFallback && args.date !== undefined) {
          showUiNotice(getInvalidDateMessage(String(args.date)));
        }
        if (!isNote && parsedDate && forcedRelativeTs !== null && args.date !== undefined && Math.abs(parsedDate.timestamp - forcedRelativeTs) >= 86400000) {
          showUiNotice(language === 'ro'
            ? 'Am aplicat data relativa pe care ai spus-o, pentru a evita o data gresita de la AI.'
            : language === 'fr'
              ? "J'ai applique la date relative que tu as dite pour eviter une date erronee de l'IA."
              : language === 'de'
                ? 'Ich habe dein relatives Datum angewendet, um ein falsches KI-Datum zu vermeiden.'
                : language === 'es'
                  ? 'Aplique la fecha relativa que dijiste para evitar una fecha incorrecta de la IA.'
                  : 'I applied the relative date you said to avoid an incorrect AI date.');
        }
        const newLocation = args.location !== undefined
          ? (isNote ? undefined : (args.location ? normalizeLocation(args.location, language) : undefined))
          : existing.location;
        const newSubtasks = args.subtasks !== undefined
          ? (isNote ? undefined : normalizeSubitems(args.subtasks))
          : existing.subtasks;
        const normalizedTime = args.time !== undefined ? normalizeDueTime(args.time) : existing.dueTime;
        const eventTextFromTitle = !isNote && args.text === undefined && args.title !== undefined
          ? String(args.title)
          : undefined;
        const newTitle = args.title !== undefined
          ? (args.title ? capitalize(String(args.title)) : undefined)
          : existing.title;
        const resolvedLabelId = resolveLabelIdFromArgs();
        const labelWasSpecified = args.labelId !== undefined || args.label !== undefined || args.clearLabel !== undefined;
        const newLabelId = resolvedLabelId !== undefined
          ? (resolvedLabelId ? String(resolvedLabelId) : undefined)
          : existing.labelId;
        const nextTodo: TodoItem = {
          ...existing,
          title: newTitle,
          text: args.text !== undefined
            ? (isNote ? String(args.text) : capitalize(args.text))
            : eventTextFromTitle !== undefined
              ? capitalize(eventTextFromTitle)
              : existing.text,
          labelId: isNote ? undefined : newLabelId,
          type: newType,
          completed: isNote ? false : existing.completed,
          dueDate: isNote ? undefined : (args.date ? new Date(newTs).toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' }) : existing.dueDate),
          dueTime: isNote ? undefined : normalizedTime,
          location: newLocation,
          subtasks: newSubtasks,
          priority: (args.priority as Priority) || existing.priority,
          sortTimestamp: isNote ? existing.createdAt : newTs
        };
        const payload: Record<string, unknown> = {};
        if (args.title !== undefined) payload.title = nextTodo.title ?? null;
        if (labelWasSpecified) payload.labelId = isNote ? null : nextTodo.labelId ?? null;
        if (args.text !== undefined || eventTextFromTitle !== undefined) payload.text = nextTodo.text;
        if (args.date !== undefined && !isNote) {
          payload.sortTimestamp = nextTodo.sortTimestamp;
          payload.dueDate = nextTodo.dueDate ?? null;
        }
        if (args.time !== undefined) payload.dueTime = isNote ? null : nextTodo.dueTime ?? null;
        if (args.location !== undefined) payload.location = isNote ? null : nextTodo.location ?? null;
        if (args.subtasks !== undefined) payload.subtasks = isNote ? null : nextTodo.subtasks ?? null;
        if (isNote) {
          payload.completed = false;
          payload.dueDate = null;
          payload.dueTime = null;
          payload.location = null;
          payload.subtasks = null;
          payload.sortTimestamp = existing.createdAt;
        }
        if (args.priority !== undefined) payload.priority = nextTodo.priority;
        setTodos(prev => prev.map(todo => (todo.id === editId ? nextTodo : todo)));
        if (!isLoggedIn) {
          break;
        }
        if (editId.startsWith('tmp-')) {
          const existing = pendingTempUpdatesRef.current.get(editId) || {};
          pendingTempUpdatesRef.current.set(editId, { ...existing, ...payload });
          break;
        }
        syncUpdate(editId, payload);
        break;
      }
      case ToolNames.ADD_SUBTASK: {
        const parentId = String(args.id);
        const addItems = normalizeSubitems(args.subtasks ?? args.text ?? args.subtask);
        if (!addItems?.length) break;
        updateTodo(parentId, (todo) => {
          if (todo.type !== 'event') return todo;
          const existing = todo.subtasks || [];
          const updated = [...existing, ...addItems];
          if (isLoggedIn) syncUpdate(parentId, { subtasks: updated });
          return { ...todo, subtasks: updated };
        });
        setExpandedSubitems(prev => new Set(prev).add(parentId));
        break;
      }
      case ToolNames.EDIT_SUBTASK: {
        const parentId = String(args.id);
        const oneBasedIndex = Number(args.subtaskIndex);
        const normalized = normalizeSubitems([args.text]);
        if (!Number.isInteger(oneBasedIndex) || oneBasedIndex < 1 || !normalized?.length) break;

        updateTodo(parentId, (todo) => {
          if (todo.type !== 'event') return todo;
          const existing = [...(todo.subtasks || [])];
          const targetIndex = oneBasedIndex - 1;
          if (targetIndex >= existing.length) return todo;
          existing[targetIndex] = normalized[0];
          if (isLoggedIn) syncUpdate(parentId, { subtasks: existing });
          return { ...todo, subtasks: existing };
        });
        setExpandedSubitems(prev => new Set(prev).add(parentId));
        break;
      }
      case ToolNames.DELETE_SUBTASK: {
        const parentId = String(args.id);
        const oneBasedIndex = Number(args.subtaskIndex);
        if (!Number.isInteger(oneBasedIndex) || oneBasedIndex < 1) break;

        updateTodo(parentId, (todo) => {
          if (todo.type !== 'event') return todo;
          const existing = [...(todo.subtasks || [])];
          const targetIndex = oneBasedIndex - 1;
          if (targetIndex >= existing.length) return todo;
          existing.splice(targetIndex, 1);
          if (isLoggedIn) syncUpdate(parentId, { subtasks: existing });
          return { ...todo, subtasks: existing.length ? existing : undefined };
        });
        break;
      }
      case ToolNames.DELETE_TODO: {
        const id = String(args.id);
        if (id.startsWith('tmp-')) {
          canceledTempIdsRef.current.add(id);
          setTodos(prev => prev.filter(t => t.id !== id));
          break;
        }
        setTodos(prev => prev.filter(t => t.id !== id));
        if (isLoggedIn) syncDelete(id);
        if (typeof window !== 'undefined' && isLoggedIn) {
          window.dispatchEvent(new CustomEvent('trash-count-refresh', { detail: { delta: 1 } }));
        }
        break;
      }
      case ToolNames.TOGGLE_TODO: {
        const id = String(args.id);
        updateTodo(id, (todo) => {
          if (todo.type !== 'event') return todo;
          const next = { ...todo, completed: !todo.completed };
          if (isLoggedIn) syncUpdate(id, { completed: next.completed });
          return next;
        });
        break;
      }
      case ToolNames.CLEAR_COMPLETED: {
        const removedCount = todosRef.current.filter(t => t.type === 'event' && t.completed && !String(t.id).startsWith('tmp-')).length;
        setTodos(prev => {
          if (isLoggedIn) prev.filter(t => t.type === 'event' && t.completed).forEach(t => syncDelete(t.id));
          return prev.filter(t => !(t.type === 'event' && t.completed));
        });
        if (typeof window !== 'undefined' && isLoggedIn && removedCount > 0) {
          window.dispatchEvent(new CustomEvent('trash-count-refresh', { detail: { delta: removedCount } }));
        }
        break;
      }
    }
    return "OK";
  }, [language, activeTab, userId]);

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
              lastUserCommandRef.current = `${lastUserCommandRef.current} ${m.serverContent.inputTranscription.text}`.trim();
              const idMatch = text.match(/id\s+(\d+)|item\s+(\d+)|sarcina\s+(\d+)|task\s+(\d+)|tarea\s+(\d+)/);
              if (idMatch) setHighlightedTaskId(idMatch[1] || idMatch[2] || idMatch[3] || idMatch[4] || idMatch[5]);
            }
            if (m.serverContent?.turnComplete) {
              setTranscription('');
              setTimeout(() => setHighlightedTaskId(null), 3000);
              lastUserCommandRef.current = '';
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
              for (const fc of m.toolCall.functionCalls ?? []) {
                const functionName = fc.name || 'unknown_tool';
                const functionArgs = fc.args && typeof fc.args === 'object' ? fc.args : {};
                let toolResponse: Record<string, unknown>;
                try {
                  const res = executeTool(functionName, functionArgs);
                  toolResponse = { ok: true, result: res };
                } catch (error) {
                  console.error('Tool execution failed:', functionName, error);
                  toolResponse = { ok: false, error: 'Tool execution failed' };
                }
                if (!isLiveRef.current) continue;
                sessionPromise.then(s => {
                  if (!isLiveRef.current || !s) return;
                  s.sendToolResponse({ functionResponses: { id: fc.id, name: functionName, response: toolResponse } });
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
          systemInstruction: `${systemInstructions[language]} ${labelsPromptContext} Current date is ${new Date().toISOString().split('T')[0]}. For relative dates like today/tomorrow/day after tomorrow, resolve against this date.`,
          tools: [{ functionDeclarations: todoTools }],
          inputAudioTranscription: {},
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) { isConnectingRef.current = false; isLiveRef.current = false; setIsLive(false); }
  };

  const openMobileMicModal = useCallback(() => {
    setIsMobileMicModalOpen(true);
    if (!isLive && !isConnectingRef.current) {
      void startLiveSession();
    }
  }, [isLive, startLiveSession]);

  const closeMobileMicModal = useCallback(() => {
    stopLiveSession();
    setIsMobileMicModalOpen(false);
  }, [stopLiveSession]);

  useEffect(() => {
    if (!isMobileMicModalOpen) return;
    if (!isLive && !isConnectingRef.current) {
      setIsMobileMicModalOpen(false);
    }
  }, [isLive, isMobileMicModalOpen]);

  useEffect(() => {
    if (!isMobileMicModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isMobileMicModalOpen]);

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
    lastUserCommandRef.current = inputValue;
    const todayIso = new Date().toISOString().split('T')[0];
    const response = await generateAssistantResponse(
      `${inputValue}\n${labelsPromptContext}\nCurrent date: ${todayIso}. For relative dates (today/tomorrow/day after tomorrow), convert to this context.`,
      [],
      language
    );
    response.functionCalls?.forEach(c => executeTool(c.name, c.args));
    lastUserCommandRef.current = '';
    setInputValue('');
    setIsWriteMode(false);
  };

  const openAddModal = () => {
    const today = new Date();
    setModalMode('add');
    setModalItemId(null);
    setFormType(activeTab);
    setFormPriority('normal');
    setFormTitle('');
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
    setFormTitle(item.title || (item.type === 'task' ? item.text : ''));
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
    setFormTitle('');
    setFormSubtasks('');
  };

  const openReminderModal = useCallback((item: TodoItem) => {
    if (item.type !== 'event') return;
    if (!userId) {
      showUiNotice(getReminderLoginRequiredMessage());
      return;
    }
    const maxMinutes = Math.max(0, Math.floor((getItemDateTime(item) - Date.now()) / 60000));
    const initialMinutes = item.reminderMinutesBefore !== undefined
      ? Math.min(item.reminderMinutesBefore, maxMinutes)
      : Math.min(10, maxMinutes);
    const parts = splitMinutesToDhm(initialMinutes);
    setReminderDays(String(parts.days));
    setReminderHours(String(parts.hours));
    setReminderMinutes(String(parts.minutes));
    setReminderChannel(item.reminderChannel ?? 'email');
    setReminderError('');
    setReminderModalItemId(item.id);
  }, [userId, showUiNotice, getReminderLoginRequiredMessage]);

  const closeReminderModal = useCallback(() => {
    setReminderModalItemId(null);
    setReminderError('');
  }, []);

  const saveReminder = useCallback(async () => {
    if (!reminderModalItemId) return;
    const days = Math.max(0, Number(reminderDays) || 0);
    const hours = Math.max(0, Number(reminderHours) || 0);
    const minutes = Math.max(0, Number(reminderMinutes) || 0);
    const totalMinutes = (days * 24 * 60) + (hours * 60) + minutes;

    if (!Number.isInteger(totalMinutes) || totalMinutes < 0) {
      setReminderError(t.reminderErrorInvalidTime);
      return;
    }
    if (totalMinutes >= reminderMaxMinutes) {
      setReminderError(t.reminderErrorBeforeTask);
      return;
    }

    setIsReminderSaving(true);
    setReminderError('');
    const res = await fetch(`/api/todos/${reminderModalItemId}/reminder`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutesBefore: totalMinutes, channel: reminderChannel })
    });
    setIsReminderSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setReminderError(data.error || t.reminderErrorSave);
      return;
    }

    setTodos(prev => prev.map(item => (
      item.id === reminderModalItemId
        ? { ...item, reminderMinutesBefore: totalMinutes, reminderChannel }
        : item
    )));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('reminder-count-refresh'));
    closeReminderModal();
  }, [
    reminderModalItemId,
    reminderDays,
    reminderHours,
    reminderMinutes,
    reminderChannel,
    reminderMaxMinutes,
    closeReminderModal,
    t.reminderErrorBeforeTask,
    t.reminderErrorInvalidTime,
    t.reminderErrorSave
  ]);

  const removeReminder = useCallback(async () => {
    if (!reminderModalItemId) return;
    setIsReminderSaving(true);
    setReminderError('');
    const res = await fetch(`/api/todos/${reminderModalItemId}/reminder`, {
      method: 'DELETE',
      credentials: 'include'
    });
    setIsReminderSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setReminderError(data.error || t.reminderErrorRemove);
      return;
    }

    setTodos(prev => prev.map(item => (
      item.id === reminderModalItemId
        ? { ...item, reminderMinutesBefore: undefined, reminderChannel: undefined }
        : item
    )));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('reminder-count-refresh'));
    closeReminderModal();
  }, [reminderModalItemId, closeReminderModal, t.reminderErrorRemove]);

  const saveModal = () => {
    if (!modalMode) return;
    if (formType === 'task') {
      if (!formTitle.trim()) return;
    } else if (!formText.trim()) {
      return;
    }
    if (modalMode === 'edit') {
      if (!modalItemId) return;
      executeTool(ToolNames.EDIT_TODO, {
        id: modalItemId,
        title: formType === 'task' ? formTitle : null,
        text: formType === 'task' ? formText : formText,
        date: formType === 'event' ? formDate : null,
        time: formType === 'event' ? (formTime || null) : null,
        location: formType === 'event' ? (formLocation || null) : null,
        priority: formPriority,
        subtasks: formType === 'event' ? formSubtasks : null,
        completed: formType === 'task' ? false : undefined
      });
    } else {
      executeTool(ToolNames.ADD_TODO, {
        title: formType === 'task' ? formTitle : null,
        text: formType === 'task' ? formText : formText,
        type: formType,
        date: formType === 'event' ? formDate : null,
        time: formType === 'event' ? (formTime || null) : null,
        location: formType === 'event' ? (formLocation || null) : null,
        priority: formPriority,
        subtasks: formType === 'event' ? formSubtasks : null
      });
    }
    closeModal();
  };

  const priorityColors = {
    low: 'text-slate-500 bg-slate-100',
    normal: 'text-blue-600 bg-blue-50',
    high: 'text-amber-900 bg-amber-200'
  };
  const formTypeLabel = formType === 'task' ? 'Note' : 'Task';
  const activeFilterLabel = (() => {
    const statusMode = statusFilterByType[activeTab];
    const priorityMode = priorityFilterByType[activeTab];
    if (activeTab === 'task') {
      if (priorityMode === 'low') return t.prioLow;
      if (priorityMode === 'normal') return t.prioNormal;
      if (priorityMode === 'high') return t.prioHigh;
      return t.filterAllPriorities;
    }
    const statusLabel = statusMode === 'closed'
      ? t.filterResolved
      : statusMode === 'open'
        ? t.filterUnresolved
        : statusMode === 'outdated'
          ? t.filterOverdue
          : statusMode === 'in_time'
            ? t.filterInTime
            : t.filterAll;
    const priorityLabel = priorityMode === 'low'
      ? t.prioLow
      : priorityMode === 'normal'
        ? t.prioNormal
        : priorityMode === 'high'
          ? t.prioHigh
          : '';
    return priorityLabel ? `${statusLabel} + ${priorityLabel}` : statusLabel;
  })();
  const activeLabelLabel = activeTab === 'event'
    ? (labelFilter === 'all' ? t.allLabels : labelNameById.get(labelFilter.slice(6)) || t.allLabels)
    : '-';
  const mobilePriorityLabel = (() => {
    const priorityMode = priorityFilterByType[activeTab];
    if (priorityMode === 'all') return '';
    if (priorityMode === 'low') return t.prioLow;
    if (priorityMode === 'normal') return t.prioNormal;
    return t.prioHigh;
  })();
  const mobileFilterLine = activeTab === 'task' ? mobilePriorityLabel : activeFilterLabel;
  const mobileLabelLine = activeTab === 'event' ? activeLabelLabel : '';

  return (
    <div className="min-h-screen bg-[#FDF5E6] text-slate-900 selection:bg-blue-100 pb-20">
      <AppHeader
        t={{
          appTitle: t.appTitle,
          menuHome: t.menuHome,
          menuFeatures: t.menuFeatures,
          menuPricing: t.menuPricing,
          menuBlog: t.menuBlog,
          menuTrash: t.menuTrash,
          languages: t.languages,
          // menuTitle: t.menuTitle,
          close: t.close
        }}
        language={language}
        setLanguage={handleLanguageChange}
        languageNames={languageNames}
        languageFlags={languageFlags}
        nowLabel={nowLabel}
        userId={userId}
        userEmail={session?.user?.email}
        bellCount={totalCount}
      />

      {uiNotice && (
        <div className="max-w-7xl mx-auto px-6 mt-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 shadow-sm">
            {uiNotice}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto sticky top-0 z-40 bg-[#FDF5E6] backdrop-blur-xl px-6 py-6 mb-8 border-b border-black">
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
            <button
              type="button"
              onClick={openAddModal}
              className="flex-shrink-0 w-14 h-14 rounded-[20px] flex items-center justify-center transition-all bg-blue-50 text-blue-600 border border-slate-200 shadow-xl shadow-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:scale-105"
              aria-label="Create item"
              title="Create item"
            >
              <i className="fas fa-pen text-lg"></i>
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
                  onClick={openMobileMicModal} 
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
          <div className="flex flex-nowrap items-center justify-between gap-4 overflow-visible p-[10px] bg-white rounded-[20px] border border-slate-200">
            <div className="flex items-center gap-6 flex-shrink-0">
              <button onClick={() => setActiveTab('task')} className={`pb-1 px-1 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all relative ${activeTab === 'task' ? 'text-blue-600' : 'text-slate-400'}`}>
                {t.tasks}
                <span className="absolute -top-[5px] -right-[12px] flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal">
                  {taskCount}
                </span>
                {activeTab === 'task' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
              </button>
              <button onClick={() => setActiveTab('event')} className={`pb-1 px-1 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all relative ${activeTab === 'event' ? 'text-blue-600' : 'text-slate-400'}`}>
                {t.events}
                <span className="absolute -top-[5px] -right-[12px] flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal">
                  {filteredEventCount}
                </span>
                {activeTab === 'event' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
              </button>
            </div>

            <div className="hidden max-[500px]:flex mb-0 items-center gap-3">
              <div className="leading-tight text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">
                {mobileFilterLine && <div className="text-slate-400">{mobileFilterLine}</div>}
                {mobileLabelLine && <div className="text-slate-400">{mobileLabelLine}</div>}
              </div>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(true)}
                className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 flex-shrink-0"
                aria-label="Open filters"
              >
                <i className="fas fa-sliders-h text-xs"></i>
              </button>
            </div>

            <div className="p-[10px] flex items-center gap-2 max-[500px]:hidden flex-nowrap justify-end shrink-0 whitespace-nowrap">
              <div className="relative" ref={filterMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterMenuOpen(prev => !prev)}
                  className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm hover:border-blue-300 transition-all cursor-pointer"
                >
                  <i className="fas fa-filter text-[10px] text-slate-400 mr-2"></i>
                  <span className="text-[10px] font-black text-blue-500 tracking-widest px-2 py-0.5">{activeFilterLabel}</span>
                  <i className="fas fa-chevron-down text-[10px] text-slate-400 ml-1"></i>
                </button>
                {isFilterMenuOpen && (
                  <div className="absolute top-full left-1/2 mt-2 flex w-64 -translate-x-1/2 flex-col bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-[120]">
                    {activeTab === 'event' && (
                      <>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 pb-1">Status</div>
                        <button
                          onClick={() => setStatusFilterByType(prev => ({ ...prev, [activeTab]: 'all' }))}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${statusFilterByType[activeTab] === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {t.filterAll}
                        </button>
                        <button
                          onClick={() => setStatusFilterByType(prev => ({ ...prev, [activeTab]: 'closed' }))}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${statusFilterByType[activeTab] === 'closed' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {t.filterResolved}
                        </button>
                        <button
                          onClick={() => setStatusFilterByType(prev => ({ ...prev, [activeTab]: 'open' }))}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${statusFilterByType[activeTab] === 'open' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {t.filterUnresolved}
                        </button>
                        <button
                          onClick={() => setStatusFilterByType(prev => ({ ...prev, [activeTab]: 'outdated' }))}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${statusFilterByType[activeTab] === 'outdated' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {t.filterOverdue}
                        </button>
                        <button
                          onClick={() => setStatusFilterByType(prev => ({ ...prev, [activeTab]: 'in_time' }))}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${statusFilterByType[activeTab] === 'in_time' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {t.filterInTime}
                        </button>
                        <div className="mt-2 pt-2 border-t border-slate-200"></div>
                      </>
                    )}
                    <div className={`${activeTab === 'event' ? '' : 'pt-0'} flex flex-col`}>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 pb-1">Priority</div>
                      <button
                        onClick={() => setPriorityFilterByType(prev => ({ ...prev, [activeTab]: 'all' }))}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${priorityFilterByType[activeTab] === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {t.filterAllPriorities}
                      </button>
                      {(['low', 'normal', 'high'] as const).map(value => (
                        <button
                          key={value}
                          onClick={() => setPriorityFilterByType(prev => ({ ...prev, [activeTab]: prev[activeTab] === value ? 'all' : value }))}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${priorityFilterByType[activeTab] === value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {value === 'low' ? t.filterLow : value === 'normal' ? t.filterNormal : t.filterHigh}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {activeTab === 'event' && (
                <div className="relative" ref={labelMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsLabelMenuOpen(prev => !prev)}
                    className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <i className="fas fa-tags text-[10px] text-slate-400 mr-2"></i>
                    {labelFilter.startsWith('label:') && labelById.get(labelFilter.slice(6)) && (
                      <span
                        className="h-2.5 w-2.5 rounded-full mr-2"
                        style={{ backgroundColor: normalizeLabelColor(labelById.get(labelFilter.slice(6))!.color) }}
                      ></span>
                    )}
                    <span className="text-[10px] font-black text-blue-500 tracking-widest px-2 py-0.5">
                      {labelFilter === 'all'
                        ? t.allLabels
                        : labelNameById.get(labelFilter.slice(6)) || t.allLabels}
                    </span>
                    <i className="fas fa-chevron-down text-[10px] text-slate-400 ml-1"></i>
                  </button>
                  {isLabelMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-[70]">
                      <button
                        onClick={() => { setLabelFilter('all'); setIsLabelMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${labelFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {t.allLabels}
                      </button>
                      {labels.map(label => (
                        <div
                          key={label.id}
                          className={`w-full px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${labelFilter === `label:${label.id}` ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className="w-full flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: normalizeLabelColor(label.color) }}
                            ></span>
                            <div
                              onClick={() => {
                                if (editingLabelId === label.id) return;
                                setLabelFilter(`label:${label.id}`);
                                setIsLabelMenuOpen(false);
                              }}
                              className="flex-1 text-left truncate cursor-pointer"
                            >
                              {editingLabelId === label.id ? (
                                <input
                                  value={editingLabelName}
                                  onChange={(e) => setEditingLabelName(e.target.value)}
                                  className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700"
                                />
                              ) : (
                                label.name
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => void deleteLabel(label.id)}
                              disabled={labelBusyId === label.id}
                              className="h-5 w-5 inline-flex items-center justify-center"
                              title="Delete label"
                            >
                              <i className="fas fa-trash text-[10px]"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditLabel(label)}
                              disabled={labelBusyId === label.id}
                              className="h-5 w-5 inline-flex items-center justify-center"
                              title="Edit label"
                            >
                              <i className="fas fa-pen text-[10px]"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => void saveEditLabel()}
                              disabled={editingLabelId !== label.id || labelBusyId === label.id}
                              className="h-5 w-5 inline-flex items-center justify-center disabled:opacity-40"
                              title="Confirm label"
                            >
                              <i className="fas fa-check text-[10px]"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 pb-1">{t.addLabel}</div>
                        <div className="flex gap-2 overflow-x-auto whitespace-nowrap px-2 pb-2">
                          {LABEL_COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => editingLabelId ? setEditingLabelColor(color) : setNewLabelColor(color)}
                              className={`h-6 w-6 rounded-full border-2 flex-shrink-0 transition-all ${(editingLabelId ? editingLabelColor : newLabelColor) === color ? 'border-slate-700 scale-105' : 'border-white'}`}
                              style={{ backgroundColor: color }}
                              aria-label={`Color ${color}`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder={t.labelNamePlaceholder}
                          />
                          <button
                            type="button"
                            onClick={() => void createLabel()}
                            disabled={!normalizeLabelName(newLabelName) || labelBusyId === 'create'}
                            className="h-9 w-9 rounded-xl text-blue-600 inline-flex items-center justify-center disabled:opacity-40"
                            title={t.addLabel}
                          >
                            <i className="fas fa-check text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop:0 }} className={`fixed inset-0 z-[80] min-[501px]:hidden transition-opacity duration-300 ${isFilterPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-slate-900/35" onClick={() => setIsFilterPanelOpen(false)}></div>
            <aside className={`absolute right-0 top-0 bottom-0 w-[88%] max-w-[360px] bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ${isFilterPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="p-5 pt-14">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Filters</h3>
                </div>

                <div className="space-y-3">
                  {activeTab === 'event' && (
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</div>
                      <div className="space-y-2">
                        {[
                          { value: 'all', label: t.filterAll },
                          { value: 'closed', label: t.filterResolved },
                          { value: 'open', label: t.filterUnresolved },
                          { value: 'outdated', label: t.filterOverdue },
                          { value: 'in_time', label: t.filterInTime }
                        ].map(opt => (
                          <label key={opt.value} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                              type="radio"
                              name="mobile-status-filter"
                              checked={statusFilterByType[activeTab] === (opt.value as StatusFilter)}
                              onChange={() => setStatusFilterByType(prev => ({ ...prev, [activeTab]: opt.value as StatusFilter }))}
                              className="h-4 w-4"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Priority</div>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: t.filterAllPriorities },
                        { value: 'normal', label: t.filterNormal },
                        { value: 'low', label: t.filterLow },
                        { value: 'high', label: t.filterHigh }
                      ].map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="radio"
                            name="mobile-priority-filter"
                            checked={priorityFilterByType[activeTab] === (opt.value as PriorityFilterMode)}
                            onChange={() => setPriorityFilterByType(prev => ({ ...prev, [activeTab]: opt.value as PriorityFilterMode }))}
                            className="h-4 w-4"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {activeTab === 'event' && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.labelsTitle}</div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="radio"
                            name="mobile-label-filter"
                            checked={labelFilter === 'all'}
                            onChange={() => setLabelFilter('all')}
                            className="h-4 w-4"
                          />
                          <span>{t.allLabels}</span>
                        </label>
                        {labels.map(label => (
                          <div key={label.id} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                              type="radio"
                              name="mobile-label-filter"
                              checked={labelFilter === `label:${label.id}`}
                              onChange={() => setLabelFilter(`label:${label.id}`)}
                              className="h-4 w-4"
                            />
                            <span
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: normalizeLabelColor(label.color) }}
                            ></span>
                            {editingLabelId === label.id ? (
                              <div className="flex-1 min-w-0">
                                <input
                                  value={editingLabelName}
                                  onChange={(e) => setEditingLabelName(e.target.value)}
                                  className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
                                />
                              </div>
                            ) : (
                              <span className="flex-1">{label.name}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => void deleteLabel(label.id)}
                              disabled={labelBusyId === label.id}
                              className="h-7 w-7 inline-flex items-center justify-center text-slate-500"
                              title="Delete label"
                            >
                              <i className="fas fa-trash text-[11px]"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditLabel(label)}
                              disabled={labelBusyId === label.id}
                              className="h-7 w-7 inline-flex items-center justify-center text-slate-500"
                              title="Edit label"
                            >
                              <i className="fas fa-pen text-[11px]"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => void saveEditLabel()}
                              disabled={editingLabelId !== label.id || labelBusyId === label.id}
                              className="h-7 w-7 inline-flex items-center justify-center text-blue-600 disabled:opacity-40"
                              title="Confirm label"
                            >
                              <i className="fas fa-check text-[11px]"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.addLabel}</div>
                        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2">
                          {LABEL_COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => editingLabelId ? setEditingLabelColor(color) : setNewLabelColor(color)}
                              className={`h-6 w-6 rounded-full border-2 flex-shrink-0 transition-all ${(editingLabelId ? editingLabelColor : newLabelColor) === color ? 'border-slate-700 scale-105' : 'border-white'}`}
                              style={{ backgroundColor: color }}
                              aria-label={`Color ${color}`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder={t.labelNamePlaceholder}
                          />
                          <button
                            type="button"
                            onClick={() => void createLabel()}
                            disabled={!normalizeLabelName(newLabelName) || labelBusyId === 'create'}
                            className="h-9 w-9 rounded-xl text-blue-600 inline-flex items-center justify-center disabled:opacity-40"
                            title={t.addLabel}
                          >
                            <i className="fas fa-check text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>


          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="py-10 flex flex-col items-center">
                {activeTab === 'event' && activeDateFilters.length > 0 && (
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
                {activeTab === 'event' && (
                  <div
                    className="text-blue-600 sticky top-24 z-20 -mx-2 px-4 py-2 text-xs font-black tracking-wider uppercase bg-[#FDF5E6] backdrop-blur-md flex items-center justify-between"
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
                )}
                {group.items.map(item => (
                  <div key={item.id} id={`todo-${item.id}`} className={`transition-all duration-300 ${highlightedTaskId === item.id ? 'scale-[1.03] ring-4 ring-blue-500/50 rounded-[32px] shadow-2xl z-10 relative' : ''}`}>
                    <div className={`flex items-start justify-between p-6 bg-white rounded-[32px] shadow-sm border border-slate-100 transition-all ${item.type === 'event' && item.completed ? 'bg-slate-50 opacity-60' : 'hover:border-blue-200 hover:shadow-md'} ${highlightedTaskId === item.id ? 'border-blue-400' : ''}`}>
                      <div className="flex items-start space-x-5 w-full">
                        {item.type === 'event' ? (
                          <button onClick={() => executeTool(ToolNames.TOGGLE_TODO, { id: item.id })} className={`mt-10 flex-shrink-0 w-7 h-7 rounded-xl border-2 transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-200'}`}>
                            {item.completed && <i className="fas fa-check text-xs"></i>}
                          </button>
                        ) : (
                          <div className="mt-10 flex-shrink-0 w-7 h-7"></div>
                        )}
                        <div className="flex flex-col flex-grow leading-tight overflow-hidden">
                          {/* Line 1: Time + Type + Priority */}
                          <div className="flex items-center justify-between mb-4 max-[1450px]:flex-col max-[1450px]:items-start max-[1450px]:gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-[13px] font-black uppercase tracking-tighter text-slate-600 max-[1450px]:grid max-[1450px]:grid-cols-2 max-[1450px]:gap-2 max-[1450px]:w-full">
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg w-fit max-[1450px]:w-full ${item.type === 'task' ? 'text-blue-600 bg-blue-50' : 'text-blue-700 bg-blue-100'}`}>
                                <span>#{item.id}</span>
                              </div>
                              {item.type === 'event' && item.dueTime && (
                                <span className="flex items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit max-[1450px]:w-full">
                                  <i className="far fa-clock mr-1.5 opacity-60"></i> {item.dueTime}
                                </span>
                              )}
                              <div style={{ padding:"2.5px 10px" }} className={`flex items-center gap-2 rounded-lg border border-transparent transition-all w-fit max-[1450px]:w-full ${priorityColors[item.priority]}`}>
                                <select 
                                  value={item.priority}
                                  onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, priority: e.target.value as Priority })}
                                  className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-1.5 py-0.5 pr-6"
                                >
                                  <option value="low">{t.prioLow}</option>
                                  <option value="normal">{t.prioNormal}</option>
                                  <option value="high">{t.prioHigh}</option>
                                </select>
                                <i className="fas fa-chevron-down text-[10px] opacity-60"></i>
                              </div>
                              {item.type === 'event' && (
                                <div
                                  className="flex items-center px-3 py-1 rounded-lg border border-slate-100 bg-slate-50 w-fit max-[1450px]:w-full"
                                  style={{
                                    backgroundColor: item.labelId ? hexToRgba(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR, 0.14) : undefined,
                                    borderColor: item.labelId ? hexToRgba(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR, 0.35) : undefined,
                                    color: item.labelId ? normalizeLabelColor(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR) : undefined
                                  }}
                                >
                                  <i className="fas fa-tag text-[10px] opacity-60 mr-1.5"></i>
                                  <select
                                    value={item.labelId || ''}
                                    onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, labelId: e.target.value || null })}
                                    className="min-w-0 flex-1 bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-1.5 py-0.5 pr-4 text-[12px]"
                                  >
                                    <option value="">No label</option>
                                    {labels.map(label => (
                                      <option key={label.id} value={label.id}>
                                        {label.name}
                                      </option>
                                    ))}
                                  </select>
                                  <i className="fas fa-chevron-down text-[10px] opacity-60 ml-1"></i>
                                </div>
                              )}
                              {item.type === 'event' && isItemOverdue(item) && (
                                <span className="px-3 py-1 rounded-lg text-[13px] font-black uppercase tracking-tighter bg-red-50 text-red-600 border border-red-100 w-fit max-[1450px]:w-full">
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
                              {item.type === 'event' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openReminderModal(item)}
                                    disabled={!userId}
                                    className={`p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${item.reminderMinutesBefore !== undefined ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-500'}`}
                                    title={userId ? t.reminderTitle : getReminderLoginRequiredMessage()}
                                  >
                                    <i
                                      className={`fas fa-bell text-base ${item.reminderMinutesBefore !== undefined ? 'reminder-bell-ring' : ''}`}
                                    ></i>
                                  </button>
                                  {item.reminderMinutesBefore !== undefined && (
                                    <span className="!ml-0 text-[12px] font-black text-amber-500 whitespace-nowrap">
                                      ~ {formatRemainingDuration(getItemDateTime(item) - Date.now())}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>


                          {/* Text */}
                          <div
                            className={`text-lg font-bold break-words leading-relaxed flex items-center gap-2 ${item.type === 'event' && item.completed ? 'line-through text-slate-400' : 'text-slate-800'} ${item.type === 'event' && item.subtasks?.length ? 'cursor-pointer' : ''}`}
                            onClick={() => item.type === 'event' && item.subtasks?.length && toggleSubitems(item.id)}
                          >
                            <span className="flex-1">{item.type === 'task' ? (item.title || item.text) : item.text}</span>
                            {item.type === 'event' && item.subtasks?.length ? (
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
                          {item.type === 'task' && item.text && item.title && (
                            <p className="mt-1 mb-3 text-sm font-semibold text-slate-600 whitespace-pre-wrap">{item.text}</p>
                          )}
                          {item.type === 'task' && (
                            <div className="mt-2 flex items-center text-sm font-semibold text-slate-500">
                              <i className="far fa-clock mr-2 text-[12px] text-slate-400"></i>
                              <span>
                                {new Date(item.createdAt).toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                {' • '}
                                {new Date(item.createdAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' })}
                              </span>
                            </div>
                          )}
                          {item.type === 'event' && item.subtasks?.length && expandedSubitems.has(item.id) && (
                            <ol className="mt-1 mb-3 space-y-2 pl-6 text-sm font-semibold text-slate-600 list-decimal marker:font-black marker:text-slate-400">
                              {item.subtasks.map((subtask, index) => (
                                <li key={`${item.id}-subtask-${index}`} className="pl-1">
                                  <span>{subtask}</span>
                                </li>
                              ))}
                            </ol>
                          )}                          
                          {item.type === 'event' && item.location && (
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
              {modalMode === 'add' ? (
                <div className={`flex items-center rounded-lg ${formType === 'task' ? 'text-blue-600 bg-blue-50' : 'text-blue-700 bg-blue-100'}`}>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ItemType)}
                    className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-3 py-1 pr-7"
                    aria-label="Item type"
                  >
                    <option value="task">Note</option>
                    <option value="event">Task</option>
                  </select>
                  <i className="fas fa-chevron-down text-[10px] opacity-60 pr-3"></i>
                </div>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${formType === 'task' ? 'text-blue-600 bg-blue-50' : 'text-blue-700 bg-blue-100'}`}>
                  {modalMode === 'edit' && modalItemId && <span className="mr-1">#{modalItemId}</span>}
                  <span>{formTypeLabel}</span>
                </div>
              )}
              <div style={{ padding:"2.5px 10px" }} className={`flex items-center rounded-lg border border-transparent ${priorityColors[formPriority]}`}>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as Priority)}
                  className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer px-1.5 py-0.5 pr-6"
                >
                  <option value="low">{t.prioLow}</option>
                  <option value="normal">{t.prioNormal}</option>
                  <option value="high">{t.prioHigh}</option>
                </select>
                <i className="fas fa-chevron-down text-[10px] opacity-60"></i>
              </div>
            </div>

            <div className="space-y-4">
              {formType === 'task' && (
                <input
                  autoFocus
                  type="text"
                  className="text-base font-bold bg-white border border-slate-200 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500/20"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Titlu..."
                />
              )}
              <textarea
                className="text-base font-bold bg-white border border-slate-200 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 min-h-[140px] resize-none"
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder={formType === 'task' ? 'Text...' : 'Descriere...'}
              />
              {formType === 'event' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t.subevents}
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
                </>
              )}
              <div className="flex flex-wrap gap-3">
                {formType === 'event' && (
                  <>
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
                  </>
                )}
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

      {reminderModalItem && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-4 md:pt-8">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeReminderModal}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl p-6 md:p-8 animate-in zoom-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeReminderModal}
              className="absolute top right-4 w-10 h-10 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="mb-6">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.reminderTitle}</div>
              <p className="text-sm font-semibold text-slate-600">
                {t.reminderNotifyBefore}: <span className="font-black text-slate-800">{reminderModalItem.text}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t.reminderDays}
                  <input
                    type="number"
                    min={0}
                    max={reminderMaxParts.days}
                    value={reminderDays}
                    onChange={(e) => setReminderDays(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t.reminderHours}
                  <input
                    type="number"
                    min={0}
                    max={Number(reminderDays || '0') >= reminderMaxParts.days ? reminderMaxParts.hours : 23}
                    value={reminderHours}
                    onChange={(e) => setReminderHours(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t.reminderMinutes}
                  <input
                    type="number"
                    min={0}
                    max={
                      Number(reminderDays || '0') >= reminderMaxParts.days
                      && Number(reminderHours || '0') >= reminderMaxParts.hours
                        ? reminderMaxParts.minutes
                        : 59
                    }
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.reminderChannel}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderChannel('email')}
                    className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border ${reminderChannel === 'email' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                  >
                    {t.reminderEmail}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-400"
                  >
                    {t.reminderSmsSoon}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-400"
                  >
                    {t.reminderPushSoon}
                  </button>
                </div>
              </div>

              {reminderError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {reminderError}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveReminder}
                  disabled={isReminderSaving || reminderMaxMinutes <= 0}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 disabled:opacity-60"
                >
                  {t.reminderSave}
                </button>
                {reminderModalItem.reminderMinutesBefore !== undefined && (
                  <button
                    type="button"
                    onClick={removeReminder}
                    disabled={isReminderSaving}
                    className="bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-100 disabled:opacity-60"
                  >
                    {t.reminderRemove}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Microphone Modal */}
      {isMobileMicModalOpen && (
        <div className="fixed inset-0 z-[90] md:hidden flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-sm rounded-[36px] bg-white p-8 shadow-2xl border border-slate-200">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-28 h-28 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-200 animate-[pulse_2.4s_ease-in-out_infinite]">
                <i className="fas fa-microphone text-4xl"></i>
              </div>
              <div className="text-[12px] font-black uppercase tracking-[0.18em] text-blue-600">
                {t.listening}
              </div>
              <button
                type="button"
                onClick={closeMobileMicModal}
                className="rounded-full bg-red-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-200 active:scale-95 transition-all"
              >
                {t.stopListening}
              </button>
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

    </div>
  );
};

export default App;
