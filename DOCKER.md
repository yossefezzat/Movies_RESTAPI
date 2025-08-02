# Docker Setup for Movies REST API

This document provides instructions for running the Movies REST API using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Services

The application consists of three main services:

### 1. PostgreSQL Database (`postgres`)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: `movies` (automatically created)
- **Credentials**: postgres/admin

### 2. Redis Cache (`redis`)
- **Image**: redis:7-alpine
- **Port**: 6379
- **Purpose**: Caching and session storage

### 3. NestJS Application (`app`)
- **Production**: Built from Dockerfile (production target)
- **Port**: 3000
- **Features**: Auto-migration, health checks

## Quick Start

1. **Clone the repository**
2. **Start the services**:
   ```bash
   docker compose up -d
   ```
3. **Access the application**:
   - API: http://localhost:3000/api
   - Swagger Documentation: http://localhost:3000/api

The database will be automatically initialized with the `movies` database, and migrations will run automatically when the application starts.

## Automated Database Setup

The Docker setup now includes **automatic database initialization**:

- **Database Creation**: PostgreSQL automatically creates the `movies` database on first startup
- **Schema Setup**: Database migrations run automatically when the application starts
- **No Manual Steps**: No need to manually create databases or run migration commands

The initialization process:
1. PostgreSQL starts and runs the initialization script in `init-db/01-create-database.sql`
2. The NestJS application waits for the database to be ready
3. Migrations are automatically executed before the application starts
4. The API becomes available once everything is initialized

## Environment Variables

Environment variables are managed through `.env` files for cleaner configuration:

### Configuration Files
- `.env` - Main environment configuration (used by Docker containers)
- `.env.example` - Template file with all required variables

### Required Variables
All environment variables are defined in the `.env` file and automatically loaded by the Docker containers. The application validates these variables on startup:

- **Database**: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- **Redis**: `REDIS_HOST`, `REDIS_PORT`, `REDIS_TTL_MS`, `REDIS_PASSWORD`
- **JWT**: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TOKEN_EXPIRATION`, `JWT_REFRESH_TOKEN_EXPIRATION`
- **TMDB API**: `TMDB_API_URL`, `TMDB_API_KEY`, `TMDB_MAX_PAGES`
- **Application**: `PORT`, `NODE_ENV`, `BCRYPT_SALT_ROUNDS`

### Customization
To customize the configuration:
1. Copy `.env.example` to `.env` (if not already present)
2. Modify the values in `.env` as needed
3. Restart the Docker containers

## Useful Commands

### Building and Running

```bash
# Build images without cache
docker-compose build --no-cache

# Start specific service
docker-compose up postgres redis

# Start in background
docker-compose up -d

# Start with specific profile
docker-compose --profile dev up -d
```

### Monitoring and Debugging

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app

# Check service status
docker-compose ps

# Execute commands in running container
docker-compose exec app sh

# Run database migrations
docker-compose exec app npm run migration:run
```

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d movies

# Run migrations
docker-compose exec app npm run migration:run

# Generate migration
docker-compose exec app npm run migration:generate -- src/database/migrations/MigrationName

# Revert migration
docker-compose exec app npm run migration:revert
```

### Redis Operations

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check Redis keys
docker-compose exec redis redis-cli KEYS "*"

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## File Structure

```
.
├── Dockerfile                 # Multi-stage Dockerfile for the app
├── docker-compose.yml         # Main compose file
├── docker-compose.override.yml # Development overrides
├── .dockerignore              # Files to ignore in Docker build
└── DOCKER.md                  # This documentation
```

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready -U postgres`
- **Redis**: `redis-cli ping`
- **App**: HTTP health check on `/health` endpoint

## Volumes

- `postgres_data`: Persistent PostgreSQL data
- `redis_data`: Persistent Redis data

## Networks

- `movies-network`: Bridge network for service communication

## Ports

- **3000**: NestJS application (production)
- **3001**: NestJS application (development profile)
- **5432**: PostgreSQL database
- **6379**: Redis cache
- **9229**: Node.js debug port (development)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5432, and 6379 are not in use
2. **Permission issues**: On Linux/macOS, you might need to adjust file permissions
3. **Memory issues**: Ensure Docker has sufficient memory allocated (at least 4GB recommended)

### Debugging

```bash
# Check container logs
docker-compose logs app

# Check container resource usage
docker stats

# Inspect container
docker-compose exec app sh

# Check network connectivity
docker-compose exec app ping postgres
docker-compose exec app ping redis
```

## Security Notes

- Change default passwords in production
- Use environment-specific configuration files
- Consider using Docker secrets for sensitive data
- Regularly update base images for security patches

## Performance Optimization

- Use multi-stage builds to reduce image size
- Leverage Docker layer caching
- Use `.dockerignore` to exclude unnecessary files
- Consider using Alpine Linux images for smaller footprint