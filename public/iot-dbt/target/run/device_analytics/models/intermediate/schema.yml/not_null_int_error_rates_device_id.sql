
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select device_id
from "device_analytics"."main_intermediate"."int_error_rates"
where device_id is null



  
  
      
    ) dbt_internal_test