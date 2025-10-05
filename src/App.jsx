import React, { useState, useMemo } from 'react';
import StaticMapSelector from './components/StaticMapSelector';
import PromiseCard from './components/PromiseCard';
import FilterPanel from './components/FilterPanel';
import StatsOverview from './components/StatsOverview';
import OfficialsList from './components/OfficialsList';
import OfficialDetail from './components/OfficialDetail';
import DarkModeToggle from './components/DarkModeToggle';
import { useDBPromises } from './hooks/useDBPromises';
import { useDBOfficials } from './hooks/useDBOfficials';
import { useDBRegions } from './hooks/useDBRegions';
import { filterPromises, getPromisesByRegion, sortPromisesByStatus } from './utils/helpers';
import { Building2, Map, Users } from 'lucide-react';

function App() {
  // Fetch data from DB
  const { promises, loading: promisesLoading, error: promisesError } = useDBPromises();
  const { officials, loading: officialsLoading, error: officialsError } = useDBOfficials();
  const { regions, loading: regionsLoading } = useDBRegions();

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mainView, setMainView] = useState('regions'); // 'regions' or 'officials'
  const [selectedOfficial, setSelectedOfficial] = useState(null);

  // Compute all memoized values BEFORE any conditional returns
  const regionPromises = useMemo(() => {
    return getPromisesByRegion(promises, selectedRegion);
  }, [promises, selectedRegion]);

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

  const allPromises = useMemo(() => {
    const promisesList = [];
    if (promises && typeof promises === 'object') {
      Object.entries(promises).forEach(([region, regionPromises]) => {
        if (Array.isArray(regionPromises)) {
          regionPromises.forEach(promise => {
            promisesList.push(promise);
          });
        }
      });
    }
    console.log('[App] All Promises Count:', promisesList.length);
    return promisesList;
  }, [promises]);

  // Show loading state
  if (promisesLoading || officialsLoading || regionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">데이터베이스 로딩중...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (promisesError || officialsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">데이터 로딩 실패</p>
          <p className="text-gray-600 dark:text-slate-300">{promisesError?.message || officialsError?.message}</p>
        </div>
      </div>
    );
  }

  const currentRegion = regions[selectedRegion];

  const handleSelectOfficial = (official) => {
    setSelectedOfficial(official);
  };

  const handleBackToList = () => {
    setSelectedOfficial(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">대한민국 공약 추적 시스템</h1>
                  <p className="text-sm text-gray-600 dark:text-slate-300">대통령 및 지자체장 공약 이행 현황</p>
                </div>
              </div>
              <DarkModeToggle />
            </div>
          </div>
          <div className="text-center py-2 text-xs">
            <span className="text-gray-500 dark:text-slate-300">
              Background should change in dark mode
            </span>
          </div>
        </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main View Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-1 flex gap-1">
            <button
              onClick={() => {
                setMainView('regions');
                setSelectedOfficial(null);
              }}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                mainView === 'regions'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Map className="w-4 h-4 mr-2 flex-shrink-0" />
              지역별 공약
            </button>
            <button
              onClick={() => setMainView('officials')}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                mainView === 'officials'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              인물별 공약
            </button>
          </div>
        </div>

        {mainView === 'officials' ? (
          selectedOfficial ? (
            <OfficialDetail
              official={selectedOfficial}
              onBack={handleBackToList}
            />
          ) : (
            <OfficialsList
              officials={officials}
              onSelectOfficial={handleSelectOfficial}
            />
          )
        ) : (
          <>
            {/* Region Selector */}
            <StaticMapSelector 
              selectedRegion={selectedRegion} 
              onRegionSelect={setSelectedRegion} 
            />

            {/* Show message if no region selected */}
            {!selectedRegion ? (
              <div className="bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-600 rounded-lg p-12 text-center">
                <Map className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">
                  지역을 선택해주세요
                </h3>
                <p className="text-gray-600 dark:text-slate-300">
                  위 지도에서 관심있는 지역을 클릭하면 해당 지역의 공약 현황을 확인할 수 있습니다.
                </p>
              </div>
            ) : (
              <>
                {currentRegion && (
                  <div className="mb-6 bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-600 rounded-lg p-4">
                    <h2 className="text-xl font-bold text-blue-900 dark:text-slate-100 mb-2">
                      {currentRegion.name} - 국회의원 공약 현황
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                      이 지역 국회의원들의 공약 이행 현황입니다. 광역단체장 공약은 "인물별 공약" 탭에서 확인하세요.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">지역:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{currentRegion.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">유형:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{currentRegion.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">인구:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{currentRegion.population}명</span>
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
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                    공약 목록 ({filteredPromises.length}개)
                  </h3>
                </div>

                {filteredPromises.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 dark:text-slate-400 text-lg">
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
              </>
            )}
          </>
        )}
      </main>

      <footer className="bg-gray-800 dark:bg-slate-950 text-white py-8 mt-16 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-400 dark:text-slate-400">
              © 2024 대한민국 공약 추적 시스템. 모든 데이터는 공개된 정보를 기반으로 합니다.
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
              본 시스템은 시민들의 알권리 증진을 위해 제작되었습니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;