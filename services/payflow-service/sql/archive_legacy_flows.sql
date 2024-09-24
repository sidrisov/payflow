SET SQL_SAFE_UPDATES = 0;
UPDATE payflow_db.flow f
    INNER JOIN (
        SELECT distinct f.id
        FROM payflow_db.flow f
            INNER JOIN payflow_db.wallet w ON w.flow_id = f.id
        WHERE w.wallet_version = '1.3.0'
            AND f.archived is false
    ) subquery ON f.id = subquery.id
SET f.archived = true;
SET SQL_SAFE_UPDATES = 1;
