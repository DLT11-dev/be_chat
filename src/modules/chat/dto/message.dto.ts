import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  type?: string = 'text';

  @IsNumber()
  @IsNotEmpty()
  receiverId: number;
}

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class MessageResponseDto {
  id: string;
  content: string;
  type: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: number;
    username: string;
    email: string;
  };
  receiver?: {
    id: number;
    username: string;
    email: string;
  };
} 