import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './GetSomething';

export const WsGetUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): any => {
    const client = ctx.switchToWs().getClient();
    const user = client.data.user;
    
    return data ? user?.[data] : user;
  },
);