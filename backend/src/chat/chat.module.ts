import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
import { PrismaModule } from '../prisma/prisma.module'; // If you're using Prisma
import { SecureWebSocketGateway } from './websocket.gateway';
import { GeminiService } from 'src/knowledge/gemini.service';
import { KnowledgeModule } from 'src/knowledge/knowledge.module'; // Import KnowledgeModule

@Module({
  imports: [
    AuthModule, // This provides JwtService and WsJwtAuthGuard
    PrismaModule, // If your ChatService uses PrismaService
    KnowledgeModule, // Import to access KnowledgeService and its dependencies
  ],
  controllers: [ChatController],
  providers: [ChatService, SecureWebSocketGateway, GeminiService], // Remove KnowledgeService from here since it's in KnowledgeModule
  exports: [ChatService], // Export if other modules need it
})
export class ChatModule {}