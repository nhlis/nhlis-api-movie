import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
    constructor(private readonly configService: ConfigService) {}

    @Get('callback')
    public async redirect(@Query() query: any): Promise<{ url: string }> {
        const url = this.configService.get<string>('REDIRECT_CLIENT');
        return { url };
    }
}
