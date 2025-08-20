# Sendbird Chat Setup Guide

This guide will help you set up Sendbird chat functionality in your video call application.

## Prerequisites

- Sendbird account (free tier available)
- Next.js application
- Environment variables configured

## Step 1: Create Sendbird Application

1. **Go to [Sendbird Dashboard](https://dashboard.sendbird.com)**
2. **Sign up or log in** to your account
3. **Create a new application** or select an existing one
4. **Copy your Application ID** from the dashboard

## Step 2: Configure Environment Variables

1. **Create `.env.local` file** in your frontend directory:
   ```bash
   # Frontend/.env.local
   NEXT_PUBLIC_SENDBIRD_APP_ID=YOUR_APP_ID_HERE
   ```

2. **Replace `YOUR_APP_ID_HERE`** with your actual Sendbird App ID

## Step 3: Test Configuration

1. **Visit `/test-env`** in your application to verify the setup
2. **Check browser console** for connection logs
3. **Verify Sendbird dashboard** shows active connections

## Step 4: Chat Integration

The chat functionality is already integrated into your video call interface:

- **Chat button**: Purple speech bubble in video call controls
- **Chat panel**: Slides in from the right when clicked
- **Real-time messaging**: Instant message delivery
- **User identification**: Shows doctor/patient status

## Troubleshooting

### Common Issues

1. **"App ID not found" error**
   - Check `.env.local` file exists
   - Verify App ID is correct
   - Restart development server

2. **Chat not connecting**
   - Check browser console for errors
   - Verify Sendbird App ID is valid
   - Check network connectivity

3. **Messages not sending**
   - Ensure user is connected to chat
   - Check Sendbird dashboard for errors
   - Verify user authentication

### Debug Steps

1. **Check environment variables:**
   ```bash
   # In your browser console
   console.log(process.env.NEXT_PUBLIC_SENDBIRD_APP_ID)
   ```

2. **Monitor network requests:**
   - Open browser DevTools
   - Check Network tab for Sendbird API calls

3. **Verify Sendbird dashboard:**
   - Check application status
   - Monitor user connections
   - Review error logs

## Advanced Configuration

### Custom Chat Features

You can extend the chat functionality by:

- **Adding file uploads**
- **Implementing user typing indicators**
- **Adding message reactions**
- **Customizing chat UI**

### Security Considerations

- **App ID is public** (safe to expose in frontend)
- **User authentication** should be implemented separately
- **Rate limiting** is handled by Sendbird
- **Data privacy** follows Sendbird's policies

## Support

- **Sendbird Documentation**: [docs.sendbird.com](https://docs.sendbird.com)
- **Sendbird Support**: Available in dashboard
- **Community Forum**: [community.sendbird.com](https://community.sendbird.com)

## Next Steps

After setup, you can:

1. **Test chat in video calls**
2. **Customize chat appearance**
3. **Add more chat features**
4. **Implement user management**
5. **Add chat analytics**
