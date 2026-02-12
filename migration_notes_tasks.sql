START TRANSACTION;

-- 1) Add title support for notes.
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER user_id;

-- 2) Migrate existing notes (type='task') to note structure.
-- Notes no longer use completion, due date/time, location, or subtasks.
UPDATE todos
SET
  title = COALESCE(NULLIF(title, ''), text),
  completed = 0,
  due_date = NULL,
  due_time = NULL,
  location = NULL,
  subtasks = NULL,
  sort_timestamp = created_at
WHERE type = 'task';

-- 3) Keep filters compatible with the new UI (all/low/normal/high only).
UPDATE user_settings
SET filter_task = 'all'
WHERE filter_task NOT IN ('all', 'low', 'normal', 'high');

UPDATE user_settings
SET filter_event = 'all'
WHERE filter_event NOT IN ('all', 'low', 'normal', 'high');

COMMIT;
