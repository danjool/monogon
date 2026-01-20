-- Fact table: Sessions with device context
-- Feature: Incremental materialization



with sessions as (
    select * from "device_analytics"."main_intermediate"."int_user_sessions"
),

devices as (
    select * from "device_analytics"."main_staging"."stg_devices"
)

select
    s.session_id,
    s.device_id,
    s.user_hash,
    s.session_start,
    s.session_end,
    s.session_duration_minutes,
    s.event_count,
    s.had_screen_share,
    d.room_name,
    d.building,
    d.floor,
    date(s.session_start) as session_date,
    

    case
        when extract(hour from s.session_start) between 8 and 17
         and extract(dow from s.session_start) between 1 and 5  -- Monday=1 through Friday=5 in DuckDB
        then true
        else false
    end
 as is_business_hours
from sessions s
left join devices d on s.device_id = d.device_id


    -- Only process sessions from last 3 days on incremental runs
    where date(s.session_start) >= current_date - interval '3 days'
