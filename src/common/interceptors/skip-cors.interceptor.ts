import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class CorsInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const skipCors = this.reflector.getAllAndOverride<boolean>('skipCors', [context.getHandler(), context.getClass()]);
        if (skipCors) context.switchToHttp().getResponse().header('Access-Control-Allow-Origin', '*');
        return next.handle();
    }
}
