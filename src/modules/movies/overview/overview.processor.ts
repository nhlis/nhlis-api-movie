import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('movieQueue')
export class OverviewProcessor {
    constructor() {}

    @Process('deleteMovie')
    async handleDeleteMovie(job: Job<{ movieId: string }>) {
        console.log(`All episodes deleted for ${job.data.movieId}`);
    }
}
