import SendbirdChat from '@sendbird/chat';
import {
  GroupChannelModule,
  GroupChannel,
  GroupChannelCreateParams,
  GroupChannelHandler,
} from '@sendbird/chat/groupChannel';
import { UserMessage, MessageListParams } from '@sendbird/chat/message';

class SendbirdService {
  private sb: SendbirdChat | null = null;
  private appId: string | null = null;
  private channel: GroupChannel | null = null;
  private messageHandler: ((message: UserMessage) => void) | null = null;

  // Initialize Sendbird with your app ID (v4 SDK)
  async initialize(appId: string): Promise<void> {
    try {
      if (this.sb) {
        console.log('ℹ️ [SB v4] Already initialized');
        return;
      }
      console.log('🔧 [SB v4] Initializing with App ID:', appId);
      this.sb = SendbirdChat.init({
        appId,
        modules: [new GroupChannelModule()],
      });
      this.appId = appId;
      console.log('✅ Initialized');
    } catch (error) {
      console.error('Sendbird initialization error:', error);
      throw error;
    }
  }

  // Connect user to Sendbird
  async connectUser(userId: string, nickname: string, profileUrl?: string): Promise<void> {
    if (!this.sb) throw new Error('Sendbird not initialized');

    try {
      console.log('🔧 Connecting user:', userId, nickname);
      const sb = this.sb; // capture instance
      await sb.connect(userId);
      console.log('✅ Connected');

      if (nickname || profileUrl) {
        await sb.updateCurrentUserInfo({ nickname, profileUrl });
        console.log('✅ User info updated');
      }
    } catch (err: any) {
      console.error(`❌ Failed: ${err?.message || err}`);
      throw err;
    }
  }

  // Add missing users to the channel if we have permission
  private async addMissingUsers(channel: GroupChannel, allUserIds: string[]): Promise<void> {
    if (!allUserIds || allUserIds.length === 0) return;
    
    try {
      const currentUser = this.sb?.currentUser;
      if (!currentUser) return;
      
      // Check if current user can invite others
      const canInvite = await this.canInviteUsers(channel);
      if (!canInvite) {
        console.log('ℹ️ [SB v4] Cannot invite users, skipping user addition');
        return;
      }
      
      // Find users that are not in the channel
      const missingUsers = allUserIds.filter(id => 
        id !== currentUser.userId && 
        !channel.members.some(member => member.userId === id)
      );
      
      if (missingUsers.length > 0) {
        console.log('🔧 [SB v4] Adding missing users to channel:', missingUsers);
        await channel.inviteWithUserIds(missingUsers);
        console.log('✅ [SB v4] All missing users added to channel');
      } else {
        console.log('ℹ️ [SB v4] All users are already in the channel');
      }
    } catch (error) {
      console.warn('⚠️ [SB v4] Failed to add missing users, but continuing:', error);
    }
  }

