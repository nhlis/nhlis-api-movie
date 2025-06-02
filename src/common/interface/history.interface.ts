import { EMovieType } from '../enums/movie/type.movie.enum';

export interface IHistoryRespone {
    _id: string;
    overview_id: string;
    overview_title: string;
    overview_type: EMovieType;
    episode_id: string;
    episode_title: string;
    episode_description: string;
    episode_duration: number;
    episode_number: number;
    episode_img: string;
    episode_premium: boolean;
    episode_release_date: Date;
}
