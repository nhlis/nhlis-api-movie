import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IUser {
    sub: string;
}

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): IUser => {
    const { user } = ctx.switchToHttp().getRequest();
    return user;
});
