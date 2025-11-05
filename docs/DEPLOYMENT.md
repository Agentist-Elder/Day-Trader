# Neural Trading System - Deployment Guide

## Overview
This guide covers deploying the Neural Trading System in various environments, from local development to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

## Prerequisites

### System Requirements
- **CPU:** 2+ cores recommended
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 2GB for application + data
- **OS:** Linux, macOS, or Windows with WSL2

### Software Requirements
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Docker:** v20.10.0 or higher (for containerized deployment)
- **Docker Compose:** v2.0.0 or higher (for containerized deployment)

### Verify Installation
```bash
node --version  # Should be v18.0.0+
npm --version   # Should be v9.0.0+
docker --version  # Should be v20.10.0+
docker-compose --version  # Should be v2.0.0+
```

## Quick Start

### Local Development

1. **Clone the repository:**
```bash
git clone <repository-url>
cd neural-trading
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run tests:**
```bash
npm test
```

4. **Start the server:**
```bash
node src/start-server.js
```

5. **Access the dashboard:**
Open your browser to `http://localhost:3000`

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Create environment configuration:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Deploy the application:**
```bash
./deploy.sh prod
```

This will:
- Build the Docker image
- Run all tests inside the container
- Start the services
- Display service status

3. **Verify deployment:**
```bash
# Check service status
./deploy.sh status

# View logs
./deploy.sh logs

# Check health endpoint
curl http://localhost:3000/health
```

### Manual Docker Deployment

1. **Build the image:**
```bash
docker build -t neural-trading:latest .
```

2. **Run the container:**
```bash
docker run -d \
  --name neural-trading \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  neural-trading:latest
```

3. **Check container logs:**
```bash
docker logs -f neural-trading
```

### Deployment Script Commands

The `deploy.sh` script provides several commands:

```bash
./deploy.sh prod      # Deploy in production mode
./deploy.sh dev       # Start in development mode
./deploy.sh test      # Run tests in container
./deploy.sh down      # Stop all services
./deploy.sh logs      # Show logs (follow mode)
./deploy.sh restart   # Restart services
./deploy.sh status    # Show service status
./deploy.sh clean     # Clean up containers and images
```

## Production Deployment

### Environment Configuration

1. **Copy and configure environment file:**
```bash
cp .env.example .env
```

2. **Edit `.env` with production values:**
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Trading Configuration
INITIAL_CAPITAL=100000
PAPER_TRADING_MODE=true  # Set to false for live trading

# Risk Management (adjust based on your risk tolerance)
MAX_RISK_PER_TRADE=0.01          # 1% max risk per trade
MAX_PORTFOLIO_DRAWDOWN=0.10      # 10% max portfolio drawdown
MAX_POSITION_SIZE=0.20           # 20% max position size

# Strategy Configuration
MOMENTUM_LOOKBACK_PERIOD=10
MOMENTUM_THRESHOLD=0.02
MEAN_REVERSION_LOOKBACK_PERIOD=20
MEAN_REVERSION_STD_DEV_MULTIPLIER=2
```

### Production Checklist

- [ ] Review and update `.env` configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configure appropriate risk limits
- [ ] Set up monitoring (see Monitoring section)
- [ ] Configure backups for data directory
- [ ] Set up log rotation
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Test health check endpoint
- [ ] Review security settings

### Using Docker Compose in Production

1. **Prepare production configuration:**
```bash
cp .env.example .env
# Edit .env with production values
```

2. **Deploy:**
```bash
./deploy.sh prod
```

3. **Verify deployment:**
```bash
# Check all services are running
docker-compose ps

# Check health
curl http://localhost:3000/health

# Monitor logs
docker-compose logs -f neural-trading
```

### Scaling Considerations

For high-load environments:

1. **Horizontal Scaling:**
```yaml
# docker-compose.yml
services:
  neural-trading:
    deploy:
      replicas: 3  # Run 3 instances
```

2. **Load Balancing:**
Use Nginx or HAProxy to distribute traffic:
```nginx
upstream neural_trading {
    server neural-trading-1:3000;
    server neural-trading-2:3000;
    server neural-trading-3:3000;
}
```

3. **Resource Limits:**
```yaml
# docker-compose.yml
services:
  neural-trading:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Configuration

### Application Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `INITIAL_CAPITAL` | `100000` | Starting capital |
| `PAPER_TRADING_MODE` | `true` | Enable paper trading |

### Risk Management Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_RISK_PER_TRADE` | `0.01` | Maximum 1% risk per trade |
| `MAX_PORTFOLIO_DRAWDOWN` | `0.10` | Maximum 10% portfolio drawdown |
| `MAX_POSITION_SIZE` | `0.20` | Maximum 20% position size |

### Strategy Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MOMENTUM_LOOKBACK_PERIOD` | `10` | Days for momentum calculation |
| `MOMENTUM_THRESHOLD` | `0.02` | 2% momentum threshold |
| `MEAN_REVERSION_LOOKBACK_PERIOD` | `20` | Days for mean calculation |
| `MEAN_REVERSION_STD_DEV_MULTIPLIER` | `2` | Standard deviations for signals |

