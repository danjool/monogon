
  
    
    

    create  table
      "device_analytics"."main_marts"."device_health_dashboard__dbt_tmp"
  
    as (
      -- Mart: Device Health Dashboard
-- Feature: Wide, denormalized table for dashboards

with devices as (
    select * from "device_analytics"."main_staging"."stg_devices"
),

utilization as (
    select
        device_id,
        event_date,
        sum(usage_minutes) as total_usage_minutes,
        avg(utilization_pct) as avg_utilization_pct,
        sum(connection_count) as total_connections
    from "device_analytics"."main_intermediate"."int_device_utilization"
    group by 1, 2
),

errors as (
    select
        device_id,
        event_date,
        sum(error_count) as total_errors,
        avg(error_rate_pct) as avg_error_rate_pct
    from "device_analytics"."main_intermediate"."int_error_rates"
    group by 1, 2
),

daily_metrics as (
    select
        d.device_id,
        d.model,
        d.firmware_version,
        d.room_name,
        d.building,
        d.floor,
        d.capacity,
        coalesce(u.event_date, e.event_date) as metric_date,
        coalesce(u.total_usage_minutes, 0) as usage_minutes,
        coalesce(u.avg_utilization_pct, 0) as utilization_pct,
        coalesce(u.total_connections, 0) as connection_count,
        coalesce(e.total_errors, 0) as error_count,
        coalesce(e.avg_error_rate_pct, 0) as error_rate_pct,
        -- Health score (0-100): penalize errors, reward utilization
        round(
            greatest(0,
                100
                - (coalesce(e.avg_error_rate_pct, 0) * 2)  -- Penalize errors
                + (least(coalesce(u.avg_utilization_pct, 0), 80) * 0.25)  -- Reward utilization up to 80%
            ),
            0
        ) as health_score
    from devices d
    left join utilization u on d.device_id = u.device_id
    left join errors e on d.device_id = e.device_id
        and u.event_date = e.event_date
    where coalesce(u.event_date, e.event_date) is not null
)

select * from daily_metrics
    );
  
  