import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  MessageCircle, 
  Send, 
  Copy, 
  ExternalLink,
  TrendingUp,
  Users,
  Star,
  Eye
} from 'lucide-react';
import { sharePromise, shareToPlatform, analyzeViralPotential, createShareableCard } from '../../utils/socialSharing';
import { useAuth } from '../../hooks/useAuth';

const SocialShareButton = ({ 
  promise, 
  userRating = null, 
  size = 'default', 
  showLabel = true,
  className = ''
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [viralData, setViralData] = useState(null);
  const [shareCount, setShareCount] = useState(0);
  const [showViralBadge, setShowViralBadge] = useState(false);

  useEffect(() => {
    checkViralStatus();
  }, [promise.id]);

  const checkViralStatus = async () => {
    try {
      const viral = await analyzeViralPotential(promise.id);
      setViralData(viral);
      setShowViralBadge(viral.isViral || viral.isTrending);
    } catch (error) {
      console.error('Error checking viral status:', error);
    }
  };

  const handleShare = async (method = null) => {
    setSharing(true);
    try {
      let result;
      if (method) {
        result = await shareToPlatform(method, promise, userRating);
      } else {
        result = await sharePromise(promise, userRating, {
          userId: user?.id,
          source: 'share_button'
        });
      }

      if (result.success) {
        setShareCount(prev => prev + 1);
        // Close dropdown after successful share
        if (method) {
          setIsOpen(false);
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setSharing(false);
    }
  };

  const handleCreateCard = async () => {
    try {
      const cardUrl = await createShareableCard(promise, {
        includeRating: true,
        includeProgress: true,
        includeComments: true,
        theme: 'light',
        size: 'large'
      });
      
      // Open card in new window for download
      window.open(cardUrl, '_blank');
    } catch (error) {
      console.error('Error creating shareable card:', error);
    }
  };

  const platforms = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-400 hover:bg-blue-50',
      action: () => handleShare('twitter')
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600 hover:bg-blue-50',
      action: () => handleShare('facebook')
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700 hover:bg-blue-50',
      action: () => handleShare('linkedin')
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'text-blue-500 hover:bg-blue-50',
      action: () => handleShare('telegram')
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600 hover:bg-green-50',
      action: () => handleShare('whatsapp')
    },
    {
      name: '복사',
      icon: Copy,
      color: 'text-gray-600 hover:bg-gray-50',
      action: () => handleShare()
    }
  ];

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 'w-7 h-7';
      case 'large':
        return 'w-12 h-12';
      default:
        return 'w-9 h-9';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'w-3.5 h-3.5';
      case 'large':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={sharing}
        className={`
          ${getButtonSize()} 
          bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
          flex items-center justify-center transition-all duration-200
          hover:scale-105 active:scale-95 shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
          ${showViralBadge ? 'relative' : ''}
        `}
        title="공약 공유하기"
      >
        {sharing ? (
          <div className={`${getIconSize()} border-2 border-white border-t-transparent rounded-full animate-spin`} />
        ) : (
          <>
            <Share2 className={getIconSize()} />
            {showViralBadge && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-2 h-2 text-white" />
              </div>
            )}
          </>
        )}
      </button>

      {/* Share Count */}
      {shareCount > 0 && (
        <span className={`
          absolute -top-2 -right-2 bg-green-500 text-white rounded-full 
          px-1.5 py-0.5 ${getTextSize()} font-bold min-w-[1.25rem] text-center
        `}>
          {shareCount > 99 ? '99+' : shareCount}
        </span>
      )}

      {/* Label */}
      {showLabel && (
        <span className={`block text-center mt-1 text-gray-600 dark:text-slate-300 ${getTextSize()}`}>
          공유
        </span>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-3 z-50 min-w-[280px]">
          {/* Viral Status Badge */}
          {viralData && (viralData.isViral || viralData.isTrending) && (
            <div className="mb-3 p-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-red-600 mr-2" />
                <span className="font-semibold text-red-800 dark:text-red-200">
                  {viralData.isViral ? '🔥 화제의 공약!' : '📈 주목받는 공약'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-red-700 dark:text-red-300">
                <span>바이럴 점수: {viralData.viralScore}</span>
                <span>시간당 참여: {viralData.metrics.velocity.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Promise Preview */}
          <div className="mb-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm line-clamp-2 mb-2">
              {promise.title}
            </h4>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-300">
              <span className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {promise.level === 'national' ? '국정' : '지방'}
              </span>
              <span className="flex items-center">
                <Star className="w-3 h-3 mr-1" />
                {promise.status}
              </span>
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {promise.progress}%
              </span>
            </div>
          </div>

          {/* Platform Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.name}
                  onClick={platform.action}
                  className={`
                    flex flex-col items-center p-2 rounded-lg transition-all duration-200
                    border border-gray-200 dark:border-slate-600 hover:border-transparent
                    ${platform.color} dark:text-slate-300 dark:hover:bg-slate-600
                  `}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{platform.name}</span>
                </button>
              );
            })}
          </div>

          {/* Advanced Options */}
          <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
            <button
              onClick={handleCreateCard}
              className="w-full flex items-center justify-center p-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              이미지 카드 생성
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SocialShareButton;