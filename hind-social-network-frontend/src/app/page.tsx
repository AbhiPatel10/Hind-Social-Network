import FeedList from '@/components/feed/FeedList';
import Navbar from '@/components/layout/Navbar';

export default function Home() {
  return (
    <>
      <Navbar />
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
            <FeedList />
          </div>
        </div>
      </main>
    </>
  );
}
