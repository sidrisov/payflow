ALTER TABLE payment
ADD COLUMN category VARCHAR(255);

ALTER TABLE payment
ADD COLUMN receiver_fid INTEGER;