'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import PostCard from '@/components/post/PostCard';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Post } from '@/types';
import Link from 'next/link';

export default function PostDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.postId as string;
    const userId = 'user-1'; // Hardcoded for now

    const { data: post, isLoading, isError, error } = useQuery({
        queryKey: ['post', postId],
        queryFn: async () => {
            const res = await api.get(`/posts/${postId}`, { params: { userId } });
            return res.data.data as Post;
        },
        enabled: !!postId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-gray-500 font-medium">Loading post...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        The post you are looking for might have been deleted or does not exist.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Feed
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Feed
                </Link>
            </div>

            {post && <PostCard post={post} />}
        </div>
    );
}
