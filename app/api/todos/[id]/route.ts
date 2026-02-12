import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const { id } = await context.params;
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
  if (body.type !== undefined) pushField('type', body.type === 'event' ? 'event' : 'task');
  if (body.priority !== undefined) {
    const priority = body.priority === 'high' ? 'high' : body.priority === 'low' ? 'low' : 'normal';
    pushField('priority', priority);
  }
  if (body.subtasks !== undefined) {
    const subtasks = Array.isArray(body.subtasks) ? JSON.stringify(body.subtasks) : null;
    pushField('subtasks', subtasks);
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(id, userId);
  await pool.query(
    `UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    values
  );

  const [rows] = await pool.query('SELECT * FROM todos WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [id, userId]);
  const item = (rows as any[])[0];
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const subtasks = item.subtasks ? (typeof item.subtasks === 'string' ? JSON.parse(item.subtasks) : item.subtasks) : undefined;
  return NextResponse.json({
    id: String(item.id),
    title: item.title ?? undefined,
    text: item.text,
    completed: Boolean(item.completed),
    createdAt: Number(item.created_at),
    dueDate: item.due_date ?? undefined,
    dueTime: item.due_time ?? undefined,
    location: item.location ?? undefined,
    sortTimestamp: Number(item.sort_timestamp),
    type: item.type,
    priority: item.priority,
    subtasks
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await pool.query(
    'UPDATE todos SET deleted_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [Date.now(), id, userId]
  );
  return NextResponse.json({ ok: true });
}
