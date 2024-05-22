START TRANSACTION;

SET SQL_SAFE_UPDATES = 0;

SET @seq_value := (SELECT next_val FROM payflow_db.wallet_seq); -- Initialize variable with sequence value

INSERT IGNORE INTO payflow_db.wallet (`id`, `deployed`, `flow_id`, `network`, `created_date`, `version`, `address`, `wallet_version`)
SELECT (@seq_value := @seq_value + 1) as id, -- Get the next sequence number for id
    0, -- Set `deployed` to false
    w1.flow_id,
    666666666, -- Target network
    NOW(6), -- Set `created_date` to current timestamp
    0,
    w1.address,
    w1.wallet_version
FROM payflow_db.wallet w1
WHERE w1.wallet_version = "1.4.1" AND NOT EXISTS (
      SELECT 1
      FROM payflow_db.wallet w2
      WHERE w2.flow_id = w1.flow_id AND w2.network = 666666666
  );

UPDATE payflow_db.wallet_seq SET next_val = @seq_value;

SET SQL_SAFE_UPDATES = 1;

COMMIT;


