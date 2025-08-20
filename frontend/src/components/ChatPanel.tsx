"use client";

import { useState, useEffect, useRef } from "react";
import sendbirdService from "../services/sendbirdService";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatPanelProps {
  roomId: string;
  userType: 'doctor' | 'patient';
  userId: string;
  isVisible: boolean;
  onToggle: () => void;
  remoteUserIds?: string[];
}

export default function ChatPanel({ roomId, userType, userId, isVisible, onToggle, remoteUserIds }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Sendbird connection when component mounts
  useEffect(() => {
    if (isVisible && roomId && userId) {
      initializeChat();
    }
  }, [isVisible, roomId, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat connection
  const initializeChat = async () => {
    try {
      const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
      if (!appId) {
        console.error('Sendbird App ID not found');
        return;
      }

      await sendbirdService.initialize(appId);
      await sendbirdService.connectUser(userId, userType === 'doctor' ? 'Dr. ' + userId : 'Patient ' + userId);
      
      // Join or create chat channel
      const channelUrl = `chat-${roomId}`;
      const allUserIds = remoteUserIds ? [...remoteUserIds, userId] : [userId];
      await sendbirdService.joinChatChannel(channelUrl, userId, userType, allUserIds);
      
      // Set up message handler
      sendbirdService.onMessageReceived((sbMessage) => {
        const isOwnMessage = sbMessage.sender?.userId === userId;
        const newMessage: Message = {
          id: sbMessage.messageId.toString(),
          text: sbMessage.message,
          sender: isOwnMessage ? (userType === 'doctor' ? 'Dr. You' : 'You') : (sbMessage.sender?.nickname || sbMessage.sender?.userId || 'Unknown'),
          timestamp: new Date(sbMessage.createdAt),
          isOwn: isOwnMessage
        };
        setMessages(prev => [...prev, newMessage]);
      });

      // Load message history
      const history = await sendbirdService.getMessageHistory(50);
      const formattedHistory = history.map(sbMessage => {
        const isOwnMessage = sbMessage.sender?.userId === userId;
        return {
          id: sbMessage.messageId.toString(),
          text: sbMessage.message,
          sender: isOwnMessage ? (userType === 'doctor' ? 'Dr. You' : 'You') : (sbMessage.sender?.nickname || sbMessage.sender?.userId || 'Unknown'),
          timestamp: new Date(sbMessage.createdAt),
          isOwn: isOwnMessage
        };
      });
      setMessages(formattedHistory);
      
      setIsConnected(true);
      console.log('✅ Chat connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize chat:', error);
      setIsConnected(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !isConnected) return;
    
    try {
      // Add your own message immediately to the UI (optimistic update)
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        text: message.trim(),
        sender: userType === 'doctor' ? 'Dr. You' : 'You',
        timestamp: new Date(),
        isOwn: true
      };
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input immediately
      setMessage("");
      
      // Send message through Sendbird
      const sentMessage = await sendbirdService.sendMessage(message.trim());
      
      if (sentMessage) {
        // Replace temp message with real message from Sendbird
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? {
                id: sentMessage.messageId.toString(),
                text: sentMessage.message,
                sender: userType === 'doctor' ? 'Dr. You' : 'You',
                timestamp: new Date(sentMessage.createdAt),
                isOwn: true
              }
            : msg
        ));
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Remove the temp message if sending failed
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      // Restore the message in input
      setMessage(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserAvatar = (userType: string, isOwn: boolean) => {
    if (isOwn) {
      return userType === 'doctor' ? '👨‍⚕️' : '🏥';
    }
    return userType === 'doctor' ? '👨‍⚕️' : '🏥';
  };

  const getUserInitials = (userType: string) => {
    return userType === 'doctor' ? 'DR' : 'PT';
  };

  // Only render when isVisible is provided
  if (typeof isVisible === 'undefined') {
    return null;
  }

  return (
    <div
      className={`fixed top-16 right-0 h-3/4 w-80 bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-[99999] flex flex-col chat-panel ${
        isVisible ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ 
        touchAction: "manipulation",
        pointerEvents: "auto"
      }}
    >
      {/* Header - Google Meet Style */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Meeting chat</h2>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-700 min-h-0 relative z-10">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Connecting to chat...</h3>
            <p className="text-gray-300 text-sm">Please wait while we establish the connection</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No messages yet</h3>
            <p className="text-gray-300 text-sm">Start a conversation with your meeting participants</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div className={`flex ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[80%]`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    msg.isOwn 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    {msg.isOwn ? getUserInitials(userType) : getUserInitials(userType === 'doctor' ? 'patient' : 'doctor')}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-full break-words ${
                      msg.isOwn
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-green-500 text-white rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    
                    {/* Timestamp and Sender */}
                    <div className={`flex items-center space-x-2 mt-1 text-xs ${
                      msg.isOwn ? 'flex-row-reverse space-x-reverse text-gray-300' : 'flex-row text-gray-300'
                    }`}>
                      <span>{formatTime(msg.timestamp)}</span>
                      <span className="font-medium">{msg.sender}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Google Meet Style */}
      <div className="border-t border-gray-700 bg-gray-800 p-4 flex-shrink-0 relative z-10">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting to chat..."}
              className="w-full px-4 py-3 border border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm placeholder-gray-400 bg-gray-700 text-white"
              rows={1}
              disabled={!isConnected}
              style={{ 
                minHeight: '44px',
                maxHeight: '120px',
                touchAction: "manipulation"
              }}
            />
            
          </div>
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || !isConnected}
            className="px-4 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center min-w-[44px]"
            style={{ touchAction: "manipulation" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>



      {/* Mobile-specific styles */}
      <style jsx>{`
        /* Custom scrollbar for messages */
        .overflow-y-auto::-webkit-scrollbar {
          width: 0px;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .fixed.top-0.right-0 {
            width: 100vw;
            max-width: 100vw;
          }
        }
        
        /* Ensure proper touch handling */
        textarea, button {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
          pointer-events: auto;
        }
        
        /* Prevent event bubbling */
        .chat-panel * {
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}
