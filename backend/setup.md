# Backend Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   - Copy `env.example` to `.env`
   - Update database connection string
   - Set your Agora App ID and Secret

3. **Database Setup:**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database
   npm run seed
   ```

4. **Start Development Server:**
   ```bash
   npm run start:dev
   ```

## Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run start:dev` - Start development server with hot reload
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

## API Endpoints

- `POST /agora/token` - Generate Agora token for video calls
- `POST /agora/mark-no-show` - Mark appointment as no-show

## Database Schema

The application uses Prisma with the following main models:
- User (doctors and patients)
- Appointment
- AppointmentStatus
- DoctorPractice
- AppointmentSystem
- WorkingDay
- AppointmentSlot

## Testing

Run the test suite:
```bash
npm run test
npm run test:e2e
```
