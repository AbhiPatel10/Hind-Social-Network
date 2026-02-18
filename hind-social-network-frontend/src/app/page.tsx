import FeedList from '@/components/feed/FeedList';
import Navbar from '@/components/layout/Navbar';
import { Suspense } from 'react';

export default function Home() {
  return (
    <>
      <Suspense fallback={<nav className="h-16 bg-white border-b border-gray-200" />}>
        <Navbar />
      </Suspense>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-8 justify-center lg:justify-center">
          <div className="w-full max-w-xl">
            {/* Feed Header */}
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Feed</h1>
              <div className="flex space-x-2 text-sm">
                <span className="text-gray-500">Sort by:</span>
                <span className="font-medium text-gray-900 cursor-pointer">Latest</span>
              </div>
            </div>
            <Suspense fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}>
              <FeedList />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
