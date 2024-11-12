CREATE TABLE storage_notification (
    id INTEGER NOT NULL,
    fid INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    threshold INTEGER DEFAULT 20,
    capacity_type VARCHAR(255) DEFAULT 'ALL',
    last_checked_at TIMESTAMP,
    version BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uc_storage_notification_fid UNIQUE (fid)
) engine = InnoDB;
CREATE TABLE storage_notification_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO storage_notification_seq
VALUES (1);
