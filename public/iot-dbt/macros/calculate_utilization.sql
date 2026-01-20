{% macro calculate_utilization(usage_minutes, total_minutes) %}
{#
    Calculates utilization percentage with null-safe division.

    Args:
        usage_minutes: Number of minutes the device was in use
        total_minutes: Total available minutes in the period

    Returns:
        Utilization percentage (0-100+)
#}
    round(
        ({{ usage_minutes }}::float / nullif({{ total_minutes }}::float, 0)) * 100,
        2
    )
{% endmacro %}
