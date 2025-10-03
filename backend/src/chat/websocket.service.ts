import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatMessageData {
  message: string;
  senderId: string;
  senderName: string;
  receiverId: string;
}

@Injectable()
export class WebSocketService {
  private server: Server;
  private logger = new Logger('WebSocketService');

  constructor(private prisma: PrismaService) {}

  // Set the server instance (called from gateways)
  setServer(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server instance set');
  }

async sendMessage(messageData: ChatMessageData) {
  if (!this.server) {
    this.logger.warn('WebSocket server not initialized');
    return null;
  }

  try {
    // TODO: Save message to database when you create the Message model
    // const savedMessage = await this.prisma.message.create({
    //   data: {
    //     content: messageData.message,
    //     senderId: messageData.senderId,
    //     receiverId: messageData.receiverId,
    //     type: messageData.type,
    //   },
    //   include: {
    //     sender: { select: { id: true, username: true } }
    //   }
    // });

    const messagePayload = {
      id: Date.now().toString(), // Replace with savedMessage.id
      message: messageData.message,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      receiverId: messageData.receiverId,
      timestamp: new Date(),
    };

      this.server.to(`user_${messageData.receiverId}`).emit('private_message_received', messagePayload);
      
      this.server.to(`notifications_${messageData.receiverId}`).emit('chat_notification', {
        title: `New message from ${messageData.senderName}`,
        message: messageData.message.substring(0, 100) + (messageData.message.length > 100 ? '...' : ''),
        fromUsername: messageData.senderName,
        timestamp: new Date(),
      });

      this.logger.log(`Private message sent from ${messageData.senderName} to user ${messageData.receiverId}`);

    return messagePayload;

  } catch (error) {
    this.logger.error('Error sending message:', error);
    throw error;
  }
}


}