import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { CreateMessageDto, UpdateMessageDto, MessageResponseDto } from './dto/message.dto';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto, senderId: number): Promise<MessageResponseDto> {
    const { content, type = 'text', receiverId } = createMessageDto;

    // Kiểm tra receiver có tồn tại không
    const receiver = await this.userRepository.findOne({ where: { id: receiverId } });
    if (!receiver) {
      throw new NotFoundException('Người nhận không tồn tại');
    }

    const message = this.messageRepository.create({
      content,
      type,
      senderId,
      receiverId,
    });

    const savedMessage = await this.messageRepository.save(message);
    return this.formatMessageResponse(savedMessage);
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number, limit = 50, offset = 0): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where(
        '(message.senderId = :userId1 AND message.receiverId = :userId2) OR (message.senderId = :userId2 AND message.receiverId = :userId1)',
        { userId1, userId2 }
      )
      .orderBy('message.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return messages.map(message => this.formatMessageResponse(message));
  }

  async getUnreadMessages(userId: number): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.receiverId = :userId AND message.isRead = :isRead', { userId, isRead: false })
      .orderBy('message.createdAt', 'ASC')
      .getMany();

    return messages.map(message => this.formatMessageResponse(message));
  }

  async markMessageAsRead(messageId: string, userId: number): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, receiverId: userId }
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    message.isRead = true;
    await this.messageRepository.save(message);
  }

  async markAllMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('senderId = :senderId AND receiverId = :receiverId AND isRead = :isRead', {
        senderId,
        receiverId,
        isRead: false
      })
      .execute();
  }

  async deleteMessage(messageId: string, userId: number): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, senderId: userId }
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại hoặc bạn không có quyền xóa');
    }

    await this.messageRepository.remove(message);
  }

  async getRecentConversations(userId: number): Promise<any[]> {
    const conversations = await this.messageRepository
      .createQueryBuilder('message')
      .select([
        'CASE WHEN message.senderId = :userId THEN message.receiverId ELSE message.senderId END as otherUserId',
        'MAX(message.createdAt) as lastMessageTime',
        'COUNT(CASE WHEN message.receiverId = :userId AND message.isRead = false THEN 1 END) as unreadCount'
      ])
      .where('message.senderId = :userId OR message.receiverId = :userId', { userId })
      .groupBy('otherUserId')
      .orderBy('lastMessageTime', 'DESC')
      .getRawMany();

    // Lấy thông tin user cho mỗi cuộc trò chuyện
    const conversationsWithUserInfo = await Promise.all(
      conversations.map(async (conv) => {
        const user = await this.userRepository.findOne({
          where: { id: conv.otherUserId },
          select: ['id', 'username', 'email']
        });
        return {
          ...conv,
          user
        };
      })
    );

    return conversationsWithUserInfo;
  }

  private formatMessageResponse(message: Message): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      type: message.type,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender ? {
        id: message.sender.id,
        username: message.sender.username,
        email: message.sender.email,
      } : undefined,
      receiver: message.receiver ? {
        id: message.receiver.id,
        username: message.receiver.username,
        email: message.receiver.email,
      } : undefined,
    };
  }
} 