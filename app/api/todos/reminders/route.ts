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
  reminder_minutes_before: number;
  reminder_channel: ReminderChannel;
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
      `SELECT
         t.id,
         t.local_id,
         t.user_id,
         t.title,
         t.text,
         t.due_time,
         t.sort_timestamp,
         tur.reminder_minutes_before,
         tur.reminder_channel,
         t.completed,
         t.deleted_at,
         t.type
       FROM todo_user_reminders tur
       JOIN todos t ON t.id = tur.todo_id
       LEFT JOIN todo_shares ts
         ON ts.todo_id = t.id
        AND ts.shared_user_id = ?
       WHERE tur.user_id = ?
         AND t.type = 'event'
         AND t.deleted_at IS NULL
         AND t.completed = 0
         AND (t.user_id = ? OR ts.shared_user_id = ?)`,
      [userId, userId, userId, userId]
    );
    const count = (rows as DbReminderRow[]).filter(isReminderActive).length;
    return NextResponse.json({ count });
  }

  const [rows] = await pool.query(
    `SELECT
       t.id,
       t.local_id,
       t.user_id,
       t.title,
       t.text,
       t.due_time,
       t.sort_timestamp,
       tur.reminder_minutes_before,
       tur.reminder_channel,
       t.completed,
       t.deleted_at,
       t.type
     FROM todo_user_reminders tur
     JOIN todos t ON t.id = tur.todo_id
     LEFT JOIN todo_shares ts
       ON ts.todo_id = t.id
      AND ts.shared_user_id = ?
     WHERE tur.user_id = ?
       AND t.type = 'event'
       AND t.deleted_at IS NULL
       AND t.completed = 0
       AND (t.user_id = ? OR ts.shared_user_id = ?)
     ORDER BY t.sort_timestamp ASC`,
    [userId, userId, userId, userId]
  );

  const activeRows = (rows as DbReminderRow[]).filter(isReminderActive);
  return NextResponse.json(activeRows.map(mapRow));
}