## Monitoring & Health Checks

### Health Check Endpoint

The application exposes a health check endpoint:

```bash
GET /health
```

**Response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-05T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "45MB",
    "total": "2GB"
  }
}
```

### Docker Health Checks

Health checks are automatically configured in Docker:
- **Interval:** 30 seconds
- **Timeout:** 3 seconds
- **Retries:** 3
- **Start Period:** 5 seconds

Check container health:
```bash
docker inspect --format='{{.State.Health.Status}}' neural-trading-app
```

### Application Metrics

Access various metrics endpoints:

```bash
# Portfolio status
curl http://localhost:3000/api/portfolio

# Risk metrics
curl http://localhost:3000/api/metrics

# Trade history
curl http://localhost:3000/api/history
```

### Monitoring Stack (Optional)

Uncomment the monitoring services in `docker-compose.yml`:

```bash
# Enable Prometheus and Grafana
docker-compose up -d prometheus grafana
```

Access monitoring:
- **Prometheus:** `http://localhost:9090`
- **Grafana:** `http://localhost:3001` (default password in .env)

### Log Management

**View logs:**
```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f neural-trading-app

# Follow specific number of lines
docker-compose logs -f --tail=100
```

**Log rotation** (configure in docker-compose.yml):
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Troubleshooting

### Common Issues

#### 1. Container won't start

**Check logs:**
```bash
docker-compose logs neural-trading
```

**Common causes:**
- Port 3000 already in use
- Invalid environment variables
- Insufficient system resources

**Solution:**
```bash
# Check port usage
lsof -i :3000

# Stop conflicting service
./deploy.sh down

# Restart with different port
PORT=3001 docker-compose up -d
```

#### 2. Health check failing

**Manual health check:**
```bash
curl -v http://localhost:3000/health
```

**Check container status:**
```bash
docker-compose ps
docker inspect neural-trading-app
```

**Solution:**
```bash
# Restart container
./deploy.sh restart

# Check logs for errors
./deploy.sh logs
```

#### 3. Tests failing in container

**Run tests with verbose output:**
```bash
docker-compose run --rm neural-trading npm test -- --verbose
```

**Common causes:**
- Dependency issues
- Insufficient memory
- Network connectivity issues

**Solution:**
```bash
# Rebuild without cache
docker-compose build --no-cache

# Increase memory limit
docker-compose down
docker-compose up -d --scale neural-trading=1
```

#### 4. Performance issues

**Check resource usage:**
```bash
docker stats neural-trading-app
```

**Check system metrics:**
```bash
curl http://localhost:3000/api/metrics
```

**Solution:**
- Increase container resources in docker-compose.yml
- Optimize strategy parameters
- Reduce concurrent analyses

### Debug Mode

Enable debug logging:

```bash
# In .env
LOG_LEVEL=debug
ENABLE_DEBUG_LOGGING=true

# Restart
./deploy.sh restart
```

### Getting Help

1. Check logs: `./deploy.sh logs`
2. Check health: `curl http://localhost:3000/health`
3. Review documentation: `/docs` directory
4. Run tests: `npm test`

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong passwords for any credentials
- Rotate API keys regularly
- Use secrets management in production (e.g., Kubernetes Secrets, AWS Secrets Manager)

### 2. Network Security
- Use HTTPS in production (configure reverse proxy)
- Configure firewall rules
- Limit exposed ports
- Use private networks for internal services

### 3. Container Security
- Run containers as non-root user (already configured)
- Keep base images updated
- Scan images for vulnerabilities
- Use minimal base images (Alpine Linux)

### 4. Access Control
- Implement authentication if exposing publicly
- Use API keys for external access
- Configure CORS properly
- Implement rate limiting

### 5. Data Protection
- Backup data directory regularly
- Encrypt sensitive data at rest
- Use secure connections for data transfer
- Implement audit logging

### Example: Setting up HTTPS with Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name trading.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Maintenance

### Backup Strategy

**Automated backups:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz data/ logs/
```

**Restore from backup:**
```bash
tar -xzf backup_20250105_120000.tar.gz
```

### Updates and Upgrades

**Update application:**
```bash
# Pull latest code
git pull

# Rebuild and restart
./deploy.sh down
./deploy.sh prod
```

**Update dependencies:**
```bash
npm update
npm audit fix
```

### Monitoring Checklist

Daily:
- [ ] Check health endpoint
- [ ] Review error logs
- [ ] Monitor resource usage

Weekly:
- [ ] Review trade history
- [ ] Check risk metrics
- [ ] Review strategy performance
- [ ] Check for updates

Monthly:
- [ ] Backup data
- [ ] Review security settings
- [ ] Update dependencies
- [ ] Performance optimization

## Support

For issues and questions:
1. Check this documentation
2. Review logs: `./deploy.sh logs`
3. Run diagnostics: `./deploy.sh status`
4. Check GitHub issues

---

*Last Updated: 2025-11-05*
*Version: 0.1.0*
