-- Mart: Room Summary
-- Feature: Room-level analytics for facility managers

with sessions as (
    select * from {{ ref('fct_sessions') }}
),

devices as (
    select * from {{ ref('stg_devices') }}
),

locations as (
    select * from {{ ref('stg_locations') }}
),

room_metrics as (
    select
        s.room_name,
        s.building,
        s.floor,
        d.capacity,
        l.room_type,
        l.sq_feet,
        count(distinct s.session_id) as total_sessions,
        count(distinct s.user_hash) as unique_users,
        avg(s.session_duration_minutes) as avg_session_duration,
        sum(case when s.had_screen_share then 1 else 0 end) as sessions_with_screen_share,
        sum(case when s.is_business_hours then 1 else 0 end) as business_hour_sessions,
        min(s.session_date) as first_session_date,
        max(s.session_date) as last_session_date
    from sessions s
    left join devices d on s.device_id = d.device_id
    left join locations l on d.building = l.building and d.floor = l.floor
    group by 1, 2, 3, 4, 5, 6
)

select
    room_name,
    building,
    floor,
    room_type,
    capacity,
    sq_feet,
    total_sessions,
    unique_users,
    round(avg_session_duration, 1) as avg_session_minutes,
    sessions_with_screen_share,
    round((sessions_with_screen_share::float / nullif(total_sessions, 0)) * 100, 1) as screen_share_pct,
    business_hour_sessions,
    round((business_hour_sessions::float / nullif(total_sessions, 0)) * 100, 1) as business_hours_pct,
    first_session_date,
    last_session_date
from room_metrics
