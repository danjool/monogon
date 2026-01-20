-- Snapshot: Track firmware version changes over time
-- Feature: SCD Type 2 (Slowly Changing Dimension)

{% snapshot device_firmware_snapshot %}

{{
    config(
      target_schema='snapshots',
      unique_key='device_id',
      strategy='check',
      check_cols=['firmware_version'],
    )
}}

select
    device_id,
    firmware_version,
    model,
    room_name,
    building,
    current_timestamp as updated_at
from {{ ref('stg_devices') }}

{% endsnapshot %}
