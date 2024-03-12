CREATE TABLE payment_bot_job (
    id INTEGER NOT NULL,
    cast_hash VARCHAR(255) NOT NULL,
    cast_fid INTEGER NOT NULL,
    cast JSON NOT NULL,
    casted_date TIMESTAMP NOT NULL,
    status VARCHAR(256) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uc_cast_hash UNIQUE (cast_hash),
    INDEX idx_payment_bot_job_status_casted_date_asc (status, casted_date ASC),
    INDEX idx_payment_bot_job_casted_date_desc (casted_date DESC)
) engine = InnoDB;

CREATE TABLE payment_bot_job_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO payment_bot_job_seq
VALUES (1);