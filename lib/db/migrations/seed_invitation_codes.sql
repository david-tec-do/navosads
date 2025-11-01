-- Generate 100 unique invitation codes
-- Each code is a random 8-character alphanumeric string

DO $$
DECLARE
    i INTEGER;
    random_code VARCHAR(32);
BEGIN
    FOR i IN 1..100 LOOP
        -- Generate random 8-character code (uppercase letters and numbers)
        random_code := upper(
            substring(
                md5(random()::text || clock_timestamp()::text || i::text),
                1, 8
            )
        );
        
        -- Insert into InvitationCode table
        INSERT INTO "InvitationCode" ("code", "createdAt")
        VALUES (random_code, NOW())
        ON CONFLICT ("code") DO NOTHING;
    END LOOP;
END $$;

