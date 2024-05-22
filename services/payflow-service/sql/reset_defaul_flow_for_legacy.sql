UPDATE payflow_db.user u
INNER JOIN (
    SELECT u.id
    FROM payflow_db.user u
    INNER JOIN payflow_db.wallet w ON w.flow_id = u.flow_id
    WHERE w.wallet_version = '1.3.0'
    ORDER BY u.last_seen DESC
    LIMIT 20
) subquery ON u.id = subquery.id
SET u.flow_id = null;