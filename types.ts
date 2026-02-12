
export type MessageRole = 'user' | 'model' | 'system' | 'tool';
export type Language = 'en' | 'ro' | 'fr' | 'de' | 'es';
export type ItemType = 'task' | 'event';
export type Priority = 'low' | 'normal' | 'high';

export interface TodoItem {
  id: string;
  title?: string;
  text: string;
  completed: boolean;
  createdAt: number;
  deletedAt?: number;
  dueDate?: string; 
  dueTime?: string; 
  location?: string;
  sortTimestamp: number; 
  type: ItemType;
  priority: Priority;
  subtasks?: string[];
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
  EDIT_SUBTASK = 'edit_subtask',
  DELETE_SUBTASK = 'delete_subtask',
  DELETE_TODO = 'delete_todo',
  TOGGLE_TODO = 'toggle_todo',
  CLEAR_COMPLETED = 'clear_completed',
  EDIT_TODO = 'edit_todo'
}
