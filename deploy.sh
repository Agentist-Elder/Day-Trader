#!/bin/bash

# Neural Trading System - Deployment Script
# Deploys the application using Docker Compose

set -e  # Exit on error

echo "🚀 Neural Trading System - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo "Please review and update .env with your configuration"
    echo ""
fi

# Parse command line arguments
MODE=${1:-prod}  # Default to production mode

case $MODE in
    prod|production)
        echo "📦 Building production image..."
        docker-compose build --no-cache

        echo ""
        echo "🧪 Running tests in container..."
        docker-compose run --rm neural-trading npm test

        echo ""
        echo "🚀 Starting services..."
        docker-compose up -d

        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Services:"
        docker-compose ps

        echo ""
        echo "📊 Dashboard: http://localhost:3000"
        echo "❤️  Health Check: http://localhost:3000/health"
        echo ""
        echo "To view logs: docker-compose logs -f"
        echo "To stop: docker-compose down"
        ;;

    dev|development)
        echo "🔧 Starting in development mode..."
        docker-compose up
        ;;

    test)
        echo "🧪 Running tests..."
        docker-compose build
        docker-compose run --rm neural-trading npm test
        echo -e "${GREEN}✅ Tests complete${NC}"
        ;;

    down|stop)
        echo "🛑 Stopping services..."
        docker-compose down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;

    logs)
        echo "📋 Showing logs..."
        docker-compose logs -f
        ;;

    restart)
        echo "🔄 Restarting services..."
        docker-compose restart
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;

    status)
        echo "📊 Service status:"
        docker-compose ps
        echo ""
        echo "📈 Container stats:"
        docker stats --no-stream neural-trading-app
        ;;

    clean)
        echo "🧹 Cleaning up..."
        docker-compose down -v
        docker image prune -f
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;

    *)
        echo "Usage: $0 {prod|dev|test|down|logs|restart|status|clean}"
        echo ""
        echo "Commands:"
        echo "  prod       - Build and deploy in production mode"
        echo "  dev        - Start in development mode (foreground)"
        echo "  test       - Run tests in container"
        echo "  down       - Stop all services"
        echo "  logs       - Show logs (follow mode)"
        echo "  restart    - Restart services"
        echo "  status     - Show service status"
        echo "  clean      - Clean up containers and images"
        exit 1
        ;;
esac
