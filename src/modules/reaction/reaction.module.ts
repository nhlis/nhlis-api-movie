import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reaction, ReactionSchema } from './reaction.schema';
import { ReactionController } from './reaction.controller';
import { ReactionRepository } from './reaction.repository';
import { ReactionService } from './reaction.service';
import { EpisodeModule } from '../../modules/movies/episode/episode.module';
import { CommentModule } from '../comment/comment.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Reaction.name, schema: ReactionSchema }]), forwardRef(() => EpisodeModule), CommentModule],
    controllers: [ReactionController],
    providers: [ReactionRepository, ReactionService],
    exports: [ReactionRepository, ReactionService],
})
export class ReactionModule {}
