import pool from '@/lib/db';

let ensureSchemaPromise: Promise<void> | null = null;

export function ensureTodoTrashSchema() {
  if (ensureSchemaPromise) return ensureSchemaPromise;

  ensureSchemaPromise = (async () => {
    const [labelsTableRows] = await pool.query("SHOW TABLES LIKE 'labels'");
    const hasLabelsTable = Array.isArray(labelsTableRows) && labelsTableRows.length > 0;
    if (!hasLabelsTable) {
      await pool.query(
        `CREATE TABLE labels (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          name VARCHAR(100) NOT NULL,
          created_at BIGINT NOT NULL,
          UNIQUE KEY uniq_user_label_name (user_id, name),
          INDEX idx_labels_user (user_id),
          CONSTRAINT fk_labels_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
      );
    }

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

    const [labelIdRows] = await pool.query("SHOW COLUMNS FROM todos LIKE 'label_id'");
    const hasLabelId = Array.isArray(labelIdRows) && labelIdRows.length > 0;
    if (!hasLabelId) {
      await pool.query('ALTER TABLE todos ADD COLUMN label_id BIGINT NULL DEFAULT NULL');
    }

    const [indexRows] = await pool.query("SHOW INDEX FROM todos WHERE Key_name = 'idx_todos_user_deleted'");
    const hasUserDeletedIndex = Array.isArray(indexRows) && indexRows.length > 0;

    if (!hasUserDeletedIndex) {
      await pool.query('CREATE INDEX idx_todos_user_deleted ON todos(user_id, deleted_at)');
    }

    const [labelIndexRows] = await pool.query("SHOW INDEX FROM todos WHERE Key_name = 'idx_todos_label'");
    const hasLabelIndex = Array.isArray(labelIndexRows) && labelIndexRows.length > 0;
    if (!hasLabelIndex) {
      await pool.query('CREATE INDEX idx_todos_label ON todos(label_id)');
    }
  })().catch((error) => {
    ensureSchemaPromise = null;
    throw error;
  });

  return ensureSchemaPromise;
}
