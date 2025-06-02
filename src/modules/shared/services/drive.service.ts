import { google, drive_v3 } from 'googleapis';
import * as stream from 'stream';
import * as sharp from 'sharp';
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';

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

    async UploadImage(fileImage: any, nameImage: string, width: number = undefined, height: number = undefined, aspectRatio: '16:9' | '2:3' | '1:1' = undefined, idFolder: string) {
        try {
            // Lấy metadata của ảnh gốc
            const metadata = await sharp(fileImage.buffer).metadata();

            if (!metadata.width || !metadata.height) {
                throw new BadRequestException('Image metadata is invalid or missing width/height.');
            }

            const originalWidth = metadata.width;
            const originalHeight = metadata.height;

            // Trường hợp không cung cấp gì, giữ nguyên kích thước gốc
            if (!width && !height && !aspectRatio) {
                width = originalWidth;
                height = originalHeight;
            }

            // Nếu chỉ có aspectRatio, sử dụng kích thước gốc
            if (!width && !height && aspectRatio) {
                if (aspectRatio === '16:9') {
                    width = originalWidth;
                    height = Math.floor((width / 16) * 9);
                } else if (aspectRatio === '2:3') {
                    width = originalWidth;
                    height = Math.floor((width / 2) * 3);
                } else if (aspectRatio === '1:1') {
                    width = height = Math.min(originalWidth, originalHeight);
                }
            }

            // Nếu chỉ có width, tính height dựa trên aspectRatio hoặc tỉ lệ gốc
            if (width && !height) {
                if (aspectRatio === '16:9') {
                    height = Math.floor((width / 16) * 9);
                } else if (aspectRatio === '2:3') {
                    height = Math.floor((width / 2) * 3);
                } else if (aspectRatio === '1:1') {
                    height = width;
                } else {
                    height = Math.floor(width / (originalWidth / originalHeight));
                }
            }

            // Nếu chỉ có height, tính width dựa trên aspectRatio hoặc tỉ lệ gốc
            if (!width && height) {
                if (aspectRatio === '16:9') {
                    width = Math.floor((height * 16) / 9);
                } else if (aspectRatio === '2:3') {
                    width = Math.floor((height * 2) / 3);
                } else if (aspectRatio === '1:1') {
                    width = height;
                } else {
                    width = Math.floor(height * (originalWidth / originalHeight));
                }
            }

            // Nếu có cả width và height, kiểm tra aspectRatio
            if (width && height && aspectRatio) {
                if (aspectRatio === '16:9') {
                    height = Math.floor((width / 16) * 9);
                } else if (aspectRatio === '2:3') {
                    height = Math.floor((width / 2) * 3);
                } else if (aspectRatio === '1:1') {
                    height = width;
                }
            }

            // Use sharp to process the image and keep the original quality, save in PNG format
            const buffer = await sharp(fileImage.buffer)
                .resize(width, height, {
                    fit: 'cover', // Crop image to fit size
                    position: 'center', // Crop from center
                })
                .webp() // Maintain the highest quality
                .toBuffer();

            // Convert buffer to stream to upload to Google Drive
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            // Upload to Google Drive
            const response: any = await this.drive.files.create({
                media: {
                    mimeType: 'image/webp', // Make sure mime type is PNG
                    body: bufferStream,
                },
                requestBody: {
                    name: nameImage,
                    parents: [idFolder],
                },
            });

            const idImage: any = response.data.id;
            return idImage;
        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException(error.message);
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
