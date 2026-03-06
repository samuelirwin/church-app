export type MediaItem = {
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    url: string;
    collection_name: string;
    model_type: string;
    created_at: string;
};

export type MediaPaginatedResponse = {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};
