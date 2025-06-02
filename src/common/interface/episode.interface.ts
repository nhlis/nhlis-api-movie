import { EReactionType } from '../enums/movie/reaction-type.movie.enum';

export interface IEpisodeResponse {
    _id: string;
    overview_id: string;
    season_id: string;
    title: string;
    description: string;
    episode_number: number;
    duration: number;
    release_date: Date;
    img: string;
    premium: boolean;
    count_view: number;
    count_comment: number;
    count_like: number;
    count_dislike: number;
    created_at: Date;
    updated_at: Date;
    reaction_type?: EReactionType;
}
