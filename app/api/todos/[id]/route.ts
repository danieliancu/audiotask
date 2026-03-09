import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import { getTodoAccess, parseUserId } from '@/lib/todoAccess';
import type { SubtaskItem } from '@/types';

type DbTodoRow = {
  id: number;
  local_id: number;
  user_id: number;
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
  reminder_channel: 'email' | 'sms' | 'push' | null;
  owner_email: string | null;
  is_owner: number | boolean;
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

const mapRow = (row: DbTodoRow) => {
  const isOwner = Boolean(row.is_owner);
  return {
    id: String(row.id),
    localId: isOwner ? String(row.local_id) : undefined,
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
    reminderMinutesBefore: row.reminder_minutes_before !== null ? Number(row.reminder_minutes_before) : undefined,
    reminderChannel: row.reminder_channel ?? undefined,
    subtasks: normalizeSubtasks(row.subtasks),
    isShared: !isOwner,
    ownerUserId: String(row.user_id),
    ownerEmail: row.owner_email ?? undefined,
    canEdit: true,
    canDelete: isOwner,
    canManageShare: isOwner,
    canManageReminder: isOwner,
    canEditLabel: isOwner
  };
};

const fetchTodoForViewer = async (todoId: number, viewerUserId: number) => {
  const [rows] = await pool.query(
    `SELECT
       t.*, 
       owner.email AS owner_email,
       CASE WHEN t.user_id = ? THEN 1 ELSE 0 END AS is_owner
     FROM todos t
     JOIN users owner ON owner.id = t.user_id
     LEFT JOIN todo_shares ts
       ON ts.todo_id = t.id
      AND ts.shared_user_id = ?
     WHERE t.id = ?
       AND t.deleted_at IS NULL
       AND (t.user_id = ? OR ts.shared_user_id = ?)
     LIMIT 1`,
    [viewerUserId, viewerUserId, todoId, viewerUserId, viewerUserId]
  );
  return (rows as DbTodoRow[])[0] ?? null;
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();

  const { id } = await context.params;
  const todoId = Number(id);
  if (!Number.isInteger(todoId) || todoId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await getTodoAccess(userId, todoId);
  if (!access || access.deletedAt !== null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const fields: string[] = [];
  const values: Array<string | number | null | boolean> = [];

  const pushField = (name: string, value: string | number | null | boolean) => {
    fields.push(`${name} = ?`);
    values.push(value);
  };

  if (body.text !== undefined) pushField('text', String(body.text).trim());
  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    pushField('title', title || null);
  }
  if (body.completed !== undefined) pushField('completed', Boolean(body.completed));
  if (body.createdAt !== undefined) pushField('created_at', Number(body.createdAt));
  if (body.dueDate !== undefined) pushField('due_date', body.dueDate ?? null);
  if (body.dueTime !== undefined) pushField('due_time', body.dueTime ?? null);
  if (body.dueEndTime !== undefined) pushField('due_end_time', body.dueEndTime ?? null);
  if (body.location !== undefined) pushField('location', body.location ?? null);
  if (body.sortTimestamp !== undefined) pushField('sort_timestamp', Number(body.sortTimestamp));

  if (body.labelId !== undefined && access.role === 'owner') {
    let labelId: number | null = null;
    if (body.labelId !== null && String(body.labelId).trim() !== '') {
      const parsed = Number(body.labelId);
      if (!Number.isNaN(parsed)) {
        const [rows] = await pool.query('SELECT id FROM labels WHERE id = ? AND user_id = ? LIMIT 1', [parsed, userId]);
        if ((rows as Array<{ id: number }>).length > 0) labelId = parsed;
      }
    }
    pushField('label_id', labelId);
  }

  if (body.priority !== undefined) {
    const priority = body.priority === 'high' ? 'high' : body.priority === 'low' ? 'low' : 'normal';
    pushField('priority', priority);
  }

  if (body.subtasks !== undefined) {
    const subtasks = normalizeSubtasks(body.subtasks);
    pushField('subtasks', subtasks ? JSON.stringify(subtasks) : null);
  }

  const shouldResetReminder = (
    body.dueDate !== undefined
    || body.dueTime !== undefined
    || body.dueEndTime !== undefined
    || body.sortTimestamp !== undefined
    || body.completed !== undefined
    || body.type !== undefined
  );

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(todoId);
  await pool.query(
    `UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );

  if (shouldResetReminder) {
    await pool.query(
      "UPDATE reminder_jobs SET status = 'canceled', canceled_at = ? WHERE user_id = ? AND todo_id = ? AND status = 'scheduled'",
      [Date.now(), access.ownerUserId, todoId]
    );
    await pool.query(
      'UPDATE todos SET reminder_minutes_before = NULL, reminder_channel = NULL WHERE id = ? AND user_id = ?',
      [todoId, access.ownerUserId]
    );
  }

  const item = await fetchTodoForViewer(todoId, userId);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(mapRow(item));
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();

  const { id } = await context.params;
  const todoId = Number(id);
  if (!Number.isInteger(todoId) || todoId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await getTodoAccess(userId, todoId);
  if (!access || access.deletedAt !== null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (access.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await pool.query(
    'UPDATE todos SET deleted_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [Date.now(), todoId, userId]
  );

  await pool.query(
    "UPDATE reminder_jobs SET status = 'canceled', canceled_at = ? WHERE user_id = ? AND todo_id = ? AND status = 'scheduled'",
    [Date.now(), userId, todoId]
  );
  await pool.query(
    'UPDATE todos SET reminder_minutes_before = NULL, reminder_channel = NULL WHERE id = ? AND user_id = ?',
    [todoId, userId]
  );

  return NextResponse.json({ ok: true });
}
