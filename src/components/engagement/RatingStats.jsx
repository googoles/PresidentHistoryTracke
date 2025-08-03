import React, { useState, useEffect } from 'react';
import { Star, BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { ratingOperations, analyticsOperations } from '../../utils/database';

const RatingStats = ({ promiseId, compact = false }) => {
  const [stats, setStats] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load rating statistics
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get basic promise statistics
      const { data: statsData, error: statsError } = await ratingOperations.getPromiseStats(promiseId);
      
      if (statsError && statsError.code !== 'PGRST116') {
        throw new Error(statsError.message);
      }

      // Get rating distribution by getting all ratings
      const { data: ratingsData, error: ratingsError } = await ratingOperations.getPromiseRatings(
        promiseId, 
        { page: 1, limit: 1000, sortBy: 'created_at', sortOrder: 'desc' }
      );

      if (ratingsError) {
        console.warn('Could not load rating distribution:', ratingsError);
      }

      // Calculate distribution if we have ratings data
      let distribution = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
      if (ratingsData && ratingsData.length > 0) {
        ratingsData.forEach(rating => {
          if (rating.rating >= 1 && rating.rating <= 5) {
            distribution[rating.rating - 1]++;
          }
        });
      }

      setStats(statsData || {
        promise_id: promiseId,
        average_rating: ratingsData ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length : 0,
        total_ratings: ratingsData ? ratingsData.length : 0,
        total_comments: ratingsData ? ratingsData.filter(r => r.comment).length : 0
      });
      
      setRatingDistribution(distribution);

    } catch (err) {
      console.error('Failed to load rating stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [promiseId]);

  // Render star rating display
  const renderStars = (rating, size = 'w-4 h-4') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className={`${size} text-yellow-400 fill-current`} />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className={`${size} text-gray-300 dark:text-gray-600`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${size} text-yellow-400 fill-current`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className={`${size} text-gray-300 dark:text-gray-600`} />
        );
      }
    }
    return stars;
  };

  // Render rating distribution bar
  const renderDistributionBar = (starLevel, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div key={starLevel} className="flex items-center gap-3 py-1">
        <div className="flex items-center gap-1 w-12">
          <span className="text-sm text-gray-600 dark:text-slate-300">{starLevel}</span>
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
        </div>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-slate-400 w-8 text-right">
          {count}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-100 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-700 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 dark:text-red-400 text-sm">통계를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_ratings === 0) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">
            아직 평가가 없습니다
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            첫 번째로 이 공약을 평가해보세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
          평가 통계
        </h3>
      </div>

      {/* Overall Rating */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            {renderStars(stats.average_rating, 'w-5 h-5')}
          </div>
          <span className="text-2xl font-bold text-gray-800 dark:text-slate-100">
            {stats.average_rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{stats.total_ratings}명 평가</span>
          </div>
          {stats.total_comments > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.total_comments}개 의견</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating Distribution */}
      {!compact && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            평점 분포
          </h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(starLevel => 
              renderDistributionBar(
                starLevel, 
                ratingDistribution[starLevel - 1], 
                stats.total_ratings
              )
            )}
          </div>
        </div>
      )}

      {/* Additional Stats */}
      {!compact && stats.last_rating_date && (
        <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>
              최근 평가: {new Date(stats.last_rating_date).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      )}

      {/* Quick Insights */}
      {!compact && stats.total_ratings >= 10 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
          <h5 className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-2">
            💡 인사이트
          </h5>
          <div className="space-y-1 text-xs text-gray-600 dark:text-slate-300">
            {stats.average_rating >= 4.0 && (
              <p>• 시민들의 높은 만족도를 보이고 있습니다</p>
            )}
            {stats.average_rating < 2.5 && (
              <p>• 개선이 필요한 공약으로 평가되고 있습니다</p>
            )}
            {(stats.total_comments / stats.total_ratings) > 0.7 && (
              <p>• 시민들의 적극적인 참여가 이루어지고 있습니다</p>
            )}
            {ratingDistribution[4] > ratingDistribution.reduce((sum, count, idx) => idx !== 4 ? sum + count : sum, 0) && (
              <p>• 대부분의 시민들이 긍정적으로 평가하고 있습니다</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingStats;