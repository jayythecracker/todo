# 🚀 Redis Cloud Free Setup Guide

## Step 1: Create Free Account
1. Go to [redis.com/try-free](https://redis.com/try-free)
2. Sign up with email
3. Verify email address

## Step 2: Create Database
1. Click "New Database"
2. Choose "Redis Stack" (free)
3. Select cloud provider (AWS recommended)
4. Choose region closest to your users
5. Name your database (e.g., "todo-app-cache")

## Step 3: Get Connection Details
1. Go to "Databases" tab
2. Click on your database
3. Copy the connection string
4. It looks like: `redis://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345`

## Step 4: Update Environment Variables
```bash
# Add to your .env file
REDIS_URL=redis://default:your-password@your-host:your-port

# For production deployment (Vercel, Netlify, etc.)
# Add the same REDIS_URL to your deployment environment variables
```

## Step 5: Test Connection
```bash
npm run test:redis
```

## Free Tier Limits
- ✅ 30MB storage (10,000+ user sessions)
- ✅ 30 concurrent connections
- ✅ 99.9% uptime SLA
- ✅ SSL/TLS encryption
- ✅ Monitoring dashboard
- ✅ No credit card required

## When to Upgrade
- **100+ concurrent users**: Upgrade to $5/month (100MB)
- **1000+ concurrent users**: Upgrade to $15/month (1GB)
- **Need clustering**: Upgrade to $50/month (5GB)

## Alternative: Upstash (Serverless)
1. Go to [upstash.com](https://upstash.com)
2. Create free account
3. Create Redis database
4. Copy connection string
5. 10,000 requests/day free

## Production Checklist
- [ ] Enable SSL/TLS
- [ ] Set up monitoring alerts
- [ ] Configure backup (paid plans)
- [ ] Set up multiple regions (paid plans)
- [ ] Monitor memory usage
- [ ] Set up proper TTL values
