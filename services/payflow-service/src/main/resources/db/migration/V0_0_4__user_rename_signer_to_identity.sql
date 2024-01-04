ALTER TABLE user DROP KEY UK3lbait4oerhndfs8i8n49yi25;
ALTER TABLE user DROP KEY UKsb8bbouer5wak8vyiiy4pf2bx;
ALTER TABLE user DROP KEY UKpnrrew2o71m330w38p0ypwjvn;
ALTER TABLE user
    RENAME COLUMN signer TO identity;
ALTER TABLE user
ADD CONSTRAINT uc_user_display_name UNIQUE (display_name);
ALTER TABLE user
ADD CONSTRAINT uc_user_identity UNIQUE (identity);
ALTER TABLE user
ADD CONSTRAINT uc_user_username UNIQUE (username);
