CREATE TABLE favourite (
    id INTEGER NOT NULL,
    created_date DATETIME(6),
    identity VARCHAR(255) NOT NULL,
    address_checked BOOLEAN,
    profile_checked BOOLEAN,
    version BIGINT,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (id)
) engine = InnoDB;
CREATE TABLE favourite_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO favourite_seq
VALUES (1);
ALTER TABLE favourite
ADD CONSTRAINT uc_favourite_user_id_identity UNIQUE (user_id, identity);
ALTER TABLE favourite
ADD CONSTRAINT FK83lccer6s8bgj5jgjwan5eipk FOREIGN KEY (user_id) REFERENCES user (id);
