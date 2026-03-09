import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import { getTodoAccess, parseUserId } from '@/lib/todoAccess';

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
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (access.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await pool.query(
    'DELETE FROM todos WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL',
    [todoId, userId]
  );

  return NextResponse.json({ ok: true });
}
