import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('episodeQueue')
export class EpisodeProcessor {
    constructor() {}

    @Process('deleteEpisode')
    async handleDeleteEpisode(job: Job<{ episode_id: string }>) {
        console.log(`All reactions deleted for comment ${job.data.episode_id}`);
    }
}
