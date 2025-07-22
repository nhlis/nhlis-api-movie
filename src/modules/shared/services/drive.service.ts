import { google, drive_v3 } from 'googleapis';
import * as stream from 'stream';
import * as sharp from 'sharp';
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';

const RATIO_MAP = {
    '20:9': [20, 9],
    '16:9': [16, 9],
    '2:3': [2, 3],
    '1:1': [1, 1],
} as const;

interface Size {
    width: number;
    height: number;
}

type Aspect = keyof typeof RATIO_MAP;

@Injectable()
export class GoogleDriveService {
    private readonly drive: drive_v3.Drive;
    private readonly logger = new Logger(GoogleDriveService.name);

    constructor(private configService: ConfigService) {
        this.drive = this.initDrive();
    }

    private initDrive() {
        const auth = new google.auth.GoogleAuth({
            keyFile: resolve('secret.json'),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        return google.drive({ version: 'v3', auth: auth });
    }

    /** Supported aspect-ratios expressed as [w, h] factors. */

    /** Pure helper → decides final {width,height}. */
    async resolveSize(original: Size, opts: { width?: number; height?: number; aspect?: Aspect }): Promise<Size> {
        let { width, height, aspect } = opts;
        const [aw, ah] = aspect ? RATIO_MAP[aspect] : [original.width, original.height];

        // nothing supplied → keep original
        if (!width && !height && !aspect) return original;

        // aspect only → keep original width, derive height
        if (!width && !height && aspect) {
            width = original.width;
            height = Math.floor((width / aw) * ah);
            return { width, height };
        }

        // width only
        if (width && !height) {
            height = aspect ? Math.floor((width / aw) * ah) : Math.floor(width / (original.width / original.height));
            return { width, height };
        }

        // height only
        if (!width && height) {
            width = aspect ? Math.floor((height * aw) / ah) : Math.floor(height * (original.width / original.height));
            return { width, height };
        }

        // both width & height provided
        if (width && height && aspect) {
            height = Math.floor((width / aw) * ah); // hard-enforce aspect
        }
        return { width: width!, height: height! };
    }

    async UploadImage(payload: { fileImage: Express.Multer.File; nameImage: string; width?: number; height?: number; aspectRatio?: Aspect; idFolder: string }) {
        try {
            // 1. metadata
            const meta = await sharp(payload.fileImage.buffer).metadata();
            if (!meta.width || !meta.height) {
                throw new BadRequestException('Image metadata missing width/height.');
            }

            // 2. compute target size
            const { width: targetW, height: targetH } = await this.resolveSize(
                { width: meta.width, height: meta.height },
                { width: payload.width, height: payload.height, aspect: payload.aspectRatio },
            );

            // 3. transform
            const buffer = await sharp(payload.fileImage.buffer).resize(targetW, targetH, { fit: 'cover', position: 'center' }).webp().toBuffer();

            // 4. upload
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            const { data } = await this.drive.files.create({
                media: { mimeType: 'image/webp', body: bufferStream },
                requestBody: { name: payload.nameImage, parents: [payload.idFolder] },
            });

            return data.id as string;
        } catch (err: any) {
            this.logger.error(err.message);
            throw new InternalServerErrorException(err.message);
        }
    }

    async StorageQuota() {
        try {
            const data = await this.drive.about.get({ fields: 'storageQuota' });
            const result = data.data.storageQuota;
            const limitBytes: any = result.limit;
            const usageBytes: any = result.usage;
            const trashBytes: any = result.usageInDriveTrash;
            const remainingBytes: any = limitBytes - usageBytes;
            const limitGB = limitBytes / (1024 * 1024 * 1024);
            const usageGB = usageBytes / (1024 * 1024 * 1024);
            const remainingGB = remainingBytes / (1024 * 1024 * 1024);
            const trashGB = trashBytes / (1024 * 1024 * 1024);
            const response = {
                'Limit Bytes': limitBytes,
                'Usage Bytes': usageBytes,
                'Remaining Bytes': remainingBytes,
                'Trash Bytes': trashBytes,
                '========================================================================================================': null,
                'Limit GB': `${limitGB.toFixed(2)}GB`,
                'Usage GB': `${usageGB.toFixed(2)}GB`,
                'Remaining GB': `${remainingGB.toFixed(2)}GB`,
                'Trash GB': `${trashGB.toFixed(2)}GB`,
            };
            return response;
        } catch (error: any) {
            throw new Error('Error get StorageQuota: ' + error.message);
        }
    }

    async DeleteFile(id: string) {
        try {
            await this.drive.files.delete({ fileId: id });
        } catch (error) {
            this.logger.error('Error deleting file: ', error.message);
        }
    }
}
