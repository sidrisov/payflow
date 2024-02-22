CREATE TABLE gift (
    id INTEGER NOT NULL,
    created_date DATETIME(6),
    gifter_user_id INTEGER NOT NULL,
    gifted_user_id INTEGER NOT NULL,
    version BIGINT,
    PRIMARY KEY (id)
) engine = InnoDB;
CREATE TABLE gift_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO gift_seq
VALUES (1);
ALTER TABLE gift
ADD CONSTRAINT uc_gift_gifter_gifted_user_id UNIQUE (gifter_user_id, gifted_user_id);
ALTER TABLE gift
ADD CONSTRAINT fk_gift_user_gifter_user_id_id FOREIGN KEY (gifter_user_id) REFERENCES user (id);
ALTER TABLE gift
ADD CONSTRAINT fk_gift_user_gifted_user_id_id FOREIGN KEY (gifted_user_id) REFERENCES user (id);