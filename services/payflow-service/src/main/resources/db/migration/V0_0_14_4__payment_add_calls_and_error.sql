ALTER TABLE payment 
ADD COLUMN calls JSON,
ADD COLUMN error VARCHAR(1024),
ADD COLUMN failures INTEGER DEFAULT 0;