ALTER TABLE payment
RENAME COLUMN created_date TO created_at;

ALTER TABLE payment
RENAME COLUMN completed_date TO completed_at;

ALTER TABLE payment
ADD COLUMN expires_at DATETIME(6);