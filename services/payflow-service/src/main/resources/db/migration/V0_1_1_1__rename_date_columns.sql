-- Rename existing column
ALTER TABLE payment_bot_job
RENAME COLUMN casted_date TO casted_at;

-- Add new column with timestamp
ALTER TABLE payment_bot_job
ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
