CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE FUNCTION url_encode(data bytea) RETURNS text LANGUAGE sql AS $$
    SELECT translate(encode(data, 'base64'), E'+/=\n', '-_');
$$;

CREATE OR REPLACE FUNCTION url_decode(data text) RETURNS bytea LANGUAGE sql AS $$
    WITH t AS (SELECT translate(data, '-_', '+/') AS trans),
         rem AS (SELECT length(t.trans) % 4 AS remainder FROM t) -- compute padding size
    SELECT decode(
        t.trans ||
        CASE WHEN rem.remainder > 0
           THEN repeat('=', (4 - rem.remainder))
           ELSE '' END,
    'base64') FROM t, rem;
$$;

CREATE OR REPLACE FUNCTION algorithm_sign(signables text, secret text, algorithm text)
RETURNS text LANGUAGE sql AS $$
WITH
  alg AS (
    SELECT CASE
      WHEN algorithm = 'HS256' THEN 'sha256'
      WHEN algorithm = 'HS384' THEN 'sha384'
      WHEN algorithm = 'HS512' THEN 'sha512'
      ELSE '' END AS id)  -- hmac throws error if algorithm is not valid
SELECT url_encode(hmac(signables, secret, alg.id)) FROM alg;
$$;

CREATE OR REPLACE FUNCTION sign(payload json, secret text, algorithm text DEFAULT 'HS256')
RETURNS text LANGUAGE sql AS $$
WITH
  header AS (
    SELECT url_encode(convert_to('{"alg":"' || algorithm || '","typ":"JWT"}', 'utf8')) AS data
    ),
  payload AS (
    SELECT url_encode(convert_to(payload::text, 'utf8')) AS data
    ),
  signables AS (
    SELECT header.data || '.' || payload.data AS data FROM header, payload
    )
SELECT
    signables.data || '.' ||
    algorithm_sign(signables.data, secret, algorithm) FROM signables;
$$;

CREATE OR REPLACE FUNCTION verify(token text, secret text, algorithm text DEFAULT 'HS256')
RETURNS table(header json, payload json, valid boolean) LANGUAGE sql AS $$
  SELECT
    convert_from(url_decode(r[1]), 'utf8')::json AS header,
    convert_from(url_decode(r[2]), 'utf8')::json AS payload,
    r[3] = algorithm_sign(r[1] || '.' || r[2], secret, algorithm) AS valid
  FROM regexp_split_to_array(token, '\.') r;
$$;
-- Set JWT secret
-- TODO: Use a more secure method to set the JWT secret
ALTER DATABASE postgres SET app.jwt_secret TO 'plant_tracker_secret_key_for_jwt_tokens';


-- Basic tables

CREATE TABLE growing_zones (
  id SERIAL PRIMARY KEY,
  zone_number TEXT NOT NULL,
  temperature_range TEXT NOT NULL,
  description TEXT,
  first_frost_date TEXT,
  last_frost_date TEXT
);

CREATE TABLE plants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  description TEXT,
  growing_difficulty TEXT NOT NULL,
  sun_requirements TEXT NOT NULL,
  water_requirements TEXT NOT NULL,
  days_to_germination INTEGER,
  days_to_maturity INTEGER,
  image_path TEXT
);

-- Auth roles (don't create roles, just set up permissions later)

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anonymous') THEN
    CREATE ROLE anonymous NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin NOLOGIN;
  END IF;
END
$$;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  growing_zone_id INTEGER REFERENCES growing_zones(id),
  role TEXT NOT NULL DEFAULT 'authenticated',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Join tables
CREATE TABLE plant_growing_schedules (
  id SERIAL PRIMARY KEY,
  plant_id INTEGER REFERENCES plants(id),
  zone_id INTEGER REFERENCES growing_zones(id),
  indoor_seed_start_month TEXT,
  outdoor_seed_start_month TEXT,
  transplant_month TEXT,
  harvest_start_month TEXT,
  harvest_end_month TEXT,
  notes TEXT
);

CREATE TABLE user_gardens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plant_id INTEGER REFERENCES plants(id),
  quantity INTEGER DEFAULT 1,
  planting_date DATE,
  notes TEXT
);

-- Login function
CREATE OR REPLACE FUNCTION login(username TEXT, password TEXT) RETURNS TEXT AS $$
DECLARE
  account users;
  result TEXT;
BEGIN
  SELECT * FROM users WHERE users.username = login.username INTO account;
  IF account IS NULL THEN
    RAISE invalid_password USING message = 'Invalid username or password';
  END IF;
  -- For demo, simple comparison (in production, use proper password verification), 
  -- TODO: Use a secure password hashing algorithm
  IF account.password_hash <> password THEN
    RAISE invalid_password USING message = 'Invalid username or password';
  END IF;
  -- Generate JWT token
  result := sign(
    json_build_object(
      'role', account.role,
      'user_id', account.id,
      'exp', extract(epoch from now())::integer + 60*60 -- 1 hour expiration
    ),
    current_setting('app.jwt_secret'),
    'HS256'
  );

  RETURN result;
END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row-level security policies

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE growing_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_growing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gardens ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_view_self ON users FOR SELECT
  USING (id = (current_setting('request.jwt.claims', true)::json->>'user_id')::integer);

CREATE POLICY users_modify_self ON users FOR UPDATE
  USING (id = (current_setting('request.jwt.claims', true)::json->>'user_id')::integer);

CREATE POLICY admin_view_all_users ON users FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');


CREATE POLICY public_view_plants ON plants FOR SELECT USING (true);
CREATE POLICY public_view_zones ON growing_zones FOR SELECT USING (true);
CREATE POLICY public_view_schedules ON plant_growing_schedules FOR SELECT USING (true);


CREATE POLICY gardens_view_self ON user_gardens FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::integer);

CREATE POLICY gardens_modify_self ON user_gardens FOR ALL
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'user_id')::integer);

GRANT USAGE ON SCHEMA public TO anonymous, authenticated, admin;

GRANT SELECT ON plants, growing_zones, plant_growing_schedules TO anonymous;
GRANT EXECUTE ON FUNCTION login TO anonymous;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_gardens TO authenticated;
GRANT SELECT, UPDATE(username, email, growing_zone_id) ON users TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON plants, growing_zones, plant_growing_schedules TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin;