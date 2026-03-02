type QueuePayload = Record<string, unknown>;
import { Client } from '@upstash/qstash';

export const enqueueDelayedReminder = async (payload: QueuePayload, runAtMs: number) => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('QSTASH_TOKEN missing');
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
  if (!appUrl) throw new Error('APP_URL missing');
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(appUrl);
  } catch {
    throw new Error('APP_URL invalid');
  }
  const host = parsedUrl.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    throw new Error('APP_URL must be a public URL (localhost is not supported for queue callbacks)');
  }

  const consumerSecret = process.env.REMINDER_QUEUE_SECRET || process.env.CRON_SECRET;
  if (!consumerSecret) throw new Error('REMINDER_QUEUE_SECRET missing');

  const destination = `${appUrl.replace(/\/+$/, '')}/api/queue/reminder`;
  const baseUrl = process.env.QSTASH_URL;
  const client = new Client(baseUrl ? { token, baseUrl } : { token });

  try {
    const response = await client.publishJSON({
      url: destination,
      body: payload,
      notBefore: Math.floor(runAtMs / 1000),
      headers: {
        Authorization: `Bearer ${consumerSecret}`
      }
    });
    return String((response as any)?.messageId || '');
  } catch (error: any) {
    throw new Error(`Queue publish failed: ${String(error?.message || error)}`);
  }
};
