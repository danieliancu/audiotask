import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

type SettingsRow = {
  user_id: number;
  active_tab: 'task' | 'event';
  language: string;
  active_date_filters: string | null;
  filter_task: string;
  filter_event: string;
  calendar_month: string | null;
  default_language: string | null;
  default_active_tab: 'task' | 'event' | null;
  default_show_subtasks: number | boolean | null;
};

const defaultSettings = {
  activeTab: 'task',
  language: 'en',
  activeDateFilters: [] as string[],
  filterTask: 'all',
  filterEvent: 'all',
  calendarMonth: '',
  defaultLanguage: '',
  defaultActiveTab: '',
  defaultShowSubtasks: false
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await pool.query('SELECT * FROM user_settings WHERE user_id = ? LIMIT 1', [userId]);
  const row = (rows as SettingsRow[])[0];
  if (!row) return NextResponse.json(defaultSettings);

  const activeDateFilters = row.active_date_filters ? JSON.parse(row.active_date_filters) : [];
  return NextResponse.json({
    activeTab: row.active_tab ?? defaultSettings.activeTab,
    language: row.language ?? defaultSettings.language,
    activeDateFilters: Array.isArray(activeDateFilters) ? activeDateFilters : [],
    filterTask: row.filter_task ?? defaultSettings.filterTask,
    filterEvent: row.filter_event ?? defaultSettings.filterEvent,
    calendarMonth: row.calendar_month ?? defaultSettings.calendarMonth,
    defaultLanguage: row.default_language ?? defaultSettings.defaultLanguage,
    defaultActiveTab: row.default_active_tab ?? defaultSettings.defaultActiveTab,
    defaultShowSubtasks: Boolean(row.default_show_subtasks ?? defaultSettings.defaultShowSubtasks)
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const activeTab = body.activeTab === 'event' ? 'event' : 'task';
  const language = ['en', 'ro', 'fr', 'de', 'es'].includes(body.language) ? body.language : 'en';
  const activeDateFilters = Array.isArray(body.activeDateFilters) ? JSON.stringify(body.activeDateFilters) : JSON.stringify([]);
  const filterTask = ['all', 'low', 'normal', 'high'].includes(body.filterTask) ? body.filterTask : 'all';
  const rawFilterEvent = String(body.filterEvent || 'all');
  const normalizedFilterEvent = rawFilterEvent === 'resolved'
    ? 'closed'
    : rawFilterEvent === 'unresolved'
      ? 'open'
      : rawFilterEvent;
  const filterEvent = ['all', 'low', 'normal', 'high', 'closed', 'open', 'outdated', 'in_time'].includes(normalizedFilterEvent)
    ? normalizedFilterEvent
    : 'all';
  const calendarMonth = typeof body.calendarMonth === 'string' ? body.calendarMonth : '';

  await pool.query(
    `INSERT INTO user_settings (user_id, active_tab, language, active_date_filters, filter_task, filter_event, calendar_month)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       active_tab = VALUES(active_tab),
       language = VALUES(language),
       active_date_filters = VALUES(active_date_filters),
       filter_task = VALUES(filter_task),
       filter_event = VALUES(filter_event),
       calendar_month = VALUES(calendar_month)`,
    [userId, activeTab, language, activeDateFilters, filterTask, filterEvent, calendarMonth]
  );

  return NextResponse.json({ ok: true });
}
