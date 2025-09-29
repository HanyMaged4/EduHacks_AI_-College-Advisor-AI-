import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

async validate(payload: any) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.id }, // Changed from payload.sub to payload.id
  });
  
  if (!user) {
    throw new UnauthorizedException();
  }
  
  return { 
    id: payload.id,           
    username: payload.username,
  };
}

}