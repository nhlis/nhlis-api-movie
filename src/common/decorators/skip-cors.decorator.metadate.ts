import { SetMetadata } from '@nestjs/common';

export const SkipCors = () => SetMetadata('skipCors', true);
