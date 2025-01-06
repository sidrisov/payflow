ALTER TABLE client_api_key
ADD COLUMN user_id INTEGER,
ADD CONSTRAINT fk_client_api_key_user FOREIGN KEY (user_id) REFERENCES user (id); 
