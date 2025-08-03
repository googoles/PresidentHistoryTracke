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
  RadialLinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import { 
  Map, 
  Users, 
  MessageCircle, 
  Star, 
  TrendingUp, 
  Award,
  BarChart3,
  Pie,
  Activity,
  Target,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format, subDays } from 'date-fns';
import { regions } from '../../data/regions';
import { promises } from '../../data/promises';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement
);

const RegionalComparison = ({ timeRange = '30d' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState({
    regionMetrics: [],
    engagementTrends: [],
    satisfactionScores: [],
    promiseProgress: [],
    demographicBreakdown: []
  });
  const [selectedMetric, setSelectedMetric] = useState('engagement');
  const [chartType, setChartType] = useState('bar');
  const [showPerCapita, setShowPerCapita] = useState(false);

  useEffect(() => {
    fetchComparisonData();
  }, [timeRange, showPerCapita]);

  const getDaysFromRange = (range) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const days = getDaysFromRange(timeRange);
      const startDate = subDays(new Date(), days);

      // Get all region keys and data
      const regionKeys = Object.keys(regions);
      
      // Fetch metrics for each region
      const regionMetrics = await Promise.all(
        regionKeys.map(async (regionKey) => {
          const regionData = regions[regionKey];
          const regionPromises = promises[regionKey] || [];
          
          // Calculate engagement metrics
          const engagementMetrics = await calculateRegionEngagement(regionKey, startDate);
          
          // Calculate satisfaction scores
          const satisfactionScore = await calculateSatisfactionScore(regionKey, startDate);
          
          // Calculate promise progress
          const progressMetrics = calculatePromiseProgress(regionPromises);
          
          // Normalize by population if requested
          const normalizedMetrics = showPerCapita && regionData.population 
            ? normalizeByPopulation(engagementMetrics, regionData.population)
            : engagementMetrics;

          return {
            regionKey,
            regionName: regionData.name,
            population: regionData.population,
            leader: regionData.leader,
            party: regionData.party,
            ...normalizedMetrics,
            satisfactionScore,
            ...progressMetrics
          };
        })
      );

      // Fetch engagement trends over time
      const engagementTrends = await fetchEngagementTrends(regionKeys, startDate, days);
      
      // Calculate demographic breakdown (mock data for now)
      const demographicBreakdown = generateDemographicData(regionKeys);

      setComparisonData({
        regionMetrics,
        engagementTrends,
        satisfactionScores: regionMetrics.map(r => ({
          region: r.regionName,
          score: r.satisfactionScore
        })),
        promiseProgress: regionMetrics.map(r => ({
          region: r.regionName,
          completed: r.completedPromises,
          inProgress: r.inProgressPromises,
          total: r.totalPromises
        })),
        demographicBreakdown
      });
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRegionEngagement = async (regionKey, startDate) => {
    try {
      // Get promise IDs for this region
      const regionPromises = promises[regionKey] || [];
      const promiseIds = regionPromises.map(p => p.id);

      if (promiseIds.length === 0) {
        return {
          totalComments: 0,
          totalRatings: 0,
          totalReports: 0,
          uniqueUsers: 0,
          totalEngagement: 0
        };
      }

      // Count comments
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('promise_id', promiseIds)
        .gte('created_at', startDate.toISOString());

      // Count ratings
      const { count: ratingsCount } = await supabase
        .from('promise_ratings')
        .select('*', { count: 'exact', head: true })
        .in('promise_id', promiseIds)
        .gte('created_at', startDate.toISOString());

      // Count reports
      const { count: reportsCount } = await supabase
        .from('citizen_reports')
        .select('*', { count: 'exact', head: true })
        .in('promise_id', promiseIds)
        .gte('created_at', startDate.toISOString());

      // Count unique users (approximate with comments for now)
      const { data: uniqueCommentUsers } = await supabase
        .from('comments')
        .select('user_id')
        .in('promise_id', promiseIds)
        .gte('created_at', startDate.toISOString());

      const uniqueUsers = new Set(uniqueCommentUsers?.map(u => u.user_id) || []).size;

      return {
        totalComments: commentsCount || 0,
        totalRatings: ratingsCount || 0,
        totalReports: reportsCount || 0,
        uniqueUsers,
        totalEngagement: (commentsCount || 0) + (ratingsCount || 0) + (reportsCount || 0)
      };
    } catch (error) {
      console.error('Error calculating region engagement:', error);
      return {
        totalComments: 0,
        totalRatings: 0,
        totalReports: 0,
        uniqueUsers: 0,
        totalEngagement: 0
      };
    }
  };

  const calculateSatisfactionScore = async (regionKey, startDate) => {
    try {
      const regionPromises = promises[regionKey] || [];
      const promiseIds = regionPromises.map(p => p.id);

      if (promiseIds.length === 0) return 0;

      const { data: ratings } = await supabase
        .from('promise_ratings')
        .select('rating')
        .in('promise_id', promiseIds)
        .gte('created_at', startDate.toISOString());

      if (!ratings || ratings.length === 0) return 0;

      const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      return Math.round(average * 20); // Convert to 0-100 scale
    } catch (error) {
      console.error('Error calculating satisfaction score:', error);
      return 0;
    }
  };

  const calculatePromiseProgress = (regionPromises) => {
    const totalPromises = regionPromises.length;
    const completedPromises = regionPromises.filter(p => p.status === '달성').length;
    const inProgressPromises = regionPromises.filter(p => p.status === '진행중').length;
    const completionRate = totalPromises > 0 ? (completedPromises / totalPromises * 100).toFixed(1) : 0;

    return {
      totalPromises,
      completedPromises,
      inProgressPromises,
      completionRate: parseFloat(completionRate)
    };
  };

  const normalizeByPopulation = (metrics, population) => {
    const per100k = population / 100000;
    return {
      ...metrics,
      totalComments: Math.round(metrics.totalComments / per100k),
      totalRatings: Math.round(metrics.totalRatings / per100k),
      totalReports: Math.round(metrics.totalReports / per100k),
      totalEngagement: Math.round(metrics.totalEngagement / per100k),
      uniqueUsers: Math.round(metrics.uniqueUsers / per100k)
    };
  };

  const fetchEngagementTrends = async (regionKeys, startDate, days) => {
    // Generate mock trend data for demonstration
    const dates = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      return format(date, 'yyyy-MM-dd');
    });

    return regionKeys.slice(0, 5).map(regionKey => ({
      region: regions[regionKey].name,
      data: dates.map(() => Math.floor(Math.random() * 50) + 10)
    }));
  };

  const generateDemographicData = (regionKeys) => {
    return regionKeys.map(regionKey => ({
      region: regions[regionKey].name,
      ageGroups: {
        '20-29': Math.floor(Math.random() * 30) + 10,
        '30-39': Math.floor(Math.random() * 35) + 15,
        '40-49': Math.floor(Math.random() * 25) + 10,
        '50-59': Math.floor(Math.random() * 20) + 10,
        '60+': Math.floor(Math.random() * 15) + 5
      }
    }));
  };

  // Chart data preparation
  const prepareChartData = () => {
    const labels = comparisonData.regionMetrics.map(r => r.regionName);
    
    switch (selectedMetric) {
      case 'engagement':
        return {
          labels,
          datasets: [
            {
              label: showPerCapita ? '총 참여도 (인구 10만명당)' : '총 참여도',
              data: comparisonData.regionMetrics.map(r => r.totalEngagement),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            }
          ]
        };
      
      case 'satisfaction':
        return {
          labels,
          datasets: [
            {
              label: '만족도 점수 (0-100)',
              data: comparisonData.regionMetrics.map(r => r.satisfactionScore),
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 1
            }
          ]
        };
      
      case 'progress':
        return {
          labels,
          datasets: [
            {
              label: '공약 이행률 (%)',
              data: comparisonData.regionMetrics.map(r => r.completionRate),
              backgroundColor: 'rgba(245, 158, 11, 0.6)',
              borderColor: 'rgb(245, 158, 11)',
              borderWidth: 1
            }
          ]
        };
      
      case 'detailed':
        return {
          labels,
          datasets: [
            {
              label: '댓글',
              data: comparisonData.regionMetrics.map(r => r.totalComments),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            },
            {
              label: '평가',
              data: comparisonData.regionMetrics.map(r => r.totalRatings),
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 1
            },
            {
              label: '신고',
              data: comparisonData.regionMetrics.map(r => r.totalReports),
              backgroundColor: 'rgba(245, 158, 11, 0.6)',
              borderColor: 'rgb(245, 158, 11)',
              borderWidth: 1
            }
          ]
        };
      
      default:
        return { labels: [], datasets: [] };
    }
  };

  const prepareRadarData = () => {
    return {
      labels: ['참여도', '만족도', '이행률', '활성 사용자', '응답률'],
      datasets: comparisonData.regionMetrics.slice(0, 5).map((region, index) => ({
        label: region.regionName,
        data: [
          region.totalEngagement / 10, // Normalize to 0-100 scale
          region.satisfactionScore,
          region.completionRate,
          region.uniqueUsers * 2, // Scale up for visibility
          Math.min(region.totalRatings / region.totalPromises * 20, 100) // Response rate
        ],
        backgroundColor: `rgba(${[
          '59, 130, 246',
          '16, 185, 129', 
          '245, 158, 11',
          '139, 92, 246',
          '239, 68, 68'
        ][index]}, 0.2)`,
        borderColor: `rgb(${[
          '59, 130, 246',
          '16, 185, 129', 
          '245, 158, 11',
          '139, 92, 246',
          '239, 68, 68'
        ][index]})`,
        borderWidth: 2
      }))
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            const suffix = selectedMetric === 'satisfaction' ? '점' : 
                          selectedMetric === 'progress' ? '%' : 
                          showPerCapita ? '/10만명' : '';
            return `${label}: ${value}${suffix}`;
          }
        }
      }
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

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
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
          <Map className="w-6 h-6 mr-2 text-purple-600" />
          지역별 참여도 비교 분석
        </h2>
        <p className="text-gray-600 dark:text-slate-300 text-sm">
          전국 지자체별 시민 참여도와 만족도를 비교하여 지역별 특성을 분석합니다.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-slate-100">분석 옵션:</span>
          </div>
          
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="engagement">총 참여도</option>
            <option value="satisfaction">만족도 점수</option>
            <option value="progress">공약 이행률</option>
            <option value="detailed">상세 분석</option>
          </select>

          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="bar">막대 차트</option>
            <option value="line">선 차트</option>
            <option value="radar">레이더 차트</option>
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showPerCapita}
              onChange={(e) => setShowPerCapita(e.target.checked)}
              className="rounded border-gray-300 dark:border-slate-600"
            />
            <span className="text-sm text-gray-900 dark:text-slate-100">인구 비례 조정</span>
          </label>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          지역별 {selectedMetric === 'engagement' ? '참여도' : 
                    selectedMetric === 'satisfaction' ? '만족도' : 
                    selectedMetric === 'progress' ? '이행률' : '상세'} 비교
        </h3>
        <div className="h-80">
          {chartType === 'radar' ? (
            <Radar data={prepareRadarData()} options={radarOptions} />
          ) : chartType === 'line' ? (
            <Line data={prepareChartData()} options={chartOptions} />
          ) : (
            <Bar data={prepareChartData()} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Regional Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            참여도 상위 지역
          </h3>
          <div className="space-y-3">
            {comparisonData.regionMetrics
              .sort((a, b) => b.totalEngagement - a.totalEngagement)
              .slice(0, 5)
              .map((region, index) => (
                <div key={region.regionKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white mr-3 ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{region.regionName}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">{region.leader} ({region.party})</p>
                    </div>
                  </div>
                  <span className="text-blue-600 font-semibold">
                    {region.totalEngagement}{showPerCapita ? '/10만명' : ''}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Satisfaction Leaders */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-green-600" />
            만족도 상위 지역
          </h3>
          <div className="space-y-3">
            {comparisonData.regionMetrics
              .sort((a, b) => b.satisfactionScore - a.satisfactionScore)
              .slice(0, 5)
              .map((region, index) => (
                <div key={region.regionKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white mr-3 ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-green-400' : 
                      index === 2 ? 'bg-green-300' : 'bg-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{region.regionName}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">평점 기반</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-semibold">
                    {region.satisfactionScore}점
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Promise Implementation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-orange-600" />
            이행률 상위 지역
          </h3>
          <div className="space-y-3">
            {comparisonData.regionMetrics
              .sort((a, b) => b.completionRate - a.completionRate)
              .slice(0, 5)
              .map((region, index) => (
                <div key={region.regionKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white mr-3 ${
                      index === 0 ? 'bg-orange-500' : 
                      index === 1 ? 'bg-orange-400' : 
                      index === 2 ? 'bg-orange-300' : 'bg-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{region.regionName}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">
                        {region.completedPromises}/{region.totalPromises} 완료
                      </p>
                    </div>
                  </div>
                  <span className="text-orange-600 font-semibold">
                    {region.completionRate}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Insights and Analysis */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-indigo-600" />
          인사이트 및 분석
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-slate-100">주요 발견사항</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
              <li>• 대도시권이 상대적으로 높은 참여도를 보임</li>
              <li>• 인구 비례 조정 시 소규모 지자체의 활발한 참여 확인</li>
              <li>• 공약 이행률과 시민 만족도 간 높은 상관관계</li>
              <li>• 진보 성향 지역에서 더 활발한 토론 문화</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-slate-100">개선 권장사항</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
              <li>• 참여도가 낮은 지역 대상 홍보 강화 필요</li>
              <li>• 모바일 접근성 개선으로 젊은 층 참여 확대</li>
              <li>• 지역별 특성을 반영한 맞춤형 콘텐츠 제공</li>
              <li>• 오프라인 연계 프로그램 도입 검토</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalComparison;