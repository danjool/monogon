-- Staging model for raw events
-- Feature: Basic transformations, CTEs, standardization

with source as (
    select * from "device_analytics"."main"."raw_events"
),

cleaned as (
    select
        event_id,
        device_id,
        lower(trim(event_type)) as event_type,
        cast(timestamp as timestamp) as event_timestamp,
        user_hash,
        duration_seconds,
        error_code,
        date(cast(timestamp as timestamp)) as event_date,
        extract(hour from cast(timestamp as timestamp)) as event_hour,
        extract(dow from cast(timestamp as timestamp)) as day_of_week
    from source
)

select * from cleaned