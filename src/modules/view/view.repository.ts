import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, SortOrder } from 'mongoose';
import { BaseRepository } from '../shared/repositories/base.repository';
import { IdService } from '../shared/services/id.service';
import { View, ViewDocument } from './view.schema';
import { EMovieSort } from 'src/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class ViewRepository extends BaseRepository<ViewDocument> {
    private readonly logger = new Logger(ViewRepository.name);

    constructor(
        @InjectModel(View.name) private readonly viewModel: Model<ViewDocument>,
        private readonly idService: IdService,
    ) {
        super(viewModel);
    }

    // ===== WRITE METHODS =====
    public async createView(payload: { visitor_id: string; overview_id: string; episode_id: string }, session?: ClientSession): Promise<Partial<ViewDocument>> {
        return this.createDocument({ _id: this.idService.handleGenerateId(), visitor_id: payload.visitor_id, overview_id: payload.overview_id, episode_id: payload.episode_id }, session);
    }

    public async findLastedView(query: { visitor_id: string; overview_id: string; episode_id: string }, field: Array<keyof View>, lean: boolean): Promise<Partial<ViewDocument>> {
        return this.viewModel
            .findOne({ visitor_id: query.visitor_id, overview_id: query.overview_id, episode_id: query.episode_id })
            .select(field.join(' '))
            .sort({ created_at: EMovieSort.DESC })
            .lean(lean)
            .exec();
    }

    public async findViews(query: FilterQuery<View>, limit: number, fields: Array<keyof View>, sort: Record<string, SortOrder>): Promise<Partial<ViewDocument>[]> {
        return this.findDocuments(query, limit, fields, sort, true);
    }
}
