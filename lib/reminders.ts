import type { ReminderChannel } from '@/types';

export type TodoReminderRow = {
  id: number;
  user_id: number;
  text: string;
  title: string | null;
  due_time: string | null;
  sort_timestamp: number;
  type: 'task' | 'event';
  completed: number | boolean;
  deleted_at: number | null;
  reminder_minutes_before: number | null;
  reminder_channel: ReminderChannel | null;
};

export const ALLOWED_REMINDER_CHANNELS: ReminderChannel[] = ['email', 'sms', 'push'];

export const computeTodoDueAt = (todo: Pick<TodoReminderRow, 'sort_timestamp' | 'due_time'>) => {
  const base = new Date(Number(todo.sort_timestamp));
  if (!todo.due_time) {
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0, 0).getTime();
  }

  const [hoursRaw, minutesRaw] = String(todo.due_time).split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0, 0).getTime();
  }
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0).getTime();
};

export const parseReminderChannel = (value: unknown): ReminderChannel | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return ALLOWED_REMINDER_CHANNELS.includes(normalized as ReminderChannel)
    ? (normalized as ReminderChannel)
    : null;
};

export const parseReminderMinutes = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
};
