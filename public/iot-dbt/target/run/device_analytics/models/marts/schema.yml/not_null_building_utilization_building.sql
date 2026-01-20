
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select building
from "device_analytics"."main_marts"."building_utilization"
where building is null



  
  
      
    ) dbt_internal_test