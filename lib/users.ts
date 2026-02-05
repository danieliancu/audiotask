import bcrypt from 'bcryptjs';
import pool from './db';

export interface DbUser {
  id: number;
  email: string | null;
  name: string | null;
  image: string | null;
  password_hash: string | null;
  provider: string;
  provider_account_id: string | null;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const list = rows as DbUser[];
  return list[0] ?? null;
}

export async function getUserByProvider(provider: string, providerAccountId: string): Promise<DbUser | null> {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE provider = ? AND provider_account_id = ? LIMIT 1',
    [provider, providerAccountId]
  );
  const list = rows as DbUser[];
  return list[0] ?? null;
}

export async function createUserWithPassword(input: {
  email: string;
  name: string;
  password: string;
}): Promise<DbUser> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (email, name, password_hash, provider, provider_account_id) VALUES (?, ?, ?, ?, ?)',
    [input.email, input.name, passwordHash, 'credentials', null]
  );
  const insertId = (result as { insertId: number }).insertId;
  const user = await getUserByEmail(input.email);
  if (!user) throw new Error('Failed to create user');
  return { ...user, id: insertId };
}

export async function upsertOAuthUser(input: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  provider: string;
  providerAccountId: string;
}): Promise<DbUser> {
  const existing = await getUserByProvider(input.provider, input.providerAccountId);
  if (existing) {
    await pool.query(
      'UPDATE users SET email = ?, name = ?, image = ? WHERE id = ?',
      [input.email ?? existing.email, input.name ?? existing.name, input.image ?? existing.image, existing.id]
    );
    return { ...existing, email: input.email ?? existing.email, name: input.name ?? existing.name, image: input.image ?? existing.image };
  }

  const [result] = await pool.query(
    'INSERT INTO users (email, name, image, provider, provider_account_id) VALUES (?, ?, ?, ?, ?)',
    [input.email ?? null, input.name ?? null, input.image ?? null, input.provider, input.providerAccountId]
  );
  const insertId = (result as { insertId: number }).insertId;
  const user = await getUserByProvider(input.provider, input.providerAccountId);
  if (!user) throw new Error('Failed to create OAuth user');
  return { ...user, id: insertId };
}

export async function verifyPassword(email: string, password: string): Promise<DbUser | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.password_hash) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}
