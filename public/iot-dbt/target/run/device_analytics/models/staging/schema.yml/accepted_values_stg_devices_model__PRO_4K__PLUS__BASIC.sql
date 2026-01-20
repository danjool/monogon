
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    

with all_values as (

    select
        model as value_field,
        count(*) as n_records

    from "device_analytics"."main_staging"."stg_devices"
    group by model

)

select *
from all_values
where value_field not in (
    'PRO-4K','PLUS','BASIC'
)



  
  
      
    ) dbt_internal_test