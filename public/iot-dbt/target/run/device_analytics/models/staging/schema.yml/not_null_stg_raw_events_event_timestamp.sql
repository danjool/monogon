
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select event_timestamp
from "device_analytics"."main_staging"."stg_raw_events"
where event_timestamp is null



  
  
      
    ) dbt_internal_test