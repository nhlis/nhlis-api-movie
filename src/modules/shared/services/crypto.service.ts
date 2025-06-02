import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
    private privateKey: string;
    private publicKey: string;
    private secretKey: Buffer;
    private ivKey: Buffer;
    private readonly algorithm = 'aes-256-cbc';
    private readonly logger = new Logger(CryptoService.name);

    constructor(private configService: ConfigService) {
        this.privateKey = this.configService.get<string>('privateKey');
        this.publicKey = this.configService.get<string>('publicKey');
        this.secretKey = Buffer.from(this.configService.get<string>('secretKey'), 'hex');
    }

    public calculateAtHash(token: string) {
        const partOfAccessToken = token.substring(0, Math.floor(token.length / 2));
        const hash = crypto.createHash('sha256').update(partOfAccessToken).digest();
        const base64UrlHash = hash.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return base64UrlHash;
    }

    private toBase64Url(base64: string) {
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private fromBase64Url(base64Url: string) {
        const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
        return base64Url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    }

    public encrypt(payload: Record<string, any>): string {
        const jsonString = JSON.stringify(payload);
        this.ivKey = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, this.ivKey);
        const encrypted = Buffer.concat([cipher.update(jsonString, 'utf8'), cipher.final()]);
        return encodeURIComponent(`${this.toBase64Url(encrypted.toString('base64'))}${this.ivKey.toString('hex')}`);
    }

    public decrypt(dataURI: string): Record<string, any> | null {
        const data = decodeURIComponent(dataURI);
        this.ivKey = Buffer.from(data.slice(-32), 'hex');
        const encrypted = Buffer.from(this.fromBase64Url(data.slice(0, -32)), 'base64');

        const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, this.ivKey);

        let decrypted = '';
        try {
            decrypted += decipher.update(encrypted, undefined, 'utf8');
            decrypted += decipher.final('utf8');
        } catch (error) {
            this.logger.error('Decryption failed:', error.stack);
            return null;
        }
        return JSON.parse(decrypted);
    }

    public generateSymmetricToken<T extends Record<string, any>>(payload: T & { exp?: number }): string {
        const currentTime = Date.now();
        payload.exp = payload.exp ? currentTime + payload.exp : currentTime + 300000;
        const payloadStr = JSON.stringify(payload);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.secretKey, iv);
        let encrypted = cipher.update(payloadStr, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const hmac = crypto
            .createHmac('sha256', this.secretKey)
            .update(`${iv.toString('base64')}:${encrypted}`)
            .digest('base64');

        return encodeURIComponent(`${iv.toString('base64')}%I${encrypted}%I${hmac}`);
    }

    public validateSymmetricToken<T>(token: string): T {
        try {
            const currentTime = Date.now();
            const decodedToken = decodeURIComponent(token);
            const [ivBase64, encryptedData, hmac] = decodedToken.split('%I');

            if (!ivBase64 || !encryptedData || !hmac) throw new Error('Invalid token format');

            const calculatedHmac = crypto.createHmac('sha256', this.secretKey).update(`${ivBase64}:${encryptedData}`).digest('base64');

            if (calculatedHmac !== hmac) throw new Error('Invalid HMAC');

            const iv = Buffer.from(ivBase64, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.secretKey, iv);
            let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            const payload = JSON.parse(decrypted);

            if (payload.exp && currentTime > payload.exp) throw new UnauthorizedException({ message: 'Token expired' });

            return payload;
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            throw new InternalServerErrorException();
        }
    }

    public signAsymmetricToken<T extends Record<string, any>>(payload: T & { exp?: number }): string {
        const currentTime = Date.now();
        payload.exp = payload.exp ? currentTime + payload.exp : currentTime + 300000;
        const payloadStr = JSON.stringify(payload);

        const sign = crypto.createSign('RSA-SHA256');
        sign.update(payloadStr);
        sign.end();
        const signature = sign.sign(this.privateKey, 'base64');

        return encodeURIComponent(`${signature}%I${Buffer.from(payloadStr).toString('base64url')}`);
    }

    public decodeAsymmetricToken<T>(token: string): T {
        const [signature, payloadBase64Url] = decodeURIComponent(token).split('%I');
        const payloadStr = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf-8'));
        return payload;
    }

    public verifyAsymmetricToken<T>(token: string): T {
        try {
            const currentTime = Date.now();
            const decodedToken = decodeURIComponent(token);
            const [signature, payloadBase64] = decodedToken.split('%I');

            if (!signature || !payloadBase64) throw new Error('Invalid token format');

            const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
            const payload = JSON.parse(payloadStr);

            // Xác thực chữ ký
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(payloadStr);
            verify.end();

            const isValidSignature = verify.verify(this.publicKey, signature, 'base64');
            if (!isValidSignature) throw new Error('Invalid signature');

            if (payload.exp && currentTime > payload.exp) throw new UnauthorizedException({ message: 'Token expired' });

            return payload;
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            throw new InternalServerErrorException();
        }
    }
}
