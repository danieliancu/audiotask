import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';

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
    'DELETE FROM todos WHERE local_id = ? AND user_id = ? AND deleted_at IS NOT NULL',
    [localId, userId]
  );

  return NextResponse.json({ ok: true });
}
