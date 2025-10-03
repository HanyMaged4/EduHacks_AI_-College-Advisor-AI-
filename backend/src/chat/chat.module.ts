import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
import { PrismaModule } from '../prisma/prisma.module'; // If you're using Prisma
import { SecureWebSocketGateway } from './websocket.gateway';
import { GeminiService } from 'src/knowledge/gemini.service';

@Module({
  imports: [
    AuthModule, // This provides JwtService and WsJwtAuthGuard
    PrismaModule, // If your ChatService uses PrismaService
    
  ],
  controllers: [ChatController],
  providers: [ChatService,SecureWebSocketGateway,GeminiService],
  exports: [ChatService], // Export if other modules need it
})
export class ChatModule {}
