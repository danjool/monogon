
    
    

with all_values as (

    select
        event_type as value_field,
        count(*) as n_records

    from "device_analytics"."main_staging"."stg_raw_events"
    group by event_type

)

select *
from all_values
where value_field not in (
    'connect','disconnect','screen_share_start','screen_share_end','error'
)


