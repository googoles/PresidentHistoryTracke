import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  XCircle, 
  PauseCircle, 
  CheckCircle, 
  BarChart2, 
  Star, 
  MessageCircle, 
  FileText, 
  Users 
} from 'lucide-react';
import { statusConfig } from '../data/categories';
import { analyticsOperations } from '../utils/database';

const StatsOverview = ({ promises }) => {
  const [engagementStats, setEngagementStats] = useState({
    totalRatings: 0,
    averageRating: 0,
    totalComments: 0,
    totalReports: 0,
    mostActivePromises: []
  });
  const [loading, setLoading] = useState(true);

  // Load engagement statistics
  useEffect(() => {
    const loadEngagementStats = async () => {
      try {
        setLoading(true);
        
        // Get engagement metrics
        const { data: metrics } = await analyticsOperations.getPromiseEngagementMetrics();
        const { data: activePromises } = await analyticsOperations.getMostActivePromises(5);
        
        if (metrics) {
          const totalStats = metrics.reduce((acc, metric) => {
            acc.totalRatings += metric.total_ratings || 0;
            acc.totalComments += metric.total_comments || 0;
            acc.totalReports += metric.total_reports || 0;
            return acc;
          }, { totalRatings: 0, totalComments: 0, totalReports: 0 });

          const avgRating = metrics.length > 0 
            ? metrics.reduce((sum, m) => sum + (m.average_rating || 0), 0) / metrics.length 
            : 0;

          setEngagementStats({
            ...totalStats,
            averageRating: avgRating,
            mostActivePromises: activePromises || []
          });
        }
      } catch (error) {
        console.error('Failed to load engagement stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEngagementStats();
  }, []);

  const calculateStats = () => {
    const stats = {
      total: promises.length,
      byStatus: {
        '달성': 0,
        '진행중': 0,
        '부분달성': 0,
        '미달성': 0,
        '중단': 0
      },
      achievementRate: 0
    };

    promises.forEach(promise => {
      if (stats.byStatus.hasOwnProperty(promise.status)) {
        stats.byStatus[promise.status]++;
      }
    });

    if (stats.total > 0) {
      const achieved = stats.byStatus['달성'] + (stats.byStatus['부분달성'] * 0.5);
      stats.achievementRate = Math.round((achieved / stats.total) * 100);
    }

    return stats;
  };

  const stats = calculateStats();

  const getStatusIcon = (status) => {
    switch (status) {
      case '달성':
        return <CheckCircle className="w-5 h-5" />;
      case '진행중':
        return <Clock className="w-5 h-5" />;
      case '부분달성':
        return <Target className="w-5 h-5" />;
      case '미달성':
        return <XCircle className="w-5 h-5" />;
      case '중단':
        return <PauseCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getProgressRingColor = (rate) => {
    if (rate >= 70) return 'text-green-500';
    if (rate >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <BarChart2 className="w-5 h-5" />
        공약 이행 현황 통계
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32">
              <circle
                className="text-gray-300 dark:text-slate-600"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="52"
                cx="64"
                cy="64"
              />
              <circle
                className={`${getProgressRingColor(stats.achievementRate)} transition-all duration-1000`}
                strokeWidth="8"
                strokeDasharray={`${stats.achievementRate * 3.27} 327`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="52"
                cx="64"
                cy="64"
                transform="rotate(-90 64 64)"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-800 dark:text-slate-100">{stats.achievementRate}%</span>
              <span className="text-sm text-gray-600 dark:text-slate-300">이행률</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">전체 공약 이행률</p>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-slate-300">전체 공약</span>
                <TrendingUp className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">개</p>
            </div>

            {Object.entries(stats.byStatus).map(([status, count]) => {
              const config = statusConfig[status];
              return (
                <div key={status} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-slate-300">{status}</span>
                    <div className={config?.color?.split(' ')[0] || 'text-gray-600'}>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">{count}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {stats.total > 0 ? `${Math.round((count / stats.total) * 100)}%` : '0%'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engagement Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          시민 참여 현황
        </h4>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded mb-1"></div>
                <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">평균 평점</span>
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              </div>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                {engagementStats.averageRating.toFixed(1)}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">5점 만점</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">총 평가</span>
                <Star className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {engagementStats.totalRatings.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">개</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">시민 제보</span>
                <FileText className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {engagementStats.totalReports.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">건</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">댓글</span>
                <MessageCircle className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                {engagementStats.totalComments.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">개</p>
            </div>
          </div>
        )}

        {/* Most Active Promises */}
        {engagementStats.mostActivePromises.length > 0 && (
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
              🔥 가장 활발한 공약 TOP 5
            </h5>
            <div className="space-y-2">
              {engagementStats.mostActivePromises.map((promise, index) => {
                const matchedPromise = promises.find(p => p.id === promise.promise_id);
                return (
                  <div key={promise.promise_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                        {matchedPromise?.title || `공약 ${promise.promise_id}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {promise.total_comments || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {promise.total_reports || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {(promise.average_rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Promise Status Breakdown */}
      {stats.total > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">
            공약 상태별 분포
          </h4>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const config = statusConfig[status];
              
              if (count === 0) return null;
              
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700 dark:text-slate-300">{status}</span>
                    <span className="text-gray-600 dark:text-slate-300">{count}개 ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${config?.progressColor || 'bg-gray-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-time Activity Indicator */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-slate-300">
              실시간 활동 모니터링 중
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-400">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;