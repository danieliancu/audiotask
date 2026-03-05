import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { ToolNames, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export const systemInstructions: Record<Language, string> = {
  en: "Minimalist voice assistant. There are two internal types: task means Note, event means Task. Use this mapping consistently. For notes use title and optional text, no time/location/subtasks/completion. For tasks keep date, start time, optional end time, location and subtasks. Use tool calls for all actions. For dates, ALWAYS use YYYY-MM-DD format. Support priorities: low, normal, high. For subtask edit, delete, or toggle, always use id plus subtaskIndex (1-based). Use toggle_subtask to check or uncheck a subtask. For status filtering, Open means not completed and Closed means completed. Labels: use label name via the label field, and remove label using clearLabel=true. Speak ONLY after tool execution.",
  ro: "Asistent vocal minimalist. Exista doua tipuri interne: task inseamna Nota, event inseamna Task. Pastreaza aceasta mapare mereu. Cand utilizatorul spune nota/notite, foloseste tipul task. Cand spune task/taskuri/eveniment/evenimente, foloseste tipul event. Pentru note foloseste title si optional text, fara ora, locatie, subtask sau completare. Pentru task-uri foloseste data, ora de inceput, optional ora de sfarsit, locatie, subtask-uri si completare. Foloseste tool calls pentru orice actiune. Pentru date foloseste intotdeauna formatul YYYY-MM-DD. Prioritati suportate: low, normal, high. Pentru editare/stergere/bifare subtask foloseste id + subtaskIndex (1-based). Foloseste toggle_subtask pentru a bifa sau debifa un subtask. La filtre de status: Open = nefinalizat, Closed = finalizat. Pentru labels: foloseste numele label-ului in campul label, iar pentru scoatere din label foloseste clearLabel=true. Vorbeste doar dupa executie.",
  fr: "Assistant vocal minimaliste. Il existe deux types internes: task signifie Note, event signifie Tâche. Conservez toujours ce mapping. Si l'utilisateur dit note/notes, utilisez type=task. S'il dit tâche/tâches/événement/événements, utilisez type=event. Pour les notes: title et texte optionnel, sans heure/lieu/sous-tâches/completion. Pour les tâches: date, heure, lieu, sous-tâches et completion. Utilisez les tool calls pour toutes les actions. Pour les dates, utilisez toujours YYYY-MM-DD. Priorités: low, normal, high. Pour éditer/supprimer une sous-tâche, utilisez id + subtaskIndex (1-based). Filtres de statut: Open = non terminé, Closed = terminé. Labels: utilisez le nom via label, et clearLabel=true pour retirer.",
  de: "Minimalistischer Sprachassistent. Es gibt zwei interne Typen: task bedeutet Notiz, event bedeutet Aufgabe. Behalten Sie dieses Mapping immer bei. Wenn der Nutzer Notiz/Notizen sagt, verwenden Sie type=task. Bei Aufgabe/Aufgaben/Ereignis/Ereignisse verwenden Sie type=event. Fuer Notizen: title und optionaler Text, ohne Uhrzeit/Ort/Unteraufgaben/Abschluss. Fuer Aufgaben: Datum, Uhrzeit, Ort, Unteraufgaben und Abschluss. Nutzen Sie Tool Calls fuer alle Aktionen. Datumsformat immer YYYY-MM-DD. Prioritaeten: low, normal, high. Zum Bearbeiten/Loeschen einer Unteraufgabe immer id + subtaskIndex (1-based). Statusfilter: Open = nicht erledigt, Closed = erledigt. Labels: Namen ueber label setzen, mit clearLabel=true entfernen.",
  es: "Asistente de voz minimalista. Hay dos tipos internos: task significa Nota, event significa Tarea. Mantén siempre este mapeo. Si el usuario dice nota/notas, usa type=task. Si dice tarea/tareas/evento/eventos, usa type=event. Para notas: title y texto opcional, sin hora/ubicacion/subtareas/completado. Para tareas: fecha, hora, ubicacion, subtareas y completado. Usa tool calls para todas las acciones. Para fechas usa siempre YYYY-MM-DD. Prioridades: low, normal, high. Para editar/eliminar subtarea usa id + subtaskIndex (1-based). Filtros de estado: Open = no completada, Closed = completada. Labels: usa nombre en label y clearLabel=true para quitar."
};

export const todoTools: FunctionDeclaration[] = [
  {
    name: ToolNames.ADD_TODO,
    description: "Adds a new item. IMPORTANT mapping: type=task means Note (title + optional text), type=event means Task (date/start time/optional end time/location/subtasks).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title for notes." },
        text: { type: Type.STRING, description: "Description/body." },
        type: { type: Type.STRING, enum: ['task', 'event'], description: "Classify item." },
        date: { type: Type.STRING, description: "Target date in YYYY-MM-DD format." },
        time: { type: Type.STRING, description: "Time string." },
        endTime: { type: Type.STRING, description: "Optional end time string." },
        priority: { type: Type.STRING, enum: ['low', 'normal', 'high'], description: "Priority level." },
        label: { type: Type.STRING, description: "Label name for tasks." },
        clearLabel: { type: Type.BOOLEAN, description: "Set true to remove current label from task." },
        location: { type: Type.STRING, description: "Location string." },
        subtasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Subtasks or subevents list." }
      },
      required: ['text', 'type']
    }
  },
  {
    name: ToolNames.EDIT_TODO,
    description: "Edits an existing item by id. Type is immutable during edit. Notes (type=task) allow title/text/priority changes. Tasks (type=event) allow text/date/start time/optional end time/location/priority/subtasks/completion changes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "ID of the item." },
        title: { type: Type.STRING },
        text: { type: Type.STRING },
        date: { type: Type.STRING, description: "Updated date in YYYY-MM-DD format." },
        time: { type: Type.STRING },
        endTime: { type: Type.STRING, description: "Optional updated end time." },
        priority: { type: Type.STRING, enum: ['low', 'normal', 'high'] },
        label: { type: Type.STRING, description: "Label name for tasks." },
        clearLabel: { type: Type.BOOLEAN, description: "Set true to remove current label from task." },
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
    name: ToolNames.TOGGLE_SUBTASK,
    description: "Checks or unchecks a specific subtask by parent id and 1-based subtask index.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "ID of the parent item." },
        subtaskIndex: { type: Type.NUMBER, description: "1-based subtask index." },
        completed: { type: Type.BOOLEAN, description: "Optional explicit completed state." }
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
