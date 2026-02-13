import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';

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
  location: string | null;
  sort_timestamp: number;
  type: 'task' | 'event';
  priority: 'low' | 'normal' | 'high';
  subtasks: string | string[] | null;
  deleted_at: number | null;
};

const mapRow = (row: DbTodoRow) => ({
  id: String(row.local_id),
  title: row.title ?? undefined,
  text: row.text,
  labelId: row.label_id ? String(row.label_id) : undefined,
  completed: Boolean(row.completed),
  createdAt: Number(row.created_at),
  dueDate: row.due_date ?? undefined,
  dueTime: row.due_time ?? undefined,
  location: row.location ?? undefined,
  sortTimestamp: Number(row.sort_timestamp),
  type: row.type,
  priority: row.priority,
  deletedAt: row.deleted_at ? Number(row.deleted_at) : undefined,
  subtasks: Array.isArray(row.subtasks)
    ? row.subtasks
    : row.subtasks
      ? JSON.parse(row.subtasks)
      : undefined
});

export async function GET() {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await pool.query(
    'SELECT * FROM todos WHERE user_id = ? AND deleted_at IS NULL ORDER BY sort_timestamp ASC',
    [userId]
  );
  const items = (rows as DbTodoRow[]).map(mapRow);
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
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
    location: body.location ?? null,
    sortTimestamp: Number(body.sortTimestamp) || Date.now(),
    type: body.type === 'event' ? 'event' : 'task',
    priority: body.priority === 'high' ? 'high' : body.priority === 'low' ? 'low' : 'normal',
    subtasks: Array.isArray(body.subtasks) ? JSON.stringify(body.subtasks) : null,
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
      'INSERT INTO todos (user_id, local_id, title, text, label_id, completed, created_at, due_date, due_time, location, sort_timestamp, type, priority, subtasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        payload.location,
        payload.sortTimestamp,
        type,
        payload.priority,
        payload.subtasks
      ]
    );

    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM todos WHERE id = ? AND user_id = ? LIMIT 1',
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
