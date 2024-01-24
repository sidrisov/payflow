ALTER TABLE user
ADD COLUMN last_updated_contacts datetime(6);
CREATE INDEX idx_user_last_updated_contacts on user (last_updated_contacts);