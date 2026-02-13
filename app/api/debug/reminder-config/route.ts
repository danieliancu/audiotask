import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const mask = (value: string | undefined) => {
  if (!value) return null;
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const qstashUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  const qstashToken = process.env.QSTASH_TOKEN;
  const reminderQueueSecret = process.env.REMINDER_QUEUE_SECRET || process.env.CRON_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
  const destination = nextAuthUrl ? `${nextAuthUrl.replace(/\/+$/, '')}/api/queue/reminder` : null;

  let qstashAuthProbe: { ok: boolean; status: number | null; message: string } = {
    ok: false,
    status: null,
    message: 'not_run'
  };

  if (qstashToken) {
    try {
      const response = await fetch(`${qstashUrl.replace(/\/+$/, '')}/v2/messages?count=1`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${qstashToken}` },
        cache: 'no-store'
      });
      qstashAuthProbe = {
        ok: response.ok,
        status: response.status,
        message: response.ok ? 'ok' : `http_${response.status}`
      };
    } catch (error: any) {
      qstashAuthProbe = {
        ok: false,
        status: null,
        message: String(error?.message || 'request_failed')
      };
    }
  }

  return NextResponse.json(
    {
      runtime: {
        nodeEnv: process.env.NODE_ENV || null,
        vercelEnv: process.env.VERCEL_ENV || null
      },
      config: {
        qstashUrl,
        qstashUrlMasked: mask(qstashUrl),
        hasQstashToken: Boolean(qstashToken),
        qstashTokenLength: qstashToken?.length ?? 0,
        qstashTokenMasked: mask(qstashToken),
        hasReminderQueueSecret: Boolean(reminderQueueSecret),
        reminderQueueSecretLength: reminderQueueSecret?.length ?? 0,
        reminderQueueSecretMasked: mask(reminderQueueSecret),
        hasNextAuthUrl: Boolean(nextAuthUrl),
        nextAuthUrl,
        destination
      },
      probes: {
        qstashAuthProbe
      }
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    }
  );
}
