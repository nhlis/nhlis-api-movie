import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CommentService } from './comment.service';
import { Comment, CommentSchema } from './comment.schema';
import { CommentController } from './comment.controller';
import { CommentRepository } from './comment.repository';
import { EpisodeModule } from '../../modules/movies/episode/episode.module';
import { ProfileModule } from '../../modules/profile/profile.module';
import { ReactionModule } from '../reaction/reaction.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]), forwardRef(() => EpisodeModule), forwardRef(() => ReactionModule), ProfileModule],
    controllers: [CommentController],
    providers: [CommentRepository, CommentService],
    exports: [CommentRepository, CommentService],
})
export class CommentModule {}
