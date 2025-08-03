import React, { useState, useEffect } from 'react';
import { Search, Filter, X, SortAsc, SortDesc, Star, ChevronDown, Sliders } from 'lucide-react';
import { categories, statusConfig } from '../data/categories';

const FilterPanel = ({ 
  selectedLevel, 
  selectedCategory, 
  selectedStatus, 
  searchTerm,
  sortBy,
  sortOrder,
  onLevelChange,
  onCategoryChange,
  onStatusChange,
  onSearchChange,
  onSortChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const levels = [
    { id: 'all', name: '전체' },
    { id: 'national', name: '대통령 공약' },
    { id: 'local', name: '지자체 공약' }
  ];

  const statuses = [
    { id: 'all', name: '전체' },
    ...Object.keys(statusConfig).map(status => ({ id: status, name: status }))
  ];

  const sortOptions = [
    { id: 'default', name: '기본순' },
    { id: 'progress', name: '진행률순' },
    { id: 'startDate', name: '시작일순' },
    { id: 'targetDate', name: '목표일순' },
    { id: 'rating', name: '평점순' },
    { id: 'engagement', name: '참여도순' }
  ];

  const clearFilters = () => {
    onLevelChange('all');
    onCategoryChange('all');
    onStatusChange('all');
    onSearchChange('');
    onSortChange?.('default', 'desc');
  };

  const hasActiveFilters = selectedLevel !== 'all' || selectedCategory !== 'all' || 
                          selectedStatus !== 'all' || searchTerm !== '' || 
                          (sortBy && sortBy !== 'default');

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md mb-6 ${isMobile ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800 dark:text-slate-100 touch-manipulation ${isMobile ? 'min-h-[44px] p-2 -m-2' : ''}`}
        >
          {isMobile ? <Sliders className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
          필터 및 검색
          {isMobile && (
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 flex items-center gap-1 touch-manipulation ${isMobile ? 'min-h-[44px] px-2' : ''}`}
          >
            <X className="w-4 h-4" />
            {!isMobile && <span>필터 초기화</span>}
          </button>
        )}
      </div>

      {/* Always show search on mobile, show all filters when expanded */}
      <div className={`space-y-4 ${isMobile && !isExpanded ? 'hidden' : ''}`}>
        {/* Search - Always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="공약 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${isMobile ? 'py-3 text-base' : 'py-2'}`}
          />
        </div>

        {/* Filter Grid */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          <select
            value={selectedLevel}
            onChange={(e) => onLevelChange(e.target.value)}
            className={`px-4 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${isMobile ? 'py-3 text-base' : 'py-2'}`}
          >
            {levels.map(level => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`px-4 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${isMobile ? 'py-3 text-base' : 'py-2'}`}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`px-4 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${isMobile ? 'py-3 text-base' : 'py-2'}`}
          >
            {statuses.map(status => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>

          {/* Sort Options */}
          <div className="flex gap-1">
            <select
              value={sortBy || 'default'}
              onChange={(e) => onSortChange?.(e.target.value, sortOrder || 'desc')}
              className={`flex-1 px-4 border border-gray-300 dark:border-slate-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${isMobile ? 'py-3 text-base' : 'py-2'}`}
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => onSortChange?.(sortBy || 'default', sortOrder === 'desc' ? 'asc' : 'desc')}
              className={`border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-lg bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation flex items-center justify-center ${isMobile ? 'px-4 py-3 min-w-[52px]' : 'px-3 py-2'}`}
              title={sortOrder === 'desc' ? '내림차순' : '오름차순'}
            >
              {sortOrder === 'desc' ? 
                <SortDesc className="w-4 h-4 text-gray-600 dark:text-slate-300" /> : 
                <SortAsc className="w-4 h-4 text-gray-600 dark:text-slate-300" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search - Always visible */}
      {isMobile && !isExpanded && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="공약 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          />
        </div>
      )}
      {hasActiveFilters && (
        <div className={`flex flex-wrap gap-2 ${isMobile ? 'mt-3' : 'mt-4'}`}>
          {searchTerm && (
            <span className={`inline-flex items-center gap-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'}`}>
              검색: {searchTerm}
              <button onClick={() => onSearchChange('')} className={`hover:text-blue-900 dark:hover:text-slate-100 touch-manipulation ${isMobile ? 'p-1 -m-1' : ''}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedLevel !== 'all' && (
            <span className={`inline-flex items-center gap-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'}`}>
              {levels.find(l => l.id === selectedLevel)?.name}
              <button onClick={() => onLevelChange('all')} className={`hover:text-blue-900 dark:hover:text-slate-100 touch-manipulation ${isMobile ? 'p-1 -m-1' : ''}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className={`inline-flex items-center gap-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'}`}>
              {categories.find(c => c.id === selectedCategory)?.name}
              <button onClick={() => onCategoryChange('all')} className={`hover:text-blue-900 dark:hover:text-slate-100 touch-manipulation ${isMobile ? 'p-1 -m-1' : ''}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className={`inline-flex items-center gap-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'}`}>
              상태: {selectedStatus}
              <button onClick={() => onStatusChange('all')} className={`hover:text-blue-900 dark:hover:text-slate-100 touch-manipulation ${isMobile ? 'p-1 -m-1' : ''}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {sortBy && sortBy !== 'default' && (
            <span className={`inline-flex items-center gap-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1 text-sm'}`}>
              정렬: {sortOptions.find(s => s.id === sortBy)?.name} ({sortOrder === 'desc' ? '내림차순' : '오름차순'})
              <button onClick={() => onSortChange?.('default', 'desc')} className={`hover:text-blue-900 dark:hover:text-slate-100 touch-manipulation ${isMobile ? 'p-1 -m-1' : ''}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;