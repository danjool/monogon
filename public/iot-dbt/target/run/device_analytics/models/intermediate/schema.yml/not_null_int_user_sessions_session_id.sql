
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select session_id
from "device_analytics"."main_intermediate"."int_user_sessions"
where session_id is null



  
  
      
    ) dbt_internal_test