ALTER TABLE payment
ADD COLUMN receiver_flow_id INTEGER;

ALTER TABLE payment
ADD CONSTRAINT fk_payment_flow_receiver_flow_id_id
FOREIGN KEY (receiver_flow_id) REFERENCES flow (id);



