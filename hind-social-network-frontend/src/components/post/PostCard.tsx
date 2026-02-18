'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Post } from '@/types';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from '@/components/comment/CommentSection';

interface PostCardProps {
    post: Post;
}

export default function PostCard({ post }: PostCardProps) {
    const queryClient = useQueryClient();
    const [isLiked, setIsLiked] = useState(post.hasLiked);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [showComments, setShowComments] = useState(false);

    // Sync local state with prop updates (e.g. from refetch)
    useEffect(() => {
        setIsLiked(!!post.hasLiked);
        setLikeCount(post.likeCount);
    }, [post.hasLiked, post.likeCount]);

    const userId = 'user-1'; // Hardcoded for now

    // Optimistic Like Mutation
    const { mutate: toggleLike } = useMutation({
        mutationFn: async (intent: 'like' | 'unlike') => {
            if (intent === 'unlike') {
                try {
                    const res = await api.delete(`/posts/${post.id}/like`, { params: { userId } });
                    return res.data.data; // Return new like count
                } catch (error: any) {
                    // If 404, valid state (unliked). We need to refetch or just assume decremented?
                    // Better to refetch or return a safe value.
                    if (error.response?.status === 404) return Math.max(0, likeCount - 1);
                    throw error;
                }
            } else {
                try {
                    const res = await api.post(`/posts/${post.id}/like`, { userId });
                    return res.data.data; // Return new like count
                } catch (error: any) {
                    // If 409, valid state (liked).
                    if (error.response?.status === 409) return likeCount; // Or likeCount + 1? Hard to know true state without fetching.
                    throw error;
                }
            }
        },
        onMutate: async (intent) => {
            await queryClient.cancelQueries({ queryKey: ['feed'] });
            const previousLiked = isLiked;
            const previousCount = likeCount;

            const newLiked = intent === 'like';
            setIsLiked(newLiked);
            // Optimistic update
            setLikeCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));

            return { previousLiked, previousCount };
        },
        onSuccess: (newCount) => {
            if (typeof newCount === 'number') {
                setLikeCount(newCount);
            }
        },
        onError: (err, newTodo, context) => {
            if (context) {
                setIsLiked(context.previousLiked);
                setLikeCount(context.previousCount);
            }
            toast.error('Failed to update like');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        },
    });

    const handleShare = async () => {
        try {
            await api.post(`/posts/${post.id}/share`, { userId });
            toast.success('Post shared!');
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        } catch (error) {
            toast.error('Failed to share');
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4 hover:shadow-md transition-shadow"
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                            {/* Placeholder or actual image */}
                            <div className="flex items-center justify-center h-full w-full bg-indigo-100 text-indigo-600 font-bold">
                                {post.user.name[0]}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 leading-tight">{post.user.name}</h3>
                            <p className="text-sm text-gray-500">@{post.user.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <p className="text-gray-800 text-base mb-4 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                </p>

                {/* Media */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-gray-100">
                        {/* Simplified media display for now */}
                        <div className="bg-gray-100 h-64 w-full flex items-center justify-center text-gray-400">
                            Media Preview
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    {/* Like */}
                    <button
                        onClick={() => toggleLike(isLiked ? 'unlike' : 'like')}
                        className={cn(
                            "flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-colors group",
                            isLiked ? "text-red-500 hover:bg-red-50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        )}
                    >
                        <div className="relative">
                            <AnimatePresence mode="wait">
                                {isLiked ? (
                                    <motion.div
                                        key="liked"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Heart className="w-5 h-5 fill-current" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="unliked"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Heart className="w-5 h-5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <span className="text-sm font-medium">{likeCount}</span>
                    </button>

                    {/* Comment */}
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={cn(
                            "flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-colors",
                            showComments ? "text-indigo-600 bg-indigo-50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        )}
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.commentCount}</span>
                    </button>

                    {/* Share */}
                    <button
                        onClick={handleShare}
                        className="flex items-center space-x-2 px-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.shareCount}</span>
                    </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <CommentSection postId={post.id} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
