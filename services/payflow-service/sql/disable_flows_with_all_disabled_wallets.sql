SET SQL_SAFE_UPDATES = 0;

UPDATE flow
SET disabled = TRUE
WHERE id IN (
    SELECT flow_id
    FROM (
        SELECT f.id AS flow_id
        FROM flow f
        JOIN wallet w ON f.id = w.flow_id
        GROUP BY f.id
        HAVING COUNT(*) = SUM(w.disabled)
    ) AS subquery
);

SET SQL_SAFE_UPDATES = 1;