-- Intermediate model: Error rate analysis
-- Feature: Window functions, error analysis

with events as (
    select * from "device_analytics"."main_staging"."stg_raw_events"
),

devices as (
    select * from "device_analytics"."main_staging"."stg_devices"
),

error_summary as (
    select
        e.device_id,
        e.event_date,
        d.firmware_version,
        d.model,
        count(case when e.event_type = 'error' then 1 end) as error_count,
        count(*) as total_events,
        round(
            count(case when e.event_type = 'error' then 1 end)::float /
            nullif(count(*)::float, 0) * 100,
            2
        ) as error_rate_pct
    from events e
    left join devices d on e.device_id = d.device_id
    group by 1, 2, 3, 4
)

select * from error_summary