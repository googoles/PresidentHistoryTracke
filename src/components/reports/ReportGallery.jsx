import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, SlidersHorizontal, FileText, Camera, Link2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { reportOperations } from '../../utils/database';
import ReportCard from './ReportCard';
import ReportForm from './ReportForm';

const ReportGallery = ({ promiseId, promiseTitle, compact = false }) => {
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    reportType: '',
    verifiedOnly: false,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Report type options for filtering
  const reportTypes = {
    '': { label: '전체', icon: FileText },
    'progress_update': { label: '진행 업데이트', icon: FileText },
    'news': { label: '관련 뉴스', icon: Link2 },
    'photo': { label: '현장 사진', icon: Camera },
    'concern': { label: '우려사항', icon: AlertCircle }
  };

  // Sort options
  const sortOptions = {
    'created_at': '최신순',
    'upvotes': '추천순',
    'title': '제목순'
  };

  // Load reports
  const loadReports = async (pageNum = 1, resetList = false) => {
    try {
      setLoading(true);
      if (resetList) setError(null);

      const options = {
        page: pageNum,
        limit: compact ? 6 : 12,
        reportType: filters.reportType || undefined,
        verifiedOnly: filters.verifiedOnly
      };

      const { data, error: loadError } = await reportOperations.getPromiseReports(promiseId, options);

      if (loadError) {
        throw new Error(loadError.message);
      }

      const newReports = data || [];

      if (resetList || pageNum === 1) {
        setReports(newReports);
      } else {
        setReports(prev => [...prev, ...newReports]);
      }

      setHasMore(newReports.length === options.limit);

    } catch (err) {
      console.error('Failed to load reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load reports when filters change
  useEffect(() => {
    setPage(1);
    loadReports(1, true);
  }, [promiseId, filters]);

  // Filter reports by search term
  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      report.title.toLowerCase().includes(term) ||
      report.content.toLowerCase().includes(term) ||
      (report.location && report.location.toLowerCase().includes(term))
    );
  });

  // Load more reports
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadReports(nextPage, false);
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle new report submission
  const handleReportSubmitted = (newReport) => {
    setReports(prev => [newReport, ...prev]);
    setShowReportForm(false);
  };

  // Handle vote change
  const handleVoteChange = (reportId, voteType, previousVote) => {
    // Update local state optimistically
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        let newUpvotes = report.upvotes || 0;
        
        if (previousVote === 'upvote') {
          newUpvotes -= 1;
        }
        if (voteType === 'upvote') {
          newUpvotes += 1;
        }

        return {
          ...report,
          upvotes: Math.max(0, newUpvotes)
        };
      }
      return report;
    }));
  };

  // Render filter controls
  const renderFilters = () => (
    <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      {/* Report Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          제보 유형
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(reportTypes).map(([key, type]) => {
            const Icon = type.icon;
            return (
              <button
                key={key}
                onClick={() => handleFilterChange('reportType', key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  filters.reportType === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified Only */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
          />
          <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-slate-300">
            <Shield className="w-4 h-4" />
            <span>검증된 제보만 보기</span>
          </div>
        </label>
      </div>

      {/* Sort Options */}
      <div>
        <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          정렬
        </label>
        <select
          id="sort-select"
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            handleFilterChange('sortBy', sortBy);
            handleFilterChange('sortOrder', sortOrder);
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
        >
          {Object.entries(sortOptions).map(([key, label]) => (
            <React.Fragment key={key}>
              <option value={`${key}-desc`}>{label} (내림차순)</option>
              <option value={`${key}-asc`}>{label} (오름차순)</option>
            </React.Fragment>
          ))}
        </select>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-700 p-6">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 mb-4">제보를 불러오는 중 오류가 발생했습니다</p>
          <button
            onClick={() => loadReports(1, true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
            시민 제보 ({filteredReports.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          {!compact && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="제보 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 w-48"
              />
            </div>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'
            }`}
            aria-label="필터"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {!compact && <span>필터</span>}
          </button>

          {/* Add Report Button */}
          {isAuthenticated && (
            <button
              onClick={() => setShowReportForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {!compact && <span>제보 작성</span>}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Mobile Search */}
      {compact && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="제보 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      )}

      {/* Reports List */}
      {loading && reports.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-20 bg-gray-100 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onVoteChange={handleVoteChange}
              compact={compact}
            />
          ))}

          {/* Load More Button */}
          {hasMore && !searchTerm && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로딩 중...' : '더 보기'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 dark:text-slate-300 mb-2">
            {searchTerm ? '검색 결과가 없습니다' : '아직 제보가 없습니다'}
          </h4>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            {searchTerm 
              ? '다른 검색어로 시도해보세요'
              : '이 공약에 대한 첫 번째 제보를 작성해보세요'
            }
          </p>
          {isAuthenticated && !searchTerm && (
            <button
              onClick={() => setShowReportForm(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              첫 제보 작성하기
            </button>
          )}
        </div>
      )}

      {/* Report Form Modal */}
      <ReportForm
        isOpen={showReportForm}
        onClose={() => setShowReportForm(false)}
        promiseId={promiseId}
        promiseTitle={promiseTitle}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
};

export default ReportGallery;