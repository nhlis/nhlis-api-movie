import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';
import { BaseRepository } from '../shared/repositories/base.repository';
import { IdService } from '../shared/services/id.service';
import { Bookmark, BookmarkDocument } from './bookmark.schema';
import { EMovieSort } from 'src/common';

@Injectable()
export class BookmarkRepository extends BaseRepository<BookmarkDocument> {
    private readonly logger = new Logger(BookmarkRepository.name);

    constructor(
        @InjectModel(Bookmark.name) private readonly bookmarkModel: Model<BookmarkDocument>,
        private readonly idService: IdService,
    ) {
        super(bookmarkModel);
    }

    // ===== WRITE METHODS =====
    public async createBookmark(payload: { profile_id: string; overview_id: string }, session: ClientSession): Promise<BookmarkDocument> {
        return this.findOneAndUpdate(
            { profile_id: payload.profile_id, overview_id: payload.overview_id },
            {
                $setOnInsert: {
                    _id: this.idService.handleGenerateId(),
                    profile_id: payload.profile_id,
                    overview_id: payload.overview_id,
                    created_at: new Date(),
                },
                $set: { updated_at: new Date() },
            },
            { new: true, upsert: true },
            session,
        );
    }

    // ===== DELETE METHODS =====
    public async deleteBookmark(profile_id: string, overview_id: string, session: ClientSession): Promise<{ acknowledged: boolean; deletedCount: number }> {
        return this.deleteDocument({ profile_id, overview_id }, session);
    }

    // ===== READ METHODS =====
    public async findBookmarks(query: FilterQuery<Bookmark>, limit: number, last_id: string, fields: Array<keyof Bookmark>, sort: Record<string, SortOrder>): Promise<BookmarkDocument[]> {
        return this.findDocuments(query, limit, fields, sort, true);
    }

    public async findBookmarksByUser(profile_id: string, limit: number, last_id: string, fields: Array<keyof Bookmark>, sort: Record<string, SortOrder>): Promise<BookmarkDocument[]> {
        const queryBuilder: FilterQuery<Bookmark> = { profile_id };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    public async findBookmarksByOverview(overview_id: string, limit: number, last_id: string, fields: Array<keyof Bookmark>, sort: Record<string, SortOrder>): Promise<BookmarkDocument[]> {
        const queryBuilder: FilterQuery<Bookmark> = { overview_id };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    public async findBookmarksByOverviewIdsAndProfileId(overview_ids: string[], profile_id: string, fields: Array<keyof Bookmark>, sort: Record<string, SortOrder>): Promise<BookmarkDocument[]> {
        const queryBuilder: FilterQuery<Bookmark> = { profile_id, overview_id: { $in: overview_ids } };
        return this.findDocuments(queryBuilder, 0, fields, sort, true);
    }

    // ===== COUNT METHODS =====
    public async countBookmarksByUser(profile_id: string): Promise<number> {
        return this.countDocuments({ profile_id });
    }

    public async countBookmarksByOverview(overview_id: string): Promise<number> {
        return this.countDocuments({ overview_id });
    }
}
