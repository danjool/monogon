
  
  create view "device_analytics"."main_staging"."stg_locations__dbt_tmp" as (
    -- Staging model for location metadata
-- Feature: Simple passthrough with clean column selection

with source as (
    select * from "device_analytics"."main"."locations"
)

select
    location_id,
    building,
    floor,
    room_type,
    sq_feet
from source
  );
