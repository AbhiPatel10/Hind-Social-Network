import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Post } from '@/types';

interface FetchFeedResponse {
    data: Post[];
    nextCursor?: string;
}

export function useFeed(searchQuery?: string) {
    return useInfiniteQuery<FetchFeedResponse, Error>({
        queryKey: ['feed', searchQuery],
        queryFn: async ({ pageParam = undefined }) => {
            const res = await api.get('/posts/feed', {
                params: { cursor: pageParam, userId: 'user-1', search: searchQuery },
            });
            return {
                data: res.data.data.posts,
                nextCursor: res.data.data.nextCursor,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined,
    });
}
