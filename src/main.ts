import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe for validating incoming requests
import { ConfigService } from '@nestjs/config'; // Import ConfigService to access environment configurations
import * as cookieParser from 'cookie-parser'; // Import cookie-parser for handling cookies
import { NestFactory } from '@nestjs/core'; // Import NestFactory to create an instance of the Nest application
import * as path from 'path';

import { AllExceptionsFilter } from './common'; // Import custom error middleware
import { AppModule } from './app.module'; // Import the root application module
import { TransformResponseInterceptor } from './common/interceptors/response.interceptor';

async function Bootstrap() {
    // Create an instance of the Nest application using the AppModule
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.set('trust proxy', true);

    app.use('/favicon.ico', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
    });

    app.setGlobalPrefix('/api/v1');

    app.use((req: any, res: any, next: any) => {
        const forwardedFor = req.headers['x-forwarded-for'];
        req['clientIP'] = req.ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || req.connection.remoteAddress;
        next();
    });

    // Get the ConfigService instance to access configuration values
    const configService = app.get(ConfigService);

    // Enable global validation and transformation
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        }),
    );

    // Use global error handling middleware
    app.useGlobalFilters(new AllExceptionsFilter());

    app.useGlobalInterceptors(new TransformResponseInterceptor(configService));

    // Enable cookie parsing middleware
    app.use(cookieParser());

    const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS');
    const allowedOriginsArr = allowedOrigins ? allowedOrigins.split('%20') : [];

    app.enableCors({
        origin: (origin, callback) => {
            // Cho phép request không có origin (e.g. server-to-server)
            if (!origin) return callback(null, true);

            const isExplicitlyAllowed = allowedOriginsArr.includes(origin);

            const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
            const isLocalNetwork = /^http:\/\/192\.168\.1\.\d+(:\d+)?$/.test(origin);

            if (isExplicitlyAllowed || isLocalhost || isLocalNetwork) {
                return callback(null, true);
            }

            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    });

    // Retrieve the server port from configuration or use 3000 as a fallback
    const port = configService.get<number>('SERVER_PORT') || 3000;

    // Start the application and listen on the specified port
    await app.listen(port, '0.0.0.0'); // Listen on all interfaces
}

// Call the Bootstrap function to start the application
Bootstrap();
