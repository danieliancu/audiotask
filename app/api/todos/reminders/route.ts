import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import { parseUserId } from '@/lib/todoAccess';
import type { ReminderChannel } from '@/types';
import { computeTodoDueAt } from '@/lib/reminders';

type DbReminderRow = {
  id: number;
  local_id: number;
  user_id: number;
  title: string | null;
  text: string;
  due_time: string | null;
  sort_timestamp: number;
  reminder_minutes_before: number | null;
  reminder_channel: ReminderChannel | null;
  completed: number | boolean;
  deleted_at: number | null;
  type: 'task' | 'event';
};

const mapRow = (row: DbReminderRow) => {
  const dueAt = computeTodoDueAt({
    due_time: row.due_time,
    sort_timestamp: row.sort_timestamp
  } as { due_time: string | null; sort_timestamp: number });
  const minutesBefore = Number(row.reminder_minutes_before || 0);
  const reminderAt = dueAt - (minutesBefore * 60 * 1000);
  return {
    id: String(row.id),
    localId: String(row.local_id),
    title: row.title ?? undefined,
    text: row.text,
    dueTime: row.due_time ?? undefined,
    sortTimestamp: Number(row.sort_timestamp),
    dueAt,
    reminderAt,
    reminderMinutesBefore: minutesBefore,
    reminderChannel: row.reminder_channel ?? undefined
  };
};

const isReminderActive = (row: DbReminderRow) => computeTodoDueAt({
  due_time: row.due_time,
  sort_timestamp: row.sort_timestamp
} as { due_time: string | null; sort_timestamp: number }) > Date.now();

export async function GET(request: Request) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = parseUserId(session?.user?.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get('count') === '1';

  if (countOnly) {
    const [rows] = await pool.query(
      `SELECT *
       FROM todos
       WHERE user_id = ?
         AND type = 'event'
         AND deleted_at IS NULL
         AND completed = 0
         AND reminder_minutes_before IS NOT NULL
         AND reminder_channel IS NOT NULL`,
      [userId]
    );
    const count = (rows as DbReminderRow[]).filter(isReminderActive).length;
    return NextResponse.json({ count });
  }

  const [rows] = await pool.query(
    `SELECT *
     FROM todos
     WHERE user_id = ?
       AND type = 'event'
       AND deleted_at IS NULL
       AND completed = 0
       AND reminder_minutes_before IS NOT NULL
       AND reminder_channel IS NOT NULL
     ORDER BY sort_timestamp ASC`,
    [userId]
  );

  const activeRows = (rows as DbReminderRow[]).filter(isReminderActive);
  return NextResponse.json(activeRows.map(mapRow));
}
