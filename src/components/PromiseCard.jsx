import React, { useState, memo } from 'react';
import { Calendar, ExternalLink, TrendingUp, BarChart3, ChevronDown, ChevronUp, Share2, Bookmark } from 'lucide-react';
import { statusConfig } from '../data/categories';

const PromiseCard = memo(({ promise, onShare, onBookmark, isBookmarked = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
                isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
              }`}
              aria-label={isBookmarked ? '북마크 제거' : '북마크 추가'}
              title={isBookmarked ? '북마크 제거' : '북마크 추가'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500 transition-colors"
              aria-label="공약 공유"
              title="공약 공유"
            >
              <Share2 className="w-4 h-4" />
            </button>
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

        {/* Always show detailed stats and articles button */}
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
          
          {(promise.statistics?.length > 2 || promise.relatedArticles?.length > 0) && (
            <button
              onClick={toggleExpanded}
              className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-expanded={isExpanded}
              aria-controls={`promise-details-${promise.id}`}
            >
              {isExpanded ? '간략히' : '자세히'}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      
      {/* Expandable section for detailed stats and articles */}
      {isExpanded && (
        <div 
          id={`promise-details-${promise.id}`}
          className="border-t border-gray-200 dark:border-gray-700 pt-4 px-6 pb-6 bg-gray-50 dark:bg-slate-900 -mx-6 -mb-6 rounded-b-lg"
        >
          {promise.statistics && promise.statistics.length > 2 && (
            <div className="mb-6">
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
    </article>
  );
});

PromiseCard.displayName = 'PromiseCard';

export default PromiseCard;