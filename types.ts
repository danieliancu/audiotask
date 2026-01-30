
export type MessageRole = 'user' | 'model' | 'system' | 'tool';
export type Language = 'en' | 'ro' | 'fr' | 'de' | 'es';
export type ItemType = 'task' | 'event';
export type Priority = 'low' | 'normal' | 'high';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string; 
  dueTime?: string; 
  sortTimestamp: number; 
  type: ItemType;
  priority: Priority;
  subtasks?: TodoItem[];
}

export interface ToolCall {
  name: string;
  args: any;
  id?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export enum ToolNames {
  ADD_TODO = 'add_todo',
  ADD_SUBTASK = 'add_subtask',
  DELETE_TODO = 'delete_todo',
  TOGGLE_TODO = 'toggle_todo',
  CLEAR_COMPLETED = 'clear_completed',
  EDIT_TODO = 'edit_todo'
}
