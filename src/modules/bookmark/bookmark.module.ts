import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BookmarkController } from './bookmark.controller';
import { Bookmark, BookmarkSchema } from './bookmark.schema';
import { BookmarkRepository } from './bookmark.repository';
import { BookmarkService } from './bookmark.service';
import { OverviewModule } from '../movies/overview/overview.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Bookmark.name, schema: BookmarkSchema }]), forwardRef(() => OverviewModule), ProfileModule],
    controllers: [BookmarkController],
    providers: [BookmarkRepository, BookmarkService],
    exports: [BookmarkRepository, BookmarkService],
})
export class BookmarkModule {}
