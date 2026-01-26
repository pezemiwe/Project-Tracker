#!/bin/bash
set -e

# Deployment script for Donor Oversight System
# Usage: ./deploy.sh [environment]
# environment: dev|prod (default: prod)

ENVIRONMENT=${1:-prod}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "==================================="
echo "Donor Oversight System Deployment"
echo "Environment: $ENVIRONMENT"
echo "==================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with the required environment variables."
    echo "You can use .env.example as a template."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

# Pull latest changes (if in production)
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "📥 Pulling latest changes from Git..."
    git pull
    echo "✓ Git pull complete"
    echo ""
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down
echo "✓ Containers stopped"
echo ""

# Build Docker images
echo "🏗️  Building Docker images..."
docker-compose -f $COMPOSE_FILE build --no-cache
echo "✓ Docker images built"
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose -f $COMPOSE_FILE up -d
echo "✓ Services started"
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose -f $COMPOSE_FILE exec -T backend pnpm exec prisma migrate deploy
echo "✓ Migrations complete"
echo ""

# Seed database (only in dev)
if [ "$ENVIRONMENT" = "dev" ]; then
    echo "🌱 Seeding database..."
    docker-compose -f $COMPOSE_FILE exec -T backend pnpm run db:seed
    echo "✓ Database seeded"
    echo ""
fi

# Health check
echo "🏥 Performing health check..."
sleep 5

if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "⚠️  Warning: Backend health check failed"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✓ Frontend is healthy"
else
    echo "⚠️  Warning: Frontend health check failed"
fi

echo ""
echo "==================================="
echo "Deployment Complete!"
echo "==================================="
echo ""
echo "Services are running:"
docker-compose -f $COMPOSE_FILE ps
echo ""

if [ "$ENVIRONMENT" = "prod" ]; then
    echo "🌐 Application URL: https://donor-oversight.example.com"
else
    echo "🌐 Application URL: http://localhost"
fi

echo ""
echo "📊 View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "🛑 Stop services: docker-compose -f $COMPOSE_FILE down"
echo ""
