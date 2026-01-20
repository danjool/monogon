
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select room_name
from "device_analytics"."main_marts"."room_summary"
where room_name is null



  
  
      
    ) dbt_internal_test