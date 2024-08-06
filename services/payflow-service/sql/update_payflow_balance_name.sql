SET SQL_SAFE_UPDATES = 0;
UPDATE flow
SET title = "Payflow Balance"
WHERE title IN ("Primary flow", "default")
    AND type is NULL
    AND wallet_provider = "safe";
SET SQL_SAFE_UPDATES = 1;
