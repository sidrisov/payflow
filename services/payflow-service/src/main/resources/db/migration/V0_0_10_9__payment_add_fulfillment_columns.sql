ALTER TABLE payment
ADD COLUMN fulfillment_id VARCHAR(255);

ALTER TABLE payment
ADD COLUMN fulfillment_hash VARCHAR(255);