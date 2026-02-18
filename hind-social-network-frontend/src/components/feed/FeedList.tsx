'use client';

import { useFeed } from '@/hooks/useFeed';
import PostCard from '@/components/post/PostCard';
import PostSkeleton from '@/components/post/PostSkeleton';
import { useEffect, useRef } from 'react';

export default function FeedList() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useFeed();

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <PostSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">Failed to load feed. Please try again.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-indigo-600 font-medium hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-10">
            {data?.pages.map((page, i) => (
                <div key={i}>
                    {page.data.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ))}

            {/* Loading Indicator / Sentinel */}
            <div ref={loadMoreRef} className="py-8 text-center">
                {isFetchingNextPage ? (
                    <div className="space-y-4">
                        <PostSkeleton />
                    </div>
                ) : hasNextPage ? (
                    <button
                        onClick={() => fetchNextPage()}
                        className="text-indigo-600 text-sm hover:underline"
                    >
                        Load More
                    </button>
                ) : (
                    data && data.pages.length > 0 && (
                        <p className="text-gray-400 text-sm">You&apos;ve reached the end of the feed.</p>
                    )
                )}

                {!hasNextPage && (!data || data.pages.length === 0) && (
                    <div className="text-center py-10 text-gray-500">
                        No posts yet. Be the first to post!
                    </div>
                )}
            </div>
        </div>
    );
}
