// app.module.ts

// import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { User } from './users/entities/user.entity';
import { Message } from './messages/entities/message.entity';
import { ChatModule } from './chat/chat.module';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // host: process.env.DB_HOST,
      // port: Number(process.env.DB_PORT),
      // username: process.env.DB_USERNAME,
      // password: process.env.DB_PASSWORD,
      // database: process.env.DB_DATABASE,
      url: process.env.DATABASE_URL,
      ssl:{rejectUnauthorized:false},
      entities: [User, Message],
      autoLoadEntities: true,
      synchronize: true,
    }),
    ChatModule,
    UsersModule,
    AuthModule,
    MessagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
      consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
