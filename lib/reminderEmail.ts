type ReminderEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

export const sendReminderEmail = async ({ to, subject, html }: ReminderEmailArgs) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY or RESEND_FROM_EMAIL missing');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Email send failed (${res.status}): ${text}`);
  }
};
