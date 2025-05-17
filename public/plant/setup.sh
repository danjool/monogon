#!/bin/bash

echo "🌱 PlantTracker: A Gardening App with PostgREST using Podman"
echo "🦭 Verifying Podman CLI is installed"
if ! command -v podman &> /dev/null
then
    echo "❌ Podman could not be found. Please install Podman CLI: https://podman.io/"
    exit
fi

echo "🧼 Clean up any existing containers"
podman stop pg api web && sleep 2
podman rm pg api web -f && sleep 2
podman network rm pgnet && sleep 2

echo "🌐 Creating dedicated podman network"
podman network create pgnet

echo "🐘 Starting PostgreSQL Container"
podman run --detach --name pg --network pgnet --env POSTGRES_PASSWORD=pass postgres:alpine
echo "💤 Waiting for database..." && sleep 7

echo "🧮 Creating tables and inserting sample data"
podman exec -i pg psql -U postgres < "schema.sql"
podman exec -i pg psql -U postgres < "mock_data.sql"

# Set JWT secret for auth, TODO: do not hard code jwt secret, poc stuff
podman exec pg psql -U postgres -c "ALTER DATABASE postgres SET app.jwt_secret TO 'plant_tracker_secret_key_for_jwt_tokens';"

echo "🛰 Starting PostgREST API Container"
podman run -d --name api --network pgnet -p 3000:3000 \
  -e PGRST_DB_URI=postgres://postgres:pass@pg/postgres \
  -e PGRST_DB_SCHEMA=public \
  -e PGRST_DB_ANON_ROLE=anonymous \
  -e PGRST_JWT_SECRET=plant_tracker_secret_key_for_jwt_tokens \
  -e PGRST_DB_POOL="10" \
  -e PGRST_MAX_ROWS="20" \
  -e PGRST_DB_PLAN_ENABLED="true" \
  -e PGRST_SERVER_CORS_ALLOWED_ORIGINS="*" \
  -e PGRST_SERVER_CORS_ALLOWED_METHODS="GET,POST,PUT,PATCH,DELETE,OPTIONS" \
  -e PGRST_SERVER_CORS_MAX_AGE="1728000" \
  postgrest/postgrest

echo "🌎 Starting web server for the frontend"

current_dir=$(pwd)
echo "Current directory: $current_dir"
windows_path=$(cygpath -w "$current_dir")
echo "Windows path: $windows_path"

podman run -d --name web --network pgnet -p 8080:80 \
  --volume "$windows_path\\web:/usr/share/nginx/html" \
  --volume "$windows_path/nginx.conf:/etc/nginx/nginx.conf" \
  nginx:alpine

echo "📡 Testing API endpoint"

response=$(curl -s http://localhost:3000/plants)

if [ -z "$response" ]; then
  echo "❌ The response was empty. Check if the API is running correctly."
else
  echo "🎯 Data found!"
fi

echo "
✅ PlantTracker is up and running!
🔗 Access points:
- Web Interface: http://localhost:8080
- API Endpoint: http://localhost:3000
💻 To stop all containers:
podman stop pg api web && podman rm pg api web && podman network rm pgnet
"