CREATE TABLE wallet_session (
    id INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    session_key VARCHAR(255) NOT NULL,
    actions JSON,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    wallet_id INTEGER,
    version BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_wallet_session_wallet FOREIGN KEY (wallet_id) REFERENCES wallet (id)
) engine = InnoDB;

CREATE TABLE wallet_session_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO wallet_session_seq VALUES (1);

ALTER TABLE payment
ADD COLUMN wallet_session_id INTEGER,
ADD CONSTRAINT fk_payment_wallet_session FOREIGN KEY (wallet_session_id) REFERENCES wallet_session (id); 
