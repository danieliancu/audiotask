import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import type { SubtaskItem } from '@/types';

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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const { id } = await context.params;
  const localId = Number(id);
  if (!Number.isInteger(localId) || localId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const fields: string[] = [];
  const values: any[] = [];

  const pushField = (name: string, value: unknown) => {
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
  if (body.location !== undefined) pushField('location', body.location ?? null);
  if (body.sortTimestamp !== undefined) pushField('sort_timestamp', Number(body.sortTimestamp));
  if (body.labelId !== undefined) {
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
    || body.sortTimestamp !== undefined
    || body.completed !== undefined
    || body.type !== undefined
  );

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(localId, userId);
  await pool.query(
    `UPDATE todos SET ${fields.join(', ')} WHERE local_id = ? AND user_id = ? AND deleted_at IS NULL`,
    values
  );
  if (shouldResetReminder) {
    const [todoRows] = await pool.query('SELECT id FROM todos WHERE local_id = ? AND user_id = ? LIMIT 1', [localId, userId]);
    const todoRow = (todoRows as Array<{ id: number }>)[0];
    if (todoRow) {
      await pool.query(
        "UPDATE reminder_jobs SET status = 'canceled', canceled_at = ? WHERE user_id = ? AND todo_id = ? AND status = 'scheduled'",
        [Date.now(), userId, todoRow.id]
      );
      await pool.query(
        'UPDATE todos SET reminder_minutes_before = NULL, reminder_channel = NULL WHERE id = ? AND user_id = ?',
        [todoRow.id, userId]
      );
    }
  }

  const [rows] = await pool.query('SELECT * FROM todos WHERE local_id = ? AND user_id = ? AND deleted_at IS NULL', [localId, userId]);
  const item = (rows as any[])[0];
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const subtasks = normalizeSubtasks(item.subtasks);
  return NextResponse.json({
    id: String(item.local_id),
    title: item.title ?? undefined,
    text: item.text,
    labelId: item.label_id ? String(item.label_id) : undefined,
    completed: Boolean(item.completed),
    createdAt: Number(item.created_at),
    dueDate: item.due_date ?? undefined,
    dueTime: item.due_time ?? undefined,
    location: item.location ?? undefined,
    sortTimestamp: Number(item.sort_timestamp),
    type: item.type,
    priority: item.priority,
    reminderMinutesBefore: item.reminder_minutes_before !== null ? Number(item.reminder_minutes_before) : undefined,
    reminderChannel: item.reminder_channel ?? undefined,
    subtasks
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const { id } = await context.params;
  const localId = Number(id);
  if (!Number.isInteger(localId) || localId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await pool.query(
    'UPDATE todos SET deleted_at = ? WHERE local_id = ? AND user_id = ? AND deleted_at IS NULL',
    [Date.now(), localId, userId]
  );
  const [todoRows] = await pool.query('SELECT id FROM todos WHERE local_id = ? AND user_id = ? LIMIT 1', [localId, userId]);
  const todoRow = (todoRows as Array<{ id: number }>)[0];
  if (todoRow) {
    await pool.query(
      "UPDATE reminder_jobs SET status = 'canceled', canceled_at = ? WHERE user_id = ? AND todo_id = ? AND status = 'scheduled'",
      [Date.now(), userId, todoRow.id]
    );
    await pool.query(
      'UPDATE todos SET reminder_minutes_before = NULL, reminder_channel = NULL WHERE id = ? AND user_id = ?',
      [todoRow.id, userId]
    );
  }
  return NextResponse.json({ ok: true });
}
