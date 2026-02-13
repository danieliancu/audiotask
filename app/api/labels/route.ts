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

export async function GET() {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await pool.query('SELECT * FROM labels WHERE user_id = ? ORDER BY name ASC', [userId]);
  return NextResponse.json((rows as DbLabelRow[]).map(mapRow));
}

export async function POST(request: Request) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const name = normalizeLabelName(body.name);
  const color = normalizeLabelColor(body.color);
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const [existsRows] = await pool.query('SELECT id FROM labels WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1', [userId, name]);
  const existing = (existsRows as Array<{ id: number }>)[0];
  if (existing) {
    const [rows] = await pool.query('SELECT * FROM labels WHERE id = ? AND user_id = ?', [existing.id, userId]);
    return NextResponse.json(mapRow((rows as DbLabelRow[])[0]));
  }

  const [result] = await pool.query(
    'INSERT INTO labels (user_id, name, color, created_at) VALUES (?, ?, ?, ?)',
    [userId, name, color, Date.now()]
  );
  const insertId = (result as { insertId: number }).insertId;
  const [rows] = await pool.query('SELECT * FROM labels WHERE id = ? AND user_id = ?', [insertId, userId]);
  return NextResponse.json(mapRow((rows as DbLabelRow[])[0]));
}
