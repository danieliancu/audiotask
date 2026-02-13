import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { computeTodoDueAt } from '@/lib/reminders';
import { sendReminderEmail } from '@/lib/reminderEmail';

type ReminderJobRow = {
  id: number;
  user_id: number;
  todo_id: number;
  channel: 'email' | 'sms' | 'push';
  scheduled_for: number;
  status: 'scheduled' | 'sent' | 'failed' | 'canceled';
  attempts: number;
};

type TodoRow = {
  id: number;
  text: string;
  title: string | null;
  type: 'task' | 'event';
  due_time: string | null;
  sort_timestamp: number;
  completed: number | boolean;
  deleted_at: number | null;
};

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.REMINDER_QUEUE_SECRET || process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reminderJobId = Number(body.reminderJobId);
  if (!Number.isInteger(reminderJobId) || reminderJobId <= 0) {
    return NextResponse.json({ error: 'Invalid reminderJobId' }, { status: 400 });
  }

  const [jobRows] = await pool.query('SELECT * FROM reminder_jobs WHERE id = ? LIMIT 1', [reminderJobId]);
  const job = (jobRows as ReminderJobRow[])[0];
  if (!job) return NextResponse.json({ ok: true, skipped: 'missing' });
  if (job.status !== 'scheduled') return NextResponse.json({ ok: true, skipped: `status_${job.status}` });

  const [todoRows] = await pool.query('SELECT * FROM todos WHERE id = ? LIMIT 1', [job.todo_id]);
  const todo = (todoRows as TodoRow[])[0];
  if (!todo || todo.deleted_at || Boolean(todo.completed) || todo.type !== 'event') {
    await pool.query("UPDATE reminder_jobs SET status = 'canceled', canceled_at = ? WHERE id = ?", [Date.now(), job.id]);
    return NextResponse.json({ ok: true, skipped: 'todo_inactive' });
  }

  const [userRows] = await pool.query('SELECT email, name FROM users WHERE id = ? LIMIT 1', [job.user_id]);
  const user = (userRows as Array<{ email: string | null; name: string | null }>)[0];
  if (!user?.email) {
    await pool.query(
      "UPDATE reminder_jobs SET status = 'failed', attempts = attempts + 1, error_message = ? WHERE id = ?",
      ['Email missing for user', job.id]
    );
    return NextResponse.json({ ok: false, error: 'Email missing' }, { status: 400 });
  }

  try {
    if (job.channel === 'email') {
      const dueAt = computeTodoDueAt({
        due_time: todo.due_time,
        sort_timestamp: todo.sort_timestamp
      } as { due_time: string | null; sort_timestamp: number });
      const reminderAt = Number(job.scheduled_for);
      const title = todo.title || todo.text;
      const taskText = todo.text;
      const userName = user.name || user.email;
      const reminderAtLabel = new Date(reminderAt).toLocaleString('en-GB', { hour12: false, timeZoneName: 'short' });
      const dueAtLabel = new Date(dueAt).toLocaleString('en-GB', { hour12: false, timeZoneName: 'short' });
      const subject = `Reminder: ${title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 8px;">Task Reminder</h2>
          <p style="margin: 0 0 10px;">Hi <strong>${userName}</strong>, this is your reminder.</p>
          <p style="margin: 0 0 6px;"><strong>Task:</strong> ${title}</p>
          <p style="margin: 0 0 6px;"><strong>Details:</strong> ${taskText}</p>
          <p style="margin: 0 0 6px;"><strong>Reminder time:</strong> ${reminderAtLabel}</p>
          <p style="margin: 0 0 10px;"><strong>Due time:</strong> ${dueAtLabel}</p>
          <p style="margin: 0; color: #64748b; font-size: 12px;">This message was sent to ${user.email}.</p>
        </div>
      `;
      await sendReminderEmail({ to: user.email, subject, html });
    }

    await pool.query(
      "UPDATE reminder_jobs SET status = 'sent', sent_at = ?, attempts = attempts + 1, error_message = NULL WHERE id = ?",
      [Date.now(), job.id]
    );
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    await pool.query(
      "UPDATE reminder_jobs SET status = 'failed', attempts = attempts + 1, error_message = ? WHERE id = ?",
      [String(error?.message || 'Send failed').slice(0, 512), job.id]
    );
    return NextResponse.json({ ok: false, error: 'Send failed' }, { status: 500 });
  }
}
