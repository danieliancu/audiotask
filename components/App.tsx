
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import AppHeader from './AppHeader';
import { useSession } from 'next-auth/react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { TodoItem, ToolNames, Language, ItemType, Priority, ReminderChannel, SubtaskItem } from '../types';
import { generateAssistantResponse, generateTTS, systemInstructions, todoTools } from '../services/geminiService';
import { DEFAULT_LABEL_COLOR, LABEL_COLOR_PALETTE, normalizeLabelColor } from '@/lib/labelColors';

type StatusFilter = 'all' | 'closed' | 'open' | 'outdated' | 'in_time' | 'shared';
type PriorityFilterMode = 'all' | 'low' | 'normal' | 'high';
type MobileView = 'list' | 'calendar' | 'add' | 'edit' | 'reminder' | 'share' | 'search';
type CalendarVariant = 'desktop' | 'modal' | 'mobile';
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
    endTimeLabel: "End time",
    searchPlaceholder: "Search tasks or say a command...",
    searchTitle: "Search",
    searchTermPlaceholder: "Search term",
    searchTypeLabel: "In",
    searchAction: "Search",
    searchResults: "Results",
    searchNoResults: "No results found",
    searchHint: "Enter a term and press Search",
    filterAll: "All tasks",
    filterAllPriorities: "All priorities",
    stopListening: "Stop",
    statusLabel: "Status",
    actionVoiceCommand: "Voice command",
    actionCalendar: "Calendar",
    actionAdd: "Add",
    filterResolved: "Checked",
    filterUnresolved: "Active",
    filterOverdue: "Overdue",
    filterInTime: "In time",
    filterLow: "Low priority",
    filterNormal: "Normal priority",
    filterHigh: "High priority",
    filterShared: "Shared",
    priorityLabel: "Priority",
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
    selectPeriod: "Select a period",
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
    reminderErrorRemove: "Failed to remove reminder",
    filterAction: "Filter",
    tasksForSelectedDates: "Tasks for selected dates",
    noTasksForSelectedDates: "No tasks for selected dates"
  },
  ro: {
    tasks: "Notite",
    events: "Taskuri",
    clear: "Curăță",
    listening: "Se asculta...",
    placeholder: "Scrie o comanda...",
    noTasks: "Nicio notita gasita",
    noEvents: "Niciun task gasit",
    settings: "Setari",
    language: "Limba",
    languages: "Limbi",
    close: "Închide",
    appTitle: "VoiceTask",
    idLabel: "ID",
    dateLabel: "Data",
    timeLabel: "Ora",
    endTimeLabel: "Ora sfarsit",
    searchPlaceholder: "Cauta sarcini sau zi o comanda...",
    searchTitle: "Cautare",
    searchTermPlaceholder: "Termen cautat",
    searchTypeLabel: "In",
    searchAction: "Cautare",
    searchResults: "Rezultate",
    searchNoResults: "Nu am gasit rezultate",
    searchHint: "Introdu un termen si apasa Cautare",
    filterAll: "Toate taskurile",
    filterAllPriorities: "Toate prioritatile",
    stopListening: "Opreste",
    statusLabel: "Status",
    actionVoiceCommand: "Comanda vocala",
    actionCalendar: "Calendar",
    actionAdd: "Adaugare",
    filterResolved: "Bifate",
    filterUnresolved: "Active",
    filterOverdue: "Depășite",
    filterInTime: "În timp",
    filterLow: "Prioritate mica",
    filterNormal: "Prioritate normala",
    filterHigh: "Prioritate mare",
    filterShared: "Partajate",
    priorityLabel: "Prioritate",
    labelsTitle: "Etichete",
    allLabels: "Toate etichetele",
    addLabel: "Adauga eticheta...",
    labelNamePlaceholder: "Nume eticheta",
    prioLow: "Mica",
    prioNormal: "Normala",
    prioHigh: "Mare",
    outdated: "Depasit",
    save: "Salveaza",
    clearFilter: "Reseteaza data",
    selectDates: "Selecteaza aceste date",
    selectPeriod: "Selecteaza o perioada",
    location: "Locație",
    subtasks: "Subtask-uri",
    subevents: "Subevenimente",
    subitemsPlaceholder: "Câte unul pe linie",
    menuHome: "Acasa",
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
    reminderErrorRemove: "Nu am putut sterge reminder-ul",
    filterAction: "Filtreaza",
    tasksForSelectedDates: "Task-uri pentru zilele selectate",
    noTasksForSelectedDates: "Nu exista task-uri pentru zilele selectate"
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
    endTimeLabel: "Heure de fin",
    searchPlaceholder: "Rechercher ou parler...",
    searchTitle: "Recherche",
    searchTermPlaceholder: "Terme recherche",
    searchTypeLabel: "Dans",
    searchAction: "Rechercher",
    searchResults: "Resultats",
    searchNoResults: "Aucun resultat",
    searchHint: "Saisissez un terme puis appuyez sur Rechercher",
    filterAll: "Toutes les tâches",
    filterAllPriorities: "Toutes les priorités",
    stopListening: "Arreter",
    statusLabel: "Statut",
    actionVoiceCommand: "Commande vocale",
    actionCalendar: "Calendrier",
    actionAdd: "Ajouter",
    filterResolved: "Cochées",
    filterUnresolved: "Actives",
    filterOverdue: "En retard",
    filterInTime: "À temps",
    filterLow: "Basse priorité",
    filterNormal: "Priorité normale",
    filterHigh: "Haute priorité",
    filterShared: "Partagees",
    priorityLabel: "Priorité",
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
    selectPeriod: "Sélectionnez une période",
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
    reminderErrorRemove: "Echec de la suppression du rappel",
    filterAction: "Filtrer",
    tasksForSelectedDates: "Taches pour les dates selectionnees",
    noTasksForSelectedDates: "Aucune tache pour les dates selectionnees"
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
    endTimeLabel: "Endzeit",
    searchPlaceholder: "Suchen oder Befehl sagen...",
    searchTitle: "Suche",
    searchTermPlaceholder: "Suchbegriff",
    searchTypeLabel: "In",
    searchAction: "Suchen",
    searchResults: "Ergebnisse",
    searchNoResults: "Keine Ergebnisse gefunden",
    searchHint: "Suchbegriff eingeben und auf Suchen klicken",
    filterAll: "Alle Aufgaben",
    filterAllPriorities: "Alle Prioritäten",
    stopListening: "Stoppen",
    statusLabel: "Status",
    actionVoiceCommand: "Sprachbefehl",
    actionCalendar: "Kalender",
    actionAdd: "Hinzufügen",
    filterResolved: "Abgehakt",
    filterUnresolved: "Aktiv",
    filterOverdue: "Überfällig",
    filterInTime: "Pünktlich",
    filterLow: "Niedrig",
    filterNormal: "Normal",
    filterHigh: "Hoch",
    filterShared: "Geteilt",
    priorityLabel: "Priorität",
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
    selectPeriod: "Zeitraum auswählen",
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
    reminderErrorRemove: "Erinnerung konnte nicht entfernt werden",
    filterAction: "Filtern",
    tasksForSelectedDates: "Aufgaben fuer ausgewaehlte Tage",
    noTasksForSelectedDates: "Keine Aufgaben fuer ausgewaehlte Tage"
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
    endTimeLabel: "Hora de fin",
    searchPlaceholder: "Buscar tareas o decir un comando...",
    searchTitle: "Buscar",
    searchTermPlaceholder: "Termino de busqueda",
    searchTypeLabel: "En",
    searchAction: "Buscar",
    searchResults: "Resultados",
    searchNoResults: "No se encontraron resultados",
    searchHint: "Introduce un termino y pulsa Buscar",
    filterAll: "Todas las tareas",
    filterAllPriorities: "Todas las prioridades",
    stopListening: "Detener",
    statusLabel: "Estado",
    actionVoiceCommand: "Comando de voz",
    actionCalendar: "Calendario",
    actionAdd: "Agregar",
    filterResolved: "Marcadas",
    filterUnresolved: "Activas",
    filterOverdue: "Vencidas",
    filterInTime: "A tiempo",
    filterLow: "Baja",
    filterNormal: "Normal",
    filterHigh: "Alta",
    filterShared: "Compartidas",
    priorityLabel: "Prioridad",
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
    selectPeriod: "Selecciona un período",
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
    reminderErrorRemove: "No se pudo eliminar el recordatorio",
    filterAction: "Filtrar",
    tasksForSelectedDates: "Tareas para fechas seleccionadas",
    noTasksForSelectedDates: "No hay tareas para las fechas seleccionadas"
  }
};

