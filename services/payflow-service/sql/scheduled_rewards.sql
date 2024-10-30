INSERT INTO top_caster_reward_schedule (
        id,
        user_id,
        rewards,
        channel_id,
        chain_id,
        usd_amount,
        token,
        cron_expression,
        criteria,
        status
    )
VALUES (
        1,
        1,
        3,
        'memes',
        8453,
        5,
        'usdc',
        '0 0 18 * * SUN',
        '{"data": {"hypersub": "0x1cff5c9fb2a5fba6951d148c5d46d1272a2763ee"}, "version": "1"}',
        'ACTIVE'
    );
