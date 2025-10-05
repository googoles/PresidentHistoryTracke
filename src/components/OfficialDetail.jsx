import React, { useState, useMemo } from 'react';
import { ArrowLeft, User, TrendingUp, CheckCircle, XCircle, Clock, Calendar, Filter } from 'lucide-react';
import PromiseCard from './PromiseCard';
import { filterPromises, sortPromisesByStatus } from '../utils/helpers';
import { useOfficialPledges } from '../hooks/useOfficialPledges';

const OfficialDetail = ({ official, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch official's pledges from DB
  const { pledges: officialPromises, loading: pledgesLoading, error: pledgesError } = useOfficialPledges(official);

  const filteredPromises = useMemo(() => {
    console.log('[OfficialDetail] officialPromises:', officialPromises);
    console.log('[OfficialDetail] officialPromises.length:', officialPromises.length);

    const filters = {
      level: 'all', // Add missing level filter
      category: selectedCategory,
      status: selectedStatus,
      searchTerm: searchTerm
    };
    const filtered = filterPromises(officialPromises, filters);

    console.log('[OfficialDetail] After filtering:', filtered.length);
    console.log('[OfficialDetail] Filters:', filters);

    return sortPromisesByStatus(filtered);
  }, [officialPromises, selectedCategory, selectedStatus, searchTerm]);

  const progressRate = official.totalPromises > 0 
    ? Math.round((official.completedPromises / official.totalPromises) * 100) 
    : 0;

  const categories = [...new Set(officialPromises.map(p => p.category))];

  // Show loading state
  if (pledgesLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>목록으로 돌아가기</span>
        </button>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">공약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (pledgesError) {
    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>목록으로 돌아가기</span>
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-12 text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">공약 정보를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600 dark:text-slate-400 text-sm">{pledgesError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>목록으로 돌아가기</span>
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
              <User className="w-16 h-16 text-gray-500 dark:text-slate-400" />
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-2">{official.name}</h1>
              <p className="text-lg text-gray-600 dark:text-slate-300">{official.position}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`inline-block text-sm font-medium px-3 py-1 rounded ${
                  official.party === '국민의힘' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {official.party}
                </span>
                <span className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {official.term}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">전체 공약 이행률</h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{progressRate}%</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          progressRate >= 70 ? 'bg-green-500' :
                          progressRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${progressRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center text-green-600 mb-1">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">완료</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-slate-100">{official.completedPromises}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-blue-600 mb-1">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">진행중</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-slate-100">{official.inProgressPromises}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-red-600 mb-1">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">미달성</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-slate-100">{official.failedPromises}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-slate-300" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">공약 필터</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              카테고리
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            >
              <option value="all">전체 카테고리</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              진행 상태
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            >
              <option value="all">전체 상태</option>
              <option value="달성">달성</option>
              <option value="진행중">진행중</option>
              <option value="부분달성">부분달성</option>
              <option value="미달성">미달성</option>
              <option value="중단">중단</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              검색
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="공약 제목 검색..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
          공약 목록 (전체: {officialPromises.length}개, 필터링: {filteredPromises.length}개)
        </h3>
      </div>

      {/* Debug Info */}
      {officialPromises.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm">
            <strong>디버그:</strong> DB에서 공약을 가져오지 못했습니다. 콘솔을 확인하세요.
          </p>
        </div>
      )}

      {filteredPromises.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-2">
            {officialPromises.length === 0
              ? '이 후보자의 공약 정보가 없습니다.'
              : '검색 조건에 맞는 공약이 없습니다.'}
          </p>
          {officialPromises.length > 0 && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPromises.map((promise) => (
            <PromiseCard key={promise.id} promise={promise} />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(OfficialDetail);