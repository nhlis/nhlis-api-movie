import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SortOrder } from 'mongoose';
import { EMovieSort, EAccountTitle } from '../../common';
import { ProfileRepository } from './profile.repository';
import { ProfileDocument } from './profile.schema';

@Injectable()
export class ProfileService {
    constructor(private readonly profileRepository: ProfileRepository) {}

    public async handleGetProfiles(limit: number, last_id: string, created_at: EMovieSort): Promise<ProfileDocument[]> {
        const sortQuery: Record<string, SortOrder> = {
            created_at: Object.values(EMovieSort).includes(created_at) ? created_at : EMovieSort.DESC,
        };

        return this.profileRepository.findProfiles(limit, last_id, ['_id', 'active', 'experience', 'partner', 'premium', 'titles', 'interaction_history', 'created_at', 'updated_at'], sortQuery);
    }

    public async handleGetProfilesCount(): Promise<number> {
        return this.profileRepository.countDocuments({});
    }

    public async handleGetProfileById(profile_id: string): Promise<Partial<ProfileDocument>> {
        const profile = await this.profileRepository.findProfileById(
            profile_id,
            ['_id', 'active', 'experience', 'partner', 'premium', 'titles', 'interaction_history', 'created_at', 'updated_at'],
            false,
        );

        if (profile) {
            const currentDate = new Date().toISOString().split('T')[0];
            const isExisting = profile.interaction_history.some((date: Date) => date.toISOString().split('T')[0] === currentDate);

            if (!isExisting) {
                profile.interaction_history.push(new Date());

                // Giới hạn mảng interaction_history không vượt quá 30 phần tử
                if (profile.interaction_history.length > 30) {
                    profile.interaction_history.shift();
                }

                // Chuẩn hóa ngày về định dạng yyyy-mm-dd và sắp xếp
                const sortedDates = profile.interaction_history.map((date) => new Date(date).toISOString().split('T')[0]).sort((a, b) => (a > b ? 1 : -1));

                // Kiểm tra xem ngày hiện tại có trong lịch sử chưa
                const today = new Date().toISOString().split('T')[0];
                if (!sortedDates.includes(today)) {
                    sortedDates.push(today);
                    sortedDates.sort((a, b) => (a > b ? 1 : -1));
                }

                // Tính số ngày liên tiếp
                let consecutiveCount = 1;
                let maxConsecutiveCount = 1;

                for (let i = 1; i < sortedDates.length; i++) {
                    const prev = new Date(sortedDates[i - 1]);
                    const curr = new Date(sortedDates[i]);
                    const diff = curr.getTime() - prev.getTime();

                    if (diff === 86400000) {
                        // Cách nhau đúng 1 ngày
                        consecutiveCount += 1;
                    } else if (diff === 0) {
                        continue; // Cùng ngày, bỏ qua
                    } else {
                        consecutiveCount = 1;
                    }

                    maxConsecutiveCount = Math.max(maxConsecutiveCount, consecutiveCount);
                }

                // Cộng kinh nghiệm
                profile.experience += 1;

                // Gán hoặc gỡ danh hiệu DAILY_GRINDER nếu đạt >16 ngày liên tục
                const dailyStreak = EAccountTitle.DAILY_STREAK;

                if (maxConsecutiveCount > 15) {
                    if (!profile.titles.includes(dailyStreak)) {
                        profile.titles.push(dailyStreak);
                    }
                } else {
                    profile.titles = profile.titles.filter((t) => t !== dailyStreak);
                }

                // Gỡ danh hiệu NEWBIE nếu kinh nghiệm > 100
                const newbie = EAccountTitle.NEWBIE;
                if (profile.experience > 100 && profile.titles.includes(newbie)) {
                    profile.titles = profile.titles.filter((t) => t !== newbie);
                }

                const pillar_member = EAccountTitle.PILLAR_MEMBER;
                if (profile.experience > 500 && !profile.titles.includes(pillar_member)) {
                    profile.titles.push(pillar_member);
                }
            }

            await profile.save();
            return profile;
        } else {
            return this.profileRepository.createProfile(profile_id);
        }
    }

    public async handlePatchProfile(profile_id: string, payload: { active: boolean; experience: number; partner: boolean; premium: boolean; title: EAccountTitle[] }): Promise<void> {
        const { matchedCount, modifiedCount } = await this.profileRepository.updateProfile(profile_id, payload);
        if (matchedCount === 0) throw new NotFoundException('Profile not found');
        if (modifiedCount === 0) throw new InternalServerErrorException('No changes were made to the profile');
    }

    public async handleDeleteProfile(profile_id: string): Promise<void> {
        const { acknowledged, deletedCount } = await this.profileRepository.deleteProfileById(profile_id);
        if (deletedCount === 0) throw new NotFoundException('Profile not found');
        if (!acknowledged) throw new InternalServerErrorException('Failed to acknowledge the deletion');
    }
}
