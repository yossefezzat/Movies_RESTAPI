#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z "$DATABASE_HOST" "$DATABASE_PORT"; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
npm run migration:run:prod

# Start the application
echo "Starting the application..."
exec "$@"