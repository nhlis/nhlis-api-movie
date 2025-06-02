import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import { BaseRepository } from '../shared/repositories/base.repository';
import { Profile, ProfileDocument } from './profile.schema';
import { EMovieSort } from '../../common';
import { EAccountTitle } from 'src/common/enums/account/title.account.enum';
import { IdService } from 'src/modules/shared/services/id.service';

@Injectable()
export class ProfileRepository extends BaseRepository<ProfileDocument> {
    private readonly logger = new Logger(ProfileRepository.name);

    constructor(
        @InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>,
        private readonly isService: IdService,
    ) {
        super(profileModel);
    }

    // ===== WRITE METHODS =====
    public async createProfile(_id: string): Promise<ProfileDocument> {
        return this.createDocument({ _id });
    }

    // ===== UPDATE METHODS =====
    public async updateProfile(
        profile_id: string,
        payload: { active: boolean; experience: number; partner: boolean; premium: boolean; title: EAccountTitle[] },
    ): Promise<{ matchedCount: number; modifiedCount: number }> {
        return this.updateDocument({ _id: profile_id }, { ...payload, updated_at: new Date() }, undefined);
    }

    // ===== DELETE METHODS =====
    public async deleteProfileById(profile_id: string): Promise<{ acknowledged: boolean; deletedCount: number }> {
        return this.deleteDocument({ _id: profile_id });
    }

    // ===== READ METHODS =====
    public async findProfileById(profile_id: string, fields: Array<keyof Profile>, learn: boolean): Promise<Partial<ProfileDocument>> {
        return this.findDocument({ _id: profile_id }, fields, learn);
    }

    public async findProfiles(limit: number, last_id: string, fields: Array<keyof Profile>, sort: Record<string, SortOrder>): Promise<ProfileDocument[]> {
        const queryBuilder: FilterQuery<Profile> = {};
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort);
    }

    public async findProfilesByIds(profile_ids: string[], fields: Array<keyof Profile>, sort: Record<string, SortOrder>): Promise<ProfileDocument[]> {
        return this.findDocuments({ _id: { $in: profile_ids } }, 0, fields, sort, true);
    }
}
