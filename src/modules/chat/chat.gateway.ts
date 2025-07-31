import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      console.log('🔌 New connection attempt:', { 
        hasToken: !!token, 
        socketId: client.id 
      });
      
      if (!token) {
        console.log('❌ No token provided, disconnecting');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.username = payload.username;

      this.connectedUsers.set(client.userId, client.id);
      
      // Join user to their personal room
      await client.join(`user_${client.userId}`);
      
      console.log(`✅ User ${client.username} (${client.userId}) connected`);
      console.log('📊 Connected users:', Array.from(this.connectedUsers.entries()));
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      console.log(`User ${client.username} (${client.userId}) disconnected`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CreateMessageDto,
  ) {
    console.log('📨 Received message:', { 
      senderId: client.userId, 
      receiverId: data.receiverId, 
      content: data.content 
    });

    if (!client.userId) {
      console.log('❌ Unauthorized message attempt');
      return { error: 'Unauthorized' };
    }

    try {
      const message = await this.chatService.createMessage(data, client.userId);
      console.log('✅ Message saved to database:', message.id);
      
      // Gửi tin nhắn đến người nhận nếu họ online
      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        console.log('📤 Sending to receiver:', receiverSocketId);
        this.server.to(receiverSocketId).emit('new_message', message);
      } else {
        console.log('⚠️ Receiver not online:', data.receiverId);
      }

      // Gửi tin nhắn về cho người gửi
      console.log('📤 Sending confirmation to sender');
      client.emit('message_sent', message);

      return message;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      client.emit('error', { message: error.message });
      return { error: error.message };
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { otherUserId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const roomId = this.getConversationRoomId(client.userId, data.otherUserId);
    await client.join(roomId);
    
    // Đánh dấu tất cả tin nhắn từ người khác là đã đọc
    await this.chatService.markAllMessagesAsRead(data.otherUserId, client.userId);
    
    client.emit('joined_conversation', { roomId, otherUserId: data.otherUserId });
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { otherUserId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const roomId = this.getConversationRoomId(client.userId, data.otherUserId);
    await client.leave(roomId);
    
    client.emit('left_conversation', { roomId, otherUserId: data.otherUserId });
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('user_typing', {
        userId: client.userId,
        username: client.username,
      });
    }
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('user_stopped_typing', {
        userId: client.userId,
        username: client.username,
      });
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await this.chatService.markMessageAsRead(data.messageId, client.userId);
      client.emit('message_marked_read', { messageId: data.messageId });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Helper method để tạo room ID cho cuộc trò chuyện
  private getConversationRoomId(userId1: number, userId2: number): string {
    const sortedIds = [userId1, userId2].sort((a, b) => a - b);
    return `conversation_${sortedIds[0]}_${sortedIds[1]}`;
  }

  // Method để gửi tin nhắn đến user cụ thể (có thể được gọi từ service khác)
  sendMessageToUser(userId: number, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Method để broadcast tin nhắn đến tất cả user online
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
} 