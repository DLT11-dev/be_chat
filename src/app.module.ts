import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule, UsersModule } from '@/modules';
import { ChatModule } from '@/modules/chat/chat.module';
import { LoggerMiddleware } from '@common/middleware/logger.middleware';
import appConfig from '@/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        // Database path configuration
        let databasePath = 'database.sqlite';
        if (isProduction) {
          databasePath = 'data/database.sqlite';
        }
        return {
          type: 'sqlite',
          database: databasePath,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProduction,
          migrationsRun: isProduction,
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          logging: !isProduction && ['error', 'warn', 'info', 'log', 'query', 'schema'],
        };
      },
    }),
    AuthModule,
    UsersModule,
    ChatModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // apply to all routes
  }
}
