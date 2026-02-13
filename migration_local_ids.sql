START TRANSACTION;

-- 1) Add per-user visible id for todos.
SET @has_local_id := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'todos'
    AND COLUMN_NAME = 'local_id'
);

SET @sql_add_local_id := IF(
  @has_local_id = 0,
  'ALTER TABLE todos ADD COLUMN local_id BIGINT NULL DEFAULT NULL AFTER user_id',
  'SELECT 1'
);

PREPARE stmt FROM @sql_add_local_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Backfill local_id with a sequence per user.
UPDATE todos t
JOIN (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) AS row_no
  FROM todos
) x ON x.id = t.id
SET t.local_id = x.row_no
WHERE t.local_id IS NULL;

-- 3) Make sure local_id cannot be NULL.
SET @is_local_id_nullable := (
  SELECT IS_NULLABLE
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'todos'
    AND COLUMN_NAME = 'local_id'
  LIMIT 1
);

SET @sql_local_id_not_null := IF(
  @is_local_id_nullable = 'YES',
  'ALTER TABLE todos MODIFY COLUMN local_id BIGINT NOT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql_local_id_not_null;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Add uniqueness per user.
SET @has_local_id_unique := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'todos'
    AND INDEX_NAME = 'uniq_todos_user_local_id'
);

SET @sql_add_local_id_unique := IF(
  @has_local_id_unique = 0,
  'CREATE UNIQUE INDEX uniq_todos_user_local_id ON todos(user_id, local_id)',
  'SELECT 1'
);

PREPARE stmt FROM @sql_add_local_id_unique;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
