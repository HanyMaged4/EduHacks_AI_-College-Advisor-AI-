import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { KnowledgeModule } from './knowledge/knowledge.module';

@Module({
  imports: [UsersModule, AuthModule, ChatModule, KnowledgeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}