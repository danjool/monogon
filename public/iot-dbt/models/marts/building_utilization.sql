-- Mart: Building Utilization Report
-- Feature: Aggregations for capacity planning

with utilization as (
    select * from {{ ref('int_device_utilization') }}
),

building_metrics as (
    select
        building,
        event_date,
        count(distinct device_id) as device_count,
        sum(usage_minutes) as total_usage_minutes,
        avg(utilization_pct) as avg_utilization_pct,
        sum(connection_count) as total_connections,
        sum(case when is_business_hours then usage_minutes else 0 end) as business_hours_usage,
        sum(case when not is_business_hours then usage_minutes else 0 end) as after_hours_usage,
        sum(distinct sq_feet) as total_sq_feet
    from utilization
    group by 1, 2
)

select
    building,
    event_date,
    device_count,
    total_sq_feet,
    total_usage_minutes,
    round(avg_utilization_pct, 2) as avg_utilization_pct,
    total_connections,
    round(business_hours_usage, 2) as business_hours_usage,
    round(after_hours_usage, 2) as after_hours_usage,
    round(
        (business_hours_usage::float / nullif(total_usage_minutes::float, 0)) * 100,
        2
    ) as business_hours_pct
from building_metrics
