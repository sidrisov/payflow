CREATE TABLE payment (
    id INTEGER NOT NULL,
    type VARCHAR(255) NOT NULL,
    reference_id VARCHAR(255) NOT NULL,
    sender_user_id INTEGER,
    receiver_user_id INTEGER,
    network INTEGER NOT NULL,
    sender_address VARCHAR(255),
    receiver_address VARCHAR(255),
    token VARCHAR(255) NOT NULL,
    usd_amount VARCHAR(255),
    token_amount VARCHAR(255),
    hash VARCHAR(255),
    status VARCHAR(255) NOT NULL,
    source_app VARCHAR(255),
    source_ref VARCHAR(255),
    comment VARCHAR(255),
    created_date DATETIME(6) NOT NULL,
    completed_date DATETIME(6),
    version BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_payment_sender_user_id FOREIGN KEY (sender_user_id) REFERENCES user(id),
    CONSTRAINT fk_payment_receiver_user_id FOREIGN KEY (receiver_user_id) REFERENCES user(id),
    CONSTRAINT uc_payment_reference_id UNIQUE (reference_id),
    CONSTRAINT uc_payment_hash UNIQUE (hash)
) engine = InnoDB;

CREATE TABLE payment_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO payment_seq
VALUES (1);