  // Try to make channel public if user has permissions
  private async makeChannelPublic(channel: GroupChannel): Promise<boolean> {
    try {
      const currentUser = this.sb?.currentUser;
      if (!currentUser) return false;
      
      // Check if user is operator (creator or in operators list)
      const isOperator = channel.creator?.userId === currentUser.userId || 
                        (channel as any).operators?.some((op: any) => op.userId === currentUser.userId);
      
      if (isOperator && !channel.isPublic) {
        console.log('🔧 [SB v4] Attempting to make channel public...');
        await channel.updateChannel({
          isPublic: true
        });
        console.log('✅ [SB v4] Channel made public successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [SB v4] Failed to make channel public:', error);
      return false;
    }
  }

  // Check if current user can invite others to the channel
  private async canInviteUsers(channel: GroupChannel): Promise<boolean> {
    try {
      // Check if current user is operator or has invite permissions
      const currentUser = this.sb?.currentUser;
      if (!currentUser) return false;
      
      // Check if user is operator (creator or in operators list)
      const isOperator = channel.creator?.userId === currentUser.userId || 
                        (channel as any).operators?.some((op: any) => op.userId === currentUser.userId);
      
      if (isOperator) {
        console.log('✅ [SB v4] Current user is operator, can invite others');
        return true;
      }
      
      // Check channel settings for member invitations
      if (channel.isPublic) {
        console.log('ℹ️ [SB v4] Channel is public, members can join directly');
        return false; // No need to invite for public channels
      }
      
      console.log('⚠️ [SB v4] Current user is not operator, cannot invite others');
      return false;
    } catch (error) {
      console.error('❌ [SB v4] Error checking invite permissions:', error);
      return false;
    }
  }

  // Join or create chat channel for the call
  async joinChatChannel(channelUrl: string, userId: string, userType: 'doctor' | 'patient', allUserIds?: string[]): Promise<void> {
    if (!this.sb) {
      if (this.appId) {
        console.log('ℹ️ [SB v4] Client missing, re-initializing...');
        await this.initialize(this.appId);
      } else {
        throw new Error('Sendbird not initialized');
      }
    }

    try {
      console.log('🔧 [SB v4] Attempting to join channel:', channelUrl, 'as user:', userId);
      console.log('🔧 [SB v4] All users to be added:', allUserIds || [userId]);
      
      // Ensure connected before channel operations
      const sb = this.sb as any;
      if (!this.sb || sb.connectionState !== 'OPEN') {
        console.log('ℹ️ [SB v4] Not connected, connecting before joining channel...');
        await (this.sb as SendbirdChat).connect(userId);
        console.log('✅ Connected (pre-join)');
      }

      let channel: GroupChannel | null = null;
      let attemptedFallback = false;

      const tryGetOrCreate = async (url: string): Promise<GroupChannel | null> => {
        // Try get existing
        try {
          const found = await (this.sb as any).groupChannel.getChannel(url);
          if (found) {
            console.log('ℹ️ [SB v4] Found existing channel:', found.url);
            return found as GroupChannel;
          }
        } catch (err: any) {
          const msg = String(err?.message || err);
          if (msg.includes('Not authorized') || msg.includes('User must be a member')) {
            console.warn('⚠️ [SB v4] Cannot fetch existing private channel (not a member).');
          } else {
            console.log('ℹ️ [SB v4] Channel not found, will create new one');
          }
        }

        // Create new
        try {
          const userIdsToAdd = (allUserIds && allUserIds.length > 0 ? allUserIds : [userId]).filter(Boolean);
          const params: GroupChannelCreateParams = {
            name: `Call Chat - ${url}`,
            channelUrl: url,
            operatorUserIds: [userId],
            invitedUserIds: userIdsToAdd,
            isDistinct: false,
            isPublic: true,
          };
          const created = await (this.sb as any).groupChannel.createChannel(params);
          console.log('✅ [SB v4] Created new channel:', created?.url);
          return created as GroupChannel;
        } catch (createErr: any) {
          const msg = String(createErr?.message || createErr);
          if (msg.includes('unique constraint')) {
            console.warn('ℹ️ [SB v4] Channel URL already exists, fetching existing channel...');
            try {
              const found = await (this.sb as any).groupChannel.getChannel(url);
              console.log('✅ [SB v4] Fetched existing channel after duplicate URL:', found?.url);
              return found as GroupChannel;
            } catch (fetchErr: any) {
              const fmsg = String(fetchErr?.message || fetchErr);
              console.warn('⚠️ [SB v4] Could not fetch existing (likely private & not a member):', fmsg);
              return null;
            }
          }
          throw createErr;
        }
      };
      
      // First, try to get existing channel
      // Try primary URL once
      channel = await tryGetOrCreate(channelUrl);
      if (!channel) {
        // Deterministic fallback for legacy private channels
        const fallbackUrl = `${channelUrl}-public`;
        attemptedFallback = true;
        console.warn('ℹ️ [SB v4] Falling back to public URL:', fallbackUrl);
        channel = await tryGetOrCreate(fallbackUrl);
      }

      if (channel) {
        // Channel exists, ensure current user is a member
        if (!((channel as any).joined === true)) {
          try {
            // Try to join first
            await channel.join();
            console.log('✅ [SB v4] Successfully joined existing channel');
          } catch (joinErr: any) {
            console.warn('⚠️ [SB v4] Join failed, user not a member. Error:', joinErr.message);
            
            // Check if it's an authorization error
            if (joinErr.message && joinErr.message.includes('Not authorized') || joinErr.message.includes('User must be a member')) {
              console.log('🔧 [SB v4] Authorization error detected, attempting to invite user...');
              
              // Check if we can invite users to this channel
              const canInvite = await this.canInviteUsers(channel);
              
              if (canInvite) {
                try {
                  // Try to invite the user to the channel
                  console.log('🔧 [SB v4] Attempting to invite user to channel...');
                  await channel.inviteWithUserIds([userId]);
                  console.log('✅ [SB v4] User invited to channel successfully');
                  
                  // After inviting, try to join again
                  await channel.join();
                  console.log('✅ [SB v4] Successfully joined after invitation');
                } catch (inviteErr: any) {
                  console.error('❌ [SB v4] Failed to invite user to channel:', inviteErr);
                  throw new Error(`Failed to invite user to channel: ${inviteErr.message}`);
                }
              } else {
                // If we can't invite, try to make the channel public and join
                try {
                  console.log('🔧 [SB v4] Cannot invite user, attempting to make channel public...');
                  
                  // Try to make the channel public first
                  const madePublic = await this.makeChannelPublic(channel);
                  
                  if (madePublic) {
                    // Channel is now public, try to join
                    await channel.join();
                    console.log('✅ [SB v4] Successfully joined after making channel public');
                  } else {
                    // Try to get fresh channel data and join
                    const freshChannel = await (this.sb as any).groupChannel.getChannel(channelUrl);
                    
                    // If channel is public, try to join directly
                    if (freshChannel.isPublic) {
                      await freshChannel.join();
                      channel = freshChannel;
                      console.log('✅ [SB v4] Successfully joined public channel');
                    } else {
                      throw new Error('Channel is private and user cannot invite others or make it public');
                    }
                  }
                } catch (publicJoinErr: any) {
                  console.error('❌ [SB v4] Failed to join public channel:', publicJoinErr);
                  throw new Error(`Cannot join channel: ${publicJoinErr.message}`);
                }
              }
            } else {
              // For other types of errors, try the same fallback
              try {
                console.log('🔧 [SB v4] Attempting to invite user to channel...');
                await channel.inviteWithUserIds([userId]);
                console.log('✅ [SB v4] User invited to channel successfully');
                
                // After inviting, try to join again
                await channel.join();
                console.log('✅ [SB v4] Successfully joined after invitation');
              } catch (inviteErr: any) {
                console.error('❌ [SB v4] Failed to invite user to channel:', inviteErr);
                
                // If invitation fails, try to get fresh channel data and join
                try {
                  console.log('🔧 [SB v4] Refreshing channel data and trying to join...');
                  const freshChannel = await (this.sb as any).groupChannel.getChannel(channelUrl);
                  await freshChannel.join();
                  channel = freshChannel;
                  console.log('✅ [SB v4] Successfully joined after refresh');
                } catch (finalErr: any) {
                  console.error('❌ [SB v4] All join attempts failed:', finalErr);
                  throw new Error(`Failed to join chat channel: ${finalErr.message}`);
                }
              }
            }
          }
        } else {
          console.log('ℹ️ [SB v4] User already a member of channel');
        }

        // If we have additional users that should be in the channel, invite them
        if (allUserIds && allUserIds.length > 0) {
          const missingUsers = allUserIds.filter(id => 
            id !== userId && (!(channel as any).memberCount || !(channel as any).members?.some((member: any) => member.userId === id))
          );
          
          if (missingUsers.length > 0 && channel) {
            try {
              console.log('🔧 [SB v4] Inviting missing users to channel:', missingUsers);
              await channel.inviteWithUserIds(missingUsers);
              console.log('✅ [SB v4] All users invited to channel');
            } catch (inviteErr) {
              console.warn('⚠️ [SB v4] Failed to invite some users, but continuing:', inviteErr);
            }
          }
        }
      } else {
        throw new Error('Unable to obtain or create a joinable channel');
      }

      if (channel) {
        this.channel = channel;
        console.log('✅ [SB v4] Channel ready for messaging');
        console.log('📊 [SB v4] Channel details:', {
          url: channel.url,
          name: channel.name,
          isPublic: channel.isPublic,
          memberCount: (channel as any).memberCount,
          joined: (channel as any).joined,
          creator: channel.creator,
          operators: (channel as any).operators?.map((op: any) => op.userId) || []
        });
        this.setupMessageHandler();
      } else {
        throw new Error('Failed to establish channel connection');
      }

    } catch (error) {
      console.error('❌ [SB v4] Error joining chat channel:', error);
      throw error;
    }
  }

  // Send message to channel
  async sendMessage(messageText: string): Promise<UserMessage | null> {
    if (!this.channel) {
      console.error('No chat channel available');
      return null;
    }
    const request = this.channel.sendUserMessage({ message: messageText });
    return await new Promise<UserMessage>((resolve, reject) => {
      try {
        (request as any)
          .onSucceeded((msg: UserMessage) => resolve(msg))
          .onFailed((err: any) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }

  // Get message history
  async getMessageHistory(limit: number = 50): Promise<UserMessage[]> {
    if (!this.channel) return [];

    const params: MessageListParams = {
      prevResultSize: limit,
      nextResultSize: 0,
    };
    const messages = await this.channel.getMessagesByTimestamp(Date.now(), params);
    return (messages as unknown as UserMessage[]) || [];
  }

  // Set up message handler for real-time updates
  private setupMessageHandler(): void {
    if (!this.sb || !this.channel) return;
    const handlerId = `chat_${this.channel.url}`;
    const handler = new GroupChannelHandler({
      onMessageReceived: (channel, message) => {
        if (channel.url === this.channel?.url && this.messageHandler) {
          if ((message as UserMessage).messageId != null) {
            this.messageHandler(message as UserMessage);
          }
        }
      },
    });
    // v4 API uses addGroupChannelHandler
    // @ts-ignore
    if (typeof (this.sb as any).groupChannel.addGroupChannelHandler === 'function') {
      (this.sb as any).groupChannel.addGroupChannelHandler(handlerId, handler);
    } else {
      // Fallback for older minor versions
      (this.sb as any).groupChannel.addEventHandler?.(handlerId, handler);
    }
  }

  // Set message handler callback
  onMessageReceived(handler: (message: UserMessage) => void): void {
    this.messageHandler = handler;
  }

  // Disconnect from Sendbird
  async disconnect(): Promise<void> {
    if (this.sb) {
      await this.sb.disconnect();
    }
    this.channel = null;
    this.messageHandler = null;
  }

  // Get current channel
  getCurrentChannel(): GroupChannel | null {
    return this.channel;
  }

  // Check if connected
  isConnected(): boolean {
    return this.sb !== null && this.sb.connectionState === 'OPEN';
  }
}

// Create singleton instance
const sendbirdService = new SendbirdService();
export default sendbirdService;
