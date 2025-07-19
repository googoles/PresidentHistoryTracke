import React from 'react';
import { TrendingUp, Target, Clock, XCircle, PauseCircle, CheckCircle, BarChart2 } from 'lucide-react';
import { statusConfig } from '../data/categories';

const StatsOverview = ({ promises }) => {
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

      {stats.total > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
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
    </div>
  );
};

export default StatsOverview;