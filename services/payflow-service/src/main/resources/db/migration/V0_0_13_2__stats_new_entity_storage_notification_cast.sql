CREATE TABLE active_users_stats (
    date DATE PRIMARY KEY,
    daily_active_users BIGINT NOT NULL,
    weekly_active_users BIGINT NOT NULL,
    monthly_active_users BIGINT NOT NULL
);

ALTER TABLE storage_notification
ADD COLUMN notify_with_message BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_with_cast BOOLEAN DEFAULT TRUE;
