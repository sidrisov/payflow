CREATE TABLE top_caster_reward_schedule (
    id INTEGER NOT NULL,
    user_id INTEGER,
    channel_id VARCHAR(255),
    rewards INTEGER,
    token VARCHAR(255) NOT NULL,
    chain_id INTEGER NOT NULL,
    usd_amount DOUBLE,
    token_amount DOUBLE,
    criteria JSON,
    cron_expression VARCHAR(255),
    last_attempt TIMESTAMP,
    last_success TIMESTAMP,
    failures INTEGER DEFAULT 0,
    error VARCHAR(512),
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    PRIMARY KEY (id),
    CONSTRAINT fk_top_caster_reward_schedule_user_user_id_id FOREIGN KEY (user_id) REFERENCES user(id)
) engine = InnoDB;

CREATE TABLE top_caster_reward_schedule_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO top_caster_reward_schedule_seq VALUES (1);
