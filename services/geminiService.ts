import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { ToolNames, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export const systemInstructions: Record<Language, string> = {
  en: "Minimalist voice assistant. There are two types: task means Note, event means Task. For notes use title and optional text, no time/location/subtasks/completion. For tasks keep date, time, location and subtasks. Use tool calls for all actions. For dates, ALWAYS use YYYY-MM-DD format. Support priorities: low, normal, high. For subtask edit or delete, always use id plus subtaskIndex (1-based). Speak ONLY after tool execution.",
  ro: "Asistent vocal minimalist. Exista doua tipuri: task inseamna Nota, event inseamna Task. Pentru note foloseste title si optional text, fara ora/locatie/subtask/completare. Pentru task-uri pastreaza data, ora, locatie si subtask-uri. Foloseste uneltele pentru orice actiune. Pentru date, foloseste intotdeauna formatul YYYY-MM-DD. Suporta prioritati: low, normal, high. Pentru editare sau stergere subtask, foloseste mereu id plus subtaskIndex (1-based). Vorbeste doar dupa executie.",
  fr: "Assistant vocal minimaliste. Identifiez tache vs evenement. Utilisez les outils pour toutes les actions. Pour les dates, utilisez toujours YYYY-MM-DD. Priorites: low, normal, high. Extrayez la localisation et les sous-taches. Pour editer ou supprimer un sous-element, utilisez id et subtaskIndex (1-based).",
  de: "Minimalistischer Sprachassistent. Unterscheiden Sie Aufgabe vs Termin. Nutzen Sie Tools fuer alle Aktionen. Fuer Datumswerte immer YYYY-MM-DD. Prioritaeten: low, normal, high. Ort und Unteraufgaben extrahieren. Fuer Bearbeiten oder Loeschen einer Unteraufgabe immer id und subtaskIndex (1-based) verwenden.",
  es: "Asistente de voz minimalista. Identifica tarea vs evento. Usa herramientas para todas las acciones. Para fechas, usa siempre YYYY-MM-DD. Prioridades: low, normal, high. Extrae ubicacion y subtareas. Para editar o borrar subtarea, usa id y subtaskIndex (1-based)."
};

export const todoTools: FunctionDeclaration[] = [
  {
    name: ToolNames.ADD_TODO,
    description: "Adds a new item. type=task means Note (title + optional text). type=event means Task (date/time/location/subtasks).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title for notes." },
        text: { type: Type.STRING, description: "Description/body." },
        type: { type: Type.STRING, enum: ['task', 'event'], description: "Classify item." },
        date: { type: Type.STRING, description: "Target date in YYYY-MM-DD format." },
        time: { type: Type.STRING, description: "Time string." },
        priority: { type: Type.STRING, enum: ['low', 'normal', 'high'], description: "Priority level." },
        location: { type: Type.STRING, description: "Location string." },
        subtasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Subtasks or subevents list." }
      },
      required: ['text', 'type']
    }
  },
  {
    name: ToolNames.EDIT_TODO,
    description: "Edits an existing item by id. Notes (type=task): title/text/priority only. Tasks (type=event): text/date/time/location/priority/subtasks.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "ID of the item." },
        title: { type: Type.STRING },
        text: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['task', 'event'] },
        date: { type: Type.STRING, description: "Updated date in YYYY-MM-DD format." },
        time: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ['low', 'normal', 'high'] },
        location: { type: Type.STRING },
        subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
        showSubtasks: { type: Type.BOOLEAN }
      },
      required: ['id']
    }
  },
  {
    name: ToolNames.ADD_SUBTASK,
    description: "Adds one or more subtasks to an existing item by id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "ID of the item." },
        text: { type: Type.STRING, description: "Subtask text." },
        subtasks: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['id']
    }
  },
  {
    name: ToolNames.EDIT_SUBTASK,
    description: "Edits a specific subtask by parent id and 1-based subtask index.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "ID of the parent item." },
        subtaskIndex: { type: Type.NUMBER, description: "1-based subtask index." },
        text: { type: Type.STRING, description: "New subtask text." }
      },
      required: ['id', 'subtaskIndex', 'text']
    }
  },
  {
    name: ToolNames.DELETE_SUBTASK,
    description: "Deletes a specific subtask by parent id and 1-based subtask index.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "ID of the parent item." },
        subtaskIndex: { type: Type.NUMBER, description: "1-based subtask index." }
      },
      required: ['id', 'subtaskIndex']
    }
  },
  {
    name: ToolNames.DELETE_TODO,
    description: "Deletes item by id.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING } },
      required: ['id']
    }
  },
  {
    name: ToolNames.TOGGLE_TODO,
    description: "Toggles completion state by id.",
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

export const generateTTS = async (text: string, _lang: Language) => {
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
