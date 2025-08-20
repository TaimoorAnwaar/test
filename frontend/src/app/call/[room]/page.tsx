"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatPanel from '../../../components/ChatPanel';

interface AgoraUser {
  uid: string | number;
  videoTrack?: any;
  audioTrack?: any;
}

interface AgoraTrack {
  play: (element: HTMLElement) => void;
  stop: () => void;
  close: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
}

export default function CallPage() {
  const params = useParams<{ room: string }>();
  const router = useRouter();
  const room = params?.room;
  
  // Refs as source of truth
  const clientRef = useRef<any | null>(null); // Changed to any as AgoraClient interface is removed
  const localAudioTrackRef = useRef<AgoraTrack | null>(null);
  const localVideoTrackRef = useRef<AgoraTrack | null>(null);
  const joinedRef = useRef(false);
  const tokenRenewalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteUsersUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uidRef = useRef<number | null>(null);
  const agoraLibRef = useRef<any | null>(null);
  
  // Video optimization config
  const getCameraConfig = useCallback(() => {
    const profile = (process.env.NEXT_PUBLIC_AGORA_VIDEO_PROFILE || '480p_2').trim();
    return {
      encoderConfig: profile,
      optimizationMode: 'motion' as const,
      facingMode: 'user' as const,
    };
  }, []);
  
  // State for UI only
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<AgoraUser[]>([]);
  const [remoteVideoActive, setRemoteVideoActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [tokenExpiryWarning, setTokenExpiryWarning] = useState(false);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null);
  const [callStartMs] = useState<number>(Date.now());
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isChatVisible, setIsChatVisible] = useState(false);
  
  // DOM refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  
  // Debounce remote users updates to prevent race conditions
  const updateRemoteUsersDebounced = useCallback(() => {
    if (clientRef.current) {
      // Clear any existing timeout
      if (remoteUsersUpdateTimeoutRef.current) {
        clearTimeout(remoteUsersUpdateTimeoutRef.current);
      }
      
      // Use setTimeout to debounce rapid state changes
      remoteUsersUpdateTimeoutRef.current = setTimeout(() => {
        if (clientRef.current) {
          const currentRemoteUsers = [...clientRef.current.remoteUsers];
          setRemoteUsers(currentRemoteUsers);
          
          // Update remoteVideoActive based on whether any user has an active video track
          const hasActiveVideo = currentRemoteUsers.some(user => 
            user.videoTrack && user.videoTrack.isEnabled !== false
          );
          setRemoteVideoActive(hasActiveVideo);
          
          console.log('🔄 Remote users updated:', {
            count: currentRemoteUsers.length,
            hasActiveVideo,
            users: currentRemoteUsers.map(u => ({ uid: u.uid, hasVideo: !!u.videoTrack }))
          });
        }
        remoteUsersUpdateTimeoutRef.current = null;
      }, 100);
    }
  }, []);

  // Validate room parameter
  useEffect(() => {
    if (!room || typeof room !== 'string' || room.trim().length === 0) {
      setError('Invalid room ID');
      router.replace('/');
      return;
    }
  }, [room, router]);

  // Debug: Monitor when tracks are available
  useEffect(() => {
    console.log('🔍 Track state updated:', {
      audioTrack: !!localAudioTrackRef.current,
      videoTrack: !!localVideoTrackRef.current,
      isAudioEnabled,
      isVideoEnabled
    });
  }, [isAudioEnabled, isVideoEnabled]);

  // Debug: Monitor remote users
  useEffect(() => {
    console.log('👥 Remote users updated:', remoteUsers.length, remoteUsers.map(u => u.uid));
  }, [remoteUsers]);

  // Event handlers with proper typing
  const handleUserPublished = useCallback(async (user: AgoraUser, mediaType: 'video' | 'audio') => {
    console.log('👤 User published:', user.uid, mediaType);
    if (!clientRef.current) return;
    // Ignore our own publications to avoid showing self in remote container
    if (uidRef.current != null && String(user.uid) === String(uidRef.current)) {
      console.log('🧍 Ignoring self-published media');
      return;
    }
    
    try {
      // Validate that the user is still in the channel before subscribing
      const isUserInChannel = clientRef.current.remoteUsers.some((remoteUser: AgoraUser) => remoteUser.uid === user.uid);
      console.log('🔍 User validation:', { uid: user.uid, inChannel: isUserInChannel, remoteUsersCount: clientRef.current.remoteUsers.length });
      
      if (!isUserInChannel) {
        console.log('⚠️ User no longer in channel, skipping subscription:', user.uid);
        return;
      }
      
      await clientRef.current.subscribe(user, mediaType);
      
      if (mediaType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
        user.videoTrack?.play(remoteVideoRef.current);
        console.log('✅ Remote video playing');
        setRemoteVideoActive(true);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
        console.log('✅ Remote audio playing');
      }
      // Update remote users list after successful subscription
      updateRemoteUsersDebounced();
    } catch (error: any) {
      // Handle specific Agora errors gracefully
      if (error?.code === 'INVALID_REMOTE_USER') {
        console.log('⚠️ User no longer in channel, subscription skipped:', user.uid);
        return;
      }
      console.error('❌ Error subscribing to user:', error);
    }
  }, []);

  const handleUserUnpublished = useCallback((user: AgoraUser, mediaType: 'video' | 'audio') => {
    console.log('👤 User unpublished:', user.uid, mediaType);
    // Ignore our own unpublish events; only respond to remote users
    if (uidRef.current != null && String(user.uid) === String(uidRef.current)) {
      console.log('🧍 Ignoring self-unpublished media');
      return;
    }
    if (mediaType === 'video') {
      try { (user as any).videoTrack?.stop?.(); } catch {}
      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
      }
      // Don't immediately set remoteVideoActive to false
      // Let updateRemoteUsersDebounced handle the state update
    } else if (mediaType === 'audio') {
      // Do not clear the remote video when only audio is unpublished (muted)
      try { (user as any).audioTrack?.stop?.(); } catch {}
    }
    
    // Update remote users state to reflect the current situation
    updateRemoteUsersDebounced();
  }, [updateRemoteUsersDebounced]);

  const handleUserJoined = useCallback((user: AgoraUser) => {
    console.log('👤 User joined:', user.uid);
    updateRemoteUsersDebounced();
  }, [updateRemoteUsersDebounced]);

  const handleUserLeft = useCallback((user: AgoraUser) => {
    console.log('👤 User left:', user.uid);
    
    // Clear remote video when user leaves
    if (remoteVideoRef.current) {
      remoteVideoRef.current.innerHTML = '';
      console.log('✅ Remote video cleared when user left');
    }
    
    // Only set remoteVideoActive to false if this was the last user
    // The updateRemoteUsersDebounced will handle updating the state properly
    updateRemoteUsersDebounced();
  }, [updateRemoteUsersDebounced]);

  const handleConnectionStateChange = useCallback((curState: string, prevState: string) => {
    console.log('🔗 Connection state changed:', prevState, '->', curState);
    setConnectionState(curState);
    
    if (curState === 'disconnected' || curState === 'failed') {
      setError(`Connection ${curState}. Please check your internet connection.`);
    }
  }, []);

  const handleTokenPrivilegeWillExpire = useCallback(async () => {
    console.log('⚠️ Token will expire soon, renewing...');
    setTokenExpiryWarning(true);
    
    try {
      // Prefer relative URL so Next.js rewrite proxies to backend (works across devices)
      const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim();
      const shouldUseEnvBase = envBase && !/localhost|127\.0\.0\.1/.test(envBase);
      const apiBase = shouldUseEnvBase ? envBase : '';
      const uid = uidRef.current ?? 0;
      const tokenUrl = `${apiBase}/agora/token?channel=${encodeURIComponent(room!)}&uid=${uid}`;
      const response = await fetch(tokenUrl);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const { token } = await response.json();
      if (!token || typeof token !== 'string') throw new Error('Invalid token received');
      
      if (clientRef.current) {
        await clientRef.current.renewToken(token);
        console.log('✅ Token renewed successfully');
        setTokenExpiryWarning(false);
      }
    } catch (error) {
      console.error('❌ Failed to renew token:', error);
      setError('Failed to renew token. Please rejoin the call.');
    }
  }, [room]);

  const handleTokenPrivilegeDidExpire = useCallback(async () => {
    console.log('🚨 Token expired, attempting renewal...');
    setError('Token expired. Attempting to renew...');
    
    try {
      await handleTokenPrivilegeWillExpire();
    } catch (error) {
      console.error('❌ Token renewal failed:', error);
      setError('Token expired and renewal failed. Please rejoin the call.');
    }
  }, [handleTokenPrivilegeWillExpire]);

  // Token renewal scheduling
  const scheduleTokenRenewal = useCallback((expiresIn: number) => {
    if (tokenRenewalTimeoutRef.current) {
      clearTimeout(tokenRenewalTimeoutRef.current);
    }
    
    // Renew 60 seconds before expiry
    const renewalTime = Math.max(expiresIn - 60, 10) * 1000;
    tokenRenewalTimeoutRef.current = setTimeout(() => {
      handleTokenPrivilegeWillExpire();
    }, renewalTime);
  }, [handleTokenPrivilegeWillExpire]);

  // Cleanup function
  const cleanupAgora = useCallback(async () => {
    console.log('🧹 Cleaning up Agora resources...');
    
    // Clear token renewal timeout
    if (tokenRenewalTimeoutRef.current) {
      clearTimeout(tokenRenewalTimeoutRef.current);
      tokenRenewalTimeoutRef.current = null;
    }
    
    // Clear remote users update timeout
    if (remoteUsersUpdateTimeoutRef.current) {
      clearTimeout(remoteUsersUpdateTimeoutRef.current);
      remoteUsersUpdateTimeoutRef.current = null;
    }
    
    if (clientRef.current) {
      // Remove all event listeners
      clientRef.current.off('user-published', handleUserPublished);
      clientRef.current.off('user-unpublished', handleUserUnpublished);
      clientRef.current.off('user-joined', handleUserJoined);
      clientRef.current.off('user-left', handleUserLeft);
      clientRef.current.off('connection-state-change', handleConnectionStateChange);
      clientRef.current.off('token-privilege-will-expire', handleTokenPrivilegeWillExpire);
      clientRef.current.off('token-privilege-did-expire', handleTokenPrivilegeDidExpire);
      
      try {
        // Unpublish tracks before leaving
        const tracksToUnpublish: AgoraTrack[] = [];
        if (localAudioTrackRef.current) tracksToUnpublish.push(localAudioTrackRef.current);
        if (localVideoTrackRef.current) tracksToUnpublish.push(localVideoTrackRef.current);
        
        if (tracksToUnpublish.length > 0) {
          await clientRef.current.unpublish(tracksToUnpublish).catch(() => {});
        }
        
        await clientRef.current.leave();
        console.log('✅ Left Agora channel');
      } catch (error) {
        console.error('❌ Error leaving channel:', error);
      }
      
      clientRef.current = null;
    }
    
    // Stop and close local tracks
    if (localAudioTrackRef.current) {
      try {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        console.log('✅ Audio track cleaned up');
      } catch (error) {
        console.error('❌ Error cleaning up audio track:', error);
      }
      localAudioTrackRef.current = null;
    }
    
    if (localVideoTrackRef.current) {
      try {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        console.log('✅ Video track cleaned up');
      } catch (error) {
        console.error('❌ Error cleaning up video track:', error);
      }
      localVideoTrackRef.current = null;
    }
    
    joinedRef.current = false;
  }, [handleUserPublished, handleUserUnpublished, handleUserJoined, handleUserLeft, handleConnectionStateChange, handleTokenPrivilegeWillExpire, handleTokenPrivilegeDidExpire]);

  useEffect(() => {
    const tick = setInterval(() => setElapsedMs(Date.now() - callStartMs), 1000);
    return () => clearInterval(tick);
  }, [callStartMs]);

  useEffect(() => {
    if (!room) return;

    // Only run on client side
    if (typeof window === 'undefined') return;

    const initAgora = async () => {
      // Guard against double-joins
      if (joinedRef.current) return;
      joinedRef.current = true;
      
      try {
        // Import Agora SDK
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        agoraLibRef.current = AgoraRTC;
        
        // Validate environment
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
        if (!appId) {
          throw new Error('Missing NEXT_PUBLIC_AGORA_APP_ID environment variable.');
        }
        // Prefer relative URL so Next.js rewrite proxies to backend (works across devices)
        const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim();
        const shouldUseEnvBase = envBase && !/localhost|127\.0\.0\.1/.test(envBase);
        const apiUrl = shouldUseEnvBase ? envBase : '';
        
        // Defer requesting permissions until the user explicitly toggles mic/camera on
        
        // Create client and set ref immediately
        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = agoraClient;
        
        console.log('🚀 Starting Agora initialization...');
        console.log('📍 Current room:', room);
        
        // Generate UID and fetch token
        const uid = Math.floor(Math.random() * 1000000);
        uidRef.current = uid;
        const tokenUrl = `${apiUrl}/agora/token?channel=${encodeURIComponent(room)}&uid=${uid}`;
        
        console.log('🔗 Fetching token from:', tokenUrl);
        const response = await fetch(tokenUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }
        
        const { token, expiresIn, appointmentId: apptId, userType: serverUserType } = await response.json();
        
        if (!token || typeof token !== 'string' || token.trim().length === 0) {
          throw new Error('Invalid token received from backend');
        }
        
        // Schedule token renewal if expiry info provided
        if (expiresIn && typeof expiresIn === 'number') {
          scheduleTokenRenewal(expiresIn);
        }
        setAppointmentId(typeof apptId === 'number' ? apptId : null);
        const urlParams = new URLSearchParams(window.location.search);
        const urlType = (urlParams.get('userType') || '').toLowerCase();
        const type: 'doctor' | 'patient' | null = urlType === 'doctor' || urlType === 'patient' ? (urlType as any) : (serverUserType === 'doctor' || serverUserType === 'patient' ? (serverUserType as any) : null);
        setUserType(type);
        
        // Debug logging for userType detection
        console.log('🔍 UserType Detection:', {
          urlType,
          serverUserType,
          finalType: type,
          fullUrl: window.location.href
        });
        
        // Validate required data - Fixed: Only check if it's a non-empty string
        if (!appId || !token) {
          console.error('❌ Missing data:', { appId: !!appId, token: !!token });
          throw new Error('Missing appId or token from backend');
        }
        
        console.log('✅ Received from backend:', { 
          appId, 
          token: token ? 'present' : 'missing',
          tokenLength: token ? token.length : 0,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
        });
        
        // Additional validation - Fixed: Only check if it's a non-empty string
        if (typeof appId !== 'string' || appId.length === 0) {
          throw new Error('Invalid appId format');
        }
        
        if (typeof token !== 'string' || token.length === 0) {
          throw new Error('Invalid token format');
        }
        
        // Initialize Agora client
        // const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }); // This line is now redundant as clientRef.current is set above
        // clientRef.current = agoraClient;   // Set ref immediately
        
        // Test token format
        console.log('🔍 Token validation:', {
          tokenType: typeof token,
          tokenLength: token.length,
          appIdType: typeof appId,
          appIdLength: appId.length,
          roomType: typeof room,
          roomValue: room
        });

        // Defer creating local tracks until user toggles mic/camera
        
        // Fixed: Attach listeners BEFORE joining
        agoraClient.on('user-published', handleUserPublished);
        agoraClient.on('user-unpublished', handleUserUnpublished);
        agoraClient.on('user-joined', handleUserJoined);
        agoraClient.on('user-left', handleUserLeft);
        agoraClient.on('connection-state-change', handleConnectionStateChange);
        agoraClient.on('token-privilege-will-expire', handleTokenPrivilegeWillExpire);
        agoraClient.on('token-privilege-did-expire', handleTokenPrivilegeDidExpire);
        
        // Join channel
        console.log('🚪 Joining channel with:', { appId, room, token: token ? 'present' : 'missing' });
        await agoraClient.join(appId, room, token, uid);
        setConnectionState('connected');
        console.log('✅ Successfully joined channel');
        
        // No publishing here; tracks are created/published on-demand when toggled
        
        // Update and subscribe to any existing remote users (handles second joiner case)
        const existingRemoteUsers: any[] = [...agoraClient.remoteUsers];
        setRemoteUsers(existingRemoteUsers);
        let hadVideo = false;
        for (const remoteUser of existingRemoteUsers) {
          try {
            if (uidRef.current != null && String(remoteUser.uid) === String(uidRef.current)) continue;
            // Attempt to subscribe to both media types if available
            await agoraClient.subscribe(remoteUser, 'audio').catch(() => {});
            await agoraClient.subscribe(remoteUser, 'video').catch(() => {});
            if (remoteUser.videoTrack && remoteVideoRef.current) {
              remoteVideoRef.current.innerHTML = '';
              remoteUser.videoTrack.play(remoteVideoRef.current);
              console.log('✅ Existing remote video playing');
              hadVideo = true;
            }
            if (remoteUser.audioTrack) {
              remoteUser.audioTrack.play();
            }
          } catch (e) {
            console.warn('⚠️ Could not subscribe to existing remote user', remoteUser?.uid, e);
          }
        }
        setRemoteVideoActive(hadVideo);
        
        console.log('🎉 Agora initialization completed successfully!');
        setIsLoading(false);
        
      } catch (error) {
        console.error('💥 Agora initialization failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to initialize video call: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    initAgora();

    return () => {
      cleanupAgora();
    };
  }, [room, handleUserPublished, handleUserUnpublished, handleUserJoined, handleUserLeft, handleConnectionStateChange, handleTokenPrivilegeWillExpire, handleTokenPrivilegeDidExpire, scheduleTokenRenewal, cleanupAgora]);

  const toggleAudio = async () => {
    try {
      if (isAudioEnabled) {
        // Unpublish and fully stop the audio track
        if (clientRef.current && localAudioTrackRef.current) {
          try { await clientRef.current.unpublish([localAudioTrackRef.current]); } catch {}
        }
        try { localAudioTrackRef.current?.stop(); } catch {}
        try { localAudioTrackRef.current?.close(); } catch {}
        localAudioTrackRef.current = null;
        setIsAudioEnabled(false);
        console.log('🎤 Microphone stopped and unpublished');
      } else {
        // Recreate and publish a new audio track
        const AgoraRTC = agoraLibRef.current || (await import('agora-rtc-sdk-ng')).default;
        agoraLibRef.current = AgoraRTC;
        const newAudio = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = newAudio;
        if (clientRef.current) {
          await clientRef.current.publish([newAudio]);
        }
        setIsAudioEnabled(true);
        console.log('🎤 Microphone created and published');
      }
    } catch (error) {
      console.error('💥 Error toggling audio:', error);
      alert('Failed to toggle microphone');
    }
  };

  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        // Unpublish and fully stop the video track
        if (clientRef.current && localVideoTrackRef.current) {
          try { await clientRef.current.unpublish([localVideoTrackRef.current]); } catch {}
        }
        try { localVideoTrackRef.current?.stop(); } catch {}
        try { localVideoTrackRef.current?.close(); } catch {}
        localVideoTrackRef.current = null;
        setIsVideoEnabled(false);
        console.log('📹 Camera stopped and unpublished');
        // Clear the local container
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
        }
      } else {
        // Recreate and publish a new video track
        const AgoraRTC = agoraLibRef.current || (await import('agora-rtc-sdk-ng')).default;
        agoraLibRef.current = AgoraRTC;
        const newVideo = await AgoraRTC.createCameraVideoTrack(getCameraConfig());
        localVideoTrackRef.current = newVideo;
        if (localVideoRef.current) {
          try { localVideoRef.current.classList.add('mirror'); } catch {}
          newVideo.play(localVideoRef.current);
        }
        if (clientRef.current) {
          await clientRef.current.publish([newVideo]);
        }
        setIsVideoEnabled(true);
        console.log('📹 Camera created, playing locally, and published');
      }
    } catch (error) {
      console.error('💥 Error toggling video:', error);
      alert('Failed to toggle camera');
    }
  };

  const leaveCall = useCallback(async () => {
    try {
      await cleanupAgora();
      router.push('/');
    } catch (error) {
      console.error('💥 Error leaving call:', error);
      router.push('/');
    }
  }, [cleanupAgora, router]);

  const leaveNoShow = useCallback(async () => {
    try {
      if (!appointmentId || !userType) return leaveCall();
      const elapsed = Date.now() - callStartMs;
      if (elapsed < 15 * 60 * 1000) return leaveCall();
      const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim();
      const shouldUseEnv = envBase && !/localhost|127\.0\.0\.1/.test(envBase);
      const api = shouldUseEnv ? envBase : '';
      await fetch(`${api}/agora/mark-no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, whoWaited: userType })
      });
    } catch {}
    finally {
      await leaveCall();
    }
  }, [appointmentId, userType, callStartMs, leaveCall]);

  // Error display
  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
          <button onClick={() => router.push('/')} className="home-btn">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!room || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{!room ? 'Loading room...' : 'Joining call...'}</p>
        {connectionState !== 'disconnected' && (
          <p className="connection-status">Status: {connectionState}</p>
        )}
      </div>
    );
  }

  return (
    <div className="call-container">
      {/* Header Section */}
      <header className="call-header">
        {/* Token expiry warning */}
        {tokenExpiryWarning && (
          <div className="token-warning">
            ⚠️ Token expiring soon, renewing...
          </div>
        )}
        
        {/* Connection status */}
        <div className="connection-status-bar">
          Status: {connectionState}
        </div>
      </header>

      {/* Main Video Call Section */}
      <main className={`call-main ${isChatVisible ? 'chat-visible' : ''}`}>
        {/* Video Layout */}
        <div className="stage">
          <div className="remote-canvas" ref={remoteVideoRef} />
          
          {/* Show different messages based on remote user status */}
          {(() => {
            // Debug logging to understand the state
            console.log('🔍 Remote user status:', {
              remoteUsersCount: remoteUsers.length,
              remoteVideoActive: remoteVideoActive,
              remoteUsers: remoteUsers.map(u => u.uid)
            });
            
            // First check: Has any remote user joined the call?
            if (remoteUsers.length === 0) {
              // No remote user has joined yet
              return (
                <div className="no-remote-user">
                  <div className="no-user-icon">👤</div>
                  <p>Remote user has not joined yet</p>
                </div>
              );
            }
            
            // Second check: Remote user has joined, but is their camera off?
            if (!remoteVideoActive) {
              // Remote user has joined but camera is off
              return (
                <div className="remote-placeholder">
                  <div className="remote-avatar">👤</div>
                  <div className="remote-text">Remote camera is off</div>
                </div>
              );
            }
            
            // Remote user has joined and camera is active - no message needed
            return null;
          })()}
          <div className={`local-pip ${!isVideoEnabled ? 'off' : ''}`}>
            <div className="local-pip-video" ref={localVideoRef} />
            {!isVideoEnabled && (
              <div className="pip-placeholder">Camera Off</div>
            )}
          </div>
        </div>

        {/* Control Bar */}
        <div className="controls">
          <button 
            className={`cbtn mic ${isAudioEnabled ? 'on' : 'off'}`}
            onClick={toggleAudio}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? (
              <svg className="cicon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            ) : (
              <svg className="cicon" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z"/></svg>
            )}
          </button>
          <button 
            className={`cbtn cam ${isVideoEnabled ? 'on' : 'off'}`}
            onClick={toggleVideo}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <svg className="cicon" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
            ) : (
              <svg className="cicon" viewBox="0 0 24 24" fill="currentColor"><path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-13.96L18 10.48zM12 12l3-3 3 3H6l3 3 3-3z"/></svg>
            )}
          </button>
          <button 
            className={`cbtn chat ${isChatVisible ? 'on' : 'off'}`}
            onClick={() => setIsChatVisible(!isChatVisible)}
            title={isChatVisible ? 'Hide chat' : 'Show chat'}
          >
            <svg className="cicon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
          </button>
          <button className="cbtn end" onClick={leaveCall} title="End call">
            <svg className="cicon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
          </button>
          {appointmentId && userType && elapsedMs > 15 * 60 * 1000 && (
            <button className="cbtn end" onClick={leaveNoShow} title={userType === 'doctor' ? 'Leave — Patient Not Showed up' : 'Leave — Doctor Not Showed up'}>
              <svg className="cicon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.34 8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
            </button>
          )}
        </div>

        {/* Chat Panel */}
        {userType && (
          <div className="chat-wrapper">
            <ChatPanel
              roomId={room}
              userType={userType}
              userId={uidRef.current?.toString() || 'unknown'}
              isVisible={isChatVisible}
              onToggle={() => setIsChatVisible(!isChatVisible)}
              remoteUserIds={remoteUsers.map(user => user.uid.toString())}
            />
          </div>
        )}
      </main>

      {/* Footer Section */}
      <footer className="call-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-name">🏥 MARHAM</span>
            <span className="brand-tagline">Pakistan's most trusted healthcare platform</span>
          </div>
          <div className="footer-info">
            <span className="call-duration">Duration: {Math.floor(elapsedMs / 1000 / 60)}:{(Math.floor(elapsedMs / 1000) % 60).toString().padStart(2, '0')}</span>
            <span className="room-id">Room: {room}</span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .call-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }

        /* Use dynamic viewport height when supported to avoid browser UI collapsing issues */
        @supports (height: 100dvh) {
          .call-container { height: 100dvh; }
        }

        /* Header Section */
        .call-header {
          flex-shrink: 0;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 40;
          min-height: 60px;
          position: relative;
        }

        /* Main Video Call Section */
        .call-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          position: relative;
        }

        .stage { position: relative; flex: 1; background: #000; min-width: 0; }
        .remote-canvas { 
          position: absolute; 
          inset: 0; 
          width: 100%; 
          height: 100%; 
          background: #000; 
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .remote-canvas > div, 
        .remote-canvas video, 
        .remote-canvas canvas { 
          width: 100% !important; 
          height: 100% !important; 
          object-fit: contain !important; 
          object-position: center center !important; 
          background: #000 !important;
          max-width: 100% !important;
          max-height: 100% !important;
          min-width: auto !important;
          min-height: auto !important;
        }
        /* Override any conflicting styles */
        .remote-canvas video {
          object-fit: contain !important;
          object-position: center center !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
        }
        .remote-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #cbd5e1; gap: 8px; background: rgba(0,0,0,.35); z-index: 5; }
        .remote-avatar { font-size: 64px; line-height: 1; }
        .remote-text { font-size: 14px; opacity: .9; }
        .local-pip { position: absolute; bottom: 20px; right: 20px; width: min(26vw, 180px); aspect-ratio: 9 / 16; height: auto; border-radius: 16px; overflow: hidden; border: 2px solid rgba(255,255,255,.2); box-shadow: 0 8px 24px rgba(0,0,0,.45); background: #111827; z-index: 15; }
        @media (max-width: 640px) { .local-pip { width: min(32vw, 140px); top: 12px; right: 12px; bottom: auto; border-radius: 12px; } }
        .local-pip-video { width: 100%; height: 100%; }
        .local-pip-video > div, 
        .local-pip-video video { 
          width: 100% !important; 
          height: 100% !important; 
          object-fit: contain !important; 
          object-position: center center !important; 
          background: #000 !important;
          max-width: 100% !important;
          max-height: 100% !important;
        }
        /* Override any conflicting styles for local video */
        .local-pip-video video {
          object-fit: contain !important;
          object-position: center center !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
        }
        .local-pip.off .local-pip-video { filter: grayscale(1) brightness(.7); }
        .pip-placeholder { position: absolute; inset: 0; display: grid; place-items: center; color: #cbd5e1; font-size: 12px; background: rgba(0,0,0,.5); }
        .mirror video { transform: scaleX(-1); }

        .no-remote-user {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #94a3b8;
          z-index: 10;
        }

        .no-user-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .no-remote-user p {
          font-size: 1.2rem;
          opacity: 0.8;
          margin: 0;
        }

        .camera-off-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 12px;
          z-index: 10;
        }

        .camera-off-icon {
          width: 40px;
          height: 40px;
          opacity: 0.8;
          color: #94a3b8;
        }

        .controls { position: absolute; left: 50%; bottom: 80px; transform: translateX(-50%); display: flex; gap: 12px; z-index: 20; }
        .cbtn { width: 52px; height: 52px; border-radius: 999px; border: none; display: grid; place-items: center; cursor: pointer; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
        .cbtn:hover { transform: translateY(-2px); }
        .cbtn:active { transform: translateY(0); }
        .cbtn .cicon { width: 22px; height: 22px; color: #fff; }
        .cbtn.mic.on { background: #10b981; }
        .cbtn.mic.off { background: #374151; }
        .cbtn.cam.on { background: #3b82f6; }
        .cbtn.cam.off { background: #374151; }
        .cbtn.chat.on { background: #8b5cf6; }
        .cbtn.chat.off { background: #374151; }
        .cbtn.end { background: #ef4444; }

        /* Mobile layout adjustments */
        @media (max-width: 640px) {
          .controls { left: 0; right: 0; bottom: calc(12px + env(safe-area-inset-bottom)); transform: none; width: 100%; justify-content: space-evenly; padding: 0 12px; }
          .cbtn { width: 56px; height: 56px; }
          .cbtn .cicon { width: 24px; height: 24px; }
        }

        /* Chat wrapper - visible on all screen sizes */
        .chat-wrapper { 
          display: block; 
          min-width: 0; 
          position: relative;
        }
        
        /* Two-column layout on medium+ screens when chat is visible */
        @media (min-width: 768px) {
          .call-main.chat-visible { flex-direction: row; }
          .chat-wrapper { 
            width: 320px; 
            max-width: 35vw; 
            border-left: 1px solid rgba(255,255,255,.08); 
          }
          .controls { left: 50%; right: auto; transform: translateX(-50%); }
        }

        /* Prevent horizontal scroll on small screens */
        .call-container, .stage, .remote-canvas { overflow-x: hidden; }

        /* Footer Styles */
        .call-footer {
          flex-shrink: 0;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 30;
          padding: 12px 20px;
          min-height: 60px;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          gap: 20px;
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .brand-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #60a5fa;
        }

        .brand-tagline {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .footer-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .call-duration {
          font-size: 0.9rem;
          color: #e5e7eb;
          font-weight: 600;
        }

        .room-id {
          font-size: 0.8rem;
          color: #94a3b8;
          font-family: monospace;
        }

        /* Responsive header and footer */
        @media (max-width: 768px) {
          .call-header {
            min-height: 50px;
          }

          .call-footer {
            padding: 10px 16px;
            min-height: 50px;
          }

          .footer-content {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }

          .footer-info {
            align-items: center;
          }

          .brand-name {
            font-size: 1rem;
          }

          .brand-tagline {
            font-size: 0.75rem;
          }

          .call-duration {
            font-size: 0.85rem;
          }
          
          /* Mobile chat panel improvements */
          .chat-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 50;
            pointer-events: none;
          }
          
          .chat-wrapper > * {
            pointer-events: auto;
          }
        }

          .room-id {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .call-header {
            min-height: 45px;
          }

          .call-footer {
            padding: 8px 12px;
            min-height: 45px;
          }

          .footer-content {
            gap: 6px;
          }

          .brand-name {
            font-size: 0.9rem;
          }

          .brand-tagline {
            font-size: 0.7rem;
          }

          .call-duration {
            font-size: 0.8rem;
          }

          .room-id {
            font-size: 0.7rem;
          }
        }

        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #e5e7eb;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container p {
          font-size: 1.2rem;
          opacity: 0.8;
        }

        .connection-status {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-top: 10px;
        }

        .error-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #e5e7eb;
          z-index: 1000;
        }

        .error-content {
          text-align: center;
          padding: 30px;
          background: #1e293b;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .error-content h2 {
          color: #ef4444;
          margin-bottom: 15px;
        }

        .error-content p {
          font-size: 1.1rem;
          color: #94a3b8;
          margin-bottom: 25px;
        }

        .retry-btn,
        .home-btn {
          padding: 10px 25px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          margin: 0 10px;
        }

        .retry-btn {
          background: #3b82f6;
          color: #fff;
        }

        .retry-btn:hover {
          background: #2563eb;
        }

        .home-btn {
          background: #dc2626;
          color: #fff;
        }

        .home-btn:hover {
          background: #b91c1c;
        }

        .token-warning {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          background: #f59e0b; /* Warning color */
          color: #fff;
          text-align: center;
          padding: 10px 0;
          z-index: 999;
          font-weight: 600;
          font-size: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .connection-status-bar {
          position: fixed;
          top: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 8px 15px;
          border-bottom-left-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          z-index: 998;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .video-container {
            flex-direction: column;
            gap: 15px;
            padding: 15px;
          }

          .control-bar {
            padding: 15px;
          }

          .control-buttons {
            gap: 15px;
          }

          .control-btn {
            width: 50px;
            height: 50px;
          }

          .end-call-btn {
            width: 56px;
            height: 56px;
          }

          .control-icon {
            width: 20px;
            height: 20px;
          }
        }

        @media (max-width: 480px) {
          .video-container {
            padding: 10px;
            gap: 10px;
          }

          .control-bar {
            padding: 10px;
          }

          .control-buttons {
            gap: 12px;
          }

          .control-btn {
            width: 44px;
            height: 44px;
          }

          .end-call-btn {
            width: 50px;
            height: 50px;
          }

          .control-icon {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </div>
  );
}
