import React, { useState, useMemo } from 'react';
import RegionSelector from './components/RegionSelector';
import StaticMapSelector from './components/StaticMapSelector';
import PromiseCard from './components/PromiseCard';
import FilterPanel from './components/FilterPanel';
import StatsOverview from './components/StatsOverview';
import { promises } from './data/promises';
import { regions } from './data/regions';
import { filterPromises, getPromisesByRegion, sortPromisesByStatus } from './utils/helpers';
import { Building2, Map, LayoutGrid } from 'lucide-react';

function App() {
  const [selectedRegion, setSelectedRegion] = useState('seoul');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  const regionPromises = useMemo(() => {
    return getPromisesByRegion(promises, selectedRegion);
  }, [selectedRegion]);

  const filteredPromises = useMemo(() => {
    const filters = {
      level: selectedLevel,
      category: selectedCategory,
      status: selectedStatus,
      searchTerm: searchTerm
    };
    const filtered = filterPromises(regionPromises, filters);
    return sortPromisesByStatus(filtered);
  }, [regionPromises, selectedLevel, selectedCategory, selectedStatus, searchTerm]);

  const currentRegion = regions[selectedRegion];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">대한민국 공약 추적 시스템</h1>
                <p className="text-sm text-gray-600">대통령 및 지자체장 공약 이행 현황</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white rounded-lg border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-2 flex-shrink-0" />
              격자 보기
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                viewMode === 'map'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Map className="w-4 h-4 mr-2 flex-shrink-0" />
              지도 보기
            </button>
          </div>
        </div>

        {/* Region Selector */}
        {viewMode === 'grid' ? (
          <RegionSelector 
            selectedRegion={selectedRegion} 
            onRegionSelect={setSelectedRegion} 
          />
        ) : (
          <StaticMapSelector 
            selectedRegion={selectedRegion} 
            onRegionSelect={setSelectedRegion} 
          />
        )}

        {currentRegion && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              {currentRegion.name} 공약 현황
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">단체장:</span>{' '}
                <span className="text-gray-900">{currentRegion.leader}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">소속정당:</span>{' '}
                <span className={currentRegion.party === '국민의힘' ? 'text-red-600' : 'text-blue-600'}>
                  {currentRegion.party}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">임기:</span>{' '}
                <span className="text-gray-900">{currentRegion.term}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">인구:</span>{' '}
                <span className="text-gray-900">{currentRegion.population}명</span>
              </div>
            </div>
          </div>
        )}

        <StatsOverview promises={filteredPromises} />

        <FilterPanel
          selectedLevel={selectedLevel}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          searchTerm={searchTerm}
          onLevelChange={setSelectedLevel}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onSearchChange={setSearchTerm}
        />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            공약 목록 ({filteredPromises.length}개)
          </h3>
        </div>

        {filteredPromises.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              검색 조건에 맞는 공약이 없습니다.
            </p>
            <button
              onClick={() => {
                setSelectedLevel('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPromises.map((promise) => (
              <PromiseCard key={promise.id} promise={promise} />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © 2024 대한민국 공약 추적 시스템. 모든 데이터는 공개된 정보를 기반으로 합니다.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              본 시스템은 시민들의 알권리 증진을 위해 제작되었습니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;