import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';

type DbTodoRow = {
  id: number;
  user_id: number;
  text: string;
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
  id: String(row.id),
  text: row.text,
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
  const payload = {
    text: String(body.text || '').trim(),
    completed: Boolean(body.completed),
    createdAt: Number(body.createdAt) || Date.now(),
    dueDate: body.dueDate ?? null,
    dueTime: body.dueTime ?? null,
    location: body.location ?? null,
    sortTimestamp: Number(body.sortTimestamp) || Date.now(),
    type: body.type === 'event' ? 'event' : 'task',
    priority: body.priority === 'high' ? 'high' : body.priority === 'low' ? 'low' : 'normal',
    subtasks: Array.isArray(body.subtasks) ? JSON.stringify(body.subtasks) : null
  };

  if (!payload.text) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 });
  }

  const [result] = await pool.query(
    'INSERT INTO todos (user_id, text, completed, created_at, due_date, due_time, location, sort_timestamp, type, priority, subtasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      userId,
      payload.text,
      payload.completed,
      payload.createdAt,
      payload.dueDate,
      payload.dueTime,
      payload.location,
      payload.sortTimestamp,
      payload.type,
      payload.priority,
      payload.subtasks
    ]
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [insertId, userId]);
  const item = (rows as DbTodoRow[])[0];
  return NextResponse.json(mapRow(item));
}
