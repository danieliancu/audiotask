import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import { parseUserId } from '@/lib/todoAccess';
import type { ReminderChannel, SubtaskItem } from '@/types';
import { computeTodoDueAt } from '@/lib/reminders';

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
  reminder_channel: ReminderChannel | null;
  owner_email: string | null;
  is_owner: number | boolean;
  share_count: number | null;
  shared_emails: string | null;
  effective_label_id: number | null;
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
  const dueAt = row.type === 'event'
    ? computeTodoDueAt({ due_time: row.due_end_time ?? row.due_time, sort_timestamp: row.sort_timestamp })
    : null;
  const isOverdue = row.type === 'event' && !Boolean(row.completed) && dueAt !== null && dueAt <= Date.now();

  return {
    id: String(row.id),
    localId: isOwner ? String(row.local_id) : undefined,
    title: row.title ?? undefined,
    text: row.text,
    labelId: row.effective_label_id ? String(row.effective_label_id) : undefined,
    completed: Boolean(row.completed),
    createdAt: Number(row.created_at),
    dueDate: row.due_date ?? undefined,
    dueTime: row.due_time ?? undefined,
    dueEndTime: row.due_end_time ?? undefined,
    location: row.location ?? undefined,
    sortTimestamp: Number(row.sort_timestamp),
    type: row.type,
    priority: row.priority,
    reminderMinutesBefore: !isOverdue && row.reminder_minutes_before !== null ? Number(row.reminder_minutes_before) : undefined,
    reminderChannel: !isOverdue ? (row.reminder_channel ?? undefined) : undefined,
    deletedAt: row.deleted_at ? Number(row.deleted_at) : undefined,
    subtasks: normalizeSubtasks(row.subtasks),
    isShared: !isOwner,
    ownerUserId: String(row.user_id),
    ownerEmail: row.owner_email ?? undefined,
    canEdit: true,
    canDelete: isOwner,
    canManageShare: isOwner,
    canManageReminder: isOwner,
    canEditLabel: true,
    shareCount: Number(row.share_count || 0),
    sharedWithEmails: String(row.shared_emails || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  };
};

export async function GET() {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await pool.query(
    `SELECT
       t.*, 
       owner.email AS owner_email,
       CASE WHEN t.user_id = ? THEN 1 ELSE 0 END AS is_owner,
       COALESCE(
         tul.label_id,
         CASE WHEN t.user_id = ? THEN t.label_id ELSE NULL END
       ) AS effective_label_id,
       (SELECT COUNT(*) FROM todo_shares ts2 WHERE ts2.todo_id = t.id) AS share_count,
       (
         SELECT GROUP_CONCAT(u2.email ORDER BY ts2.created_at ASC SEPARATOR ',')
         FROM todo_shares ts2
         JOIN users u2 ON u2.id = ts2.shared_user_id
         WHERE ts2.todo_id = t.id
       ) AS shared_emails
     FROM todos t
     JOIN users owner ON owner.id = t.user_id
     LEFT JOIN todo_user_labels tul
       ON tul.todo_id = t.id
      AND tul.user_id = ?
     LEFT JOIN todo_shares ts
       ON ts.todo_id = t.id
      AND ts.shared_user_id = ?
     WHERE t.deleted_at IS NULL
       AND (t.user_id = ? OR ts.shared_user_id = ?)
     ORDER BY t.sort_timestamp ASC`,
    [userId, userId, userId, userId, userId, userId]
  );

  const uniqueByTodoId = new Map<number, DbTodoRow>();
  for (const row of rows as DbTodoRow[]) {
    if (!uniqueByTodoId.has(row.id)) {
      uniqueByTodoId.set(row.id, row);
    }
  }

  const items = Array.from(uniqueByTodoId.values()).map(mapRow);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const normalizedSubtasks = normalizeSubtasks(body.subtasks);
  let labelId: number | null = null;
  if (body.labelId !== undefined && body.labelId !== null && String(body.labelId).trim() !== '') {
    const parsed = Number(body.labelId);
    if (!Number.isNaN(parsed)) {
      const [labelRows] = await pool.query('SELECT id FROM labels WHERE id = ? AND user_id = ? LIMIT 1', [parsed, userId]);
      if ((labelRows as Array<{ id: number }>).length > 0) labelId = parsed;
    }
  }

  const payload = {
    title: body.title ? String(body.title).trim() : null,
    text: String(body.text || '').trim(),
    completed: Boolean(body.completed),
    createdAt: Number(body.createdAt) || Date.now(),
    dueDate: body.dueDate ?? null,
    dueTime: body.dueTime ?? null,
    dueEndTime: body.dueEndTime ?? null,
    location: body.location ?? null,
    sortTimestamp: Number(body.sortTimestamp) || Date.now(),
    type: body.type === 'event' ? 'event' : 'task',
    priority: body.priority === 'high' ? 'high' : body.priority === 'low' ? 'low' : 'normal',
    subtasks: normalizedSubtasks ? JSON.stringify(normalizedSubtasks) : null,
    labelId
  };

  const type = body.type === 'event' ? 'event' : 'task';
  if (type === 'task' && !payload.title && !payload.text) {
    return NextResponse.json({ error: 'Title required for note' }, { status: 400 });
  }
  if (type === 'event' && !payload.text) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [maxRows] = await connection.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(local_id), 0) + 1 AS nextLocalId FROM todos WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const nextLocalId = Number(maxRows[0]?.nextLocalId || 1);

    const [insertResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO todos (user_id, local_id, title, text, label_id, completed, created_at, due_date, due_time, due_end_time, location, sort_timestamp, type, priority, subtasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        nextLocalId,
        payload.title,
        payload.text,
        payload.labelId,
        payload.completed,
        payload.createdAt,
        payload.dueDate,
        payload.dueTime,
        payload.dueEndTime,
        payload.location,
        payload.sortTimestamp,
        type,
        payload.priority,
        payload.subtasks
      ]
    );

    if (payload.labelId) {
      await connection.query(
        `INSERT INTO todo_user_labels (todo_id, user_id, label_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE label_id = VALUES(label_id), updated_at = VALUES(updated_at)`,
        [insertResult.insertId, userId, payload.labelId, Date.now(), Date.now()]
      );
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT
         t.*, 
         owner.email AS owner_email,
         1 AS is_owner,
         COALESCE(tul.label_id, t.label_id) AS effective_label_id,
         (SELECT COUNT(*) FROM todo_shares ts2 WHERE ts2.todo_id = t.id) AS share_count,
         (
           SELECT GROUP_CONCAT(u2.email ORDER BY ts2.created_at ASC SEPARATOR ',')
           FROM todo_shares ts2
           JOIN users u2 ON u2.id = ts2.shared_user_id
           WHERE ts2.todo_id = t.id
         ) AS shared_emails
       FROM todos t
       JOIN users owner ON owner.id = t.user_id
       LEFT JOIN todo_user_labels tul
         ON tul.todo_id = t.id
        AND tul.user_id = t.user_id
       WHERE t.id = ? AND t.user_id = ?
       LIMIT 1`,
      [insertResult.insertId, userId]
    );

    await connection.commit();
    return NextResponse.json(mapRow((rows as DbTodoRow[])[0]));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
