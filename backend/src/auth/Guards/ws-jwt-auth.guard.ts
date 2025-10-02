import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../Decorators/GetSomething';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromClient(client);
      
      if (!token) {
        throw new WsException('Authentication token not found');
      }

      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      client.data.user = payload;
      
      this.logger.log(`WebSocket authenticated for user: ${payload.username}`);
      return true;
      
    } catch (error) {
      this.logger.error('WebSocket authentication failed:', error.message);
      throw new WsException('Authentication failed');
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    // Try multiple token sources
    
    // 1. From auth object during handshake
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token.replace('Bearer ', '');
    }
    
    // 2. From authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // 3. From query parameters
    if (client.handshake.query?.token) {
      return Array.isArray(client.handshake.query.token) 
        ? client.handshake.query.token[0] 
        : client.handshake.query.token;
    }
    
    // 4. From cookies (if you're using them)
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const tokenCookie = cookies
        .split(';')
        .find(cookie => cookie.trim().startsWith('access_token='));
      
      if (tokenCookie) {
        return tokenCookie.split('=')[1];
      }
    }
    
    return null;
  }
}