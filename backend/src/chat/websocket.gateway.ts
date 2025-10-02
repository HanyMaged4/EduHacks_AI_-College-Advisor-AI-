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

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class SecureWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SecureWebSocketGateway');

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
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