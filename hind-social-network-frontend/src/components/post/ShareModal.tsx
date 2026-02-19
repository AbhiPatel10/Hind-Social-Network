'use client';

import { Copy, Facebook, Instagram, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/common/Modal'; // Adjust path if Modal is in shared/common
// Using Phone icon as a placeholder for WhatsApp if a specific WhatsApp icon isn't available in the standard set or using external SVG. 
// Lucide doesn't have brand icons by default in all versions, but let's check if we can use something generic or if I should assume they have it.
// Actually, Lucide often doesn't have brand icons. I will use generic icons with colors or SVGs if possible.
// For now, I'll use text/generic icons and style them. 
// Wait, I can use simple SVGs for brands or just generic icons with labels. Use specific colors for recognition.

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    postUrl: string;
    onShare: (platform: string) => void;
}

export default function ShareModal({ isOpen, onClose, postUrl, onShare }: ShareModalProps) {

    const handleShare = (platform: string) => {
        let url = '';
        const encodedPostUrl = encodeURIComponent(postUrl);

        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodedPostUrl}`;
                window.open(url, '_blank');
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodedPostUrl}`;
                window.open(url, '_blank');
                break;
            case 'instagram':
                // Instagram doesn't support direct web sharing url well, just copy link
                navigator.clipboard.writeText(postUrl);
                toast.success('Link copied! Open Instagram to share.');
                break;
            case 'copy':
                navigator.clipboard.writeText(postUrl);
                toast.success('Link copied to clipboard!');
                break;
        }

        onShare(platform);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Post">
            <div className="grid grid-cols-4 gap-4">
                {/* WhatsApp */}
                <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-green-50 rounded-xl transition-colors group"
                >
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        {/* WhatsApp Icon usually fits Phone or MessageCircle, using generic MessageCircle for now if brand icon missing */}
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">WhatsApp</span>
                </button>

                {/* Facebook */}
                <button
                    onClick={() => handleShare('facebook')}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-blue-50 rounded-xl transition-colors group"
                >
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Facebook className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Facebook</span>
                </button>

                {/* Instagram */}
                <button
                    onClick={() => handleShare('instagram')}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-pink-50 rounded-xl transition-colors group"
                >
                    <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Instagram className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Instagram</span>
                </button>

                {/* Copy Link */}
                <button
                    onClick={() => handleShare('copy')}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                    <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Copy className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Copy Link</span>
                </button>
            </div>

            <div className="mt-6">
                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 truncate flex-1 px-2">{postUrl}</p>
                    <button
                        onClick={() => handleShare('copy')}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm"
                    >
                        Copy
                    </button>
                </div>
            </div>
        </Modal>
    );
}
