'use client';

import Link from 'next/link';
import { Bell, Home, MessageSquare, PlusSquare, Search, User } from 'lucide-react';
import { useState } from 'react';
import CreatePostModal from '@/components/post/CreatePostModal';

export default function Navbar() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/" className="text-xl font-bold text-indigo-600">
                                    Hind Social
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <button className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors hidden sm:block">
                                <Search className="w-5 h-5" />
                            </button>

                            <Link href="/" className="p-2 text-gray-900 bg-gray-100 rounded-full">
                                <Home className="w-5 h-5" />
                            </Link>

                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-colors shadow-sm ml-2"
                            >
                                <PlusSquare className="w-4 h-4" />
                                <span className="text-sm font-medium hidden sm:inline">Create</span>
                            </button>

                            <button className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                                <MessageSquare className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                                <Bell className="w-5 h-5" />
                            </button>
                            <div className="h-8 w-8 rounded-full bg-gray-200 ml-2 overflow-hidden">
                                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-xs">
                                    U
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </>
    );
}
