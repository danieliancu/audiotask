
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { ToolNames, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const systemInstructions: Record<Language, string> = {
  en: "Minimalist voice assistant. Identify 'task' vs 'event'. Use tool calls for all actions. For dates, ALWAYS use YYYY-MM-DD format. Support priorities: low, normal, high. Extract location when present. When editing, clarify the ID. Speak ONLY after tool execution.",
  ro: "Asistent vocal minimalist. Identifică 'task' vs 'event'. Folosește uneltele pentru orice acțiune. Pentru date, folosește ÎNTOTDEAUNA formatul YYYY-MM-DD. Suportă priorități: low, normal, high. Extrage locația dacă este prezentă. La editare, menționează ID-ul elementului. Vorbește DOAR după execuție.",
  fr: "Assistant vocal minimaliste. Identifiez 'tâche' vs 'événement'. Pour les dates, utilisez TOUJOURS le format YYYY-MM-DD. Supporte les priorités: low, normal, high. Extrayez la localisation si présente. Lors de l'édition, précisez l'ID.",
  de: "Minimalistischer Sprachassistent. Unterscheiden Sie zwischen 'Aufgabe' und 'Termin'. Verwenden Sie für Daten IMMER das Format YYYY-MM-DD. Unterstützt Prioritäten: low, normal, high. Ort extrahieren, wenn vorhanden. Klären Sie beim Bearbeiten die ID.",
  es: "Asistente de voz minimalista. Identifica 'tarea' vs 'evento'. Para las fechas, usa SIEMPRE el format YYYY-MM-DD. Soporta prioridades: low, normal, high. Extrae la ubicación si está presente. Al editar, aclara siempre el ID."
};

export const todoTools: FunctionDeclaration[] = [
  {
    name: ToolNames.ADD_TODO,
    description: "Adds a new item. Categorize as 'task' or 'event'. Extract date (YYYY-MM-DD), time, priority (low, normal, high), and location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "Description." },
        type: { type: Type.STRING, enum: ['task', 'event'], description: "Classify item." },
        date: { type: Type.STRING, description: "Target date in YYYY-MM-DD format." },
        time: { type: Type.STRING, description: "Time string." },
        priority: { type: Type.STRING, enum: ['low', 'normal', 'high'], description: "Priority level." },
        location: { type: Type.STRING, description: "Location string." }
      },
      required: ['text', 'type']
    }
  },
  {
    name: ToolNames.EDIT_TODO,
    description: "Edits an existing item by ID. Update text, date (YYYY-MM-DD), time, priority, or location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "ID of the item." },
        text: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['task', 'event'] },
        date: { type: Type.STRING, description: "Updated date in YYYY-MM-DD format." },
        time: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ['low', 'normal', 'high'] },
        location: { type: Type.STRING }
      },
      required: ['id']
    }
  },
  {
    name: ToolNames.DELETE_TODO,
    description: "Deletes item by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ['id']
    }
  },
  {
    name: ToolNames.TOGGLE_TODO,
    description: "Toggles completion state by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ['id']
    }
  },
  {
    name: ToolNames.CLEAR_COMPLETED,
    description: "Clears all finished items.",
    parameters: { type: Type.OBJECT, properties: {} }
  }
];

export const generateAssistantResponse = async (userPrompt: string, history: any[], lang: Language) => {
  const model = 'gemini-3-flash-preview';
  return await ai.models.generateContent({
    model,
    contents: [...history, { role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemInstructions[lang],
      tools: [{ functionDeclarations: todoTools }]
    }
  });
};

export const generateTTS = async (text: string, lang: Language) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
