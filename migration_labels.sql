START TRANSACTION;

-- 1) labels table
SET @has_labels_table := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'labels'
);

SET @sql_labels_table := IF(
  @has_labels_table = 0,
  'CREATE TABLE labels (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     user_id BIGINT NOT NULL,
     name VARCHAR(100) NOT NULL,
     color VARCHAR(7) NOT NULL DEFAULT ''#2563EB'',
     created_at BIGINT NOT NULL,
     UNIQUE KEY uniq_user_label_name (user_id, name),
     INDEX idx_labels_user (user_id),
     CONSTRAINT fk_labels_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   )',
  'SELECT 1'
);

PREPARE stmt FROM @sql_labels_table;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1b) labels.color column
SET @has_label_color := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'labels'
    AND COLUMN_NAME = 'color'
);

SET @sql_labels_color := IF(
  @has_label_color = 0,
  'ALTER TABLE labels ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT ''#2563EB'' AFTER name',
  'SELECT 1'
);

PREPARE stmt FROM @sql_labels_color;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) todos.label_id column
SET @has_label_id := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'todos'
    AND COLUMN_NAME = 'label_id'
);

SET @sql_todos_label_id := IF(
  @has_label_id = 0,
  'ALTER TABLE todos ADD COLUMN label_id BIGINT NULL DEFAULT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql_todos_label_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) index on todos.label_id
SET @has_label_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'todos'
    AND INDEX_NAME = 'idx_todos_label'
);

SET @sql_todos_label_idx := IF(
  @has_label_idx = 0,
  'CREATE INDEX idx_todos_label ON todos(label_id)',
  'SELECT 1'
);

PREPARE stmt FROM @sql_todos_label_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) foreign key todos.label_id -> labels.id (ON DELETE SET NULL)
SET @has_todos_label_fk := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'todos'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_todos_label'
);

SET @sql_todos_label_fk := IF(
  @has_todos_label_fk = 0,
  'ALTER TABLE todos ADD CONSTRAINT fk_todos_label FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql_todos_label_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
