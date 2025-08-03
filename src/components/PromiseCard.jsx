import React, { useState, memo, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  TrendingUp, 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Bookmark,
  Star,
  MessageCircle,
  FileText,
  Users,
  Wifi,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { statusConfig } from '../data/categories';
import { useAuth } from '../hooks/useAuth';
import { usePromiseRealtime } from '../hooks/useRealtime';
import { dbUtils } from '../utils/database';
import RatingCard from './engagement/RatingCard';
import RatingModal from './engagement/RatingModal';
import ReportGallery from './reports/ReportGallery';
import CommentSection from './comments/CommentSection';
import SocialShareButton from './social/SocialShareButton';
import { showSuccessNotification } from './NotificationSystem';

const PromiseCard = memo(({ promise, onShare, onBookmark, isBookmarked = false, showEngagement = true }) => {
  const { isAuthenticated, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'ratings', 'reports', 'comments'
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [engagementStats, setEngagementStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    totalComments: 0,
    totalReports: 0
  });
  const [hasLiveUpdates, setHasLiveUpdates] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const cardRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const swipeThreshold = 50;
  
  // Real-time hooks for this promise
  const { subscribeToComments, subscribeToRatings } = usePromiseRealtime(promise.id);

  // Handle real-time comment updates
  const handleCommentUpdate = useCallback((payload) => {
    setHasLiveUpdates(true);
    setLastUpdateTime(new Date());
    
    if (payload.eventType === 'INSERT') {
      setEngagementStats(prev => ({
        ...prev,
        totalComments: prev.totalComments + 1
      }));
      
      // Show notification for new comments (if not from current user)
      if (payload.new?.user_id !== user?.id) {
        showSuccessNotification(
          `새 댓글이 추가되었습니다.`,
          `${promise.title}`
        );
      }
    }
  }, [promise.title, promise.id, user?.id]);

  // Handle real-time rating updates  
  const handleRatingUpdate = useCallback((payload) => {
    setHasLiveUpdates(true);
    setLastUpdateTime(new Date());
    
    if (payload.eventType === 'INSERT') {
      setEngagementStats(prev => ({
        ...prev,
        totalRatings: prev.totalRatings + 1
      }));
      
      // Show notification for new ratings (if not from current user)
      if (payload.new?.user_id !== user?.id) {
        showSuccessNotification(
          `새 평가가 등록되었습니다. (${payload.new.rating}점)`,
          `${promise.title}`
        );
      }
    }
  }, [promise.title, promise.id, user?.id]);

  // Set up real-time subscriptions when card is expanded
  useEffect(() => {
    if (isExpanded && showEngagement) {
      const unsubscribeComments = subscribeToComments(handleCommentUpdate);
      const unsubscribeRatings = subscribeToRatings(handleRatingUpdate);
      
      return () => {
        unsubscribeComments();
        unsubscribeRatings();
      };
    }
  }, [isExpanded, showEngagement, subscribeToComments, subscribeToRatings, handleCommentUpdate, handleRatingUpdate]);

  // Reset live update indicator after 10 seconds
  useEffect(() => {
    if (hasLiveUpdates) {
      const timer = setTimeout(() => {
        setHasLiveUpdates(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [hasLiveUpdates]);

  // Touch gesture handlers for swipe navigation
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;

    // Only handle horizontal swipes that are more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      e.preventDefault();
    }
  }, [swipeThreshold]);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;

    // Only handle horizontal swipes that are more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        // Swipe left - next tab
        const currentIndex = engagementTabs.findIndex(tab => tab.id === activeTab);
        const nextIndex = (currentIndex + 1) % engagementTabs.length;
        setActiveTab(engagementTabs[nextIndex].id);
        if (!isExpanded) setIsExpanded(true);
      } else {
        // Swipe right - previous tab
        const currentIndex = engagementTabs.findIndex(tab => tab.id === activeTab);
        const prevIndex = currentIndex === 0 ? engagementTabs.length - 1 : currentIndex - 1;
        setActiveTab(engagementTabs[prevIndex].id);
        if (!isExpanded) setIsExpanded(true);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [activeTab, engagementTabs, isExpanded, swipeThreshold]);
  const getProgressBarColor = () => {
    return statusConfig[promise.status]?.progressColor || 'bg-gray-500';
  };

  const getStatusBadge = () => {
    const config = statusConfig[promise.status] || statusConfig['중단'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {promise.status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const isLongDescription = promise.description && promise.description.length > 120;
  const displayDescription = showFullDescription || !isLongDescription 
    ? promise.description 
    : `${promise.description.slice(0, 120)}...`;

  const handleShare = (e) => {
    e.stopPropagation();
    onShare?.(promise);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    onBookmark?.(promise);
  };

  const handleRatingClick = (e) => {
    e.stopPropagation();
    if (isAuthenticated) {
      setShowRatingModal(true);
    }
  };

  const handleRatingSubmitted = (newRating) => {
    setUserRating(newRating);
    setEngagementStats(prev => ({
      ...prev,
      totalRatings: prev.totalRatings + (userRating ? 0 : 1)
    }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // Engagement tab options
  const engagementTabs = [
    { id: 'overview', label: '개요', icon: BarChart3 },
    { id: 'ratings', label: '평가', icon: Star, count: engagementStats.totalRatings },
    { id: 'reports', label: '제보', icon: FileText, count: engagementStats.totalReports },
    { id: 'comments', label: '댓글', icon: MessageCircle, count: engagementStats.totalComments }
  ];

  return (
    <article 
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-md border-l-4 ${statusConfig[promise.status]?.borderColor || 'border-gray-500'} hover:shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50`}
      aria-labelledby={`promise-title-${promise.id}`}
      aria-describedby={`promise-description-${promise.id}`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 
              id={`promise-title-${promise.id}`}
              className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2 leading-tight"
            >
              {promise.title}
            </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{promise.category}</span>
            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
              {promise.level === 'national' ? '대통령 공약' : '지자체 공약'}
            </span>
          </div>
        </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleBookmark}
              className={`p-3 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${
                isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
              }`}
              aria-label={isBookmarked ? '북마크 제거' : '북마크 추가'}
              title={isBookmarked ? '북마크 제거' : '북마크 추가'}
            >
              <Bookmark className={`w-5 h-5 sm:w-4 sm:h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <SocialShareButton 
              promise={promise}
              userRating={userRating?.rating}
              size="small"
              showLabel={false}
              className=""
            />
            {getStatusBadge()}
          </div>
        </div>

        <p 
          id={`promise-description-${promise.id}`}
          className="text-gray-700 dark:text-slate-300 mb-4 leading-relaxed"
        >
          {displayDescription}
          {isLongDescription && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium focus:outline-none focus:underline"
              aria-label={showFullDescription ? '간략히 보기' : '전체 보기'}
            >
              {showFullDescription ? '간략히' : '더보기'}
            </button>
          )}
        </p>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">진행률</span>
            <span className="text-sm font-bold text-gray-800 dark:text-slate-100">{promise.progress}%</span>
          </div>
          <div 
            className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3"
            role="progressbar"
            aria-valuenow={promise.progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`${promise.title} 진행률 ${promise.progress}%`}
          >
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
              style={{ width: `${promise.progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-300 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>시작: {formatDate(promise.startDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>목표: {formatDate(promise.targetDate)}</span>
          </div>
        </div>

        {/* Engagement Summary */}
        {showEngagement && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                <Users className="w-4 h-4" />
                시민 참여
              </h4>
              {isAuthenticated && (
                <button
                  onClick={handleRatingClick}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors touch-manipulation min-h-[36px]"
                >
                  <Star className="w-4 h-4" />
                  평가하기
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-semibold">{engagementStats.averageRating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  {engagementStats.totalRatings}개 평가
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold">{engagementStats.totalReports}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400">시민 제보</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-semibold">{engagementStats.totalComments}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400">댓글</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats and expand button */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            {promise.statistics && promise.statistics.length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {promise.statistics.slice(0, 2).map((stat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <BarChart3 className="w-3 h-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {stat.label}: <strong>{stat.value}{stat.unit}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 touch-manipulation min-h-[44px]"
            aria-expanded={isExpanded}
            aria-controls={`promise-details-${promise.id}`}
          >
            {isExpanded ? '간략히' : '자세히'}
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      
      {/* Expandable section for detailed content */}
      {isExpanded && (
        <div 
          id={`promise-details-${promise.id}`}
          className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 -mx-6 -mb-6 rounded-b-lg"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          ref={cardRef}
        >
          {/* Tab Navigation with swipe indicators */}
          {showEngagement && (
            <div className="px-4 sm:px-6 pt-4">
              <div className="relative">
                {/* Mobile swipe hint */}
                <div className="flex items-center justify-center mb-2 sm:hidden">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <ChevronLeft className="w-3 h-3" />
                    <span>좌우로 스와이프</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                
                <div className="flex gap-1 mb-4 bg-white dark:bg-slate-800 rounded-lg p-1 overflow-x-auto scrollbar-hide">
                  {engagementTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-manipulation min-h-[44px] ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.charAt(0)}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                          <span className={`px-2 py-1 rounded-full text-xs min-w-[20px] text-center ${
                            activeTab === tab.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="px-4 sm:px-6 pb-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {promise.statistics && promise.statistics.length > 2 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" aria-hidden="true" />
                      상세 통계
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {promise.statistics.map((stat, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                          <span className="text-xs text-gray-600 dark:text-gray-300 block mb-1">{stat.label}</span>
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            {stat.value}
                            <span className="text-sm font-normal text-gray-600 dark:text-gray-300 ml-1">{stat.unit}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {promise.relatedArticles && promise.relatedArticles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" aria-hidden="true" />
                      관련 기사 ({promise.relatedArticles.length}개)
                    </h4>
                    <div className="space-y-3">
                      {promise.relatedArticles.map((article, index) => (
                        <a
                          key={index}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 group transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                          aria-label={`${article.title} - ${article.source}에서 새 창으로 열기`}
                        >
                          <ExternalLink className="w-4 h-4 mt-1 flex-shrink-0 group-hover:text-blue-800 dark:group-hover:text-blue-300" aria-hidden="true" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-slate-100 group-hover:text-blue-800 dark:group-hover:text-blue-300">{article.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {article.source} · {article.date}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showEngagement && activeTab === 'ratings' && (
              <RatingCard
                promiseId={promise.id}
                showHeader={false}
                compact={false}
              />
            )}

            {showEngagement && activeTab === 'reports' && (
              <ReportGallery
                promiseId={promise.id}
                promiseTitle={promise.title}
                compact={false}
              />
            )}

            {showEngagement && activeTab === 'comments' && (
              <CommentSection
                promiseId={promise.id}
                promiseTitle={promise.title}
                compact={false}
              />
            )}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        promiseId={promise.id}
        promiseTitle={promise.title}
        existingRating={userRating}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </article>
  );
});

PromiseCard.displayName = 'PromiseCard';

export default PromiseCard;