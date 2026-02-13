START TRANSACTION;

SET @has_reminder_minutes := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'todos'
    AND COLUMN_NAME = 'reminder_minutes_before'
);

SET @sql_add_reminder_minutes := IF(
  @has_reminder_minutes = 0,
  'ALTER TABLE todos ADD COLUMN reminder_minutes_before INT NULL DEFAULT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql_add_reminder_minutes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_reminder_channel := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'todos'
    AND COLUMN_NAME = 'reminder_channel'
);

SET @sql_add_reminder_channel := IF(
  @has_reminder_channel = 0,
  'ALTER TABLE todos ADD COLUMN reminder_channel ENUM(''email'',''sms'',''push'') NULL DEFAULT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql_add_reminder_channel;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_reminder_jobs_table := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reminder_jobs'
);

SET @sql_create_reminder_jobs := IF(
  @has_reminder_jobs_table = 0,
  'CREATE TABLE reminder_jobs (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     user_id BIGINT NOT NULL,
     todo_id BIGINT NOT NULL,
     channel ENUM(''email'',''sms'',''push'') NOT NULL,
     scheduled_for BIGINT NOT NULL,
     status ENUM(''scheduled'',''sent'',''failed'',''canceled'') NOT NULL DEFAULT ''scheduled'',
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
   )',
  'SELECT 1'
);

PREPARE stmt FROM @sql_create_reminder_jobs;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
