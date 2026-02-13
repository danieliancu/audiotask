type QueuePayload = Record<string, unknown>;

export const enqueueDelayedReminder = async (payload: QueuePayload, runAtMs: number) => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('QSTASH_TOKEN missing');

  const baseUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (!appUrl) throw new Error('NEXTAUTH_URL missing');

  const consumerSecret = process.env.REMINDER_QUEUE_SECRET || process.env.CRON_SECRET;
  if (!consumerSecret) throw new Error('REMINDER_QUEUE_SECRET missing');

  const destination = `${appUrl.replace(/\/+$/, '')}/api/queue/reminder`;
  const delaySeconds = Math.max(0, Math.floor((runAtMs - Date.now()) / 1000));

  const response = await fetch(`${baseUrl}/v2/publish/${encodeURIComponent(destination)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Upstash-Delay': `${delaySeconds}s`,
      'Upstash-Forward-Authorization': `Bearer ${consumerSecret}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Queue publish failed (${response.status}): ${body}`);
  }

  const data = await response.json().catch(() => ({} as { messageId?: string; message_id?: string }));
  return String(data.messageId || data.message_id || '');
};
