export default function PostSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
            </div>
            <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
            <div className="h-64 bg-gray-100 rounded-lg mb-4" />
            <div className="flex justify-between pt-2">
                <div className="h-8 w-16 bg-gray-100 rounded" />
                <div className="h-8 w-16 bg-gray-100 rounded" />
                <div className="h-8 w-16 bg-gray-100 rounded" />
            </div>
        </div>
    );
}
