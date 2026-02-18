'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/common/Modal';
import { api } from '@/services/api';
import { Post } from '@/types';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [userId, setUserId] = useState('user-1'); // Default for demo
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: async (newPost: { userId: string; content: string }) => {
            const res = await api.post('/posts', newPost);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            toast.success('Post created successfully!');
            setContent('');
            onClose();
        },
        onError: () => {
            toast.error('Failed to create post');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        mutate({ userId, content });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Post">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* User ID Input - per requirements */}
                <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">User ID (Demo)</label>
                    <input
                        type="text"
                        id="userId"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        placeholder="Enter user ID..."
                    />
                </div>

                <div>
                    <label htmlFor="content" className="sr-only">Content</label>
                    <textarea
                        id="content"
                        rows={4}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none px-4 py-3 text-base"
                        placeholder="What's on your mind?"
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>

                    <button
                        type="submit"
                        disabled={!content.trim() || isPending}
                        className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                Post
                                <Send className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
