import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PostViewDto } from './dtos/post-view.dto';
import { ViewService } from './view.service';

@Controller('views')
export class ViewController {
    constructor(private readonly viewService: ViewService) {}

    // For api client user
    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async createView(@Body() body: PostViewDto): Promise<void> {
        await this.viewService.handleCreateView({ visitor_id: body.visitor_id, overview_id: body.overview_id, episode_id: body.episode_id });
    }
}
