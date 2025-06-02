import { Controller, Get, Patch, Delete, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard, IUser, User } from '../../common';
import { QueryProfileDto } from './dtos/query-profile.dto';
import { PatchProfileDto } from './dtos/patch-profile.dto';
import { ProfileDocument } from './profile.schema';

@UseGuards(AuthGuard)
@Controller('profiles')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    // For api client user

    @Get('info')
    @HttpCode(HttpStatus.OK)
    public async handleGetProfileById(@User() user: IUser): Promise<{ profile: Partial<ProfileDocument> }> {
        const profile = await this.profileService.handleGetProfileById(user.sub);

        return { profile };
    }

    // ===========================================================================================

    @Get()
    @HttpCode(HttpStatus.OK)
    public async handleGetProfiles(@Query() query: QueryProfileDto): Promise<ProfileDocument[]> {
        return this.profileService.handleGetProfiles(query.limit, query.last_id, query.created_at);
    }

    @Get('count')
    @HttpCode(HttpStatus.OK)
    public async handleGetProfilesCount(): Promise<{ totalRecords: number }> {
        const totalRecords = await this.profileService.handleGetProfilesCount();
        return { totalRecords };
    }

    @Patch()
    @HttpCode(HttpStatus.OK)
    public async handlePatchProfile(@User() user: IUser, @Body() body: PatchProfileDto): Promise<void> {
        return this.profileService.handlePatchProfile(user.sub, {
            active: body.active,
            experience: body.experience,
            partner: body.partner,
            premium: body.premium,
            title: body.title,
        });
    }

    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    public async handleDeleteProfile(@User() user: IUser): Promise<void> {
        return this.profileService.handleDeleteProfile(user.sub);
    }
}
