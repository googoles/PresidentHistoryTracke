import React, { useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';

const DistrictList = ({ districts, regionName, selectedDistrict, onDistrictSelect, onDistrictHover }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDistricts = useMemo(() => {
    if (!searchTerm) return districts;
    return districts.filter(district =>
      district.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [districts, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="선거구 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* District count */}
      <div className="mb-2 text-sm text-gray-600 dark:text-slate-400">
        {filteredDistricts.length}개 선거구 {searchTerm && `(${districts.length}개 중)`}
      </div>

      {/* Districts list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ maxHeight: '400px' }}>
        {filteredDistricts.map((district, index) => (
          <button
            key={index}
            onClick={() => onDistrictSelect(district)}
            onMouseEnter={() => onDistrictHover(district)}
            onMouseLeave={() => onDistrictHover(null)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
              selectedDistrict?.name === district.name
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  selectedDistrict?.name === district.name
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-slate-500'
                }`} />
                <div>
                  <div className={`font-medium ${
                    selectedDistrict?.name === district.name
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-gray-900 dark:text-slate-100'
                  }`}>
                    {district.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {regionName}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}

        {filteredDistricts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictList;
