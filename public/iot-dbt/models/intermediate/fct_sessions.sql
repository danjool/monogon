-- Fact table: Sessions with device context
-- Feature: Incremental materialization

{{
    config(
        materialized='incremental',
        unique_key='session_id',
        on_schema_change='append_new_columns'
    )
}}

with sessions as (
    select * from {{ ref('int_user_sessions') }}
),

devices as (
    select * from {{ ref('stg_devices') }}
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
    {{ is_business_hours('s.session_start') }} as is_business_hours
from sessions s
left join devices d on s.device_id = d.device_id

{% if is_incremental() %}
    -- Only process sessions from last 3 days on incremental runs
    where date(s.session_start) >= current_date - interval '3 days'
{% endif %}
