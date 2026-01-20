-- Custom generic test: Validates session duration is reasonable
-- Sessions should be between 0 and 1440 minutes (24 hours)

{% test session_duration_reasonable(model, column_name) %}

select *
from {{ model }}
where {{ column_name }} < 0
   or {{ column_name }} > 1440  -- 24 hours in minutes

{% endtest %}
