import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { getUserByEmail, verifyPassword } from '@/lib/users';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

  if (!username && !newPassword) {
    return NextResponse.json({ error: 'No updates' }, { status: 400 });
  }

  if (newPassword) {
    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }
    if (session.user?.email) {
      const user = await verifyPassword(session.user.email, currentPassword);
      if (!user) return NextResponse.json({ error: 'Invalid current password' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
  }

  const updates: string[] = [];
  const values: any[] = [];
  if (username) {
    updates.push('name = ?');
    values.push(username);
  }
  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    updates.push('password_hash = ?');
    values.push(hash);
  }
  if (!updates.length) return NextResponse.json({ ok: true });

  values.push(userId);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  return NextResponse.json({ ok: true });
}
