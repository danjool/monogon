CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(32) UNIQUE NOT NULL,
  password VARCHAR(32) NOT NULL,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 2000,
  position_z FLOAT DEFAULT 0,
  rotation_x FLOAT DEFAULT 0,
  rotation_y FLOAT DEFAULT 0, 
  rotation_z FLOAT DEFAULT 0,
  color VARCHAR(16) DEFAULT '0xffffff'
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  text VARCHAR(200) NOT NULL,
  poster VARCHAR(32) REFERENCES users(name),
  position_x FLOAT,
  position_y FLOAT,
  position_z FLOAT,
  color VARCHAR(16),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);