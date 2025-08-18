# 🏥 Video Call System

A comprehensive video call system built with React Native/Next.js frontend and NestJS backend, featuring separate doctor and patient rooms, lobby system, and appointment-based video calls.

## ✨ Features

- **Separate Doctor & Patient Rooms**: Each appointment gets dedicated rooms for doctors and patients
- **Lobby System**: Users can test their camera and microphone before joining the call
- **Appointment Integration**: Rooms are linked to specific appointments in the database
- **Scheduled Meetings**: Support for scheduled start times and durations
- **Real-time Video Calls**: Powered by Agora.io for high-quality video communication
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
Frontend (Next.js)          Backend (NestJS)           Database (MySQL)
     │                           │                           │
     ├── /lobby/[room] ────────►│                           │
     ├── /call/[room] ─────────►│                           │
     └── /doctor|patient/[room]─┤                           │
                                 ├── Agora Service           │
                                 ├── Room Management        │
                                 └── Prisma ORM ───────────►│
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL database
- Agora.io account and credentials

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
```

Edit `.env` file:
```env
DATABASE_URL="mysql://username:password@localhost:3306/video_call_db"
AGORA_APP_ID="your_agora_app_id"
AGORA_APP_CERTIFICATE="your_agora_app_certificate"
FRONTEND_BASE_URL="http://localhost:3001"
```

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with test data
npm run seed:test

# Start the backend
npm run start:dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

```bash
# Start the frontend
npm run dev
```

## 📱 Usage

### 1. Create Appointment Rooms

1. Visit the homepage at `http://localhost:3001`
2. Enter an appointment ID
3. Optionally set start time and duration
4. Click "Create Rooms"
5. The system will generate separate links for doctor and patient

### 2. Join Lobby

- **Doctors**: Click the doctor room link → redirected to lobby
- **Patients**: Click the patient room link → redirected to lobby
- In the lobby, users can:
  - Test camera and microphone
  - See meeting countdown (if scheduled)
  - Wait for the meeting to start

### 3. Join Video Call

- Once in the lobby, click "Join Meeting" when ready
- Users are redirected to the video call interface
- Full video call features including:
  - Camera on/off
  - Microphone mute/unmute
  - Screen sharing
  - Leave call

## 🔧 API Endpoints

### Create Appointment Rooms
```http
POST /agora/create-appointment-rooms
{
  "appointmentId": 123,
  "startTime": "2024-01-15T10:00:00Z",
  "durationMinutes": 60
}
```

### Create Single Room
```http
POST /agora/create-room
{
  "usertype": "doctor",
  "appointmentId": 123,
  "startTime": "2024-01-15T10:00:00Z",
  "durationMinutes": 60
}
```

### Get Room Schedule
```http
GET /agora/schedule?channel=roomId
```

### Get Agora Token
```http
GET /agora/token?channel=roomId&uid=userId
```

### Get Rooms by Appointment
```http
GET /agora/rooms-by-appointment?appointmentId=123
```

### Get Room Status
```http
GET /agora/room-status?roomId=roomId
```

## 🗄️ Database Schema

### Room Table
```sql
CREATE TABLE Room (
  roomId VARCHAR(255) PRIMARY KEY,
  startTimeMs BIGINT NOT NULL,
  endTimeMs BIGINT NOT NULL,
  link VARCHAR(512) NOT NULL,
  createdAt BIGINT NOT NULL,
  appointmentId BIGINT,
  userTypeId INT NOT NULL,
  FOREIGN KEY (appointmentId) REFERENCES Appointment(id),
  FOREIGN KEY (userTypeId) REFERENCES UserType(id)
);
```

### UserType Table
```sql
CREATE TABLE UserType (
  id INT PRIMARY KEY,
  typeName VARCHAR(100) UNIQUE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME,
  deletedAt DATETIME
);
```

### Appointment Table
```sql
CREATE TABLE Appointment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  status INT DEFAULT 0,
  fee INT,
  paymentStatus INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME,
  deletedAt DATETIME
);
```

## 🧪 Testing

### Test Data
The system includes pre-created test rooms:
- **Doctor Test Room**: `/lobby/test-doctor-room`
- **Patient Test Room**: `/lobby/test-patient-room`

### Manual Testing
1. Create appointment rooms via the homepage form
2. Test both doctor and patient flows
3. Verify lobby functionality (camera/mic preview)
4. Test video call joining and features

## 🔒 Security Features

- **Time-based Access**: Users can only join during scheduled meeting times
- **User Type Validation**: Doctors and patients are restricted to their respective rooms
- **Token Expiration**: Agora tokens expire based on meeting schedule
- **Appointment Linking**: Rooms are tied to specific appointments

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check DATABASE_URL in .env
   - Run `npx prisma generate`

2. **Agora Token Error**
   - Verify AGORA_APP_ID and AGORA_APP_CERTIFICATE
   - Check Agora project settings
   - Ensure backend is running

3. **Camera/Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS or localhost
   - Try refreshing the page

4. **Rooms Not Creating**
   - Check backend logs
   - Verify database schema
   - Check appointment ID exists

### Debug Mode
```bash
# Backend debug
npm run start:debug

# Frontend debug
# Check browser console for errors
```

## 📚 Dependencies

### Backend
- NestJS framework
- Prisma ORM
- Agora.io SDK
- MySQL database

### Frontend
- Next.js 14
- Agora RTC SDK
- React hooks
- Styled JSX

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Open an issue on GitHub

---

**Note**: This system is designed for healthcare applications. Ensure compliance with HIPAA and other relevant regulations when deploying to production.
