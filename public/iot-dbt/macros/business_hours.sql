{% macro is_business_hours(timestamp_column) %}
{#
    Determines if a timestamp falls within business hours.
    Business hours: Monday-Friday, 8am-5pm

    Args:
        timestamp_column: The timestamp column to evaluate

    Returns:
        Boolean expression (true if business hours, false otherwise)
#}
    case
        when extract(hour from {{ timestamp_column }}) between 8 and 17
         and extract(dow from {{ timestamp_column }}) between 1 and 5  -- Monday=1 through Friday=5 in DuckDB
        then true
        else false
    end
{% endmacro %}
