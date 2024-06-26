ALTER TABLE flow
ADD COLUMN disabled BOOLEAN;

UPDATE flow SET disabled = FALSE;