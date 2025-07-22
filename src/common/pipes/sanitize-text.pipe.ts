import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { stripHtml } from 'string-strip-html';

@Injectable()
export class SanitizeTextPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (!value || typeof value !== 'object') return value;

        if ('text' in value) {
            const result = stripHtml(value.text).result.trim();

            if (!result) {
                throw new BadRequestException('Comment text must not be empty after sanitization');
            }

            value.text = result;
        }

        return value;
    }
}
