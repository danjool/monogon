INSERT INTO growing_zones (zone_number, temperature_range, description, first_frost_date, last_frost_date)

VALUES 
  ('Zone 5a', '-20°F to -15°F', 'Cold winter zone common in Midwest', 'Mid October', 'Late April'),
  ('Zone 6b', '-5°F to 0°F', 'Moderate winter zone', 'Early November', 'Mid April'),
  ('Zone 8a', '10°F to 15°F', 'Mild winter zone', 'Late November', 'Early March'),
  ('Zone 9b', '25°F to 30°F', 'Warm winter zone common in South', 'December or None', 'January or None');

INSERT INTO plants (name, scientific_name, description, growing_difficulty, sun_requirements, water_requirements, days_to_germination, days_to_maturity, image_path)
VALUES
  ('Tomato', 'Solanum lycopersicum', 'Popular garden vegetable with many varieties', 'Beginner', 'Full Sun', 'Medium', 7, 80, '/images/tomato.jpg'),
  ('Basil', 'Ocimum basilicum', 'Aromatic herb used in cooking', 'Beginner', 'Full Sun', 'Medium', 5, 60, '/images/basil.jpg'),
  ('Carrot', 'Daucus carota', 'Root vegetable high in vitamin A', 'Intermediate', 'Full Sun/Partial Shade', 'Medium', 14, 70, '/images/carrot.jpg'),
  ('Lavender', 'Lavandula', 'Fragrant perennial with purple flowers', 'Intermediate', 'Full Sun', 'Low', 21, 90, '/images/lavender.jpg');

INSERT INTO plant_growing_schedules (plant_id, zone_id, indoor_seed_start_month, outdoor_seed_start_month, transplant_month, harvest_start_month, harvest_end_month, notes)

VALUES
  (1, 1, 'March', 'May', 'May', 'July', 'October', 'Start indoors 6-8 weeks before last frost'),
  (1, 3, 'February', 'April', 'April', 'June', 'November', 'Can have extended growing season in warmer zones'),
  (2, 2, 'March', 'May', 'May', 'June', 'September', 'Harvest leaves as needed throughout season'),
  (3, 4, 'N/A', 'February', 'N/A', 'May', 'June', 'Direct sow outside, thin seedlings to 2 inches apart');

INSERT INTO users (username, email, password_hash, growing_zone_id, role)
VALUES
  ('admin', 'admin@planttracker.com', 'admin_pass', 1, 'admin'),
  ('gardenlover', 'garden@example.com', 'user_pass', 2, 'authenticated'),
  ('plantmama', 'plantmama@example.com', 'user_pass', 3, 'authenticated'),
  ('herbgardener', 'herbs@example.com', 'user_pass', 4, 'authenticated');

INSERT INTO user_gardens (user_id, plant_id, quantity, planting_date, notes)
VALUES
  (2, 1, 3, '2025-05-10', 'Planted Roma tomatoes near fence'),
  (2, 2, 5, '2025-05-12', 'Basil companion planted with tomatoes'),
  (3, 3, 15, '2025-03-20', 'Rainbow carrots in raised bed'),
  (4, 4, 2, '2025-04-15', 'English lavender in front garden');