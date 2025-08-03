import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Map, 
  Users, 
  Download, 
  RefreshCw, 
  Calendar,
  Filter,
  Settings,
  Eye,
  Share2,
  AlertCircle
} from 'lucide-react';
import CitizenEngagement from './CitizenEngagement';
import TrendingPromises from './TrendingPromises';
import RegionalComparison from './RegionalComparison';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('engagement');
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [exportLoading, setExportLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    permissions: {
      canExport: true,
      canViewDetailed: true,
      canViewRegional: true
    }
  });

  useEffect(() => {
    fetchDashboardOverview();
  }, [timeRange]);

  const fetchDashboardOverview = async () => {
    setLoading(true);
    try {
      // Get basic analytics overview
      const overview = await getDashboardOverview();
      setDashboardData(prev => ({
        ...prev,
        overview
      }));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardOverview = async () => {
    try {
      const startDate = getStartDateFromRange(timeRange);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users in period
      const { count: activeUsers } = await supabase
        .from('comments')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Get total engagements
      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      const { count: totalRatings } = await supabase
        .from('promise_ratings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      const { count: totalReports } = await supabase
        .from('citizen_reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalComments: totalComments || 0,
        totalRatings: totalRatings || 0,
        totalReports: totalReports || 0,
        totalEngagements: (totalComments || 0) + (totalRatings || 0) + (totalReports || 0),
        engagementRate: totalUsers > 0 ? ((activeUsers || 0) / totalUsers * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      return {};
    }
  };

  const getStartDateFromRange = (range) => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const handleExportData = async (format = 'csv') => {
    setExportLoading(true);
    try {
      // Generate export data based on current view
      const exportData = await generateExportData(activeTab, timeRange);
      
      if (format === 'csv') {
        downloadCSV(exportData, `analytics-${activeTab}-${timeRange}-${Date.now()}.csv`);
      } else if (format === 'pdf') {
        await generatePDFReport(exportData, activeTab);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const generateExportData = async (tab, range) => {
    const startDate = getStartDateFromRange(range);
    
    switch (tab) {
      case 'engagement':
        return await exportEngagementData(startDate);
      case 'trending':
        return await exportTrendingData(startDate);
      case 'regional':
        return await exportRegionalData(startDate);
      default:
        return [];
    }
  };

  const exportEngagementData = async (startDate) => {
    // Export engagement analytics data
    const { data: comments } = await supabase
      .from('comments')
      .select('promise_id, user_id, created_at')
      .gte('created_at', startDate.toISOString());

    const { data: ratings } = await supabase
      .from('promise_ratings')
      .select('promise_id, user_id, rating, created_at')
      .gte('created_at', startDate.toISOString());

    const { data: reports } = await supabase
      .from('citizen_reports')
      .select('promise_id, user_id, report_type, created_at')
      .gte('created_at', startDate.toISOString());

    return [
      ['Date', 'Promise ID', 'User ID', 'Action Type', 'Value'],
      ...(comments || []).map(c => [
        c.created_at,
        c.promise_id,
        c.user_id,
        'comment',
        '1'
      ]),
      ...(ratings || []).map(r => [
        r.created_at,
        r.promise_id,
        r.user_id,
        'rating',
        r.rating
      ]),
      ...(reports || []).map(r => [
        r.created_at,
        r.promise_id,
        r.user_id,
        'report',
        r.report_type
      ])
    ];
  };

  const exportTrendingData = async (startDate) => {
    // Export trending promises data
    return [
      ['Promise ID', 'Comments', 'Ratings', 'Reports', 'Total Engagement', 'Trending Score'],
      // This would be populated with actual trending calculation results
    ];
  };

  const exportRegionalData = async (startDate) => {
    // Export regional comparison data
    return [
      ['Region', 'Total Engagement', 'Comments', 'Ratings', 'Reports', 'Users', 'Satisfaction Score'],
      // This would be populated with actual regional data
    ];
  };

  const downloadCSV = (data, filename) => {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDFReport = async (data, type) => {
    // This would integrate with a PDF generation service
    console.log('PDF generation not implemented yet');
  };

  const tabs = [
    {
      id: 'engagement',
      label: '시민 참여도',
      icon: Users,
      description: '사용자 활동 및 참여 패턴 분석'
    },
    {
      id: 'trending',
      label: '트렌딩 공약',
      icon: TrendingUp,
      description: '실시간 주목받는 공약 추적'
    },
    {
      id: 'regional',
      label: '지역별 비교',
      icon: Map,
      description: '전국 지자체 참여도 비교'
    }
  ];

  const timeRanges = [
    { value: '7d', label: '최근 7일' },
    { value: '30d', label: '최근 30일' },
    { value: '90d', label: '최근 90일' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  분석 대시보드
                </h1>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  실시간 시민 참여도 및 공약 트렌드 분석
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => handleExportData('csv')}
                  disabled={exportLoading}
                  className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors disabled:opacity-50"
                >
                  {exportLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  내보내기
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchDashboardOverview}
                disabled={loading}
                className="p-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                title="새로고침"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">총 사용자</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {dashboardData.overview.totalUsers?.toLocaleString() || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">활성 사용자</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {dashboardData.overview.activeUsers?.toLocaleString() || 0}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">총 참여</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {dashboardData.overview.totalEngagements?.toLocaleString() || 0}
                </p>
              </div>
              <Share2 className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">참여율</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {dashboardData.overview.engagementRate || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Last Updated Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 mr-2" />
            마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
          </div>
          
          {!dashboardData.permissions.canViewDetailed && (
            <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 mr-2" />
              제한된 데이터 보기
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'engagement' && (
            <CitizenEngagement 
              timeRange={timeRange}
              region="all"
            />
          )}
          
          {activeTab === 'trending' && (
            <TrendingPromises 
              timeRange={timeRange === '7d' ? '24h' : timeRange === '30d' ? '7d' : '30d'}
              limit={20}
            />
          )}
          
          {activeTab === 'regional' && (
            <RegionalComparison 
              timeRange={timeRange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;