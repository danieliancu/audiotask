import pool from '@/lib/db';

export type TodoAccessRole = 'owner' | 'shared' | 'none';

export type TodoAccess = {
  todoId: number;
  ownerUserId: number;
  deletedAt: number | null;
  role: TodoAccessRole;
};

type DbAccessRow = {
  id: number;
  user_id: number;
  deleted_at: number | null;
  shared_user_id: number | null;
};

export const parseUserId = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

export async function getTodoAccess(viewerUserId: number, todoId: number): Promise<TodoAccess | null> {
  const [rows] = await pool.query(
    `SELECT
       t.id,
       t.user_id,
       t.deleted_at,
       ts.shared_user_id
     FROM todos t
     LEFT JOIN todo_shares ts
       ON ts.todo_id = t.id
      AND ts.shared_user_id = ?
     WHERE t.id = ?
     LIMIT 1`,
    [viewerUserId, todoId]
  );

  const row = (rows as DbAccessRow[])[0];
  if (!row) return null;

  let role: TodoAccessRole = 'none';
  if (row.user_id === viewerUserId) {
    role = 'owner';
  } else if (row.shared_user_id !== null) {
    role = 'shared';
  }

  if (role === 'none') return null;

  return {
    todoId: Number(row.id),
    ownerUserId: Number(row.user_id),
    deletedAt: row.deleted_at === null ? null : Number(row.deleted_at),
    role
  };
}
