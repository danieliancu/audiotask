START TRANSACTION;

SET @has_label_color := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'labels'
    AND COLUMN_NAME = 'color'
);

SET @sql_add_label_color := IF(
  @has_label_color = 0,
  'ALTER TABLE labels ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT ''#2563EB'' AFTER name',
  'SELECT 1'
);

PREPARE stmt FROM @sql_add_label_color;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE labels
SET color = '#2563EB'
WHERE color IS NULL OR color = '';

COMMIT;
