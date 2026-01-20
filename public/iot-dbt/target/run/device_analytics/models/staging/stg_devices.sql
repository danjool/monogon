
  
  create view "device_analytics"."main_staging"."stg_devices__dbt_tmp" as (
    -- Staging model for device metadata
-- Feature: Type casting and clean column selection

with source as (
    select * from "device_analytics"."main"."devices"
)

select
    device_id,
    model,
    firmware_version,
    cast(install_date as date) as install_date,
    room_name,
    building,
    floor,
    capacity
from source
  );
