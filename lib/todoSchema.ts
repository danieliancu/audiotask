import pool from '@/lib/db';
import { DEFAULT_LABEL_COLOR } from '@/lib/labelColors';

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
          color VARCHAR(7) NOT NULL DEFAULT '${DEFAULT_LABEL_COLOR}',
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

    const [localIdRows] = await pool.query("SHOW COLUMNS FROM todos LIKE 'local_id'");
    const hasLocalId = Array.isArray(localIdRows) && localIdRows.length > 0;
    if (!hasLocalId) {
      await pool.query('ALTER TABLE todos ADD COLUMN local_id BIGINT NULL DEFAULT NULL AFTER user_id');
    }

    const [labelColorRows] = await pool.query("SHOW COLUMNS FROM labels LIKE 'color'");
    const hasLabelColor = Array.isArray(labelColorRows) && labelColorRows.length > 0;
    if (!hasLabelColor) {
      await pool.query(`ALTER TABLE labels ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '${DEFAULT_LABEL_COLOR}' AFTER name`);
    }

    const [reminderMinutesRows] = await pool.query("SHOW COLUMNS FROM todos LIKE 'reminder_minutes_before'");
    const hasReminderMinutes = Array.isArray(reminderMinutesRows) && reminderMinutesRows.length > 0;
    if (!hasReminderMinutes) {
      await pool.query('ALTER TABLE todos ADD COLUMN reminder_minutes_before INT NULL DEFAULT NULL');
    }

    const [reminderChannelRows] = await pool.query("SHOW COLUMNS FROM todos LIKE 'reminder_channel'");
    const hasReminderChannel = Array.isArray(reminderChannelRows) && reminderChannelRows.length > 0;
    if (!hasReminderChannel) {
      await pool.query("ALTER TABLE todos ADD COLUMN reminder_channel ENUM('email','sms','push') NULL DEFAULT NULL");
    }

    const [dueEndTimeRows] = await pool.query("SHOW COLUMNS FROM todos LIKE 'due_end_time'");
    const hasDueEndTime = Array.isArray(dueEndTimeRows) && dueEndTimeRows.length > 0;
    if (!hasDueEndTime) {
      await pool.query('ALTER TABLE todos ADD COLUMN due_end_time VARCHAR(10) NULL DEFAULT NULL AFTER due_time');
    }

    await pool.query(`
      UPDATE todos t
      JOIN (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) AS row_no
        FROM todos
      ) x ON x.id = t.id
      SET t.local_id = x.row_no
      WHERE t.local_id IS NULL
    `);

    const [localIdDefinitionRows] = await pool.query("SHOW COLUMNS FROM todos LIKE 'local_id'");
    const localIdDefinition = (localIdDefinitionRows as Array<{ Null: string }>)[0];
    if (localIdDefinition?.Null === 'YES') {
      await pool.query('ALTER TABLE todos MODIFY COLUMN local_id BIGINT NOT NULL');
    }

    const [indexRows] = await pool.query("SHOW INDEX FROM todos WHERE Key_name = 'idx_todos_user_deleted'");
    const hasUserDeletedIndex = Array.isArray(indexRows) && indexRows.length > 0;

    if (!hasUserDeletedIndex) {
      await pool.query('CREATE INDEX idx_todos_user_deleted ON todos(user_id, deleted_at)');
    }

    const [localUniqueRows] = await pool.query("SHOW INDEX FROM todos WHERE Key_name = 'uniq_todos_user_local_id'");
    const hasLocalUniqueIndex = Array.isArray(localUniqueRows) && localUniqueRows.length > 0;
    if (!hasLocalUniqueIndex) {
      await pool.query('CREATE UNIQUE INDEX uniq_todos_user_local_id ON todos(user_id, local_id)');
    }

    const [labelIndexRows] = await pool.query("SHOW INDEX FROM todos WHERE Key_name = 'idx_todos_label'");
    const hasLabelIndex = Array.isArray(labelIndexRows) && labelIndexRows.length > 0;
    if (!hasLabelIndex) {
      await pool.query('CREATE INDEX idx_todos_label ON todos(label_id)');
    }

    const [reminderJobsTableRows] = await pool.query("SHOW TABLES LIKE 'reminder_jobs'");
    const hasReminderJobsTable = Array.isArray(reminderJobsTableRows) && reminderJobsTableRows.length > 0;
    if (!hasReminderJobsTable) {
      await pool.query(
        `CREATE TABLE reminder_jobs (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          todo_id BIGINT NOT NULL,
          channel ENUM('email','sms','push') NOT NULL,
          scheduled_for BIGINT NOT NULL,
          status ENUM('scheduled','sent','failed','canceled') NOT NULL DEFAULT 'scheduled',
          provider_job_id VARCHAR(255) NULL,
          error_message VARCHAR(512) NULL,
          attempts INT NOT NULL DEFAULT 0,
          created_at BIGINT NOT NULL,
          sent_at BIGINT NULL,
          canceled_at BIGINT NULL,
          INDEX idx_reminder_jobs_due (status, scheduled_for),
          INDEX idx_reminder_jobs_todo (todo_id),
          CONSTRAINT fk_reminder_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_reminder_jobs_todo FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
        )`
      );
    }
  })().catch((error) => {
    ensureSchemaPromise = null;
    throw error;
  });

  return ensureSchemaPromise;
}
