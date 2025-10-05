import React, { useState, useMemo } from 'react';
import { User, TrendingUp, CheckCircle, XCircle, Clock, ChevronRight, Search, ChevronLeft } from 'lucide-react';

const OfficialsList = ({ officials, onSelectOfficial }) => {
  const [selectedParty, setSelectedParty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract unique parties
  const parties = useMemo(() => {
    const partySet = new Set(officials.map(o => o.party).filter(Boolean));
    return ['all', ...Array.from(partySet).sort()];
  }, [officials]);

  // Filter and sort officials
  const filteredOfficials = useMemo(() => {
    let filtered = officials.filter(official => {
      const partyMatch = selectedParty === 'all' || official.party === selectedParty;
      const searchMatch = searchTerm === '' ||
        official.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        official.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        official.position?.toLowerCase().includes(searchTerm.toLowerCase());

      return partyMatch && searchMatch;
    });

    // Sort by name (가나다순)
    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
  }, [officials, selectedParty, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredOfficials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOfficials = filteredOfficials.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedParty, searchTerm]);

  const getProgressRate = (official) => {
    const total = official.totalPromises;
    const completed = official.completedPromises;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getStatusColor = (rate) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4">
          국회의원 공약 이행 현황
        </h2>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 지역구로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            >
              <option value="all">전체 정당</option>
              {parties.filter(p => p !== 'all').map(party => (
                <option key={party} value={party}>
                  {party}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-slate-400">
            총 {filteredOfficials.length}명 ({startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOfficials.length)})
          </div>
        </div>
      </div>

      {/* Officials Grid */}
      {paginatedOfficials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-slate-400">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedOfficials.map((official) => {
              const progressRate = getProgressRate(official);

              return (
                <div
                  key={official.id}
                  onClick={() => onSelectOfficial(official)}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-700"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-gray-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100">{official.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-300">{official.district}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{official.term}</p>
                      <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded ${
                        official.party === '국민의힘' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {official.party}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-slate-400">전체 진행률</span>
                      <span className={`text-sm font-bold ${getStatusColor(progressRate)}`}>
                        {progressRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progressRate >= 70 ? 'bg-green-500' :
                          progressRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${progressRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <div className="flex items-center justify-center text-green-600 mb-1">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-300">완료</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{official.completedPromises}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center text-blue-600 mb-1">
                        <Clock className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-300">진행중</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{official.inProgressPromises}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center text-red-600 mb-1">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-300">미달성</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{official.pendingPromises + official.suspendedPromises}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-600">
                    <span className="text-sm text-gray-600 dark:text-slate-300">총 {official.totalPromises}개 공약</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
                title="첫 페이지"
              >
                &laquo;
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
                title="이전 페이지"
              >
                &lt;
              </button>

              {/* Page Numbers (show max 5 pages) */}
              {(() => {
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                if (endPage - startPage < maxVisible - 1) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg min-w-[2.5rem] ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
                title="다음 페이지"
              >
                &gt;
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
                title="마지막 페이지"
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(OfficialsList);
