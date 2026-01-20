
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select timestamp
from "device_analytics"."main"."raw_events"
where timestamp is null



  
  
      
    ) dbt_internal_test