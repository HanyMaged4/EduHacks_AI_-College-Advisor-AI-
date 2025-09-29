import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  id: string;
  username: string;
  [key: string]: any;
}

export const GetUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return data ? user?.[data] : user;
  },
);