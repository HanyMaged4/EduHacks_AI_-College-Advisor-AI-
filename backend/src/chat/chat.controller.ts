import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { GetUser } from 'src/auth/Decorators/GetSomething';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from 'src/auth/Guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask-question')
  async askQuestion(@Body() body: { question: string }) {
    if (!body.question || body.question.trim() === '') {
      throw new BadRequestException('Question cannot be empty');
    }
    return this.chatService.askQuestion(body.question);
  }

  @Post()
  async create(@GetUser('id') userId: string) {
    return await this.chatService.create(userId);
  }

  @Get()
  async findAll(@GetUser('id') userId: string) {
    return await this.chatService.findAll(userId);
  }

  @Get(':id')
  async findOne(@GetUser('id') userId: string, @Param('id') id: string) {
    return await this.chatService.findOne(userId, id);
  }

  @Delete(':id')
  async remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return await this.chatService.remove(userId, id);
  }

  @Post(':id/message')
  async addMessage(@GetUser('id') userId: string, @Param('id') id: string, @Body() body: CreateMessageDto) {
    if (!body.content || body.content.trim() === '') {
      throw new BadRequestException('Message content cannot be empty');
    }
    body.conversationId = id;
    return await this.chatService.addMessage(userId, body);
  }
}
