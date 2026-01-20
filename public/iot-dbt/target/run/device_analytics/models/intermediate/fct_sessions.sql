
        
            delete from "device_analytics"."main_intermediate"."fct_sessions"
            where (
                session_id) in (
                select (session_id)
                from "fct_sessions__dbt_tmp20260119160659224566"
            );

        
    

    insert into "device_analytics"."main_intermediate"."fct_sessions" ("session_id", "device_id", "user_hash", "session_start", "session_end", "session_duration_minutes", "event_count", "had_screen_share", "room_name", "building", "floor", "session_date", "is_business_hours")
    (
        select "session_id", "device_id", "user_hash", "session_start", "session_end", "session_duration_minutes", "event_count", "had_screen_share", "room_name", "building", "floor", "session_date", "is_business_hours"
        from "fct_sessions__dbt_tmp20260119160659224566"
    )
  