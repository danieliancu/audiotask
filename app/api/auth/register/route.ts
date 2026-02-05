import { NextResponse } from 'next/server';
import { createUserWithPassword, getUserByEmail } from '@/lib/users';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || '').toLowerCase().trim();
  const name = String(body.name || '').trim();
  const password = String(body.password || '');

  if (!email || !name || password.length < 6) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const user = await createUserWithPassword({ email, name, password });
  return NextResponse.json({ id: String(user.id), email: user.email, name: user.name });
}
