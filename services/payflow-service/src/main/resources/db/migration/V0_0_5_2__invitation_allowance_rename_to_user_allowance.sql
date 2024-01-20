ALTER TABLE invitation_allowance RENAME TO user_allowance;
ALTER TABLE invitation_allowance_seq RENAME TO user_allowance_seq;
ALTER TABLE user_allowance
    RENAME COLUMN idenity_invite_limit TO identity_invite_limit;

