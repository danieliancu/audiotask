import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { ResultSetHeader } from 'mysql2';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import { getTodoAccess, parseUserId } from '@/lib/todoAccess';

type DbShareRow = {
  shared_user_id: number;
  email: string | null;
  name: string | null;
  created_at: number;
};

const parseTodoId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const validateOwnerAccess = async (viewerUserId: number, todoId: number) => {
  const access = await getTodoAccess(viewerUserId, todoId);
  if (!access || access.deletedAt !== null) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }
  if (access.role !== 'owner') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { access };
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const todoId = parseTodoId(id);
  if (!todoId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const validated = await validateOwnerAccess(userId, todoId);
  if (validated.error) return validated.error;

  const [rows] = await pool.query(
    `SELECT
       ts.shared_user_id,
       u.email,
       u.name,
       ts.created_at
     FROM todo_shares ts
     JOIN users u ON u.id = ts.shared_user_id
     WHERE ts.todo_id = ?
     ORDER BY ts.created_at ASC`,
    [todoId]
  );

  return NextResponse.json(
    (rows as DbShareRow[]).map((row) => ({
      userId: String(row.shared_user_id),
      email: row.email ?? '',
      name: row.name ?? '',
      sharedAt: Number(row.created_at)
    }))
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const todoId = parseTodoId(id);
  if (!todoId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const validated = await validateOwnerAccess(userId, todoId);
  if (validated.error) return validated.error;

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').toLowerCase().trim();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const [userRows] = await pool.query('SELECT id, email, name FROM users WHERE email = ? LIMIT 1', [email]);
  const targetUser = (userRows as Array<{ id: number; email: string | null; name: string | null }>)[0];
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (Number(targetUser.id) === userId) {
    return NextResponse.json({ error: 'Cannot share with owner email' }, { status: 400 });
  }

  const [insertResult] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO todo_shares (todo_id, owner_user_id, shared_user_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [todoId, userId, targetUser.id, Date.now()]
  );

  const created = Number(insertResult.affectedRows || 0) > 0;
  return NextResponse.json({
    ok: true,
    created,
    userId: String(targetUser.id),
    email: targetUser.email ?? email,
    name: targetUser.name ?? ''
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const todoId = parseTodoId(id);
  if (!todoId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const validated = await validateOwnerAccess(userId, todoId);
  if (validated.error) return validated.error;

  const body = await request.json().catch(() => ({}));
  let sharedUserId = Number(body.userId);

  if ((!Number.isInteger(sharedUserId) || sharedUserId <= 0) && typeof body.email === 'string') {
    const email = body.email.toLowerCase().trim();
    if (email) {
      const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      const user = (rows as Array<{ id: number }>)[0];
      if (user) sharedUserId = Number(user.id);
    }
  }

  if (!Number.isInteger(sharedUserId) || sharedUserId <= 0) {
    return NextResponse.json({ error: 'Invalid shared user target' }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM todo_shares WHERE todo_id = ? AND shared_user_id = ?',
    [todoId, sharedUserId]
  );
  if (Number(result.affectedRows || 0) === 0) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
