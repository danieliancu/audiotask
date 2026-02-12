import pool from '@/lib/db';

let ensureSchemaPromise: Promise<void> | null = null;

export function ensureTodoTrashSchema() {
  if (ensureSchemaPromise) return ensureSchemaPromise;

  ensureSchemaPromise = (async () => {
    const [titleRows] = await pool.query("SHOW COLUMNS FROM todos LIKE 'title'");
    const hasTitle = Array.isArray(titleRows) && titleRows.length > 0;
    if (!hasTitle) {
      await pool.query('ALTER TABLE todos ADD COLUMN title VARCHAR(255) NULL DEFAULT NULL AFTER user_id');
    }

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
