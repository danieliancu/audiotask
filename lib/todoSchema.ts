import pool from '@/lib/db';

let ensureSchemaPromise: Promise<void> | null = null;

export function ensureTodoTrashSchema() {
  if (ensureSchemaPromise) return ensureSchemaPromise;

  ensureSchemaPromise = (async () => {
    const [columnRows] = await pool.query("SHOW COLUMNS FROM todos LIKE 'deleted_at'");
    const hasDeletedAt = Array.isArray(columnRows) && columnRows.length > 0;

    if (!hasDeletedAt) {
      await pool.query('ALTER TABLE todos ADD COLUMN deleted_at BIGINT NULL DEFAULT NULL');
    }

    const [indexRows] = await pool.query("SHOW INDEX FROM todos WHERE Key_name = 'idx_todos_user_deleted'");
    const hasUserDeletedIndex = Array.isArray(indexRows) && indexRows.length > 0;

    if (!hasUserDeletedIndex) {
      await pool.query('CREATE INDEX idx_todos_user_deleted ON todos(user_id, deleted_at)');
    }
  })().catch((error) => {
    ensureSchemaPromise = null;
    throw error;
  });

  return ensureSchemaPromise;
}
