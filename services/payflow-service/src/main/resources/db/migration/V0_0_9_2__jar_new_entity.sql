ALTER TABLE flow
DROP COLUMN description;

ALTER TABLE flow
ADD COLUMN type VARCHAR(255);

CREATE TABLE jar (
  id INTEGER NOT NULL,
  flow_id INTEGER NOT NULL,
  description VARCHAR(255),
  image VARCHAR(255),
  link VARCHAR(255),
  created_date DATETIME(6) NOT NULL,
  version BIGINT,
  PRIMARY KEY (id),
  CONSTRAINT uc_jar_flow_id UNIQUE (flow_id),
  CONSTRAINT fk_jar_flow_flow_id_id FOREIGN KEY (flow_id) REFERENCES flow (id)
) engine = InnoDB;

CREATE TABLE jar_seq (next_val BIGINT) engine = InnoDB;
INSERT INTO jar_seq
VALUES (1);

