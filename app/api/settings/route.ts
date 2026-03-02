import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

type SettingsRow = {
  user_id: number;
  active_tab: 'task' | 'event';
  language: string;
  color_scheme?: string | null;
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
  colorScheme: 'light',
  activeDateFilters: [] as string[],
  filterTask: 'all|all',
  filterEvent: 'all|all',
  calendarMonth: '',
  defaultLanguage: '',
  defaultActiveTab: '',
  defaultShowSubtasks: false
};

const isStatusFilter = (value: string) => ['all', 'closed', 'open', 'outdated', 'in_time'].includes(value);
const isPriorityFilter = (value: string) => ['all', 'low', 'normal', 'high'].includes(value);
const isColorScheme = (value: unknown): value is 'light' | 'dark' => value === 'light' || value === 'dark';

const normalizeCombinedFilter = (rawValue: unknown, isEvent: boolean) => {
  const raw = String(rawValue || 'all').trim().toLowerCase();
  if (raw.includes('|')) {
    const [rawStatus, rawPriority] = raw.split('|');
    const status = isStatusFilter(rawStatus) ? rawStatus : 'all';
    const priority = isPriorityFilter(rawPriority) ? rawPriority : 'all';
    return `${isEvent ? status : 'all'}|${priority}`;
  }
  if (raw === 'resolved') return `${isEvent ? 'closed' : 'all'}|all`;
  if (raw === 'unresolved') return `${isEvent ? 'open' : 'all'}|all`;
  if (isStatusFilter(raw)) return `${isEvent ? raw : 'all'}|all`;
  if (isPriorityFilter(raw)) return `all|${raw}`;
  return 'all|all';
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
    colorScheme: isColorScheme(row.color_scheme) ? row.color_scheme : defaultSettings.colorScheme,
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
  const [existingRows] = await pool.query('SELECT * FROM user_settings WHERE user_id = ? LIMIT 1', [userId]);
  const existing = (existingRows as SettingsRow[])[0];

  const activeTab = body.activeTab === 'event'
    ? 'event'
    : body.activeTab === 'task'
      ? 'task'
      : (existing?.active_tab ?? defaultSettings.activeTab);
  const language = ['en', 'ro', 'fr', 'de', 'es'].includes(body.language)
    ? body.language
    : (existing?.language ?? defaultSettings.language);
  const colorScheme = isColorScheme(body.colorScheme)
    ? body.colorScheme
    : (isColorScheme(existing?.color_scheme) ? existing.color_scheme : defaultSettings.colorScheme);
  const activeDateFilters = Array.isArray(body.activeDateFilters)
    ? JSON.stringify(body.activeDateFilters)
    : (existing?.active_date_filters ?? JSON.stringify(defaultSettings.activeDateFilters));
  const filterTask = body.filterTask !== undefined
    ? normalizeCombinedFilter(body.filterTask, false)
    : (existing?.filter_task ?? defaultSettings.filterTask);
  const filterEvent = body.filterEvent !== undefined
    ? normalizeCombinedFilter(body.filterEvent, true)
    : (existing?.filter_event ?? defaultSettings.filterEvent);
  const calendarMonth = typeof body.calendarMonth === 'string'
    ? body.calendarMonth
    : (existing?.calendar_month ?? defaultSettings.calendarMonth);

  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, active_tab, language, color_scheme, active_date_filters, filter_task, filter_event, calendar_month)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         active_tab = VALUES(active_tab),
         language = VALUES(language),
         color_scheme = VALUES(color_scheme),
         active_date_filters = VALUES(active_date_filters),
         filter_task = VALUES(filter_task),
         filter_event = VALUES(filter_event),
         calendar_month = VALUES(calendar_month)`,
      [userId, activeTab, language, colorScheme, activeDateFilters, filterTask, filterEvent, calendarMonth]
    );
  } catch (error: any) {
    const message = String(error?.message || '');
    if (!message.toLowerCase().includes('unknown column') || !message.includes('color_scheme')) {
      throw error;
    }
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
  }

  return NextResponse.json({ ok: true });
}
