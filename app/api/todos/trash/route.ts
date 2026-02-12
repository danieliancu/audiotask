import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';

type DbTodoRow = {
  id: number;
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
  id: String(row.id),
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

export async function GET(request: Request) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
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
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await pool.query('DELETE FROM todos WHERE user_id = ? AND deleted_at IS NOT NULL', [userId]);
  return NextResponse.json({ ok: true });
}
