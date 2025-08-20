# Video Call Backend

A NestJS backend application for handling video calls using Agora SDK and chat functionality with Sendbird.

## Features

- **Video Calls**: Agora SDK integration for high-quality video calls
- **Chat System**: Sendbird integration for real-time messaging
- **User Management**: Doctor and patient user types
- **Appointment System**: Scheduling and management
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Video**: Agora SDK
- **Chat**: Sendbird
- **Language**: TypeScript

## Project Structure

```
src/
├── agora/           # Video call functionality
├── prisma/          # Database operations
├── storage/         # File storage service
├── app.module.ts    # Main application module
├── app.controller.ts # Main controller
├── app.service.ts   # Main service
└── main.ts          # Application entry point
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run seed
   ```

4. **Start development server:**
   ```bash
   npm run start:dev
   ```

## API Documentation

### Video Call Endpoints

- `POST /agora/token` - Generate Agora token
- `POST /agora/mark-no-show` - Mark appointment as no-show

### Database Models

- **User**: Doctors and patients
- **Appointment**: Scheduled appointments
- **AppointmentStatus**: Status tracking
- **DoctorPractice**: Practice information
- **AppointmentSystem**: System configuration
- **WorkingDay**: Working hours
- **AppointmentSlot**: Available time slots

## Development

- **Build**: `npm run build`
- **Test**: `npm run test`
- **E2E Test**: `npm run test:e2e`
- **Lint**: `npm run lint`

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `AGORA_APP_ID`: Agora application ID
- `AGORA_APP_SECRET`: Agora application secret
- `JWT_SECRET`: JWT signing secret

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
