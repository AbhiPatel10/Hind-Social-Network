'use client';

import Link from 'next/link';
import { Bell, PlusSquare, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreatePostModal from '@/components/post/CreatePostModal';
import { useDebounce } from '@/hooks/useDebounce';

export default function Navbar() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Optional: Keep for immediate enter key search if desired, 
        // but debounce handles it mostly.
    };

    // Effect to update URL when debounced value changes
    useEffect(() => {
        const currentQuery = searchParams.get('q') || '';
        if (currentQuery === debouncedSearchQuery) return;

        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearchQuery) {
            params.set('q', debouncedSearchQuery);
        } else {
            params.delete('q');
        }
        router.push(`/?${params.toString()}`);
    }, [debouncedSearchQuery, router, searchParams]);

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
                            <form onSubmit={handleSearch} className="relative hidden sm:block">
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    className="bg-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="absolute left-0 top-0 mt-2 ml-3 text-gray-400">
                                    <Search className="w-5 h-5" />
                                </button>
                            </form>

                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-colors shadow-sm ml-2"
                            >
                                <PlusSquare className="w-4 h-4" />
                                <span className="text-sm font-medium hidden sm:inline">Create</span>
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
