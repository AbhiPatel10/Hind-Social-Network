'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '@/services/api';
import { Comment } from '@/types';
import CommentItem from './CommentItem';

interface CommentSectionProps {
    postId: string;
}

interface FetchCommentsResponse {
    data: Comment[];
    nextCursor?: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
    const [content, setContent] = useState('');
    const queryClient = useQueryClient();
    // Using userId 'user-1' for demo purposes as requested
    const userId = 'user-1';

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery<FetchCommentsResponse>({
        queryKey: ['comments', postId],
        queryFn: async ({ pageParam = undefined }) => {
            const res = await api.get(`/posts/${postId}/comments`, {
                params: { cursor: pageParam },
            });
            return {
                data: res.data.data.comments,
                nextCursor: res.data.data.nextCursor,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined,
    });

    const { mutate: addComment, isPending: isAdding } = useMutation({
        mutationFn: async () => {
            await api.post(`/posts/${postId}/comments`, { userId, content });
        },
        onSuccess: () => {
            setContent('');
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            queryClient.invalidateQueries({ queryKey: ['feed'] }); // Update comment count on feed
            toast.success('Comment added');
        },
        onError: () => {
            toast.error('Failed to add comment');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        addComment();
    };

    return (
        <div className="pt-4 border-t border-gray-100 mt-4 space-y-4">
            {/* List */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {isLoading && <p className="text-gray-500 text-sm text-center">Loading comments...</p>}
                {data?.pages.map((page, i) => (
                    <div key={i} className="space-y-3">
                        {page.data.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </div>
                ))}
                {hasNextPage && (
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-sm text-indigo-600 hover:text-indigo-700 w-full text-left"
                    >
                        {isFetchingNextPage ? 'Loading more...' : 'Load more comments'}
                    </button>
                )}
                {!isLoading && data?.pages[0]?.data.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-2">No comments yet.</p>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-lg border-gray-200 bg-gray-50 text-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
                />
                <button
                    type="submit"
                    disabled={!content.trim() || isAdding}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </form>
        </div>
    );
}