const languageFlags: Record<Language, string> = {
  en: "US",
  ro: "RO",
  fr: "FR",
  de: "DE",
  es: "ES"
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
  ro: new Set(['a', 'al', 'ale', 'ai', 'cu', 'de', 'din', 'fara', 'fara', 'in', 'în', 'la', 'pe', 'pentru', 'si', '?i', 'spre', 'sau', 'ori']),
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
const formatDayMonthLabel = (timestamp: number, language: Language) => {
  const date = new Date(timestamp);
  const day = date.toLocaleDateString(language, { day: '2-digit' });
  const monthRaw = date.toLocaleDateString(language, { month: 'short' }).replace(/[.,]$/u, '');
  const month = monthRaw ? `${monthRaw.charAt(0).toLocaleUpperCase(localeByLanguage[language])}${monthRaw.slice(1)}` : '';
  return `${day} ${month}`.trim();
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
const normalizeSearchText = (value: string) => value
  .toLocaleLowerCase()
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .trim();
const normalizeLocation = (value: string, language: Language) => {
  let cleaned = value.trim().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ');
  if (language === 'ro') {
    cleaned = cleaned.replace(/^\s*(aleea|alea)\s+/i, '');
    cleaned = cleaned.replace(/^\s*(strada|str\.?)\s+/i, '');
    cleaned = cleaned.replace(/\b(num[aa]r(ul|u)?|nr\.?)\s+(\d+)\b/gi, '$3');
    cleaned = cleaned.replace(/\b(num[aa]r(ul|u)?|nr\.?)\s+([^\d\W]+)\b/gi, (match, _label, _suffix, rawWord) => {
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
const normalizeSubitems = (value: unknown, options?: { capitalizeText?: boolean }) => {
  if (!value) return undefined;
  const capitalizeText = options?.capitalizeText ?? true;
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\r?\n/)
      : [];
  const cleaned = items
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim();
        if (!text) return null;
        return {
          text: capitalizeText ? capitalize(text) : text,
          completed: false
        } as SubtaskItem;
      }
      if (!item || typeof item !== 'object') return null;
      const raw = item as { text?: unknown; completed?: unknown };
      const text = typeof raw.text === 'string' ? raw.text.trim() : '';
      if (!text) return null;
      return {
        text: capitalizeText ? capitalize(text) : text,
        completed: Boolean(raw.completed)
      } as SubtaskItem;
    })
    .filter((item): item is SubtaskItem => Boolean(item));
  return cleaned.length ? cleaned : undefined;
};
const mergeSubitemsWithExistingCompletion = (nextSubitems: SubtaskItem[] | undefined, existingSubitems?: SubtaskItem[]) => {
  if (!nextSubitems?.length) return undefined;
  if (!existingSubitems?.length) return nextSubitems;

  const completionByText = new Map<string, boolean[]>();
  existingSubitems.forEach((subitem) => {
    const key = subitem.text.trim().toLocaleLowerCase();
    if (!completionByText.has(key)) completionByText.set(key, []);
    completionByText.get(key)!.push(Boolean(subitem.completed));
  });

  return nextSubitems.map((subitem) => {
    const key = subitem.text.trim().toLocaleLowerCase();
    const queue = completionByText.get(key);
    if (!queue?.length) return subitem;
    const preservedCompleted = queue.shift();
    return {
      ...subitem,
      completed: Boolean(preservedCompleted)
    };
  });
};
const normalizeTodoForState = (item: TodoItem): TodoItem => ({
  ...item,
  canEdit: item.canEdit ?? true,
  canDelete: item.canDelete ?? true,
  canManageShare: item.canManageShare ?? false,
  canManageReminder: item.canManageReminder ?? true,
  canEditLabel: item.canEditLabel ?? true,
  subtasks: normalizeSubitems(item.subtasks, { capitalizeText: false })
});
const normalizeTodoListForState = (value: unknown): TodoItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is TodoItem => Boolean(item) && typeof item === 'object')
    .map((item) => normalizeTodoForState(item));
};
const getCompletedSubtaskCount = (subtasks?: SubtaskItem[]) => {
  if (!subtasks?.length) return 0;
  return subtasks.reduce((count, subtask) => count + (subtask.completed ? 1 : 0), 0);
};
const getSubtaskProgressPercent = (subtasks?: SubtaskItem[]) => {
  if (!subtasks?.length) return 0;
  return Math.round((getCompletedSubtaskCount(subtasks) / subtasks.length) * 100);
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
const formatRemainingDuration = (totalMs: number, language: Language) => {
  const minutesTotal = Math.max(0, Math.floor(totalMs / 60000));
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
const formatSubtaskCountLabel = (count: number, language: Language) => {
  if (count === 1) {
    switch (language) {
      case 'ro': return '1 subtask';
      case 'fr': return '1 sous-tâche';
      case 'de': return '1 Unteraufgabe';
      case 'es': return '1 subtarea';
      default: return '1 subtask';
    }
  }
  switch (language) {
    case 'ro': return `${count} subtask-uri`;
    case 'fr': return `${count} sous-tâches`;
    case 'de': return `${count} Unteraufgaben`;
    case 'es': return `${count} subtareas`;
    default: return `${count} subtasks`;
  }
};
const formatSubtaskProgressLabel = (completed: number, total: number, language: Language) => {
  switch (language) {
    case 'ro': return `${completed}/${total} subtaskuri`;
    case 'fr': return `${completed}/${total} sous-taches`;
    case 'de': return `${completed}/${total} Unteraufgaben`;
    case 'es': return `${completed}/${total} subtareas`;
    default: return `${completed}/${total} subtasks`;
  }
};
const getNoLabelText = (language: Language) => {
  switch (language) {
    case 'ro': return 'Fara eticheta';
    case 'fr': return 'Sans label';
    case 'de': return 'Ohne Label';
    case 'es': return 'Sin etiqueta';
    default: return 'No label';
  }
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
const normalizeWordForMatch = (value: string) => value
  .toLocaleLowerCase()
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .replace(/[^a-z]/g, '');
const extractMeaningfulFilterWord = (value: string, language: Language) => {
  const words = value
    .split(/\s+/)
    .map(word => word.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter(Boolean);
  if (!words.length) return value;

  const genericWords = new Set([
    'priority', 'priorities', 'prioritate', 'prioritati', 'priorite', 'priorites', 'prioridad', 'prioridades', 'prioritat', 'prioritaten',
    'task', 'tasks', 'taskuri', 'tache', 'taches', 'aufgabe', 'aufgaben', 'tarea', 'tareas',
    'toate', 'toutes', 'alle', 'todas', 'all'
  ]);

  const preferred = words.find(word => !genericWords.has(normalizeWordForMatch(word))) || words[0];
  return preferred.charAt(0).toLocaleUpperCase(language) + preferred.slice(1);
};

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
  const overdueTimeValue = item.dueEndTime || item.dueTime;
  if (!overdueTimeValue) return false;
  const [hStr, mStr] = overdueTimeValue.split(':');
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

function formatEventTimeRange(item: Pick<TodoItem, 'dueTime' | 'dueEndTime'>): string {
  const start = item.dueTime || '--:--';
  if (!item.dueEndTime) return start;
  return `${start}-${item.dueEndTime}`;
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
  ['all', 'closed', 'open', 'outdated', 'in_time', 'shared'].includes(value)
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
      status: isEvent ? status : (status === 'shared' ? 'shared' : 'all'),
      priority
    };
  }

  if (raw === 'resolved') return { status: isEvent ? 'closed' : 'all', priority: 'all' as PriorityFilterMode };
  if (raw === 'unresolved') return { status: isEvent ? 'open' : 'all', priority: 'all' as PriorityFilterMode };
  if (isStatusFilter(raw)) {
    return { status: isEvent ? raw : (raw === 'shared' ? 'shared' : 'all'), priority: 'all' as PriorityFilterMode };
  }
  if (isPriorityFilterMode(raw)) return { status: 'all' as StatusFilter, priority: raw };
  return { status: 'all' as StatusFilter, priority: 'all' as PriorityFilterMode };
};

const buildCombinedFilter = (status: StatusFilter, priority: PriorityFilterMode) => `${status}|${priority}`;
const parseStoredLabelFilters = (rawValue: unknown): string[] => {
  if (Array.isArray(rawValue)) {
    return rawValue
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (typeof rawValue === 'string') {
    const value = rawValue.trim();
    if (value === 'all') return [];
    if (value.startsWith('label:')) return [value.slice(6)];
  }
  return [];
};

const SWIPE_DELETE_THRESHOLD = 88;
const SWIPE_DELETE_MAX_OFFSET = 120;
const SwipeableCard: React.FC<{
  enabled: boolean;
  onDelete: () => void;
  children: React.ReactNode;
}> = ({ enabled, onDelete, children }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const gestureRef = useRef({
    active: false,
    dragging: false,
    horizontal: false,
    startX: 0,
    startY: 0
  });

  const resetGesture = () => {
    gestureRef.current = {
      active: false,
      dragging: false,
      horizontal: false,
      startX: 0,
      startY: 0
    };
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!enabled || event.touches.length !== 1) return;
    const touch = event.touches[0];
    gestureRef.current = {
      active: true,
      dragging: false,
      horizontal: false,
      startX: touch.clientX,
      startY: touch.clientY
    };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!enabled || !gestureRef.current.active || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - gestureRef.current.startX;
    const dy = touch.clientY - gestureRef.current.startY;

    if (!gestureRef.current.dragging) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      gestureRef.current.dragging = true;
      gestureRef.current.horizontal = Math.abs(dx) > Math.abs(dy);
    }

    if (!gestureRef.current.horizontal) return;
    event.preventDefault();
    const nextOffset = dx <= 0 ? Math.max(-SWIPE_DELETE_MAX_OFFSET, dx) : Math.min(dx * 0.2, 20);
    setOffsetX(nextOffset);
  };

  const handleTouchEnd = () => {
    if (!enabled || !gestureRef.current.active) {
      resetGesture();
      return;
    }

    if (offsetX <= -SWIPE_DELETE_THRESHOLD) {
      setOffsetX(-SWIPE_DELETE_MAX_OFFSET);
      setIsDeleting(true);
      window.setTimeout(() => onDelete(), 180);
    } else {
      setOffsetX(0);
    }
    resetGesture();
  };

  return (
    <div className="relative">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ transform: `translate3d(${offsetX}px, 0, 0)` }}
        className={`will-change-transform transition-transform duration-200 ease-out ${isDeleting ? 'opacity-0 scale-[0.98] transition-all duration-200' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};

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
  const [shareModalItemId, setShareModalItemId] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<ItemType>('task');
  const [searchResults, setSearchResults] = useState<TodoItem[]>([]);
  const [searchHasExecuted, setSearchHasExecuted] = useState(false);
  const [reminderDays, setReminderDays] = useState('0');
  const [reminderHours, setReminderHours] = useState('0');
  const [reminderMinutes, setReminderMinutes] = useState('10');
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>('email');
  const [reminderError, setReminderError] = useState('');
  const [isReminderSaving, setIsReminderSaving] = useState(false);
  const [shareInputEmail, setShareInputEmail] = useState('');
  const [shareList, setShareList] = useState<Array<{ userId: string; email: string; name: string; sharedAt: number }>>([]);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareDropdownItemId, setShareDropdownItemId] = useState<string | null>(null);
  const [formType, setFormType] = useState<ItemType>('task');
  const [formPriority, setFormPriority] = useState<Priority>('normal');
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSubtasks, setFormSubtasks] = useState('');
  const [labels, setLabels] = useState<ItemLabel[]>([]);
  const labelsRef = useRef<ItemLabel[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
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
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
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
  const assistantSpeakingUntilRef = useRef<number>(0);
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
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobileViewport(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileView('list');
      setIsFilterPanelOpen(false);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    if (isMobileViewport) {
      setIsSearchModalOpen(false);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    if (!isMobileViewport) return;
    setIsCalendarOpen(false);
  }, [isMobileViewport]);

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
          const storedTodos = normalizeTodoListForState(parsed?.todos);
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
          const nextLabelFilters = parseStoredLabelFilters((storedSettings as any).labelFilters ?? storedSettings.labelFilter);
          const nextShowSubtasksDefault = Boolean(storedSettings.showSubtasksDefault);
          setTodos(storedTodos);
          setLabels(storedLabels);
          if (nextLang) setLanguage(nextLang);
          if (nextTab) setActiveTab(nextTab as ItemType);
          setActiveDateFilters(nextDates);
          setStatusFilterByType({ task: nextTaskFilters.status, event: nextEventFilters.status });
          setPriorityFilterByType({ task: nextTaskFilters.priority, event: nextEventFilters.priority });
          setCurrentDate(nextMonth);
          setSelectedLabelIds(nextLabelFilters);
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
        setTodos(normalizeTodoListForState(data));
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
      const insideDesktopLabelMenu = Boolean(labelMenuRef.current?.contains(target));
      if (!insideDesktopLabelMenu) {
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
        labelFilters: selectedLabelIds,
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
    selectedLabelIds,
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
        if (!selectedLabelIds.length) return true;
        return Boolean(item.labelId && selectedLabelIds.includes(item.labelId));
      })
      .filter(item => {
        if (statusFilter === 'shared') return Boolean(item.isShared) || Number(item.shareCount || 0) > 0;
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
  }, [todos, statusFilterByType.event, priorityFilterByType.event, activeDateFilters, selectedLabelIds]);
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
  const selectedDateTasks = useMemo(() => {
    if (!activeDateFilters.length) return [];
    const selectedKeys = new Set(activeDateFilters);
    return todos
      .filter((item) => item.type === 'event')
      .filter((item) => {
        const d = new Date(item.sortTimestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return selectedKeys.has(key);
      })
      .sort((a, b) => {
        const aTime = getItemDateTime(a);
        const bTime = getItemDateTime(b);
        if (aTime !== bTime) return aTime - bTime;
        return String(a.id).localeCompare(String(b.id));
      });
  }, [todos, activeDateFilters]);

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
        if (!selectedLabelIds.length) return true;
        return Boolean(item.labelId && selectedLabelIds.includes(item.labelId));
      })
      .filter(item => {
        let statusMatches = true;
        if (statusFilter === 'shared') {
          statusMatches = Boolean(item.isShared) || Number(item.shareCount || 0) > 0;
        } else if (activeTab === 'event') {
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
          if (a.sortTimestamp !== b.sortTimestamp) return b.sortTimestamp - a.sortTimestamp;
          if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt;
          return String(b.id).localeCompare(String(a.id));
        }
        const aTime = getItemDateTime(a);
        const bTime = getItemDateTime(b);
        if (aTime !== bTime) return aTime - bTime;
        return String(a.id).localeCompare(String(b.id));
      });
  }, [todos, activeTab, statusFilterByType, priorityFilterByType, activeDateFilters, activeDateFilterSet, selectedLabelIds]);
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

  const modalTodoItem = useMemo(
    () => todos.find(item => item.id === modalItemId) || null,
    [todos, modalItemId]
  );
  const shareModalItem = useMemo(
    () => todos.find(item => item.id === shareModalItemId) || null,
    [todos, shareModalItemId]
  );
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
      setSelectedLabelIds(prev => (prev.includes(id) ? prev : [...prev, id]));
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
    setSelectedLabelIds(prev => (prev.includes(label.id) ? prev : [...prev, label.id]));
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
      setSelectedLabelIds(prev => prev.filter(labelId => labelId !== id));
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
    setSelectedLabelIds(prev => prev.filter(labelId => labelId !== id));
    setTodos(prev => prev.map(item => (item.labelId === id ? { ...item, labelId: undefined } : item)));
    if (editingLabelId === id) {
      setEditingLabelId(null);
      setEditingLabelName('');
      setEditingLabelColor(DEFAULT_LABEL_COLOR);
    }
  }, [userId, editingLabelId]);

  const scrollToTask = useCallback((id: string, type: ItemType, options?: { preserveDateFilters?: boolean }) => {
    const preserveDateFilters = Boolean(options?.preserveDateFilters);
    setActiveTab(type);
    setHighlightedTaskId(id);
    if (!preserveDateFilters) {
      setActiveDateFilters([]); // Clear date filter when jumping to a specific task
      setPendingDateStart(null);
      setPendingDateEnd(null);
    }
    setTimeout(() => {
      const el = document.getElementById(`todo-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    if (!isLive) setTimeout(() => setHighlightedTaskId(prev => prev === id ? null : prev), 5000);
  }, [isLive]);
  const focusEventInMain = useCallback((item: TodoItem) => {
    if (item.type !== 'event') return;
    const itemDate = new Date(item.sortTimestamp);
    const itemDateKey = buildDateKey(itemDate);
    setActiveTab('event');
    setCurrentDate(new Date(itemDate.getFullYear(), itemDate.getMonth(), 1));
    setActiveDateFilters([itemDateKey]);
    setPendingDateStart(null);
    setPendingDateEnd(null);
    setStatusFilterByType(prev => (prev.event === 'all' ? prev : { ...prev, event: 'all' }));
    setPriorityFilterByType(prev => (prev.event === 'all' ? prev : { ...prev, event: 'all' }));
    setSelectedLabelIds([]);
    if (isMobileViewport) {
      setMobileView('list');
      setTimeout(() => scrollToTask(item.id, 'event', { preserveDateFilters: true }), 80);
      return;
    }
    scrollToTask(item.id, 'event', { preserveDateFilters: true });
  }, [isMobileViewport, scrollToTask]);
  const openSelectedDateTask = useCallback((item: TodoItem) => {
    focusEventInMain(item);
  }, [focusEventInMain]);

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
        .then(data => setTodos(normalizeTodoListForState(data)))
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
          const normalizedServerItem = normalizeTodoForState(serverItem as TodoItem);
          setTodos(prev => prev.map(todo => (todo.id === tempId ? normalizedServerItem : todo)));
          scheduleRefreshTodos();
      })
        .catch(() => {
          setTodos(prev => prev.filter(todo => todo.id !== tempId));
        });
    };

    switch (name) {
      case ToolNames.ADD_TODO: {
        const normalizedTime = normalizeDueTime(args.time);
        const normalizedEndTime = normalizedTime ? normalizeDueTime(args.endTime) : undefined;
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
          dueEndTime: isNote ? undefined : normalizedEndTime,
          location: isNote ? undefined : (args.location ? normalizeLocation(args.location, language) : undefined),
          subtasks: normalizedSubtasks,
          sortTimestamp: isNote ? Date.now() : ts,
          priority: (args.priority as Priority) || 'normal',
          canEdit: true,
          canDelete: true,
          canManageReminder: true,
          canEditLabel: true,
          canManageShare: false,
          isShared: false,
          ownerUserId: userId || undefined,
          ownerEmail: session?.user?.email || undefined
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
        const requestedSortTimestamp = args.sortTimestamp !== undefined ? Number(args.sortTimestamp) : null;
        const hasRequestedSortTimestamp = requestedSortTimestamp !== null && Number.isFinite(requestedSortTimestamp);
        const newTs = hasRequestedSortTimestamp
          ? requestedSortTimestamp
          : (parsedDate ? (forcedRelativeTs ?? parsedDate.timestamp) : existing.sortTimestamp);
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
          ? (isNote ? undefined : mergeSubitemsWithExistingCompletion(normalizeSubitems(args.subtasks), existing.subtasks))
          : existing.subtasks;
        const normalizedTime = args.time !== undefined ? normalizeDueTime(args.time) : existing.dueTime;
        const normalizedEndTime = args.endTime !== undefined
          ? (normalizedTime ? normalizeDueTime(args.endTime) : undefined)
          : (args.time !== undefined && !normalizedTime ? undefined : existing.dueEndTime);
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
          dueEndTime: isNote ? undefined : normalizedEndTime,
          location: newLocation,
          subtasks: newSubtasks,
          priority: (args.priority as Priority) || existing.priority,
          sortTimestamp: newTs
        };
        const payload: Record<string, unknown> = {};
        if (args.title !== undefined) payload.title = nextTodo.title ?? null;
        if (labelWasSpecified) payload.labelId = isNote ? null : nextTodo.labelId ?? null;
        if (args.text !== undefined || eventTextFromTitle !== undefined) payload.text = nextTodo.text;
        if (args.date !== undefined && !isNote) {
          payload.sortTimestamp = nextTodo.sortTimestamp;
          payload.dueDate = nextTodo.dueDate ?? null;
        } else if (hasRequestedSortTimestamp) {
          payload.sortTimestamp = nextTodo.sortTimestamp;
        }
        if (args.time !== undefined) payload.dueTime = isNote ? null : nextTodo.dueTime ?? null;
        if (args.endTime !== undefined || (args.time !== undefined && !nextTodo.dueTime)) {
          payload.dueEndTime = isNote ? null : nextTodo.dueEndTime ?? null;
        }
        if (args.location !== undefined) payload.location = isNote ? null : nextTodo.location ?? null;
        if (args.subtasks !== undefined) payload.subtasks = isNote ? null : nextTodo.subtasks ?? null;
        if (isNote) {
          payload.completed = false;
          payload.dueDate = null;
          payload.dueTime = null;
          payload.dueEndTime = null;
          payload.location = null;
          payload.subtasks = null;
          payload.sortTimestamp = nextTodo.sortTimestamp;
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
          existing[targetIndex] = {
            ...existing[targetIndex],
            text: normalized[0].text
          };
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
      case ToolNames.TOGGLE_SUBTASK: {
        const parentId = String(args.id);
        const oneBasedIndex = Number(args.subtaskIndex);
        if (!Number.isInteger(oneBasedIndex) || oneBasedIndex < 1) break;
        const explicitCompleted = typeof args.completed === 'boolean' ? args.completed : undefined;

        updateTodo(parentId, (todo) => {
          if (todo.type !== 'event') return todo;
          const existing = [...(todo.subtasks || [])];
          const targetIndex = oneBasedIndex - 1;
          if (targetIndex >= existing.length) return todo;
          const current = existing[targetIndex];
          existing[targetIndex] = {
            ...current,
            completed: explicitCompleted ?? !current.completed
          };
          if (isLoggedIn) syncUpdate(parentId, { subtasks: existing });
          return { ...todo, subtasks: existing };
        });
        setExpandedSubitems(prev => new Set(prev).add(parentId));
        break;
      }
      case ToolNames.DELETE_TODO: {
        const id = String(args.id);
        const targetTodo = todosRef.current.find((todo) => todo.id === id);
        if (targetTodo && !targetTodo.canDelete) {
          showUiNotice('Only the owner can delete this task.');
          break;
        }
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
  }, [activeTab, language, session?.user?.email, showUiNotice, userId]);

  const moveNoteCard = useCallback((id: string, direction: 'up' | 'down', visibleNotes: TodoItem[]) => {
    const currentIndex = visibleNotes.findIndex(item => item.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= visibleNotes.length) return;

    const currentItem = visibleNotes[currentIndex];
    const targetItem = visibleNotes[targetIndex];
    let currentSortTimestamp = Number(targetItem.sortTimestamp);
    let targetSortTimestamp = Number(currentItem.sortTimestamp);

    if (!Number.isFinite(currentSortTimestamp) || !Number.isFinite(targetSortTimestamp)) return;
    if (currentSortTimestamp === targetSortTimestamp) {
      const base = Date.now();
      currentSortTimestamp = direction === 'up' ? base + 1 : base - 1;
      targetSortTimestamp = base;
    }

    executeTool(ToolNames.EDIT_TODO, { id: currentItem.id, sortTimestamp: currentSortTimestamp });
    executeTool(ToolNames.EDIT_TODO, { id: targetItem.id, sortTimestamp: targetSortTimestamp });
  }, [executeTool]);

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
    assistantSpeakingUntilRef.current = 0;
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
    assistantSpeakingUntilRef.current = 0;
    resetInactivityTimer();
    
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    const inputCtx = new AudioContext({ sampleRate: 16000 });
    inputAudioContextRef.current = inputCtx;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
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
              const outputCtx = audioContextRef.current;
              if (outputCtx && outputCtx.currentTime < assistantSpeakingUntilRef.current) {
                resetInactivityTimer();
                return;
              }
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
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                  if (audioSourcesRef.current.size === 0) {
                    assistantSpeakingUntilRef.current = 0;
                  }
                });
                const scheduledStart = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const scheduledEnd = scheduledStart + audioBuffer.duration;
                source.start(scheduledStart);
                nextStartTimeRef.current = scheduledEnd;
                assistantSpeakingUntilRef.current = Math.max(assistantSpeakingUntilRef.current, scheduledEnd + 0.08);
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
              assistantSpeakingUntilRef.current = 0;
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
    if (isMobileViewport) {
      setMobileView('list');
      if (modalMode === 'add') {
        setModalMode(null);
        setModalItemId(null);
        setFormTitle('');
        setFormSubtasks('');
      }
    }
    setIsMobileMicModalOpen(true);
    if (!isLive && !isConnectingRef.current) {
      void startLiveSession();
    }
  }, [isLive, isMobileViewport, modalMode, startLiveSession]);

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

  useEffect(() => {
    if (mobileView === 'list') return;
    setIsFilterPanelOpen(false);
  }, [mobileView]);

  const Calendar = ({
    variant = 'desktop',
    onApply,
    hideApplyAction = false
  }: {
    variant?: CalendarVariant;
    onApply?: () => void;
    hideApplyAction?: boolean;
  }) => {
    const isModal = variant === 'modal';
    const isMobile = variant === 'mobile';
    const locale = localeByLanguage[language];
    const rawMonthLabel = currentDate.toLocaleDateString(language, { month: 'long', year: 'numeric' });
    const monthLabel = rawMonthLabel
      ? `${rawMonthLabel.charAt(0).toLocaleUpperCase(locale)}${rawMonthLabel.slice(1)}`
      : rawMonthLabel;
    const weekdayBaseDay = isMobile ? 3 : 4; // Sunday for mobile, Monday for desktop/modal.
    const mobileCalendarCells = useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstOffset = new Date(year, month, 1).getDay();
      const currentMonthDays = new Date(year, month + 1, 0).getDate();
      const previousMonthDays = new Date(year, month, 0).getDate();
      const totalCells = firstOffset + currentMonthDays <= 35 ? 35 : 42;
      const cells: Array<{ day: number; dateKey: string; isCurrentMonth: boolean }> = [];

      for (let i = firstOffset - 1; i >= 0; i -= 1) {
        const day = previousMonthDays - i;
        const date = new Date(year, month - 1, day);
        cells.push({ day, dateKey: buildDateKey(date), isCurrentMonth: false });
      }
      for (let day = 1; day <= currentMonthDays; day += 1) {
        const date = new Date(year, month, day);
        cells.push({ day, dateKey: buildDateKey(date), isCurrentMonth: true });
      }
      const trailingDays = totalCells - cells.length;
      for (let day = 1; day <= trailingDays; day += 1) {
        const date = new Date(year, month + 1, day);
        cells.push({ day, dateKey: buildDateKey(date), isCurrentMonth: false });
      }
      return cells;
    }, [currentDate]);

    return (
      <div className={`calendar-surface w-full max-w-full overflow-hidden border border-gray-200 bg-white ${isMobile ? 'rounded-2xl p-3 shadow-sm' : 'rounded-lg p-4'} ${variant === 'desktop' ? 'h-full flex flex-col' : ''}`}>
        <div className={`${isMobile ? 'mb-3' : 'mb-4'} flex items-center justify-between`}>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className={`inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 ${isMobile ? 'h-7 w-7' : 'h-7 w-7 border-0'}`}
            aria-label="Previous month"
          >
            <i className="fas fa-chevron-left text-[12px]"></i>
          </button>
          <h2 className={`text-gray-900 ${isMobile ? 'text-[20px] font-semibold' : 'font-medium'}`}>
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className={`inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 ${isMobile ? 'h-7 w-7' : 'h-7 w-7 border-0'}`}
            aria-label="Next month"
          >
            <i className="fas fa-chevron-right text-[12px]"></i>
          </button>
        </div>

        <div className={`mb-1.5 grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-1'}`}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const dayLabel = new Date(2021, 0, weekdayBaseDay + i).toLocaleString(language, { weekday: 'short' });
            return (
              <div key={i} className={`text-center font-medium text-gray-500 ${isMobile ? 'py-0.5 text-[11px]' : 'py-1 text-xs'}`}>
                {dayLabel.slice(0, 2)}
              </div>
            );
          })}
        </div>

        {isMobile ? (
          <div className="grid grid-cols-7 gap-y-1">
            {mobileCalendarCells.map((cell, idx) => {
              const dayItems = tasksByDate[cell.dateKey] || [];
              const cellDate = dateKeyToDate(cell.dateKey);
              const now = new Date();
              const isToday = now.getDate() === cellDate.getDate() && now.getMonth() === cellDate.getMonth() && now.getFullYear() === cellDate.getFullYear();
              const isSelected = activeDateFilterSet.has(cell.dateKey);
              const pendingStart = pendingDateStart === cell.dateKey;
              const pendingEnd = pendingDateEnd === cell.dateKey;
              let isPendingRange = false;
              if (pendingDateStart && pendingDateEnd) {
                const rangeKeys = getDateRangeKeys(pendingDateStart, pendingDateEnd);
                isPendingRange = rangeKeys.includes(cell.dateKey);
              }

              return (
                <div key={`${cell.dateKey}-${idx}`} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleDateClick(cell.dateKey)}
                    className={`relative h-8 w-8 rounded-lg text-[13px] transition-colors ${isSelected ? 'bg-[#0b1445] font-semibold text-white' : pendingStart || pendingEnd ? 'bg-purple-600 font-semibold text-white' : isPendingRange ? 'bg-purple-100 text-purple-700' : isToday ? 'bg-purple-50 text-purple-700' : cell.isCurrentMonth ? 'text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    {cell.day}
                  </button>
                  <div className="mt-0.5 flex min-h-[6px] flex-wrap items-center justify-center gap-[2px]">
                    {dayItems.map((item) => (
                      <span
                        key={item.id}
                        className={`h-[5px] w-[5px] rounded-full ${item.type === 'task' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                        title={item.text}
                      ></span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`grid grid-cols-7 ${isModal ? 'gap-1' : 'gap-0.5'}`}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className={isModal ? 'aspect-square' : 'h-9'}></div>
            ))}
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
                    className={`relative w-full ${isModal ? 'aspect-square' : 'h-9'} rounded-lg flex items-center justify-center text-sm transition-colors ${isSelected ? `bg-purple-100 text-purple-700 font-medium ${isSelectedEdge ? 'ring-1 ring-purple-300' : ''}` : pendingStart || pendingEnd ? 'bg-purple-500 text-white' : isPendingRange ? 'bg-purple-200 text-purple-800' : isToday ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {day}
                  </button>
                  <div className="mt-2 flex min-h-[12px] w-full flex-wrap justify-center gap-1 px-1">
                    {dayItems.map(item => (
                      <button
                        key={item.id}
                        title={item.text}
                        onClick={(e) => { e.stopPropagation(); scrollToTask(item.id, item.type); }}
                        className={`h-2 w-2 rounded-full shadow-sm transition-all duration-300 hover:scale-150 active:scale-95 ${item.type === 'task' ? 'bg-emerald-500' : 'bg-purple-500'} ${highlightedTaskId === item.id ? 'ring-2 ring-offset-2 ring-purple-500 scale-125 z-10' : 'hover:ring-1 hover:ring-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!hideApplyAction && (
          <div className={`${isMobile ? 'mt-4' : `${isModal ? 'mt-4' : 'mt-auto'} pt-4 border-t border-gray-200`}`}>
            <button
              type="button"
              onClick={() => {
                applyPendingDates();
                if (isModal) setIsCalendarOpen(false);
                onApply?.();
              }}
              disabled={!pendingDateStart}
              className={`w-full rounded-lg px-4 font-medium transition-colors ${isMobile ? 'py-3 text-sm' : 'py-2 text-sm'} ${pendingDateStart ? (isMobile ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'bg-purple-600 text-white hover:bg-purple-700') : 'cursor-not-allowed bg-gray-100 text-gray-400'}`}
            >
              {isMobile && <i className="fas fa-check mr-2 text-[11px]"></i>}
              {t.selectDates}
            </button>
          </div>
        )}
      </div>
    );
  };

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

  const resetComposerState = () => {
    setModalMode(null);
    setModalItemId(null);
    setFormTitle('');
    setFormEndTime('');
    setFormSubtasks('');
  };

  const runSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchHasExecuted(false);
      setSearchResults([]);
      return;
    }
    const normalizedQuery = normalizeSearchText(query);
    const matched = todos
      .filter(item => item.type === searchType)
      .filter(item => {
        const labelName = item.labelId ? (labelNameById.get(item.labelId) ?? '') : '';
        const subtasksText = item.subtasks?.map(subtask => subtask.text).join(' ') ?? '';
        const source = [
          item.id,
          item.title ?? '',
          item.text,
          item.location ?? '',
          item.dueDate ?? '',
          item.dueTime ?? '',
          item.dueEndTime ?? '',
          labelName,
          subtasksText
        ].join(' ');
        return normalizeSearchText(source).includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (searchType === 'task') {
          if (a.sortTimestamp !== b.sortTimestamp) return b.sortTimestamp - a.sortTimestamp;
          if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt;
          return String(b.id).localeCompare(String(a.id));
        }
        const aTime = getItemDateTime(a);
        const bTime = getItemDateTime(b);
        if (aTime !== bTime) return aTime - bTime;
        return String(a.id).localeCompare(String(b.id));
      });
    setSearchResults(matched);
    setSearchHasExecuted(true);
  }, [searchQuery, searchType, todos, labelNameById]);

  const openSearchPanel = useCallback(() => {
    resetComposerState();
    setSearchType(activeTab);
    setSearchQuery('');
    setSearchResults([]);
    setSearchHasExecuted(false);
    setIsCalendarOpen(false);
    setIsFilterPanelOpen(false);
    setIsFilterMenuOpen(false);
    setIsLabelMenuOpen(false);
    if (isMobileViewport) {
      setMobileView('search');
      return;
    }
    setIsSearchModalOpen(true);
  }, [activeTab, isMobileViewport]);

  const closeSearchPanel = useCallback(() => {
    setIsSearchModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchHasExecuted(false);
    if (isMobileViewport) {
      setMobileView('list');
    }
  }, [isMobileViewport]);

  const openSearchResult = useCallback((item: TodoItem) => {
    closeSearchPanel();
    if (item.type === 'event') {
      focusEventInMain(item);
      return;
    }
    if (isMobileViewport) {
      setTimeout(() => scrollToTask(item.id, item.type), 80);
      return;
    }
    scrollToTask(item.id, item.type);
  }, [closeSearchPanel, focusEventInMain, isMobileViewport, scrollToTask]);

  const getSearchItemSubtitle = useCallback((item: TodoItem) => {
    if (item.type === 'event') {
      const dateLabel = new Date(item.sortTimestamp).toLocaleDateString(language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const startTime = item.dueTime || '--:--';
      return `${dateLabel}\n${startTime}${item.dueEndTime ? `\n${item.dueEndTime}` : ''}`;
    }
    const createdAtDate = new Date(item.createdAt);
    const dateLabel = createdAtDate.toLocaleDateString(language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeLabel = createdAtDate.toLocaleTimeString(language, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      hourCycle: 'h23'
    });
    return `${dateLabel} • ${timeLabel}`;
  }, [language]);

  const openCalendarPanel = () => {
    if (isMobileViewport) {
      resetComposerState();
      setMobileView('calendar');
      return;
    }
    setIsCalendarOpen(true);
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
    setFormEndTime('');
    setFormLocation('');
    setFormSubtasks('');
  };

  const openAddPanel = () => {
    openAddModal();
    if (isMobileViewport) {
      setMobileView('add');
    }
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
    setFormEndTime(item.dueEndTime || '');
    setFormLocation(item.location || '');
    setFormSubtasks((item.subtasks || []).map(subtask => subtask.text).join('\n'));
    if (isMobileViewport) {
      setMobileView('edit');
    }
  };

  const closeModal = () => {
    resetComposerState();
    if (isMobileViewport) {
      setMobileView('list');
    }
  };

  const openShareModal = useCallback((item: TodoItem) => {
    if (!item.canManageShare) {
      showUiNotice('Only owner can manage share list.');
      return;
    }
    setShareModalItemId(item.id);
    setShareInputEmail('');
    setShareError('');
    setShareList([]);
    setShareBusy(true);
    void fetch(`/api/todos/${item.id}/shares`, { credentials: 'include', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then((data) => {
        setShareList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setShareError('Failed to load share list.');
      })
      .finally(() => setShareBusy(false));
    if (isMobileViewport) {
      setMobileView('share');
    }
  }, [isMobileViewport, showUiNotice]);

  const closeShareModal = useCallback(() => {
    setShareModalItemId(null);
    setShareInputEmail('');
    setShareError('');
    setShareList([]);
    if (isMobileViewport) {
      setMobileView('list');
    }
  }, [isMobileViewport]);

  const addShare = useCallback(async () => {
    if (!shareModalItemId || !shareModalItem?.canManageShare) return;
    const email = shareInputEmail.trim().toLowerCase();
    if (!email) return;
    setShareBusy(true);
    setShareError('');
    const res = await fetch(`/api/todos/${shareModalItemId}/shares`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setShareError(data.error || 'Failed to share task.');
      setShareBusy(false);
      return;
    }

    const payload = await res.json().catch(() => null);
    const userIdFromPayload = String(payload?.userId || '');
    const emailFromPayload = String(payload?.email || email);
    const nameFromPayload = String(payload?.name || '');

    setShareList((prev) => {
      const exists = prev.find((entry) => entry.userId === userIdFromPayload || entry.email.toLowerCase() === emailFromPayload.toLowerCase());
      if (exists) return prev;
      return [...prev, { userId: userIdFromPayload, email: emailFromPayload, name: nameFromPayload, sharedAt: Date.now() }];
    });
    setTodos((prev) => prev.map((todo) => {
      if (todo.id !== shareModalItemId) return todo;
      const existing = todo.sharedWithEmails || [];
      if (existing.some((entry) => entry.toLowerCase() === emailFromPayload.toLowerCase())) return todo;
      const nextEmails = [...existing, emailFromPayload];
      return { ...todo, sharedWithEmails: nextEmails, shareCount: nextEmails.length };
    }));
    setShareInputEmail('');
    setShareBusy(false);
  }, [shareInputEmail, shareModalItem?.canManageShare, shareModalItemId]);

  const removeShare = useCallback(async (sharedUserId: string) => {
    if (!shareModalItemId || !shareModalItem?.canManageShare) return;
    setShareBusy(true);
    setShareError('');
    const res = await fetch(`/api/todos/${shareModalItemId}/shares`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: sharedUserId })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setShareError(data.error || 'Failed to remove share.');
      setShareBusy(false);
      return;
    }
    const removed = shareList.find((entry) => entry.userId === sharedUserId);
    setShareList((prev) => prev.filter((entry) => entry.userId !== sharedUserId));
    if (removed) {
      setTodos((prev) => prev.map((todo) => {
        if (todo.id !== shareModalItemId) return todo;
        const nextEmails = (todo.sharedWithEmails || []).filter((entry) => entry.toLowerCase() !== removed.email.toLowerCase());
        return { ...todo, sharedWithEmails: nextEmails, shareCount: nextEmails.length };
      }));
    }
    setShareBusy(false);
  }, [shareList, shareModalItem?.canManageShare, shareModalItemId]);

  const openReminderModal = useCallback((item: TodoItem) => {
    if (item.type !== 'event') return;
    if (!item.canManageReminder) {
      showUiNotice('Reminder can be managed only by the task owner.');
      return;
    }
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
    if (isMobileViewport) {
      setMobileView('reminder');
    }
  }, [userId, showUiNotice, getReminderLoginRequiredMessage, isMobileViewport]);

  const closeReminderModal = useCallback(() => {
    setReminderModalItemId(null);
    setReminderError('');
    if (isMobileViewport) {
      setMobileView('list');
    }
  }, [isMobileViewport]);

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
        endTime: formType === 'event' ? (formTime && formEndTime ? formEndTime : null) : null,
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
        endTime: formType === 'event' ? (formTime && formEndTime ? formEndTime : null) : null,
        location: formType === 'event' ? (formLocation || null) : null,
        priority: formPriority,
        subtasks: formType === 'event' ? formSubtasks : null
      });
    }
    closeModal();
  };

  const priorityColors = {
    low: 'text-slate-500 bg-slate-100',
    normal: 'text-purple-600 bg-purple-50',
    high: 'text-amber-900 bg-amber-200'
  };
  const priorityBadgeClasses: Record<Priority, string> = {
    low: 'text-blue-600 border-blue-500 bg-blue-50',
    normal: 'text-slate-600 border-slate-400 bg-white',
    high: 'text-amber-900 border-amber-500 bg-amber-100'
  };
  const formTypeLabel = formType === 'task' ? 'Note' : 'Task';
  const activeFilterLabel = (() => {
    const statusMode = statusFilterByType[activeTab];
    const priorityMode = priorityFilterByType[activeTab];
    if (activeTab === 'task') {
      if (statusMode === 'shared') return t.filterShared;
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
          : statusMode === 'shared'
            ? t.filterShared
          : statusMode === 'in_time'
            ? t.filterUnresolved
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
  const selectedLabelNames = useMemo(
    () => selectedLabelIds
      .map(id => labelNameById.get(id))
      .filter((value): value is string => Boolean(value)),
    [selectedLabelIds, labelNameById]
  );
  const mobileStatusLabel = (() => {
    const statusMode = statusFilterByType[activeTab];
    if (statusMode === 'closed') return t.filterResolved;
    if (statusMode === 'open') return t.filterUnresolved;
    if (statusMode === 'outdated') return t.filterOverdue;
    if (statusMode === 'in_time') return t.filterInTime;
    if (statusMode === 'shared') return t.filterShared;
    return t.filterAll;
  })();
  const mobilePriorityMenuLabel = (() => {
    const priorityMode = priorityFilterByType[activeTab];
    if (priorityMode === 'low') return t.filterLow;
    if (priorityMode === 'normal') return t.filterNormal;
    if (priorityMode === 'high') return t.filterHigh;
    return t.filterAllPriorities;
  })();
  const mobileStatusShortLabel = mobileStatusLabel === t.filterAll
    ? extractMeaningfulFilterWord(t.filterAll, language).toLocaleLowerCase(language)
    : mobileStatusLabel;
  const mobilePriorityShortLabel = extractMeaningfulFilterWord(mobilePriorityMenuLabel, language);
  const isSearchActionDisabled = !searchQuery.trim();
  const searchTypeLabel = searchType === 'task' ? t.tasks : t.events;
  const getSharedEmails = useCallback((item: TodoItem) => item.sharedWithEmails || [], []);
  const hasShares = useCallback((item: TodoItem) => {
    const emails = getSharedEmails(item);
    return emails.length > 0 || Number(item.shareCount || 0) > 0;
  }, [getSharedEmails]);
  const handleHomeLogoClick = useCallback(() => {
    if (!isMobileViewport) return;
    if (mobileView === 'add' || mobileView === 'edit') {
      closeModal();
      return;
    }
    if (mobileView === 'reminder') {
      closeReminderModal();
      return;
    }
    if (mobileView === 'share') {
      closeShareModal();
      return;
    }
    if (mobileView === 'search') {
      closeSearchPanel();
      return;
    }
    if (mobileView === 'calendar') {
      setMobileView('list');
      setIsCalendarOpen(false);
    }
  }, [isMobileViewport, mobileView, closeModal, closeReminderModal, closeSearchPanel, closeShareModal]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 selection:bg-purple-100 pb-28 md:pb-20">
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
        onHomeClick={handleHomeLogoClick}
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

      <div className="mobile-action-bar hidden md:block max-w-7xl mx-auto px-4 mb-4 pb-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <button
            disabled={isConnectingRef.current && !isLive}
            onClick={startLiveSession}
            className={`w-[200px] shrink-0 flex items-center justify-center gap-2 px-5 py-3 text-white rounded-lg transition-all ${isLive ? 'bg-gradient-to-br from-red-600 to-pink-600' : 'bg-gradient-to-br from-red-500 to-pink-500 hover:shadow-md'} ${isConnectingRef.current && !isLive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <i className={`fas ${isLive ? 'fa-stop' : 'fa-microphone'} text-base`}></i>
            <span className="text-sm">{isLive ? t.stopListening : t.actionVoiceCommand}</span>
          </button>

          <button
            type="button"
            onClick={openAddPanel}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-md transition-all"
            aria-label="Create item"
            title="Create item"
          >
            <i className="fas fa-pen text-base"></i>
            <span className="text-sm">{t.actionAdd}</span>
          </button>

          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-300 rounded-lg pl-4 pr-2 py-1">
            <input
              type="text"
              readOnly={isLive}
              value={isLive ? transcription : inputValue}
              onChange={e => {
                if (!isLive) setInputValue(e.target.value);
              }}
              onKeyDown={e => {
                if (!isLive && e.key === 'Enter') handleSendPrompt();
              }}
              placeholder={isLive ? t.listening : t.placeholder}
              className="flex-1 text-sm bg-transparent border-none outline-none focus:outline-none text-gray-700"
            />
            <button
              type="button"
              onClick={handleSendPrompt}
              className={`p-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors ${isLive ? 'invisible pointer-events-none' : ''}`}
              aria-label="Send"
            >
              <i className="fas fa-paper-plane text-sm text-white"></i>
            </button>
          </div>
        </div>
      </div>

      <nav className="mobile-action-bar md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-2 py-2 shadow-[0_-8px_20px_rgba(15,23,42,0.08)]">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          <button
            disabled={isConnectingRef.current && !isLive}
            onClick={openMobileMicModal}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors ${isConnectingRef.current && !isLive ? 'opacity-50 cursor-not-allowed' : ''} ${mobileView === 'list' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <i className={`fas ${isLive ? 'fa-stop' : 'fa-microphone'} text-[19px] ${mobileView === 'list' ? 'text-white' : (isLive ? 'text-red-500' : '')}`}></i>
            <span className="text-[11px] leading-none">{t.actionVoiceCommand}</span>
          </button>
          <button
            onClick={openCalendarPanel}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors ${mobileView === 'calendar' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <i className="far fa-calendar-alt text-[19px]"></i>
            <span className="text-[11px] leading-none">{t.actionCalendar}</span>
          </button>
          <button
            onClick={() => { setIsWriteMode(false); openAddPanel(); }}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors ${mobileView === 'add' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <i className="fas fa-plus text-[19px]"></i>
            <span className="text-[11px] leading-none">{t.actionAdd}</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 lg:grid lg:grid-cols-5 lg:gap-6">
        <div className="hidden md:flex lg:col-span-5 items-center justify-between gap-3 pb-3 border-b border-gray-200 mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('task')} className={`relative px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'task' ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.tasks}
              <span className="absolute -top-[5px] -right-[5px] flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal">
                {taskCount}
              </span>
            </button>
            <button onClick={() => setActiveTab('event')} className={`relative px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'event' ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.events}
              <span className="absolute -top-[5px] -right-[5px] flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal">
                {filteredEventCount}
              </span>
            </button>
            <button
              type="button"
              onClick={openSearchPanel}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50"
              aria-label={t.searchTitle}
              title={t.searchTitle}
            >
              <i className="fas fa-search text-[13px]"></i>
            </button>
              {activeTab === 'event' && (
                <div
                  className="flex px-3 py-2 items-center gap-2 text-sm cursor-pointer border border-gray-300 rounded-lg bg-white"
                  onClick={openCalendarPanel}
                >
                  <i className="far fa-calendar-alt text-[12px] text-gray-600"></i>
                  <span className="font-medium text-gray-700">{activeDateFilters.length > 0 ? selectedDateLabel : t.selectPeriod}</span>
                  {activeDateFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDateFilters([]);
                        setPendingDateStart(null);
                        setPendingDateEnd(null);
                      }}
                      className="text-red-500 font-bold text-[12px] leading-none mb-1.5"
                      aria-label="Clear selected period"
                    >
                      x
                    </button>
                  )}
                </div>
              )}
          </div>

          <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
            <select
              value={statusFilterByType[activeTab]}
              onChange={(e) => setStatusFilterByType(prev => ({ ...prev, [activeTab]: e.target.value as StatusFilter }))}
              className="cursor-pointer px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">Status: {t.filterAll}</option>
              <option value="shared">Status: {t.filterShared}</option>
              {activeTab === 'event' && <option value="open">Status: {t.filterUnresolved}</option>}
              {activeTab === 'event' && <option value="closed">Status: {t.filterResolved}</option>}
              {activeTab === 'event' && <option value="outdated">Status: {t.filterOverdue}</option>}
              {activeTab === 'event' && <option value="in_time">Status: {t.filterInTime}</option>}
            </select>

            <select
              value={priorityFilterByType[activeTab]}
              onChange={(e) => setPriorityFilterByType(prev => ({ ...prev, [activeTab]: e.target.value as PriorityFilterMode }))}
              className="cursor-pointer px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">Priority: {t.filterAllPriorities}</option>
              <option value="normal">Priority: {t.prioNormal}</option>
              <option value="high">Priority: {t.prioHigh}</option>
              <option value="low">Priority: {t.prioLow}</option>
            </select>

            {activeTab === 'event' && (
              <div className="relative" ref={labelMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsLabelMenuOpen(prev => !prev)}
                  className="relative cursor-pointer px-3 py-2 pr-8 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 inline-flex items-center text-slate-900"
                >
                  <span className="text-slate-900">
                    {selectedLabelNames.length ? selectedLabelNames.join(', ') : t.allLabels}
                  </span>
                  <i className="pointer-events-none fas fa-chevron-down text-[10px] text-slate-900 absolute right-1 top-1/2 -translate-y-1/2"></i>
                </button>
                {isLabelMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-[70]">
                  <button
                    onClick={() => { setSelectedLabelIds([]); setIsLabelMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black ${selectedLabelIds.length === 0 ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {t.allLabels}
                  </button>
                  {labels.map(label => (
                    <div
                      key={label.id}
                      className={`w-full px-3 py-2 rounded-xl text-[11px] font-black ${selectedLabelIds.includes(label.id) ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <div className="w-full flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedLabelIds.includes(label.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedLabelIds(prev => checked
                              ? (prev.includes(label.id) ? prev : [...prev, label.id])
                              : prev.filter(labelId => labelId !== label.id)
                            );
                          }}
                          className="h-4 w-4 accent-purple-600"
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: normalizeLabelColor(label.color) }}
                        ></span>
                        <div
                          onClick={() => {
                            if (editingLabelId === label.id) return;
                            setSelectedLabelIds(prev => prev.includes(label.id)
                              ? prev.filter(labelId => labelId !== label.id)
                              : [...prev, label.id]
                            );
                          }}
                          className="flex-1 text-left truncate cursor-pointer"
                        >
                          {editingLabelId === label.id ? (
                            <input
                              value={editingLabelName}
                              onChange={(e) => setEditingLabelName(e.target.value)}
                              className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] font-black text-slate-700"
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
                    <div className="text-[10px] font-black text-slate-400 px-2 pb-1">{t.addLabel}</div>
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
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                        placeholder={t.labelNamePlaceholder}
                      />
                      <button
                        type="button"
                        onClick={() => void createLabel()}
                        disabled={!normalizeLabelName(newLabelName) || labelBusyId === 'create'}
                        className="h-9 w-9 rounded-xl text-purple-600 inline-flex items-center justify-center disabled:opacity-40"
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

        <section className="space-y-6 md:space-y-0 lg:col-span-3">
          <div className={`md:hidden pb-3 border-b border-gray-200 ${mobileView !== 'list' ? 'hidden' : ''}`}>
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setActiveTab('task')} className={`relative px-3 py-2 rounded-lg text-[clamp(13px,3.4vw,15px)] leading-none whitespace-nowrap transition-colors ${activeTab === 'task' ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t.tasks}
                <span className="absolute -top-[5px] -right-[5px] flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal">
                  {taskCount}
                </span>
              </button>
              <button onClick={() => setActiveTab('event')} className={`relative px-3 py-2 rounded-lg text-[clamp(13px,3.4vw,15px)] leading-none whitespace-nowrap transition-colors ${activeTab === 'event' ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t.events}
                <span className="absolute -top-[5px] -right-[5px] flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] text-white leading-none tracking-normal">
                  {filteredEventCount}
                </span>
              </button>
              <button
                type="button"
                onClick={openSearchPanel}
                className="h-9 w-9 inline-flex items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
                aria-label={t.searchTitle}
                title={t.searchTitle}
              >
                <i className="fas fa-search text-[12px]"></i>
              </button>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-11 flex-1 flex items-center px-3.5 gap-2 border border-gray-300 rounded-xl bg-white shadow-sm"
                  onClick={() => {
                    if (activeTab !== 'event') setActiveTab('event');
                    openCalendarPanel();
                  }}
                >
                  <span className="font-medium text-gray-700 text-[15px] truncate">{activeDateFilters.length > 0 ? selectedDateLabel : t.selectPeriod}</span>
                  {activeDateFilters.length > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDateFilters([]);
                        setPendingDateStart(null);
                        setPendingDateEnd(null);
                      }}
                      className="ml-auto h-6 w-6 inline-flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100"
                      aria-label="Clear selected period"
                    >
                      <i className="fas fa-times text-[11px]"></i>
                    </button>
                  ) : (
                    <span className="ml-auto h-6 w-6 inline-flex items-center justify-center text-gray-300">
                      <i className="fas fa-times text-[11px]"></i>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(true)}
                  className="h-11 shrink-0 rounded-xl border border-gray-300 bg-white px-3 text-[13px] font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  {t.filterAction}
                </button>
              </div>
            </div>

          </div>

          {mobileView === 'list' && (
          <div style={{ marginTop:0 }} className={`fixed inset-0 z-[80] min-[768px]:hidden transition-opacity duration-300 ${isFilterPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
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
                  <h3 className="text-sm font-black text-slate-700">Filters</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-black text-slate-400 mb-2">{t.statusLabel}</div>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: t.filterAll },
                        { value: 'shared', label: t.filterShared },
                        ...(activeTab === 'event'
                          ? [
                              { value: 'closed', label: t.filterResolved },
                              { value: 'open', label: t.filterUnresolved },
                              { value: 'outdated', label: t.filterOverdue },
                              { value: 'in_time', label: t.filterInTime }
                            ]
                          : [])
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

                  <div>
                    <div className="text-[11px] font-black text-slate-400 mb-2">{t.priorityLabel}</div>
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
                      <div className="text-[11px] font-black text-slate-400 mb-2">{t.labelsTitle}</div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedLabelIds.length === 0}
                            onChange={() => setSelectedLabelIds([])}
                            className="h-4 w-4"
                          />
                          <span>{t.allLabels}</span>
                        </label>
                        {labels.map(label => (
                          <div key={label.id} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={selectedLabelIds.includes(label.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedLabelIds(prev => checked
                                  ? (prev.includes(label.id) ? prev : [...prev, label.id])
                                  : prev.filter(labelId => labelId !== label.id)
                                );
                              }}
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
                              className="h-7 w-7 inline-flex items-center justify-center text-purple-600 disabled:opacity-40"
                              title="Confirm label"
                            >
                              <i className="fas fa-check text-[11px]"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <div className="text-[11px] font-black text-slate-400 mb-2">{t.addLabel}</div>
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
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder={t.labelNamePlaceholder}
                          />
                          <button
                            type="button"
                            onClick={() => void createLabel()}
                            disabled={!normalizeLabelName(newLabelName) || labelBusyId === 'create'}
                            className="h-9 w-9 rounded-xl text-purple-600 inline-flex items-center justify-center disabled:opacity-40"
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
          )}


          {mobileView === 'calendar' && (
            <div className="md:hidden pb-3">
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Back to list"
                >
                  <i className="fas fa-chevron-left text-[12px]"></i>
                </button>
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">{t.actionCalendar}</span>
                <span className="w-8"></span>
              </div>
              <div>
                <Calendar variant="mobile" hideApplyAction />
                <button
                  type="button"
                  onClick={applyPendingDates}
                  disabled={!pendingDateStart}
                  className={`mt-3 w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${pendingDateStart ? 'border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400'}`}
                >
                  <i className="fas fa-check mr-2 text-[11px]"></i>
                  {t.selectDates}
                </button>

                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {t.tasksForSelectedDates}
                    </h3>
                    <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      {selectedDateTasks.length}
                    </span>
                  </div>

                  {selectedDateTasks.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-slate-500">
                      {t.noTasksForSelectedDates}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateTasks.map((item) => {
                        const statusPill = item.completed ? 'Realizat' : (isItemOverdue(item) ? 'Depasit' : null);
                        return (
                          <button
                            key={`selected-${item.id}`}
                            type="button"
                            onClick={() => openSelectedDateTask(item)}
                            className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="inline-flex min-w-[54px] h-[40px] flex-col items-center justify-start rounded-xl bg-violet-100 px-2 py-1.5 text-[12px] font-semibold leading-tight text-violet-700">
                                <span>{item.dueTime || '--:--'}</span>
                                <span className={item.dueEndTime ? '' : 'select-none opacity-0'}>{item.dueEndTime || (item.dueTime || '--:--')}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-[18px] font-medium text-slate-900">
                                  {item.text}
                                </div>
                                <div className="mt-1 text-[13px] text-slate-500">
                                  {formatDayMonthLabel(item.sortTimestamp, language)}
                                </div>
                                {statusPill && (
                                  <div className="mt-1.5">
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-white ${statusPill === 'Realizat' ? 'border-emerald-300 bg-emerald-500' : 'border-red-300 bg-red-500'}`}
                                    >
                                      {statusPill}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {mobileView === 'add' && (
            <div className="md:hidden pb-6">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Back to list"
                >
                  <i className="fas fa-chevron-left text-[12px]"></i>
                </button>
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">{t.actionAdd}</span>
                <button
                  type="button"
                  onClick={saveModal}
                  className="h-8 px-3 inline-flex items-center justify-center rounded-xl bg-purple-600 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                >
                  {t.save}
                </button>
              </div>

              <div className="min-h-[calc(100vh-270px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-black uppercase tracking-widest text-slate-600">
                    <div className="mobile-add-select-surface rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="mb-1 text-[10px] text-slate-400">Type</div>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as ItemType)}
                        className="w-full bg-transparent appearance-none border-0 px-0 py-0 text-xs font-bold text-slate-700 outline-none"
                        aria-label="Item type"
                      >
                        <option value="task">Note</option>
                        <option value="event">Task</option>
                      </select>
                    </div>
                    <div className="mobile-add-select-surface rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="mb-1 text-[10px] text-slate-400">{t.priorityLabel}</div>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as Priority)}
                        className="w-full bg-transparent appearance-none border-0 px-0 py-0 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="low">{t.prioLow}</option>
                        <option value="normal">{t.prioNormal}</option>
                        <option value="high">{t.prioHigh}</option>
                      </select>
                    </div>
                  </div>

                  {formType === 'task' && (
                    <input
                      autoFocus
                      type="text"
                      className="text-base font-bold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Titlu..."
                    />
                  )}

                  <textarea
                    className="text-base font-bold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20 min-h-[140px] resize-none"
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
                          className="text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-700 focus:ring-2 focus:ring-purple-500/20 min-h-[90px] resize-none"
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
                          className="text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-700 focus:ring-2 focus:ring-purple-500/20"
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          placeholder="Ex: Splaiul Unirii 45"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="date"
                          className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                        />
                        <input
                          type="time"
                          className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none"
                          value={formTime}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setFormTime(nextValue);
                            if (!nextValue) setFormEndTime('');
                          }}
                        />
                        <input
                          type="time"
                          disabled={!formTime}
                          className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          value={formEndTime}
                          onChange={(e) => setFormEndTime(e.target.value)}
                          aria-label={t.endTimeLabel}
                          title={t.endTimeLabel}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={saveModal}
                    className="w-full bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mobileView === 'edit' && modalMode === 'edit' && (
            <div className="md:hidden pb-6">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Back to list"
                >
                  <i className="fas fa-chevron-left text-[12px]"></i>
                </button>
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">
                  {formTypeLabel}{modalTodoItem ? ` #${modalTodoItem.localId || modalTodoItem.id}` : ''}
                </span>
                <button
                  type="button"
                  onClick={saveModal}
                  className="h-8 px-3 inline-flex items-center justify-center rounded-xl bg-purple-600 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                >
                  {t.save}
                </button>
              </div>

              <div className="min-h-[calc(100vh-270px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-black uppercase tracking-widest text-slate-600">
                    <div className="mobile-add-select-surface rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="mb-1 text-[10px] text-slate-400">Type</div>
                      <div className="text-xs font-bold text-slate-700">{formTypeLabel}</div>
                    </div>
                    <div className="mobile-add-select-surface rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="mb-1 text-[10px] text-slate-400">{t.priorityLabel}</div>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as Priority)}
                        className="w-full bg-transparent appearance-none border-0 px-0 py-0 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="low">{t.prioLow}</option>
                        <option value="normal">{t.prioNormal}</option>
                        <option value="high">{t.prioHigh}</option>
                      </select>
                    </div>
                  </div>

                  {formType === 'task' && (
                    <input
                      autoFocus
                      type="text"
                      className="text-base font-bold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Titlu..."
                    />
                  )}

                  <textarea
                    className="text-base font-bold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20 min-h-[140px] resize-none"
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
                          className="text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-700 focus:ring-2 focus:ring-purple-500/20 min-h-[90px] resize-none"
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
                          className="text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-700 focus:ring-2 focus:ring-purple-500/20"
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          placeholder="Ex: Splaiul Unirii 45"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="date"
                          className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                        />
                        <input
                          type="time"
                          className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none"
                          value={formTime}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setFormTime(nextValue);
                            if (!nextValue) setFormEndTime('');
                          }}
                        />
                        <input
                          type="time"
                          disabled={!formTime}
                          className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          value={formEndTime}
                          onChange={(e) => setFormEndTime(e.target.value)}
                          aria-label={t.endTimeLabel}
                          title={t.endTimeLabel}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={saveModal}
                    className="w-full bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mobileView === 'reminder' && reminderModalItem && (
            <div className="md:hidden pb-6">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={closeReminderModal}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Back to list"
                >
                  <i className="fas fa-chevron-left text-[12px]"></i>
                </button>
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">{t.reminderTitle}</span>
                <span className="w-8"></span>
              </div>

              <div className="min-h-[calc(100vh-270px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-600">
                    {t.reminderNotifyBefore}: <span className="font-black text-slate-800">{reminderModalItem.text}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t.reminderDays}
                      <input
                        type="number"
                        min={0}
                        max={reminderMaxParts.days}
                        value={reminderDays}
                        onChange={(e) => setReminderDays(e.target.value)}
                        className="reminder-input mt-2 w-full rounded-xl border border-slate-300 bg-[#f8f9fb] px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
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
                        className="reminder-input mt-2 w-full rounded-xl border border-slate-300 bg-[#f8f9fb] px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
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
                        className="reminder-input mt-2 w-full rounded-xl border border-slate-300 bg-[#f8f9fb] px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </label>
                  </div>

                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.reminderChannel}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReminderChannel('email')}
                        className={`reminder-channel-btn rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border ${reminderChannel === 'email' ? 'is-active bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'}`}
                      >
                        {t.reminderEmail}
                      </button>
                      <button
                        type="button"
                        disabled
                        className="reminder-channel-btn is-disabled rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-400"
                      >
                        {t.reminderSmsSoon}
                      </button>
                      <button
                        type="button"
                        disabled
                        className="reminder-channel-btn is-disabled rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-400"
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
                      className="bg-purple-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md disabled:opacity-60"
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

          {mobileView === 'share' && shareModalItem && (
            <div className="md:hidden pb-6">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={closeShareModal}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Back to list"
                >
                  <i className="fas fa-chevron-left text-[12px]"></i>
                </button>
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">Share</span>
                <button
                  type="button"
                  onClick={closeShareModal}
                  className="h-8 px-3 inline-flex items-center justify-center rounded-xl bg-purple-600 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                >
                  Salveaza
                </button>
              </div>

              <div className="min-h-[calc(100vh-270px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">Share with email</div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={shareInputEmail}
                      onChange={(e) => setShareInputEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="flex-1 text-xs font-semibold bg-[#f8f9fb] border border-slate-300 rounded-xl px-3 py-2 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void addShare()}
                      disabled={shareBusy || !shareInputEmail.trim()}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  {shareError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      {shareError}
                    </div>
                  )}
                  <div className="space-y-2">
                    {shareList.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                        No shared users yet.
                      </div>
                    ) : shareList.map((entry) => (
                      <div key={`${entry.userId}-${entry.email}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="text-xs font-bold text-slate-800">{entry.email}</div>
                        {entry.name && <div className="text-[11px] font-semibold text-slate-500">{entry.name}</div>}
                        <button
                          type="button"
                          onClick={() => void removeShare(entry.userId)}
                          disabled={shareBusy}
                          className="mt-2 rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mobileView === 'search' && (
            <div className="md:hidden pb-6">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={closeSearchPanel}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Back to list"
                >
                  <i className="fas fa-chevron-left text-[12px]"></i>
                </button>
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">{t.searchTitle}</span>
                <span className="w-8"></span>
              </div>

              <div className="min-h-[calc(100vh-270px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-4">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchHasExecuted(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSearchActionDisabled) runSearch();
                    }}
                    placeholder={t.searchTermPlaceholder}
                    className="text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                  />

                  <div className="mobile-add-select-surface rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.searchTypeLabel}</div>
                    <select
                      value={searchType}
                      onChange={(e) => {
                        setSearchType(e.target.value as ItemType);
                        setSearchHasExecuted(false);
                      }}
                      className="w-full bg-transparent appearance-none border-0 px-0 py-0 text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="task">{t.tasks}</option>
                      <option value="event">{t.events}</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={runSearch}
                    disabled={isSearchActionDisabled}
                    className={`w-full rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${isSearchActionDisabled ? 'cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-400' : 'bg-purple-600 text-white shadow-md active:scale-95'}`}
                  >
                    {t.searchAction}
                  </button>

                  {!searchHasExecuted ? (
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500">
                      {t.searchHint}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500">
                      {t.searchNoResults}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        {t.searchResults}: {searchResults.length} • {searchTypeLabel}
                      </div>
                      {searchResults.map(item => {
                        const itemTitle = item.type === 'task' ? (item.title || item.text) : item.text;
                        const itemDescription = item.type === 'task' && item.title ? item.text : '';
                        const eventDateLabel = item.type === 'event'
                          ? new Date(item.sortTimestamp).toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : '';
                        return (
                          <button
                            key={`search-mobile-${item.id}`}
                            type="button"
                            onClick={() => openSearchResult(item)}
                            className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate text-sm font-bold text-slate-900">{itemTitle}</div>
                              <span className="text-[11px] font-semibold text-slate-400">#{item.localId || item.id}</span>
                            </div>
                            {itemDescription && (
                              <div className="mt-1 text-xs text-slate-600 line-clamp-2">{itemDescription}</div>
                            )}
                            {item.type === 'event' ? (
                              <div className="mt-1 flex items-start gap-2">
                                <div className="inline-flex min-w-[54px] h-[40px] flex-col items-center justify-start rounded-xl bg-violet-100 px-2 py-1.5 text-[11px] font-semibold leading-tight text-violet-700">
                                  <span>{item.dueTime || '--:--'}</span>
                                  <span className={item.dueEndTime ? '' : 'select-none opacity-0'}>{item.dueEndTime || (item.dueTime || '--:--')}</span>
                                </div>
                                <div className="min-w-0 text-[11px] text-slate-500">{eventDateLabel}</div>
                              </div>
                            ) : (
                              <div className="mt-1 whitespace-pre-line text-[11px] text-slate-500">{getSearchItemSubtitle(item)}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`space-y-4 ${mobileView !== 'list' ? 'max-[767px]:hidden' : ''}`}>
            {filteredItems.length === 0 ? (
              <div className="py-10 flex flex-col items-center">
                <div className="py-24 text-center flex flex-col items-center opacity-10">
                  <i className={`fas ${activeTab === 'task' ? 'fa-feather' : 'fa-calendar-check'} text-6xl mb-4`}></i>
                  <p className="text-lg font-bold uppercase tracking-widest">{activeTab === 'task' ? t.noTasks : t.noEvents}</p>
                </div>
              </div>
            ) : groupedItems.map((group, groupIndex) => (
              <div
                key={group.key}
                className="space-y-3"
                style={{ borderTop: groupIndex === 0 ? 'none' : '1px solid #e5e7eb', paddingTop: '0px' }}
              >
                {activeTab === 'event' && (
                  <div
                    className="sticky top-0 z-10 py-2 bg-gray-50 flex items-center gap-2 text-lg font-bold text-gray-700"
                  >
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>{group.dateLabel}</span>
                  </div>
                )}
                {group.items.map((item, itemIndex) => (
                  <SwipeableCard
                    key={item.id}
                    enabled={isMobileViewport && Boolean(item.canDelete)}
                    onDelete={() => executeTool(ToolNames.DELETE_TODO, { id: item.id })}
                  >
                  <div id={`todo-${item.id}`} className={`transition-all duration-300 ${highlightedTaskId === item.id ? 'scale-[1.02] ring-2 ring-purple-500/50 rounded-lg shadow-lg z-10 relative' : ''}`}>
                    <div className={`card-icons-18 p-4 max-[767px]:p-3 bg-[#f2f2f3] rounded-xl border border-gray-300/70 transition-all ${item.type === 'event' && item.completed ? 'opacity-60' : 'hover:shadow-sm'} ${highlightedTaskId === item.id ? 'border-purple-400' : ''}`}>
                      {item.type === 'event' ? (
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => executeTool(ToolNames.TOGGLE_TODO, { id: item.id })}
                            className={`mt-.5 h-6 w-6 inline-flex items-center justify-center rounded-[4px] border transition-all ${item.completed ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-transparent'}`}
                            aria-label={item.completed ? 'Mark task as open' : 'Mark task as done'}
                          >
                            {item.completed && <i className="fas fa-check text-[9px]"></i>}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`inline-flex items-center gap-1.5 text-[14px] max-[767px]:text-[14px] font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                <i className="far fa-clock text-[14px] text-slate-400"></i>
                                <span>{formatEventTimeRange(item)}</span>
                              </span>
                              <div className="inline-flex items-center gap-0.5">
                                {item.reminderMinutesBefore !== undefined && (
                                  <span className="mr-1 text-[11px] font-bold text-amber-600 whitespace-nowrap">
                                    ~ {formatRemainingDuration(getItemDateTime(item) - Date.now(), language)}
                                  </span>
                                )}
                                {hasShares(item) && (
                                  <div className="relative mr-1">
                                    {getSharedEmails(item).length <= 1 ? (
                                      <span className="text-[11px] font-bold text-red-600 whitespace-nowrap">
                                        {getSharedEmails(item)[0] || `${item.shareCount || 1} users`}
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setShareDropdownItemId((prev) => (prev === item.id ? null : item.id))}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 whitespace-nowrap"
                                      >
                                        <span>{getSharedEmails(item)[0]}</span>
                                        <i className={`fas fa-chevron-${shareDropdownItemId === item.id ? 'up' : 'down'}`} style={{ fontSize:"6px" }}></i>
                                      </button>
                                    )}
                                    {shareDropdownItemId === item.id && getSharedEmails(item).length > 1 && (
                                      <div className="absolute right-0 mt-1 z-20 min-w-[220px] rounded-xl border border-red-200 bg-white shadow-lg p-2 space-y-1">
                                        {getSharedEmails(item).map((email) => (
                                          <div key={`${item.id}-${email}`} className="text-[11px] font-semibold text-red-700">{email}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openShareModal(item)}
                                  disabled={!item.canManageShare}
                                  className={`h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${hasShares(item) ? 'text-red-600' : 'text-slate-500'}`}
                                  title={item.canManageShare ? 'Share' : 'Owner only'}
                                >
                                  <i className="fas fa-user-friends text-[15px]"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openReminderModal(item)}
                                  disabled={!userId || !item.canManageReminder}
                                  className={`h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${item.reminderMinutesBefore !== undefined ? 'text-amber-600' : 'text-slate-400'}`}
                                  title={!userId ? getReminderLoginRequiredMessage() : (item.canManageReminder ? t.reminderTitle : 'Owner only')}
                                >
                                  <i className={`far fa-bell ${item.reminderMinutesBefore !== undefined ? 'reminder-bell-ring' : ''}`}></i>
                                </button>
                                <button onClick={() => openEditModal(item)} className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 transition-colors">
                                  <i className="fas fa-pen text-[13px]"></i>
                                </button>
                                <button onClick={() => executeTool(ToolNames.DELETE_TODO, { id: item.id })} disabled={!item.canDelete} className="h-7 w-7 inline-flex items-center justify-center rounded-md text-red-500 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                  <i className="fas fa-trash-alt text-[13px]"></i>
                                </button>
                              </div>
                            </div>

                            <div className={`mt-2 text-[18px] max-[767px]:text-[14px] font-semibold break-words leading-[1.15] ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              <span className="mr-2 text-slate-500 font-semibold">#{item.localId || item.id}</span>
                              <span>{item.text}</span>
                            </div>
                            {item.isShared && item.ownerEmail && (
                              <div className="mt-1 text-[11px] font-semibold text-slate-500">Shared by {item.ownerEmail}</div>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {isMobileViewport ? (
                                <>
                                  <div
                                    className="event-label-chip inline-flex items-center rounded-lg border px-2 py-0.5"
                                    style={{
                                      backgroundColor: item.labelId ? hexToRgba(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR, 0.15) : '#ffffff',
                                      borderColor: item.labelId ? hexToRgba(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR, 0.35) : '#cbd5e1',
                                      color: item.labelId ? normalizeLabelColor(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR) : '#0f172a'
                                    }}
                                  >
                                    <select
                                      value={item.labelId || ''}
                                      onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, labelId: e.target.value || null })}
                                      disabled={!item.canEditLabel}
                                      className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer text-[11px] font-semibold pr-2"
                                    >
                                      <option value="">{getNoLabelText(language)}</option>
                                      {labels.map(label => (
                                        <option key={label.id} value={label.id}>
                                          {label.name}
                                        </option>
                                      ))}
                                    </select>
                                    <i className="card-caret-icon fas fa-chevron-down text-[8px] opacity-60"></i>
                                  </div>
                                  <div className={`event-priority-chip event-priority-${item.priority} inline-flex items-center rounded-lg border px-2 py-0.5 ${priorityBadgeClasses[item.priority]}`}>
                                    <select
                                      value={item.priority}
                                      onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, priority: e.target.value as Priority })}
                                      className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer text-[11px] font-semibold pr-2"
                                    >
                                      <option value="low">{t.prioLow}</option>
                                      <option value="normal">{t.prioNormal}</option>
                                      <option value="high">{t.prioHigh}</option>
                                    </select>
                                    <i className="card-caret-icon fas fa-chevron-down text-[8px] opacity-60"></i>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div
                                    className="event-label-chip inline-flex items-center rounded-full border px-2 py-0.5"
                                    style={{
                                      backgroundColor: item.labelId ? hexToRgba(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR, 0.15) : '#e2e8f0',
                                      borderColor: item.labelId ? hexToRgba(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR, 0.35) : '#cbd5e1',
                                      color: item.labelId ? normalizeLabelColor(labelById.get(item.labelId)?.color ?? DEFAULT_LABEL_COLOR) : '#64748b'
                                    }}
                                  >
                                    <select
                                      value={item.labelId || ''}
                                      onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, labelId: e.target.value || null })}
                                      disabled={!item.canEditLabel}
                                      className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer text-[14px] font-medium pr-2"
                                    >
                                      <option value="">{getNoLabelText(language)}</option>
                                      {labels.map(label => (
                                        <option key={label.id} value={label.id}>
                                          {label.name}
                                        </option>
                                      ))}
                                    </select>
                                    <i className="card-caret-icon fas fa-chevron-down text-[9px] opacity-60"></i>
                                  </div>
                                  <div className={`event-priority-chip event-priority-${item.priority} inline-flex items-center rounded-full border px-2 py-0.5 ${priorityBadgeClasses[item.priority]}`}>
                                    <select
                                      value={item.priority}
                                      onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, priority: e.target.value as Priority })}
                                      className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer text-[14px] font-medium pr-2"
                                    >
                                      <option value="low">{t.prioLow}</option>
                                      <option value="normal">{t.prioNormal}</option>
                                      <option value="high">{t.prioHigh}</option>
                                    </select>
                                    <i className="card-caret-icon fas fa-chevron-down text-[9px] opacity-60"></i>
                                  </div>
                                </>
                              )}

                              {isItemOverdue(item) && (
                                <span className="inline-flex items-center rounded-full border border-red-300 bg-red-500 px-2 py-0.5 text-[11px] font-medium text-white">
                                  {t.outdated}
                                </span>
                              )}
                            </div>

                            {item.subtasks?.length ? (
                              <div className="mt-3">
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleSubitems(item.id)}
                                    className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600"
                                    aria-label="Toggle subtasks"
                                  >
                                    <span>{formatSubtaskProgressLabel(getCompletedSubtaskCount(item.subtasks), item.subtasks.length, language)}</span>
                                    <i className={`fas fa-angle-down text-[11px] text-[#6f48ff] transition-transform ${expandedSubitems.has(item.id) ? 'rotate-180' : ''}`}></i>
                                  </button>
                                  <span className="text-[12px] font-semibold text-[#6f48ff]">
                                    {getSubtaskProgressPercent(item.subtasks)}%
                                  </span>
                                </div>
                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-300/90">
                                  <div
                                    className="h-full bg-slate-900 transition-all duration-300"
                                    style={{ width: `${getSubtaskProgressPercent(item.subtasks)}%` }}
                                  ></div>
                                </div>

                                {expandedSubitems.has(item.id) && (
                                  <ul className="mt-2.5 space-y-2">
                                    {item.subtasks.map((subtask, index) => (
                                      <li key={`${item.id}-${index}`} className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => executeTool(ToolNames.TOGGLE_SUBTASK, { id: item.id, subtaskIndex: index + 1 })}
                                          className={`h-[12px] w-[12px] min-w-[12px] inline-flex items-center justify-center rounded-[4px] border text-[11px] font-semibold transition-all ${subtask.completed ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-600'}`}
                                          aria-label={`Toggle subtask ${index + 1}`}
                                        >
                                          {index + 1}
                                        </button>
                                        <span className={`text-[16px] max-[767px]:text-[12px] leading-tight ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                          {subtask.text}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : null}

                            {item.location && (
                              <div className="mt-3 flex items-center text-[14px] max-[767px]:text-[14px] font-medium text-slate-500">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors min-w-0"
                                  aria-label="Open in Google Maps"
                                  title="Open in Google Maps"
                                >
                                  <i className="far fa-compass text-[13px] text-slate-500"></i>
                                  <span className={item.completed ? 'line-through' : ''}>{item.location}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="relative flex-1 min-w-0 pr-7">
                          <div className="absolute right-0 top-0 inline-flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => moveNoteCard(item.id, 'up', group.items)}
                              disabled={itemIndex === 0}
                              className="h-4 w-4 inline-flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors disabled:cursor-default disabled:opacity-30"
                              aria-label="Move note up"
                              title="Move up"
                            >
                              <i className="fas fa-chevron-up text-[8px]"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveNoteCard(item.id, 'down', group.items)}
                              disabled={itemIndex === group.items.length - 1}
                              className="h-4 w-4 inline-flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors disabled:cursor-default disabled:opacity-30"
                              aria-label="Move note down"
                              title="Move down"
                            >
                              <i className="fas fa-chevron-down text-[8px]"></i>
                            </button>
                          </div>
                          <div className="text-lg max-[767px]:text-[15px] font-bold break-words leading-snug text-slate-900">
                            <span className="mr-2 text-slate-500 font-semibold">#{item.localId || item.id}</span>
                            <span>{item.title || item.text}</span>
                          </div>
                          {item.isShared && item.ownerEmail && (
                            <div className="mt-1 text-[11px] font-semibold text-slate-500">Shared by {item.ownerEmail}</div>
                          )}
                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            <div className={`event-priority-chip event-priority-${item.priority} inline-flex items-center rounded-full border px-2 py-0.5 ${priorityBadgeClasses[item.priority]}`}>
                              <select
                                value={item.priority}
                                onChange={(e) => executeTool(ToolNames.EDIT_TODO, { id: item.id, priority: e.target.value as Priority })}
                                className="bg-transparent appearance-none border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer text-[14px] max-[767px]:text-[10px] font-medium pr-2"
                              >
                                <option value="low">{t.prioLow}</option>
                                <option value="normal">{t.prioNormal}</option>
                                <option value="high">{t.prioHigh}</option>
                              </select>
                              <i className="card-caret-icon fas fa-chevron-down text-[9px] opacity-60"></i>
                            </div>
                            <div className="inline-flex items-center gap-2 ml-1 relative">
                              {hasShares(item) && (
                                <div className="relative">
                                  {getSharedEmails(item).length <= 1 ? (
                                    <span className="text-[11px] font-bold text-red-600 whitespace-nowrap">
                                      {getSharedEmails(item)[0] || `${item.shareCount || 1} users`}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setShareDropdownItemId((prev) => (prev === item.id ? null : item.id))}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 whitespace-nowrap"
                                    >
                                      <span>{getSharedEmails(item)[0]}</span>
                                      <i className={`fas fa-chevron-${shareDropdownItemId === item.id ? 'up' : 'down'} text-[9px]`}></i>
                                    </button>
                                  )}
                                  {shareDropdownItemId === item.id && getSharedEmails(item).length > 1 && (
                                    <div className="absolute right-0 mt-1 z-20 min-w-[220px] rounded-xl border border-red-200 bg-white shadow-lg p-2 space-y-1">
                                      {getSharedEmails(item).map((email) => (
                                        <div key={`${item.id}-${email}`} className="text-[11px] font-semibold text-red-700">{email}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <button onClick={() => openShareModal(item)} disabled={!item.canManageShare} className={`h-7 w-7 inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${hasShares(item) ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                <i className="fas fa-user-friends text-[14px]"></i>
                              </button>
                              <button onClick={() => openEditModal(item)} className="h-7 w-7 inline-flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors">
                                <i className="fas fa-pen text-[12px]"></i>
                              </button>
                              <button onClick={() => executeTool(ToolNames.DELETE_TODO, { id: item.id })} disabled={!item.canDelete} className="h-7 w-7 inline-flex items-center justify-center text-red-500 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                <i className="fas fa-trash-alt text-[12px]"></i>
                              </button>
                            </div>
                          </div>
                          {item.text && item.title && (
                            <p className="mt-3 text-sm max-[767px]:text-[12px] font-semibold text-slate-600 whitespace-pre-wrap">
                              {item.text}
                            </p>
                          )}
                          <div className="mt-2 flex items-center text-sm max-[767px]:text-[12px] font-semibold text-slate-500">
                            <i className="far fa-clock mr-2 text-[12px] text-slate-400"></i>
                            <span>
                              {new Date(item.createdAt).toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              {' • '}
                              {new Date(item.createdAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </SwipeableCard>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="hidden lg:block lg:col-span-2">
          <div className="sticky top-9 h-[calc(100vh-320px)] max-h-[calc(100vh-320px)]">
            <Calendar />
          </div>
        </section>
      </main>

      {/* Add/Edit Modal */}
      {modalMode && !(isMobileViewport && ((mobileView === 'add' && modalMode === 'add') || (mobileView === 'edit' && modalMode === 'edit'))) && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-4 md:pt-8">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={closeModal}></div>
          <div className="modal-surface relative bg-[#f3f4f6] w-full max-w-2xl rounded-[38px] border border-slate-200 shadow-2xl p-6 md:p-8 animate-in zoom-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-10 h-10 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/80 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="flex flex-wrap items-center gap-3 mb-6 text-[13px] font-black uppercase tracking-tighter text-slate-600">
              {modalMode === 'add' ? (
                <div className={`modal-type-chip flex items-center rounded-lg border border-transparent ${formType === 'task' ? 'text-purple-600 bg-purple-50' : 'text-purple-700 bg-purple-100'}`}>
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
                <div className={`modal-type-chip flex items-center gap-2 px-3 py-1 rounded-lg border border-transparent ${formType === 'task' ? 'text-purple-600 bg-purple-50' : 'text-purple-700 bg-purple-100'}`}>
                  {modalMode === 'edit' && modalTodoItem && <span className="mr-1">#{modalTodoItem.localId || modalTodoItem.id}</span>}
                  <span>{formTypeLabel}</span>
                </div>
              )}
              <div style={{ padding:"2.5px 10px" }} className={`modal-priority-chip flex items-center rounded-lg border border-transparent ${priorityColors[formPriority]}`}>
                <span className="pr-1.5 normal-case">{t.priorityLabel}:</span>
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
                    className="text-base font-bold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Titlu..."
                  />
                )}
              <textarea
                className="text-base font-bold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20 min-h-[140px] resize-none"
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
                      className="text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-700 focus:ring-2 focus:ring-purple-500/20 min-h-[90px] resize-none"
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
                      className="text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-700 focus:ring-2 focus:ring-purple-500/20"
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
                      className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none flex-grow"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                    <input
                      type="time"
                      className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none w-32"
                      value={formTime}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setFormTime(nextValue);
                        if (!nextValue) setFormEndTime('');
                      }}
                    />
                    <input
                      type="time"
                      disabled={!formTime}
                      className="text-xs font-bold bg-[#f8f9fb] border border-slate-300 rounded-xl px-4 py-2 outline-none w-32 disabled:cursor-not-allowed disabled:opacity-60"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      aria-label={t.endTimeLabel}
                      title={t.endTimeLabel}
                    />
                  </>
                )}
                <button
                  onClick={saveModal}
                  className="bg-purple-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {shareModalItem && !(isMobileViewport && mobileView === 'share') && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-4 md:pt-8">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={closeShareModal}></div>
          <div className="modal-surface relative bg-[#f3f4f6] w-full max-w-xl rounded-[38px] border border-slate-200 shadow-2xl p-6 md:p-8 animate-in zoom-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeShareModal}
              className="absolute top-4 right-4 w-10 h-10 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/80 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="mb-6">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Share</div>
              <p className="text-sm font-semibold text-slate-600">
                Share with email
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={shareInputEmail}
                  onChange={(e) => setShareInputEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => void addShare()}
                  disabled={shareBusy || !shareInputEmail.trim()}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
                >
                  Add
                </button>
              </div>

              {shareError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {shareError}
                </div>
              )}

              <div className="space-y-2">
                {shareList.length === 0 ? (
                  <div className="rounded-xl border border-gray-300/70 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
                    No shared users yet.
                  </div>
                ) : (
                  shareList.map((entry) => (
                    <div key={`${entry.userId}-${entry.email}`} className="rounded-xl border border-gray-300/70 bg-white p-4 shadow-sm">
                      <div className="text-sm font-bold text-slate-800">{entry.email}</div>
                      {entry.name && <div className="text-xs font-semibold text-slate-500 mt-1">{entry.name}</div>}
                      <button
                        type="button"
                        onClick={() => void removeShare(entry.userId)}
                        disabled={shareBusy}
                        className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={closeShareModal}
                  className="bg-purple-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md"
                >
                  Salveaza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reminderModalItem && !(isMobileViewport && mobileView === 'reminder') && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-4 md:pt-8">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={closeReminderModal}></div>
          <div className="modal-surface reminder-modal relative bg-[#f3f4f6] w-full max-w-xl rounded-[38px] border border-slate-200 shadow-2xl p-6 md:p-8 animate-in zoom-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeReminderModal}
              className="reminder-close-btn absolute top-4 right-4 w-10 h-10 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/80 transition-colors"
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
                    className="reminder-input mt-2 w-full rounded-xl border border-slate-300 bg-[#f8f9fb] px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    className="reminder-input mt-2 w-full rounded-xl border border-slate-300 bg-[#f8f9fb] px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    className="reminder-input mt-2 w-full rounded-xl border border-slate-300 bg-[#f8f9fb] px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </label>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.reminderChannel}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderChannel('email')}
                    className={`reminder-channel-btn rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border ${reminderChannel === 'email' ? 'is-active bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'}`}
                  >
                    {t.reminderEmail}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="reminder-channel-btn is-disabled rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-400"
                  >
                    {t.reminderSmsSoon}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="reminder-channel-btn is-disabled rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-400"
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
                  className="bg-purple-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md disabled:opacity-60"
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

      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[76] flex items-start justify-center p-4 pt-4 md:pt-8">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={closeSearchPanel}></div>
          <div className="modal-surface relative bg-[#f3f4f6] w-full max-w-xl rounded-[38px] border border-slate-200 shadow-2xl p-6 md:p-8 animate-in zoom-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeSearchPanel}
              className="absolute top-4 right-4 w-10 h-10 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/80 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="mb-5">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.searchTitle}</div>
            </div>

            <div className="space-y-4">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchHasExecuted(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearchActionDisabled) runSearch();
                }}
                placeholder={t.searchTermPlaceholder}
                className="text-sm font-semibold bg-[#f8f9fb] border border-slate-300 rounded-2xl outline-none w-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-purple-500/20"
              />

              <div className="mobile-add-select-surface rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.searchTypeLabel}</div>
                <select
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value as ItemType);
                    setSearchHasExecuted(false);
                  }}
                  className="w-full bg-transparent appearance-none border-0 px-0 py-0 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="task">{t.tasks}</option>
                  <option value="event">{t.events}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={runSearch}
                disabled={isSearchActionDisabled}
                className={`w-full rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${isSearchActionDisabled ? 'cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-400' : 'bg-purple-600 text-white shadow-md active:scale-95'}`}
              >
                {t.searchAction}
              </button>

              {!searchHasExecuted ? (
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500">
                  {t.searchHint}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-500">
                  {t.searchNoResults}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {t.searchResults}: {searchResults.length} • {searchTypeLabel}
                  </div>
                  {searchResults.map(item => {
                    const itemTitle = item.type === 'task' ? (item.title || item.text) : item.text;
                    const itemDescription = item.type === 'task' && item.title ? item.text : '';
                    const eventDateLabel = item.type === 'event'
                      ? new Date(item.sortTimestamp).toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : '';
                    return (
                      <button
                        key={`search-desktop-${item.id}`}
                        type="button"
                        onClick={() => openSearchResult(item)}
                        className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-bold text-slate-900">{itemTitle}</div>
                          <span className="text-[11px] font-semibold text-slate-400">#{item.localId || item.id}</span>
                        </div>
                        {itemDescription && (
                          <div className="mt-1 text-xs text-slate-600 line-clamp-2">{itemDescription}</div>
                        )}
                        {item.type === 'event' ? (
                          <div className="mt-1 flex items-start gap-2">
                            <div className="inline-flex min-w-[54px] h-[40px] flex-col items-center justify-start rounded-xl bg-violet-100 px-2 py-1.5 text-[11px] font-semibold leading-tight text-violet-700">
                              <span>{item.dueTime || '--:--'}</span>
                              <span className={item.dueEndTime ? '' : 'select-none opacity-0'}>{item.dueEndTime || (item.dueTime || '--:--')}</span>
                            </div>
                            <div className="min-w-0 text-[11px] text-slate-500">{eventDateLabel}</div>
                          </div>
                        ) : (
                          <div className="mt-1 whitespace-pre-line text-[11px] text-slate-500">{getSearchItemSubtitle(item)}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Microphone Modal */}
      {isMobileMicModalOpen && (
        <div className="fixed inset-0 z-[90] md:hidden flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-sm rounded-[36px] bg-[#f3f4f6] p-8 shadow-2xl border border-slate-200">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-28 h-28 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-200 animate-[pulse_2.4s_ease-in-out_infinite]">
                <i className="fas fa-microphone text-4xl"></i>
              </div>
              <div className="text-[12px] font-black uppercase tracking-[0.18em] text-purple-600">
                {t.listening}
              </div>
              {!isLive && (
                <div className="w-full bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={transcription}
                    placeholder={t.placeholder}
                    className="w-full bg-transparent text-sm focus:outline-none text-gray-700"
                  />
                </div>
              )}
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
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={() => setIsCalendarOpen(false)}></div>
          <div className="modal-surface relative bg-[#f3f4f6] w-full max-w-lg rounded-[38px] border border-slate-200 shadow-2xl p-8 animate-in zoom-in fade-in duration-300 max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setIsCalendarOpen(false)}
              className="absolute top-1 right-1 w-10 h-10 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/80 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
            <Calendar variant="modal" />
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
