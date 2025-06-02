export interface ICommentRespone {
    _id: string;
    profile_id: string;
    episode_id: string;
    text: string;
    parent_id: string;
    reply_id: string;
    reply_profile_id: string;
    reply_first_name?: string;
    reply_last_name?: string;
    is_edit: boolean;
    is_like?: boolean;
    is_dislike?: boolean;
    experience: number;
    partner: boolean;
    titles: { title: string; color: string }[];
    count_child: number;
    count_like: number;
    count_dislike: number;
    created_at: Date;
    updated_at: Date;
}
