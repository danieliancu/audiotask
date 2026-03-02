import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { ensureTodoTrashSchema } from '@/lib/todoSchema';
import { computeTodoDueAt, parseReminderChannel, parseReminderMinutes, type TodoReminderRow } from '@/lib/reminders';
import { enqueueDelayedReminder } from '@/lib/delayedQueue';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const localId = Number(id);
  if (!Number.isInteger(localId) || localId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await request.json();
  const minutesBefore = parseReminderMinutes(body.minutesBefore);
  const channel = parseReminderChannel(body.channel);
  if (minutesBefore === null) return NextResponse.json({ error: 'Invalid minutesBefore' }, { status: 400 });
  if (channel !== 'email' && channel !== 'sms' && channel !== 'push') {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  }
  if (channel !== 'email') {
    return NextResponse.json({ error: 'Channel not enabled yet' }, { status: 400 });
  }

  const [todoRows] = await pool.query(
    'SELECT * FROM todos WHERE user_id = ? AND local_id = ? AND deleted_at IS NULL LIMIT 1',
    [userId, localId]
  );
  const todo = (todoRows as TodoReminderRow[])[0];
  if (!todo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (todo.type !== 'event') return NextResponse.json({ error: 'Reminders only for tasks' }, { status: 400 });

  const dueAt = computeTodoDueAt(todo);
  const scheduledFor = dueAt - (minutesBefore * 60 * 1000);
  if (scheduledFor <= Date.now()) {
    return NextResponse.json({ error: 'Reminder must be in the future' }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE reminder_jobs SET status = 'canceled', canceled_at = ? WHERE user_id = ? AND todo_id = ? AND status = 'scheduled'",
      [Date.now(), userId, todo.id]
    );

    await connection.query(
      'UPDATE todos SET reminder_minutes_before = ?, reminder_channel = ? WHERE id = ? AND user_id = ?',
      [minutesBefore, channel, todo.id, userId]
    );

    const [insertResult] = await connection.query(
      'INSERT INTO reminder_jobs (user_id, todo_id, channel, scheduled_for, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, todo.id, channel, scheduledFor, 'scheduled', Date.now()]
    );
    const reminderJobId = Number((insertResult as { insertId: number }).insertId);

    const providerJobId = await enqueueDelayedReminder({ reminderJobId }, scheduledFor);
    if (providerJobId) {
      await connection.query('UPDATE reminder_jobs SET provider_job_id = ? WHERE id = ?', [providerJobId, reminderJobId]);
    }

    await connection.commit();
    return NextResponse.json({
      ok: true,
      reminderMinutesBefore: minutesBefore,
      reminderChannel: channel,
      scheduledFor
    });
  } catch (error: any) {
    await connection.rollback();
    const message = String(error?.message || 'Reminder queue unavailable');
    const missingKeys: string[] = [];
    if (message.includes('QSTASH_TOKEN missing')) missingKeys.push('QSTASH_TOKEN');
    if (message.includes('NEXTAUTH_URL missing')) missingKeys.push('NEXTAUTH_URL');
    if (message.includes('APP_URL missing')) missingKeys.push('APP_URL');
    if (message.includes('REMINDER_QUEUE_SECRET missing')) missingKeys.push('REMINDER_QUEUE_SECRET');
    if (missingKeys.length) {
      return NextResponse.json(
        {
          error: `Reminder service is not configured yet. Missing: ${missingKeys.join(', ')}.`
        },
        { status: 503 }
      );
    }
    if (message.includes('APP_URL must be a public URL')) {
      return NextResponse.json(
        {
          error: 'Reminder queue requires a public APP_URL (localhost is not supported).'
        },
        { status: 503 }
      );
    }
    if (message.includes('Queue publish failed')) {
      return NextResponse.json(
        {
          error: 'Reminder queue publish failed.',
          details: message.slice(0, 260)
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Failed to save reminder' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureTodoTrashSchema();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const localId = Number(id);
  if (!Number.isInteger(localId) || localId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const [todoRows] = await pool.query(
    'SELECT id FROM todos WHERE user_id = ? AND local_id = ? LIMIT 1',
    [userId, localId]
  );
  const todo = (todoRows as Array<{ id: number }>)[0];
  if (!todo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await pool.query(
    "UPDATE reminder_jobs SET status = 'canceled', canceled_at = ? WHERE user_id = ? AND todo_id = ? AND status = 'scheduled'",
    [Date.now(), userId, todo.id]
  );
  await pool.query(
    'UPDATE todos SET reminder_minutes_before = NULL, reminder_channel = NULL WHERE user_id = ? AND id = ?',
    [userId, todo.id]
  );

  return NextResponse.json({ ok: true });
}
