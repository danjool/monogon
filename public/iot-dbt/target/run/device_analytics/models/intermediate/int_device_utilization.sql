
  
  create view "device_analytics"."main_intermediate"."int_device_utilization__dbt_tmp" as (
    -- Intermediate model: Device utilization metrics
-- Feature: Using macros, date logic, aggregations

with events as (
    select * from "device_analytics"."main_staging"."stg_raw_events"
),

devices as (
    select * from "device_analytics"."main_staging"."stg_devices"
),

locations as (
    select * from "device_analytics"."main_staging"."stg_locations"
),

-- Calculate session durations per device per hour
sessions as (
    select
        device_id,
        event_date,
        event_hour,
        

    case
        when extract(hour from event_timestamp) between 8 and 17
         and extract(dow from event_timestamp) between 1 and 5  -- Monday=1 through Friday=5 in DuckDB
        then true
        else false
    end
 as is_business_hours,
        count(case when event_type = 'connect' then 1 end) as connection_count,
        coalesce(sum(duration_seconds), 0) / 60.0 as usage_minutes
    from events
    where event_type in ('connect', 'disconnect')
    group by 1, 2, 3, 4
),

-- Calculate utilization per device per hour, enriched with location data
hourly_utilization as (
    select
        s.device_id,
        s.event_date,
        s.event_hour,
        s.is_business_hours,
        s.connection_count,
        s.usage_minutes,
        

    round(
        (s.usage_minutes::float / nullif(60::float, 0)) * 100,
        2
    )
 as utilization_pct,
        d.room_name,
        d.building,
        d.floor,
        d.capacity,
        l.room_type,
        l.sq_feet
    from sessions s
    left join devices d on s.device_id = d.device_id
    left join locations l on d.building = l.building and d.floor = l.floor
)

select * from hourly_utilization
  );
