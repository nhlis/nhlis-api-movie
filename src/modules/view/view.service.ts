import { Injectable } from '@nestjs/common';

import { EpisodeRepository } from '../movies/episode/episode.repository';
import { OverviewRepository } from '../movies/overview/overview.repository';
import { ViewRepository } from './view.repository';
import { ClientSession } from 'mongoose';

@Injectable()
export class ViewService {
    constructor(
        private readonly viewRepository: ViewRepository,
        private readonly overviewRepository: OverviewRepository,
        private readonly episodeRepository: EpisodeRepository,
    ) {}

    public async handleCreateView(payload: { visitor_id: string; overview_id: string; episode_id: string }): Promise<void> {
        return this.viewRepository.transaction(async (session: ClientSession) => {
            const [viewsByVisitorAndOverview, viewsByVisitorAndEpisode] = await Promise.all([
                this.viewRepository.findViews({ visitor_id: payload.visitor_id, overview_id: payload.overview_id }, 0, ['_id'], { created_at: -1 }),
                this.viewRepository.findViews({ visitor_id: payload.visitor_id, episode_id: payload.episode_id }, 1, ['_id', 'created_at'], { created_at: -1 }),
            ]);

            const hasViewedOverview = viewsByVisitorAndOverview.length > 0;
            const latestViewEpisode = viewsByVisitorAndEpisode[0];

            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            const shouldCreateNewView = !latestViewEpisode || (latestViewEpisode.created_at && now - new Date(latestViewEpisode.created_at).getTime() > oneDay);

            if (shouldCreateNewView) {
                await this.viewRepository.createView(
                    {
                        visitor_id: payload.visitor_id,
                        overview_id: payload.overview_id,
                        episode_id: payload.episode_id,
                    },
                    session,
                );

                if (!hasViewedOverview) {
                    await this.overviewRepository.incrementOverviewStats(payload.overview_id, { count_view: 1 }, session);
                }

                await this.episodeRepository.incrementEpisodeStats(payload.episode_id, { count_view: 1 }, session);
            }
        });
    }
}
