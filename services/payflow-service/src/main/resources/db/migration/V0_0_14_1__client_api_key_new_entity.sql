CREATE TABLE client_api_key (
    id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(512),
    client_type VARCHAR(255) NOT NULL,
    client_identifier VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    version BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uc_client_identifier UNIQUE (client_type, client_identifier),
    CONSTRAINT uc_api_key UNIQUE (api_key)
) engine = InnoDB;

CREATE TABLE client_api_key_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO client_api_key_seq VALUES (1);
