import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, of } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { EExpirationTime } from '../enums/auth/expiration-time.enum';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
    constructor(private configService: ConfigService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();

        return next.handle().pipe(
            mergeMap((data) => {
                // 1. Nếu có sid → gán cookie trước
                if (data?.sid) {
                    res.cookie('SID', data.sid, {
                        ...(this.configService.get<string>('BUN_ENV') === 'PRODUCTION' && {
                            domain: this.configService.get<string>('COOKIE_DOMAIN'),
                            sameSite: 'none',
                            secure: true,
                        }),
                        maxAge: EExpirationTime.SESSION,
                        httpOnly: true,
                        path: '/',
                    });
                    delete data.sid;
                }

                // 2. Nếu có redirect → chuyển hướng
                if (data?.url && typeof data.url === 'string' && !res.headersSent) {
                    res.redirect(data.statusCode || 302, data.url);
                    return of(null);
                }

                // 3. Nếu có HTML → gửi HTML
                if (data && typeof data.html === 'string' && !res.headersSent) {
                    res.setHeader('Content-Type', 'text/html');
                    res.send(data.html);
                    return of(null);
                }

                // 4. Trả về data bình thường
                return of(data);
            }),
            map((data) => {
                if (data === null) return null;

                return {
                    statusCode: 200,
                    timestamp: new Date().toISOString(),
                    path: req.url,
                    method: req.method,
                    data,
                };
            }),
        );
    }
}
