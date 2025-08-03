import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageCircle, ThumbsUp, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ratingOperations, dbUtils } from '../../utils/database';

const RatingCard = ({ promiseId, showHeader = true, compact = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load ratings data
  const loadRatings = async (pageNum = 1) => {
    try {
      setLoading(true);
      
      // Get ratings for promise
      const { data: ratingsData, error: ratingsError } = await ratingOperations.getPromiseRatings(
        promiseId,
        { page: pageNum, limit: compact ? 3 : 10, sortBy: 'helpful_count', sortOrder: 'desc' }
      );

      if (ratingsError) {
        throw new Error(ratingsError.message);
      }

      // Get user's rating if authenticated
      let userRatingData = null;
      if (isAuthenticated && user) {
        const { data: userRat, error: userRatError } = await ratingOperations.getUserRating(promiseId, user.id);
        if (!userRatError && userRat) {
          userRatingData = userRat;
        }
      }

      // Get promise statistics
      const { data: stats, error: statsError } = await ratingOperations.getPromiseStats(promiseId);
      
      if (pageNum === 1) {
        setRatings(ratingsData || []);
      } else {
        setRatings(prev => [...prev, ...(ratingsData || [])]);
      }
      
      setUserRating(userRatingData);
      setHasMore((ratingsData || []).length === (compact ? 3 : 10));
      
      if (stats && !statsError) {
        setAverageRating(stats.average_rating || 0);
        setTotalRatings(stats.total_ratings || 0);
      } else {
        // Calculate from loaded ratings if stats not available
        if (ratingsData && ratingsData.length > 0) {
          const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
          setAverageRating(avg);
          setTotalRatings(ratingsData.length);
        }
      }
      
    } catch (err) {
      console.error('Failed to load ratings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, [promiseId, user]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadRatings(nextPage);
    }
  };

  // Touch-friendly star rating with larger hit areas
  const renderStars = (rating, interactive = false, size = 'w-4 h-4', onStarClick = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        interactive ? (
          <button
            key={i}
            type="button"
            onClick={() => onStarClick?.(i)}
            className="p-2 touch-manipulation" // 44x44px minimum touch target
            aria-label={`${i}점 평가`}
          >
            <Star
              className={`${size} ${
                i <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300 dark:text-gray-600'
              } transition-colors`}
            />
          </button>
        ) : (
          <Star
            key={i}
            className={`${size} ${
              i <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        )
      );
    }
    return stars;
  };

  // Render rating summary
  const renderRatingSummary = () => (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-1">
        {renderStars(Math.round(averageRating))}
      </div>
      <span className="text-lg font-semibold text-gray-800 dark:text-slate-100">
        {averageRating.toFixed(1)}
      </span>
      <span className="text-sm text-gray-600 dark:text-slate-300">
        ({totalRatings}개의 평가)
      </span>
    </div>
  );

  // Mobile-optimized individual rating with touch-friendly buttons
  const renderRating = (rating) => (
    <div key={rating.id} className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {rating.profile?.avatar_url ? (
            <img
              src={rating.profile.avatar_url}
              alt={rating.profile.full_name || rating.profile.username}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600 dark:text-slate-300" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {renderStars(rating.rating, false, 'w-4 h-4 sm:w-3.5 sm:h-3.5')}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-800 dark:text-slate-100">
                {rating.profile?.full_name || rating.profile?.username || '익명'}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {dbUtils.getRelativeTime(rating.created_at)}
              </span>
            </div>
          </div>
          
          {rating.comment && (
            <p className="text-sm text-gray-700 dark:text-slate-300 mb-3 leading-relaxed">
              {rating.comment}
            </p>
          )}
          
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-2 p-2 -m-2 touch-manipulation hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs text-gray-500 dark:text-slate-400"
              aria-label="도움이 됨"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{rating.helpful_count || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && ratings.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-700">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">평가를 불러오는 중 오류가 발생했습니다</p>
          <button
            onClick={() => loadRatings()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 ${!compact ? 'p-6' : 'p-4'}`}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
            시민 평가
          </h3>
        </div>
      )}

      {/* Rating Summary */}
      {totalRatings > 0 && renderRatingSummary()}

      {/* User's Rating Display */}
      {userRating && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            <span>내 평가:</span>
            <div className="flex items-center gap-1">
              {renderStars(userRating.rating)}
            </div>
          </div>
          {userRating.comment && (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              "{userRating.comment}"
            </p>
          )}
        </div>
      )}

      {/* Ratings List */}
      {ratings.length > 0 ? (
        <div className="space-y-3">
          {ratings
            .filter(rating => !userRating || rating.id !== userRating.id)
            .slice(0, compact ? 3 : ratings.length)
            .map(renderRating)}
          
          {!compact && hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
            >
              {loading ? '로딩 중...' : '더 보기'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400 mb-4">
            아직 평가가 없습니다
          </p>
          {isAuthenticated && (
            <p className="text-sm text-gray-400 dark:text-slate-500">
              첫 번째로 이 공약을 평가해보세요
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingCard;