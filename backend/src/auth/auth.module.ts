import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './Strategy/jwt.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WsJwtAuthGuard } from './Guards/ws-jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, WsJwtAuthGuard],
  controllers: [AuthController],
  exports: [WsJwtAuthGuard, JwtModule],
})
export class AuthModule {}