import { formatDistanceToNow } from 'date-fns';
import { Comment } from '@/types';

interface CommentItemProps {
    comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
    return (
        <div className="flex space-x-3 text-sm">
            <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                    {comment.user.name[0]}
                </div>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{comment.user.name}</span>
                    <span className="text-gray-500 text-xs">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-gray-800">{comment.content}</p>
            </div>
        </div>
    );
}
