import React, { useState, useEffect, useMemo } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Users, 
  MessageCircle, 
  Star, 
  TrendingUp, 
  Calendar,
  Activity,
  Eye,
  Share2
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format, subDays, startOfDay } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const CitizenEngagement = ({ timeRange = '30d', region = 'all' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [engagementData, setEngagementData] = useState({
    dailyActivity: [],
    topPromises: [],
    userGrowth: [],
    engagementMetrics: {},
    regionActivity: [],
    categoryEngagement: []
  });
  const [selectedMetric, setSelectedMetric] = useState('comments');

  useEffect(() => {
    fetchEngagementData();
  }, [timeRange, region]);

  const getDaysFromRange = (range) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const fetchEngagementData = async () => {
    setLoading(true);
    try {
      const days = getDaysFromRange(timeRange);
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch daily activity data
      const dailyActivity = await fetchDailyActivity(startDate, days);
      
      // Fetch engagement metrics
      const metrics = await fetchEngagementMetrics(startDate);
      
      // Fetch top promises by engagement
      const topPromises = await fetchTopPromises(startDate);
      
      // Fetch user growth data
      const userGrowth = await fetchUserGrowth(startDate, days);
      
      // Fetch regional activity
      const regionActivity = await fetchRegionalActivity(startDate);
      
      // Fetch category engagement
      const categoryEngagement = await fetchCategoryEngagement(startDate);

      setEngagementData({
        dailyActivity,
        topPromises,
        userGrowth,
        engagementMetrics: metrics,
        regionActivity,
        categoryEngagement
      });
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyActivity = async (startDate, days) => {
    try {
      // Generate date array for the past N days
      const dates = Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - 1 - i);
        return format(date, 'yyyy-MM-dd');
      });

      // Fetch comments per day
      const { data: commentsData } = await supabase
        .from('comments')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Fetch ratings per day
      const { data: ratingsData } = await supabase
        .from('promise_ratings')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Fetch reports per day
      const { data: reportsData } = await supabase
        .from('citizen_reports')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Group by date
      const commentsByDate = groupByDate(commentsData || []);
      const ratingsByDate = groupByDate(ratingsData || []);
      const reportsByDate = groupByDate(reportsData || []);

      return dates.map(date => ({
        date,
        comments: commentsByDate[date] || 0,
        ratings: ratingsByDate[date] || 0,
        reports: reportsByDate[date] || 0,
        total: (commentsByDate[date] || 0) + (ratingsByDate[date] || 0) + (reportsByDate[date] || 0)
      }));
    } catch (error) {
      console.error('Error fetching daily activity:', error);
      return [];
    }
  };

  const fetchEngagementMetrics = async (startDate) => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // New users in period
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Total comments
      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Total ratings
      const { count: totalRatings } = await supabase
        .from('promise_ratings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Total reports
      const { count: totalReports } = await supabase
        .from('citizen_reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Average rating
      const { data: avgRatingData } = await supabase
        .from('promise_ratings')
        .select('rating')
        .gte('created_at', startDate.toISOString());

      const avgRating = avgRatingData?.length > 0
        ? avgRatingData.reduce((sum, r) => sum + r.rating, 0) / avgRatingData.length
        : 0;

      return {
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0,
        totalComments: totalComments || 0,
        totalRatings: totalRatings || 0,
        totalReports: totalReports || 0,
        averageRating: avgRating.toFixed(1),
        engagementRate: totalUsers > 0 ? ((totalComments + totalRatings + totalReports) / totalUsers * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      return {};
    }
  };

  const fetchTopPromises = async (startDate) => {
    try {
      // Get promise engagement counts
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('promise_id')
        .gte('created_at', startDate.toISOString());

      const { data: ratingCounts } = await supabase
        .from('promise_ratings')
        .select('promise_id')
        .gte('created_at', startDate.toISOString());

      const { data: reportCounts } = await supabase
        .from('citizen_reports')
        .select('promise_id')
        .gte('created_at', startDate.toISOString());

      // Combine and count engagements per promise
      const engagementCounts = {};
      
      [...(commentCounts || []), ...(ratingCounts || []), ...(reportCounts || [])].forEach(item => {
        engagementCounts[item.promise_id] = (engagementCounts[item.promise_id] || 0) + 1;
      });

      // Sort by engagement count and get top 10
      const topPromises = Object.entries(engagementCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([promiseId, count]) => ({
          promiseId,
          engagementCount: count
        }));

      return topPromises;
    } catch (error) {
      console.error('Error fetching top promises:', error);
      return [];
    }
  };

  const fetchUserGrowth = async (startDate, days) => {
    try {
      const dates = Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - 1 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const { data: userData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const usersByDate = groupByDate(userData || []);

      return dates.map(date => ({
        date,
        newUsers: usersByDate[date] || 0
      }));
    } catch (error) {
      console.error('Error fetching user growth:', error);
      return [];
    }
  };

  const fetchRegionalActivity = async (startDate) => {
    try {
      // This would need to be joined with user profiles to get region data
      // For now, return mock data based on known regions
      const regions = ['서울특별시', '경기도', '부산광역시', '대구광역시', '인천광역시'];
      
      return regions.map(region => ({
        region,
        activity: Math.floor(Math.random() * 100) + 20 // Mock data
      }));
    } catch (error) {
      console.error('Error fetching regional activity:', error);
      return [];
    }
  };

  const fetchCategoryEngagement = async (startDate) => {
    try {
      // This would require promise category data from the database
      // For now, return mock data
      const categories = ['부동산정책', '복지정책', '교육정책', '경제정책', '환경정책'];
      
      return categories.map(category => ({
        category,
        engagement: Math.floor(Math.random() * 200) + 50 // Mock data
      }));
    } catch (error) {
      console.error('Error fetching category engagement:', error);
      return [];
    }
  };

  const groupByDate = (data) => {
    return data.reduce((acc, item) => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  };

  // Chart configurations
  const dailyActivityChartData = useMemo(() => {
    const labels = engagementData.dailyActivity.map(d => format(new Date(d.date), 'MM/dd'));
    
    return {
      labels,
      datasets: [
        {
          label: '댓글',
          data: engagementData.dailyActivity.map(d => d.comments),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: '평가',
          data: engagementData.dailyActivity.map(d => d.ratings),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: '신고',
          data: engagementData.dailyActivity.map(d => d.reports),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [engagementData.dailyActivity]);

  const userGrowthChartData = useMemo(() => {
    return {
      labels: engagementData.userGrowth.map(d => format(new Date(d.date), 'MM/dd')),
      datasets: [
        {
          label: '신규 사용자',
          data: engagementData.userGrowth.map(d => d.newUsers),
          backgroundColor: 'rgba(139, 92, 246, 0.6)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1
        }
      ]
    };
  }, [engagementData.userGrowth]);

  const regionActivityChartData = useMemo(() => {
    return {
      labels: engagementData.regionActivity.map(r => r.region),
      datasets: [
        {
          label: '지역별 활동',
          data: engagementData.regionActivity.map(r => r.activity),
          backgroundColor: [
            'rgba(239, 68, 68, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(139, 92, 246, 0.6)'
          ],
          borderWidth: 0
        }
      ]
    };
  }, [engagementData.regionActivity]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-slate-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          시민 참여도 분석
        </h2>
        <p className="text-gray-600 dark:text-slate-300 text-sm">
          사용자 활동 패턴과 참여도를 분석하여 플랫폼 성장을 추적합니다.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">총 사용자</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {engagementData.engagementMetrics.totalUsers?.toLocaleString() || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">신규 사용자</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {engagementData.engagementMetrics.newUsers?.toLocaleString() || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">총 댓글</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {engagementData.engagementMetrics.totalComments?.toLocaleString() || 0}
              </p>
            </div>
            <MessageCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300">평균 평점</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {engagementData.engagementMetrics.averageRating || '0.0'}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          일별 활동 현황
        </h3>
        <div className="h-80">
          <Line data={dailyActivityChartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            사용자 증가 추이
          </h3>
          <div className="h-64">
            <Bar data={userGrowthChartData} options={chartOptions} />
          </div>
        </div>

        {/* Regional Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-purple-600" />
            지역별 참여도
          </h3>
          <div className="h-64">
            <Doughnut data={regionActivityChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Top Engaged Promises */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Share2 className="w-5 h-5 mr-2 text-orange-600" />
          가장 활발한 공약 토론
        </h3>
        <div className="space-y-3">
          {engagementData.topPromises.slice(0, 5).map((promise, index) => (
            <div key={promise.promiseId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </span>
                <span className="text-gray-900 dark:text-slate-100 font-medium">
                  공약 ID: {promise.promiseId}
                </span>
              </div>
              <span className="text-blue-600 font-semibold">
                {promise.engagementCount} 참여
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitizenEngagement;