

select *
from "device_analytics"."main_intermediate"."fct_sessions"
where session_duration_minutes < 0
   or session_duration_minutes > 1440  -- 24 hours in minutes

