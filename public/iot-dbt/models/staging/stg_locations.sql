-- Staging model for location metadata
-- Feature: Simple passthrough with clean column selection

with source as (
    select * from {{ source('raw', 'locations') }}
)

select
    location_id,
    building,
    floor,
    room_type,
    sq_feet
from source
