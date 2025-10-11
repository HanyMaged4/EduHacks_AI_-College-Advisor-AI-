import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WsJwtAuthGuard } from '../auth/Guards/ws-jwt-auth.guard';
import { WsGetUser } from '../auth/Decorators/ws-get-user.decorator';
import { GeminiService } from 'src/knowledge/gemini.service';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
export class SecureWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SecureWebSocketGateway');
  private userMessageCounts: Map<number, string[]> = new Map(); // Track message counts per user
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private readonly geminiService: GeminiService, 
    private readonly chatservice: ChatService
  ) {}

  afterInit(server: Server) {
    this.logger.log('Secure WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromClient(client);
      
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Use same validation logic as your JWT strategy
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) {
        this.logger.warn(`Connection rejected: User not found`);
        client.disconnect();
        return;
      }

      // Store user data (matching your JWT strategy format)
      client.data.user = {
        id: payload.id,
        username: payload.username,
      };
      
      await client.join(`user_${payload.id}`);
      
      this.logger.log(`User ${payload.username} (ID: ${payload.id}) connected`);
      
      client.emit('connected', {
        message: 'Successfully connected to secure WebSocket',
        user: { id: payload.id, username: payload.username },
      });
      
    } catch (error) {
      this.logger.error('Connection authentication failed:', error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`User ${user.username} disconnected`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('load_messages')
  async handleLoadMessages(
    @MessageBody() data: { conversationId: string; limit?: number },
    @WsGetUser() user: any,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.conversationId) {
      throw new WsException('conversationId is required');
    }

    const conv = await this.prisma.conversation.findFirst({
      where: { id: data.conversationId, userId: user.id },
      select: { id: true },
    });
    if (!conv) {
      throw new WsException('Conversation not found');
    }

    const limit = Math.min(Math.max(data.limit ?? 50, 1), 200);
    const messages = await this.chatservice.getMessages(data.conversationId, limit);

    client.emit('chat_history', {
      conversationId: data.conversationId,
      messages, 
    });
  }

  //chat message handler
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('chat')
  async handleMessagesRequest(
    @MessageBody() data: { message: CreateMessageDto },
    @WsGetUser() user: any,
  ) {
    if (!data?.message?.conversationId || !data?.message?.content) {
      throw new WsException('conversationId and content are required');
    }

    // Verify conversation ownership
    const conv = await this.prisma.conversation.findFirst({
      where: { id: data.message.conversationId, userId: user.id },
      select: { id: true },
    });
    if (!conv) {
      throw new WsException('Conversation not found');
    }

    // Persist the user message
    await this.chatservice.addMessage(user.id, {
      conversationId: data.message.conversationId,
      content: data.message.content,
      role: 'user',
    });

    // Notify client that we’re processing
    this.server.to(`user_${user.id}`).emit('chat_update', {
      status: 'processing',
      message: 'Analyzing your message...',
    });

    try {
      // Load recent history to give the LLM context
      const recent = await this.chatservice.getMessages(
        data.message.conversationId,
        20, 
      );

      // Build a single prompt string for Gemini (keeps your current service API)
      // If your GeminiService supports chat messages, switch to that instead.
      const historyText = recent
        .map((m: any) => `${m.role}: ${m.content}`)
        .join('\n');

      const compositePrompt =
        `You are an AI College Advisor. Use the conversation context to respond helpfully.\n` +
        `Conversation:\n${historyText}\n` +
        `user: ${data.message.content}\nassistant:`;

      const response = await this.geminiService.generateResponse(compositePrompt);

      // Persist the assistant message
      await this.chatservice.addMessage(user.id, {
        conversationId: data.message.conversationId,
        content: response,
        role: 'assistant',
      });

      // Send back to the user
      this.server.to(`user_${user.id}`).emit('chat_response', {
        status: 'success',
        message: response,
        conversationId: data.message.conversationId,
      });
    } catch (error) {
      this.server.to(`user_${user.id}`).emit('chat_response', {
        status: 'error',
        message: 'Failed to generate response.',
        conversationId: data.message.conversationId,
      });
      this.logger.error(`Error generating response: ${error.message}`);
    }
  }


  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('college_recommendation_request')
  handleRecommendationRequest(
    @MessageBody() data: { preferences: any },
    @WsGetUser() user: any,
  ) {
    this.logger.log(`College recommendation request from ${user.username}`);
    
    // Process the recommendation (integrate with your AI logic)
    // Send real-time updates back to the user
    this.server.to(`user_${user.id}`).emit('recommendation_update', {
      status: 'processing',
      message: 'Analyzing your preferences...',
    });
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  private extractTokenFromClient(client: Socket): string | null {
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token.replace('Bearer ', '');
    }
    
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    if (client.handshake.query?.token) {
      return Array.isArray(client.handshake.query.token) 
        ? client.handshake.query.token[0] 
        : client.handshake.query.token;
    }
    
    return null;
  }
}