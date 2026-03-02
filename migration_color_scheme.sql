ALTER TABLE user_settings
  ADD COLUMN color_scheme VARCHAR(10) NOT NULL DEFAULT 'light' AFTER language;

