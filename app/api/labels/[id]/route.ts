import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import { normalizeLabelColor } from '@/lib/labelColors';

type DbLabelRow = {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: number;
};

const normalizeLabelName = (value: unknown) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const firstWord = trimmed.split(/\s+/)[0].slice(0, 100);
  if (!firstWord) return '';
  const lower = firstWord.toLocaleLowerCase();
  return `${lower.charAt(0).toLocaleUpperCase()}${lower.slice(1)}`;
};

const mapRow = (row: DbLabelRow) => ({
  id: String(row.id),
  name: normalizeLabelName(row.name),
  color: normalizeLabelColor(row.color),
  createdAt: Number(row.created_at)
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const hasName = body.name !== undefined;
  const hasColor = body.color !== undefined;
  const name = hasName ? normalizeLabelName(body.name) : '';
  const color = hasColor ? normalizeLabelColor(body.color) : null;

  if (hasName && !name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  if (!hasName && !hasColor) return NextResponse.json({ error: 'No updates' }, { status: 400 });

  if (hasName) {
    const [dupRows] = await pool.query(
      'SELECT id FROM labels WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id <> ? LIMIT 1',
      [userId, name, id]
    );
    if ((dupRows as Array<{ id: number }>).length > 0) {
      return NextResponse.json({ error: 'Duplicate label' }, { status: 409 });
    }
  }

  const updates: string[] = [];
  const values: Array<string | null> = [];
  if (hasName) {
    updates.push('name = ?');
    values.push(name);
  }
  if (hasColor) {
    updates.push('color = ?');
    values.push(color);
  }
  values.push(id);
  values.push(String(userId));

  await pool.query(`UPDATE labels SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM labels WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
  const item = (rows as DbLabelRow[])[0];
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(mapRow(item));
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await pool.query('UPDATE todos SET label_id = NULL WHERE user_id = ? AND label_id = ?', [userId, id]);
  await pool.query('DELETE FROM labels WHERE id = ? AND user_id = ?', [id, userId]);
  return NextResponse.json({ ok: true });
}
