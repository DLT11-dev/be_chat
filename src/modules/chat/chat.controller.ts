import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateMessageDto, MessageResponseDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @ApiResponse({ status: 201, description: 'Tin nhắn đã được gửi', type: MessageResponseDto })
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Request() req,
  ): Promise<MessageResponseDto> {
    return this.chatService.createMessage(createMessageDto, req.user.id);
  }

  @Get('messages/:otherUserId')
  @ApiResponse({ status: 200, description: 'Danh sách tin nhắn', type: [MessageResponseDto] })
  async getMessages(
    @Param('otherUserId') otherUserId: number,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Request() req,
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getMessagesBetweenUsers(req.user.id, otherUserId, limit, offset);
  }

  @Get('messages/unread')
  @ApiResponse({ status: 200, description: 'Danh sách tin nhắn chưa đọc', type: [MessageResponseDto] })
  async getUnreadMessages(@Request() req): Promise<MessageResponseDto[]> {
    return this.chatService.getUnreadMessages(req.user.id);
  }

  @Put('messages/:messageId/read')
  @ApiResponse({ status: 200, description: 'Tin nhắn đã được đánh dấu đã đọc' })
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @Request() req,
  ): Promise<void> {
    return this.chatService.markMessageAsRead(messageId, req.user.id);
  }

  @Put('messages/read/:otherUserId')
  @ApiResponse({ status: 200, description: 'Tất cả tin nhắn đã được đánh dấu đã đọc' })
  async markAllMessagesAsRead(
    @Param('otherUserId') otherUserId: number,
    @Request() req,
  ): Promise<void> {
    return this.chatService.markAllMessagesAsRead(otherUserId, req.user.id);
  }

  @Delete('messages/:messageId')
  @ApiResponse({ status: 200, description: 'Tin nhắn đã được xóa' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Request() req,
  ): Promise<void> {
    return this.chatService.deleteMessage(messageId, req.user.id);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện gần đây' })
  @ApiResponse({ status: 200, description: 'Danh sách cuộc trò chuyện' })
  async getRecentConversations(@Request() req): Promise<any[]> {
    return this.chatService.getRecentConversations(req.user.id);
  }
} 