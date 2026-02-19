'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
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
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [mediaInput, setMediaInput] = useState('');
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: async (newPost: { userId: string; content: string; mediaUrls: string[] }) => {
            const res = await api.post('/posts', newPost);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            toast.success('Post created successfully!');
            setContent('');
            setMediaUrls([]);
            setMediaInput('');
            onClose();
        },
        onError: () => {
            toast.error('Failed to create post');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && mediaUrls.length === 0) return;
        mutate({ userId, content, mediaUrls });
    };

    const handleAddMedia = () => {
        if (mediaInput.trim()) {
            setMediaUrls([...mediaUrls, mediaInput.trim()]);
            setMediaInput('');
        }
    };

    const handleRemoveMedia = (index: number) => {
        setMediaUrls(mediaUrls.filter((_, i) => i !== index));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Post">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Info & Scope */}
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        U
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">User</span>
                            <span className="text-gray-400 text-sm">•</span>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="text-sm border-none focus:ring-0 p-0 text-gray-500 placeholder-gray-400 w-32 bg-transparent"
                                placeholder="User ID"
                            />
                        </div>
                        <div className="text-xs text-gray-500">Public</div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative">
                    <textarea
                        id="content"
                        rows={5}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="block w-full border-none resize-none p-0 text-xl placeholder-gray-400 focus:ring-0"
                        placeholder="What's on your mind?"
                    />
                </div>

                {/* Media Preview Link List */}
                {mediaUrls.length > 0 && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attached Media</p>
                        <ul className="space-y-2">
                            {mediaUrls.map((url, index) => (
                                <li key={index} className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg border border-gray-200 text-sm shadow-sm group">
                                    <div className="flex items-center overflow-hidden flex-1 mr-3">
                                        <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center mr-3 text-gray-400">
                                            {/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /youtu/i.test(url) ? (
                                                <div className="w-4 h-4 bg-gray-400 rounded-full" /> // Video icon placeholder
                                            ) : (
                                                <ImageIcon className="w-4 h-4" />
                                            )}
                                        </div>
                                        <span className="truncate text-gray-600 font-medium">{url}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMedia(index)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Actions Bar */}
                <div className="border-t border-gray-100 pt-4">
                    <div className="space-y-4">
                        {/* Media Input */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={mediaInput}
                                    onChange={(e) => setMediaInput(e.target.value)}
                                    className="w-full pl-9 rounded-full border-gray-200 bg-gray-50 focus:bg-white transition-all shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2.5"
                                    placeholder="Paste image or video URL..."
                                />
                                <div className="absolute left-3 top-2.5 text-gray-400">
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddMedia}
                                disabled={!mediaInput.trim()}
                                className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={(!content.trim() && mediaUrls.length === 0) || isPending}
                                className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-indigo-100"
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
                    </div>
                </div>
            </form>
        </Modal>
    );
}
