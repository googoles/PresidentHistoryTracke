import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageCircle, 
  Star, 
  Eye, 
  Share2, 
  Clock,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format, subDays, subHours } from 'date-fns';
import { promises } from '../../data/promises';

const TrendingPromises = ({ timeRange = '24h', limit = 10 }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trendingData, setTrendingData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortBy, setSortBy] = useState('trending_score');
  const [trendDirection, setTrendDirection] = useState('all');

  useEffect(() => {
    fetchTrendingPromises();
  }, [timeRange, selectedCategory, selectedRegion, sortBy]);

  const getTimeRangeHours = (range) => {
    switch (range) {
      case '1h': return 1;
      case '6h': return 6;
      case '24h': return 24;
      case '7d': return 168;
      default: return 24;
    }
  };

  const fetchTrendingPromises = async () => {
    setLoading(true);
    try {
      const hours = getTimeRangeHours(timeRange);
      const currentPeriodStart = subHours(new Date(), hours);
      const previousPeriodStart = subHours(new Date(), hours * 2);
      const previousPeriodEnd = currentPeriodStart;

      // Get all promises data
      const allPromises = [];
      Object.entries(promises).forEach(([region, regionPromises]) => {
        regionPromises.forEach(promise => {
          allPromises.push({
            ...promise,
            region: region
          });
        });
      });

      // Calculate trending scores for each promise
      const trendingPromises = await Promise.all(
        allPromises.map(async (promise) => {
          const currentMetrics = await getPromiseMetrics(promise.id, currentPeriodStart);
          const previousMetrics = await getPromiseMetrics(promise.id, previousPeriodStart, previousPeriodEnd);
          
          const trendingScore = calculateTrendingScore(currentMetrics, previousMetrics);
          const velocityScore = calculateVelocityScore(currentMetrics, hours);
          
          return {
            ...promise,
            ...currentMetrics,
            previousMetrics,
            trendingScore,
            velocityScore,
            trendDirection: getTrendDirection(currentMetrics, previousMetrics)
          };
        })
      );

      // Filter and sort
      const filtered = filterPromises(trendingPromises);
      const sorted = sortPromises(filtered);

      setTrendingData(sorted.slice(0, limit));
    } catch (error) {
      console.error('Error fetching trending promises:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPromiseMetrics = async (promiseId, startDate, endDate = new Date()) => {
    try {
      // Get comments count
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('promise_id', promiseId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get ratings count and average
      const { data: ratings, count: ratingsCount } = await supabase
        .from('promise_ratings')
        .select('rating', { count: 'exact' })
        .eq('promise_id', promiseId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get reports count
      const { count: reportsCount } = await supabase
        .from('citizen_reports')
        .select('*', { count: 'exact', head: true })
        .eq('promise_id', promiseId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get shares count (would need to track this separately)
      const sharesCount = Math.floor(Math.random() * 20); // Mock data for now

      // Calculate average rating
      const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      return {
        commentsCount: commentsCount || 0,
        ratingsCount: ratingsCount || 0,
        reportsCount: reportsCount || 0,
        sharesCount,
        averageRating: averageRating.toFixed(1),
        totalEngagement: (commentsCount || 0) + (ratingsCount || 0) + (reportsCount || 0) + sharesCount
      };
    } catch (error) {
      console.error('Error fetching promise metrics:', error);
      return {
        commentsCount: 0,
        ratingsCount: 0,
        reportsCount: 0,
        sharesCount: 0,
        averageRating: '0.0',
        totalEngagement: 0
      };
    }
  };

  const calculateTrendingScore = (current, previous) => {
    if (previous.totalEngagement === 0) {
      return current.totalEngagement > 0 ? 100 : 0;
    }
    
    const growth = ((current.totalEngagement - previous.totalEngagement) / previous.totalEngagement) * 100;
    const recencyBoost = current.totalEngagement * 0.1; // Boost for recent activity
    const diversityBonus = Math.min(current.commentsCount, current.ratingsCount, current.reportsCount) * 5;
    
    return Math.round(growth + recencyBoost + diversityBonus);
  };

  const calculateVelocityScore = (metrics, hours) => {
    // Engagement per hour
    return Math.round(metrics.totalEngagement / Math.max(hours, 1));
  };

  const getTrendDirection = (current, previous) => {
    if (current.totalEngagement > previous.totalEngagement * 1.1) return 'up';
    if (current.totalEngagement < previous.totalEngagement * 0.9) return 'down';
    return 'stable';
  };

  const filterPromises = (promisesList) => {
    return promisesList.filter(promise => {
      if (selectedCategory !== 'all' && promise.category !== selectedCategory) return false;
      if (selectedRegion !== 'all' && promise.region !== selectedRegion) return false;
      if (trendDirection !== 'all' && promise.trendDirection !== trendDirection) return false;
      return true;
    });
  };

  const sortPromises = (promisesList) => {
    return promisesList.sort((a, b) => {
      switch (sortBy) {
        case 'trending_score':
          return b.trendingScore - a.trendingScore;
        case 'velocity':
          return b.velocityScore - a.velocityScore;
        case 'engagement':
          return b.totalEngagement - a.totalEngagement;
        case 'comments':
          return b.commentsCount - a.commentsCount;
        case 'rating':
          return parseFloat(b.averageRating) - parseFloat(a.averageRating);
        default:
          return b.trendingScore - a.trendingScore;
      }
    });
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score) => {
    if (score > 50) return 'text-green-600 bg-green-50';
    if (score > 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const categories = ['all', '부동산정책', '복지정책', '교육정책', '경제정책', '환경정책'];
  const regions = ['all', 'seoul', 'gyeonggi', 'busan', 'daegu', 'incheon'];

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-slate-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
          실시간 주목받는 공약
        </h2>
        <p className="text-gray-600 dark:text-slate-300 text-sm">
          최근 {timeRange} 동안 가장 많은 관심을 받고 있는 공약들을 실시간으로 추적합니다.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-slate-100">필터:</span>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? '모든 분야' : category}
              </option>
            ))}
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            {regions.map(region => (
              <option key={region} value={region}>
                {region === 'all' ? '모든 지역' : region}
              </option>
            ))}
          </select>

          <select
            value={trendDirection}
            onChange={(e) => setTrendDirection(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="all">모든 트렌드</option>
            <option value="up">상승 중</option>
            <option value="down">하락 중</option>
            <option value="stable">안정</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="trending_score">트렌딩 점수</option>
            <option value="velocity">참여 속도</option>
            <option value="engagement">총 참여도</option>
            <option value="comments">댓글 수</option>
            <option value="rating">평점</option>
          </select>
        </div>
      </div>

      {/* Trending Promises List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            실시간 트렌딩 ({trendingData.length}개)
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {trendingData.map((promise, index) => (
            <div key={promise.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-start space-x-4">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2 line-clamp-2">
                        {promise.title}
                      </h4>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {promise.category}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                          {promise.level === 'national' ? '국정' : '지방'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTrendColor(promise.trendDirection)}`}>
                          {getTrendIcon(promise.trendDirection)}
                          <span className="ml-1">
                            {promise.trendDirection === 'up' ? '상승' : 
                             promise.trendDirection === 'down' ? '하락' : '안정'}
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-slate-300">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {promise.commentsCount} 댓글
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-slate-300">
                          <Star className="w-4 h-4 mr-1" />
                          {promise.ratingsCount} 평가
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-slate-300">
                          <Eye className="w-4 h-4 mr-1" />
                          {promise.reportsCount} 신고
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-slate-300">
                          <Share2 className="w-4 h-4 mr-1" />
                          {promise.sharesCount} 공유
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-slate-300">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {promise.velocityScore}/시간
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(promise.trendingScore)}`}>
                        {promise.trendingScore}점
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-slate-400">평균 평점</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {promise.averageRating}/5.0
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {trendingData.length === 0 && (
          <div className="p-12 text-center">
            <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400">
              선택한 조건에 맞는 트렌딩 공약이 없습니다.
            </p>
          </div>
        )}
      </div>

      {/* Trending Algorithm Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">트렌딩 알고리즘</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          트렌딩 점수는 다음 요소들을 종합하여 계산됩니다:
        </p>
        <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
          <li>• 이전 기간 대비 참여도 증가율 (가중치: 높음)</li>
          <li>• 최근 활동 빈도 (가중치: 중간)</li>
          <li>• 참여 유형의 다양성 (댓글, 평가, 신고 균형)</li>
          <li>• 시간당 참여 속도</li>
        </ul>
      </div>
    </div>
  );
};

export default TrendingPromises;