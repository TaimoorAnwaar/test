# Video Call Frontend

A Next.js frontend application for video calls with integrated chat functionality using Agora SDK and Sendbird.

## Features

- **Video Calls**: High-quality video calls using Agora SDK
- **Real-time Chat**: Integrated chat system with Sendbird
- **Responsive Design**: Works on desktop and mobile devices
- **User Management**: Doctor and patient interfaces
- **Modern UI**: Clean, professional interface

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Video**: Agora SDK
- **Chat**: Sendbird
- **State Management**: React Hooks

## Project Structure

```
src/
├── app/              # Next.js app router
│   ├── call/         # Video call pages
│   ├── lobby/        # Pre-call lobby
│   ├── doctor/       # Doctor-specific routes
│   ├── patient/      # Patient-specific routes
│   └── test-env/     # Environment testing
├── components/       # React components
│   └── ChatPanel.tsx # Chat interface
├── services/         # External service integrations
│   └── sendbirdService.ts # Sendbird chat service
└── utils/            # Utility functions
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.local.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Sendbird Chat
NEXT_PUBLIC_SENDBIRD_APP_ID=your_sendbird_app_id

# Agora Video (if needed)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Available Routes

- **`/`** - Home page with room creation
- **`/lobby/[room]`** - Pre-call lobby
- **`/call/[room]`** - Video call interface
- **`/doctor/[room]`** - Doctor call redirect
- **`/patient/[room]`** - Patient call redirect
- **`/test-env`** - Environment testing page

## Video Call Features

- **Camera/Microphone Controls**: Toggle video and audio
- **Chat Integration**: Real-time messaging during calls
- **Responsive Layout**: Adapts to different screen sizes
- **Connection Status**: Real-time connection monitoring
- **Call Duration**: Timer display
- **End Call**: Safe call termination

## Chat Features

- **Real-time Messaging**: Instant message delivery
- **User Identification**: Shows doctor/patient status
- **Message History**: Persistent chat records
- **Mobile Optimized**: Touch-friendly interface
- **Professional UI**: Google Meet-style design

## Development

- **Build**: `npm run build`
- **Start**: `npm start`
- **Lint**: `npm run lint`
- **Type Check**: `npm run type-check`

## Customization

### Styling
- Uses Tailwind CSS for styling
- Custom CSS variables for theming
- Responsive design patterns

### Components
- Modular component architecture
- Reusable UI components
- TypeScript interfaces

### Chat Integration
- Sendbird service layer
- Real-time event handling
- Message persistence

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: iOS Safari, Android Chrome

## Troubleshooting

### Common Issues

1. **Chat not working**
   - Check Sendbird App ID in environment
   - Verify network connectivity
   - Check browser console for errors

2. **Video call issues**
   - Ensure camera/microphone permissions
   - Check Agora configuration
   - Verify backend connectivity

3. **Build errors**
   - Clear `.next` directory
   - Reinstall dependencies
   - Check TypeScript errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
