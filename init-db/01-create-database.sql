-- Create the movies database if it doesn't exist
SELECT 'CREATE DATABASE movies'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'movies')\gexec

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE movies TO postgres;