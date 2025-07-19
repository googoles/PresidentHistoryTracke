import React, { useState } from 'react';
import { User, TrendingUp, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';

const OfficialsList = ({ officials, onSelectOfficial }) => {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedParty, setSelectedParty] = useState('all');

  const filteredOfficials = officials.filter(official => {
    const levelMatch = selectedLevel === 'all' || official.level === selectedLevel;
    const partyMatch = selectedParty === 'all' || official.party === selectedParty;
    return levelMatch && partyMatch;
  });

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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4">역대 공약 이행 현황</h2>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="all">전체 레벨</option>
            <option value="national">국가</option>
            <option value="local">지자체</option>
          </select>

          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="all">전체 정당</option>
            <option value="국민의힘">국민의힘</option>
            <option value="더불어민주당">더불어민주당</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOfficials.map((official) => {
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
                  <p className="text-sm text-gray-600 dark:text-slate-300">{official.position}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{official.term}</p>
                  <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded ${
                    official.party === '국민의힘' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {official.party}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">전체 진행률</span>
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
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{official.failedPromises}</p>
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
    </div>
  );
};

export default OfficialsList;