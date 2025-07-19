import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { categories, statusConfig } from '../data/categories';

const FilterPanel = ({ 
  selectedLevel, 
  selectedCategory, 
  selectedStatus, 
  searchTerm,
  onLevelChange,
  onCategoryChange,
  onStatusChange,
  onSearchChange
}) => {
  const levels = [
    { id: 'all', name: '전체' },
    { id: 'national', name: '대통령 공약' },
    { id: 'local', name: '지자체 공약' }
  ];

  const statuses = [
    { id: 'all', name: '전체' },
    ...Object.keys(statusConfig).map(status => ({ id: status, name: status }))
  ];

  const clearFilters = () => {
    onLevelChange('all');
    onCategoryChange('all');
    onStatusChange('all');
    onSearchChange('');
  };

  const hasActiveFilters = selectedLevel !== 'all' || selectedCategory !== 'all' || 
                          selectedStatus !== 'all' || searchTerm !== '';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          필터 및 검색
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            필터 초기화
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="공약 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          />
        </div>

        <select
          value={selectedLevel}
          onChange={(e) => onLevelChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
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
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
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
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        >
          {statuses.map(status => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full text-sm">
              검색: {searchTerm}
              <button onClick={() => onSearchChange('')} className="hover:text-blue-900 dark:hover:text-slate-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedLevel !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full text-sm">
              {levels.find(l => l.id === selectedLevel)?.name}
              <button onClick={() => onLevelChange('all')} className="hover:text-blue-900 dark:hover:text-slate-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full text-sm">
              {categories.find(c => c.id === selectedCategory)?.name}
              <button onClick={() => onCategoryChange('all')} className="hover:text-blue-900 dark:hover:text-slate-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 rounded-full text-sm">
              상태: {selectedStatus}
              <button onClick={() => onStatusChange('all')} className="hover:text-blue-900 dark:hover:text-slate-100">
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