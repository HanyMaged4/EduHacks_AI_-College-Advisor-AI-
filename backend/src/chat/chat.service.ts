import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { KnowledgeService } from 'src/knowledge/knowledge.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly knowledgeService: KnowledgeService,
    private readonly prismaService: PrismaService
  ) {}
  async askQuestion(question: string) {
    const results = await this.knowledgeService.search(question, 3);
    return {
      question,
      results,
    };
  }
  async create(userId: string) {
    return await this.prismaService.conversation.create({
      data: {
        userId: userId,
      }
    });

  }

  async findAll(userId: string) {
    let stringUserId = userId;
    const conversations = await this.prismaService.conversation.findMany({
      where: {
        userId: stringUserId,
      },
      // include: { messages: true },
      orderBy: { createdAt: 'desc' },
    });
    return conversations;
  }

  async findOne(userId: string, id: string) {
    return await this.prismaService.conversation.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: { messages: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    return await this.prismaService.conversation.deleteMany({
      where: {
        id: id,
        userId: userId,
      },
    });
  }
  async addMessage(userId: string, Message: CreateMessageDto) {
    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        id: Message.conversationId,
        userId: userId,
      },
    });
    return await this.prismaService.message.create({
      data: {
        role: Message.role,
        conversationId: Message.conversationId,
        content: Message.content,
      },
    });
  }
  async getMessages(conversationId: string, maxTokens: number) {
    return await this.prismaService.message.findMany({
      where: {
        conversationId: conversationId,
      },
      orderBy: { createdAt: 'asc' },
      take: maxTokens,
    });
  }
}
