import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../modules/users/user.entity';
import { Message } from '../modules/chat/message.entity';
import { RefreshToken } from '../modules/auth/refresh-token.entity';
import { CreateInitialTables1700000000000 } from './migrations/1700000000000-CreateInitialTables';
import { AddMessageRecall1700000000001 } from './migrations/1700000000001-AddMessageRecall';

const configService = new ConfigService();

// Database path configuration
let databasePath = 'database.sqlite';
if (configService.get<string>('NODE_ENV') === 'production') {
  // In production, use volume mount for persistence
  databasePath = 'data/database.sqlite';
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: databasePath,
  entities: [User, Message, RefreshToken],
  migrations: [CreateInitialTables1700000000000, AddMessageRecall1700000000001],
  synchronize: false,
  logging: ['error', 'warn', 'info', 'log', 'query', 'schema'],
}); 