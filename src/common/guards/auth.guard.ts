import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { EErrorMessages } from '../enums/error/error-message';
import { CryptoService } from '../../modules/shared/services/crypto.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly cryptoService: CryptoService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader) throw new UnauthorizedException({ message: EErrorMessages.MISSING_AUTH });
        const token = authHeader.split(' ')[1];

        try {
            request.user = this.cryptoService.validateSymmetricToken(token);

            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(private readonly cryptoService: CryptoService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                request.user = this.cryptoService.validateSymmetricToken(token);
            } catch (error) {
                request.user = {};
            }
        } else {
            request.user = {};
        }

        return true;
    }
}
