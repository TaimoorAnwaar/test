# 🚀 Backend Setup Guide

## Prerequisites
- Node.js 18+ installed
- MySQL database running
- Agora.io account and credentials

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual values
# - DATABASE_URL: Your MySQL connection string
# - AGORA_APP_ID: Your Agora.io App ID
# - AGORA_APP_CERTIFICATE: Your Agora.io App Certificate
# - FRONTEND_BASE_URL: Your frontend URL (default: http://localhost:3001)
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (if any)
npx prisma migrate dev

# Seed the database with test data
npm run seed:test
```

### 4. Start Development Server
```bash
npm run start:dev
```

## Troubleshooting

### Common Issues

1. **Prisma Client Not Generated**
   ```bash
   npx prisma generate
   ```

2. **Database Connection Error**
   - Verify MySQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists

3. **Missing Dependencies**
   ```bash
   npm install
   ```

4. **TypeScript Errors**
   ```bash
   # Clean and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## API Testing

Once running, test the endpoints:

```bash
# Create appointment rooms
curl -X POST http://localhost:3000/agora/create-appointment-rooms \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": 123, "durationMinutes": 60}'

# Get room schedule
curl "http://localhost:3000/agora/schedule?channel=roomId"

# Get Agora token
curl "http://localhost:3000/agora/token?channel=roomId&uid=123"
```

## Development

- **Watch Mode**: `npm run start:dev`
- **Debug Mode**: `npm run start:debug`
- **Build**: `npm run build`
- **Production**: `npm run start:prod`
