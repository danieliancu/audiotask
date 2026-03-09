import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import { parseUserId } from '@/lib/todoAccess';
import type { ReminderChannel, SubtaskItem } from '@/types';

type DbTodoRow = {
  id: number;
  local_id: number;
  title: string | null;
  text: string;
  label_id: number | null;
  completed: number | boolean;
  created_at: number;
  due_date: string | null;
  due_time: string | null;
  due_end_time: string | null;
  location: string | null;
  sort_timestamp: number;
  type: 'task' | 'event';
  priority: 'low' | 'normal' | 'high';
  subtasks: string | unknown[] | null;
  deleted_at: number | null;
  reminder_minutes_before: number | null;
  reminder_channel: ReminderChannel | null;
};

const normalizeSubtasks = (value: unknown): SubtaskItem[] | undefined => {
  if (value === null || value === undefined) return undefined;

  let rawItems: unknown[] = [];
  if (Array.isArray(value)) {
    rawItems = value;
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) rawItems = parsed;
    } catch {
      rawItems = [];
    }
  }

  const items = rawItems
    .map((entry) => {
      if (typeof entry === 'string') {
        const text = entry.trim();
        if (!text) return null;
        return { text, completed: false } as SubtaskItem;
      }
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as { text?: unknown; completed?: unknown };
      const text = typeof raw.text === 'string' ? raw.text.trim() : '';
      if (!text) return null;
      return { text, completed: Boolean(raw.completed) } as SubtaskItem;
    })
    .filter((entry): entry is SubtaskItem => Boolean(entry));

  return items.length ? items : undefined;
};

const mapRow = (row: DbTodoRow) => ({
  id: String(row.id),
  localId: String(row.local_id),
  title: row.title ?? undefined,
  text: row.text,
  labelId: row.label_id ? String(row.label_id) : undefined,
  completed: Boolean(row.completed),
  createdAt: Number(row.created_at),
  dueDate: row.due_date ?? undefined,
  dueTime: row.due_time ?? undefined,
  dueEndTime: row.due_end_time ?? undefined,
  location: row.location ?? undefined,
  sortTimestamp: Number(row.sort_timestamp),
  type: row.type,
  priority: row.priority,
  deletedAt: row.deleted_at ? Number(row.deleted_at) : undefined,
  reminderMinutesBefore: row.reminder_minutes_before !== null ? Number(row.reminder_minutes_before) : undefined,
  reminderChannel: row.reminder_channel ?? undefined,
  subtasks: normalizeSubtasks(row.subtasks),
  isShared: false,
  canEdit: false,
  canDelete: true,
  canManageShare: false,
  canManageReminder: false,
  canEditLabel: false
});

export async function GET(request: Request) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get('count') === '1';

  if (countOnly) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM todos WHERE user_id = ? AND deleted_at IS NOT NULL',
      [userId]
    );
    const count = Number((rows as Array<{ count: number }>)[0]?.count || 0);
    return NextResponse.json({ count });
  }

  const [rows] = await pool.query(
    'SELECT * FROM todos WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC',
    [userId]
  );
  return NextResponse.json((rows as DbTodoRow[]).map(mapRow));
}

export async function DELETE() {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await pool.query('DELETE FROM todos WHERE user_id = ? AND deleted_at IS NOT NULL', [userId]);
  return NextResponse.json({ ok: true });
}
