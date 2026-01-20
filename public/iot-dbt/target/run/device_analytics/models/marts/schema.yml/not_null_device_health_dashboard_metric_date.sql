
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select metric_date
from "device_analytics"."main_marts"."device_health_dashboard"
where metric_date is null



  
  
      
    ) dbt_internal_test