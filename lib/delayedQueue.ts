type QueuePayload = Record<string, unknown>;
import { Client } from '@upstash/qstash';

export const enqueueDelayedReminder = async (payload: QueuePayload, runAtMs: number) => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('QSTASH_TOKEN missing');
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (!appUrl) throw new Error('NEXTAUTH_URL missing');

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
