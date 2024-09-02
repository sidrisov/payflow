CREATE TABLE preferred_tokens (
    id INTEGER NOT NULL,
    user_id INT NOT NULL,
    tokens VARCHAR(255),
    version BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_preferred_tokens_user_user_id_id FOREIGN KEY (user_id) REFERENCES user (id)
)  engine = InnoDB;

CREATE TABLE preferred_tokens_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO preferred_tokens_seq
VALUES (1);