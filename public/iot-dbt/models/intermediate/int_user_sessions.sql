-- Intermediate model: User session building
-- Feature: Session building, window functions

with events as (
    select * from {{ ref('stg_raw_events') }}
),

-- Create session boundaries based on gaps between events
session_starts as (
    select
        event_id,
        device_id,
        user_hash,
        event_timestamp,
        event_type,
        lag(event_timestamp) over (
            partition by device_id, user_hash
            order by event_timestamp
        ) as prev_timestamp,
        -- New session if > 30 minutes since last event
        case
            when datediff('minute',
                 lag(event_timestamp) over (partition by device_id, user_hash order by event_timestamp),
                 event_timestamp
            ) > 30
            then 1
            when lag(event_timestamp) over (partition by device_id, user_hash order by event_timestamp) is null
            then 1
            else 0
        end as is_new_session
    from events
    where event_type in ('connect', 'disconnect', 'screen_share_start', 'screen_share_end')
),

-- Assign session IDs using cumulative sum
sessions_numbered as (
    select
        *,
        sum(is_new_session) over (
            partition by device_id, user_hash
            order by event_timestamp
            rows between unbounded preceding and current row
        ) as session_number
    from session_starts
),

-- Aggregate to session level
sessions as (
    select
        device_id,
        user_hash,
        session_number,
        concat(device_id, '-', user_hash, '-', session_number) as session_id,
        min(event_timestamp) as session_start,
        max(event_timestamp) as session_end,
        datediff('minute', min(event_timestamp), max(event_timestamp)) as session_duration_minutes,
        count(*) as event_count,
        sum(case when event_type = 'screen_share_start' then 1 else 0 end) > 0 as had_screen_share
    from sessions_numbered
    group by 1, 2, 3, 4
)

select * from sessions
