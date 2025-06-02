import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';
import { Profile, ProfileSchema } from './profile.schema';
import { ProfileController } from './profile.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }])],
    controllers: [ProfileController],
    providers: [ProfileRepository, ProfileService],
    exports: [ProfileRepository, ProfileService],
})
export class ProfileModule {}
