import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const isHttpException = exception instanceof HttpException;
        const status = isHttpException ? exception.getStatus() : 500;
        const message = isHttpException ? exception.getResponse() : 'Internal Server Error';

        this.logger.error(
            `Method: ${request.method} | URL: ${request.url} | IP: ${request.ip} | Status: ${status} | Error: ${JSON.stringify(message)}`,
            isHttpException ? undefined : (exception as any)?.stack,
        );

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            detail: message,
        });
    }
}
