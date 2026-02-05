import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const defaultLanguage = ['en', 'ro', 'fr', 'de', 'es'].includes(body.defaultLanguage)
    ? body.defaultLanguage
    : null;
  const defaultActiveTab = body.defaultActiveTab === 'event' || body.defaultActiveTab === 'task'
    ? body.defaultActiveTab
    : null;
  const defaultShowSubtasks = Boolean(body.defaultShowSubtasks);

  await pool.query(
    `INSERT INTO user_settings (user_id, default_language, default_active_tab, default_show_subtasks)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       default_language = VALUES(default_language),
       default_active_tab = VALUES(default_active_tab),
       default_show_subtasks = VALUES(default_show_subtasks)`,
    [userId, defaultLanguage, defaultActiveTab, defaultShowSubtasks]
  );

  return NextResponse.json({ ok: true });
}
