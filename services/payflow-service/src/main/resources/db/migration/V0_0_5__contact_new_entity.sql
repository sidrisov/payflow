CREATE TABLE contact (
    id INTEGER NOT NULL,
    created_date DATETIME(6),
    identity VARCHAR(255) NOT NULL,
    address_checked BOOLEAN,
    profile_checked BOOLEAN,
    version BIGINT,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (id)
) engine = InnoDB;
CREATE TABLE contact_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO contact_seq
VALUES (1);
ALTER TABLE contact
ADD CONSTRAINT uc_contact_user_id_identity UNIQUE (user_id, identity);
ALTER TABLE contact
ADD CONSTRAINT fk_contact_user_user_id_id FOREIGN KEY (user_id) REFERENCES user (id);
