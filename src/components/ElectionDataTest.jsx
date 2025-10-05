import React, { useState, useEffect } from 'react';
import { useElectionData } from '../contexts/ElectionDataContext';

/**
 * Election Data Test Component
 *
 * LocalDBDataSource의 기능을 테스트하는 컴포넌트입니다.
 * 개발 중에만 사용하며, 프로덕션에서는 제거합니다.
 */
const ElectionDataTest = () => {
  const { dataSource } = useElectionData();

  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('종로구');

  const runTests = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: 선거 정보 조회
      console.log('Test 1: getElection()');
      const election = await dataSource.getElection('20240410');
      results.election = election;

      // Test 2: 특정 선거구 당선자 조회
      console.log('Test 2: getWinnerByDistrict()');
      const winner = await dataSource.getWinnerByDistrict(selectedDistrict);
      results.winner = winner;

      // Test 3: 당선자 공약 조회
      if (winner) {
        console.log('Test 3: getPledgesByCandidate()');
        const pledges = await dataSource.getPledgesByCandidate(winner.hubo_id);
        results.pledges = pledges;

        // Test 4: 공약 통계
        console.log('Test 4: getPledgeStatistics()');
        const stats = await dataSource.getPledgeStatistics(winner.hubo_id);
        results.statistics = stats;
      }

      // Test 5: 전체 당선자 수
      console.log('Test 5: getAllWinners()');
      const allWinners = await dataSource.getAllWinners();
      results.totalWinners = allWinners.length;

      // Test 6: 정당별 당선자
      console.log('Test 6: getWinnersByParty()');
      const demoWinners = await dataSource.getWinnersByParty('더불어민주당');
      const ppWinners = await dataSource.getWinnersByParty('국민의힘');
      results.partyStats = {
        '더불어민주당': demoWinners.length,
        '국민의힘': ppWinners.length
      };

      // Test 7: 후보자 검색
      console.log('Test 7: searchCandidates()');
      const searchResults = await dataSource.searchCandidates('서울');
      results.searchResults = searchResults.length;

      // Test 8: 정당 목록
      console.log('Test 8: getAllParties()');
      const parties = await dataSource.getAllParties();
      results.parties = parties;

      setTestResults(results);
      console.log('All tests completed!', results);

    } catch (error) {
      console.error('Test failed:', error);
      results.error = error.message;
      setTestResults(results);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          🧪 Election Data Source Test
        </h1>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              placeholder="선거구명 입력 (예: 종로구)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? '테스트 실행 중...' : '테스트 실행'}
            </button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              {/* 선거 정보 */}
              {testResults.election && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    📅 선거 정보
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    {testResults.election.election_name} ({testResults.election.election_date})
                  </p>
                </div>
              )}

              {/* 당선자 정보 */}
              {testResults.winner && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                    🏛️ 당선자 정보 ({selectedDistrict})
                  </h3>
                  <div className="space-y-1 text-sm text-green-800 dark:text-green-400">
                    <p><strong>이름:</strong> {testResults.winner.name}</p>
                    <p><strong>정당:</strong> {testResults.winner.party_name}</p>
                    <p><strong>득표율:</strong> {testResults.winner.vote_percentage}% ({testResults.winner.votes_won?.toLocaleString()}표)</p>
                    <p><strong>나이:</strong> {testResults.winner.age}세 / {testResults.winner.gender}</p>
                    <p><strong>직업:</strong> {testResults.winner.job}</p>
                  </div>
                </div>
              )}

              {/* 공약 통계 */}
              {testResults.statistics && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                    📊 공약 통계
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {testResults.statistics.total}
                      </div>
                      <div className="text-purple-700 dark:text-purple-500">전체</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {testResults.statistics.completed}
                      </div>
                      <div className="text-green-700 dark:text-green-500">완료</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {testResults.statistics.inProgress}
                      </div>
                      <div className="text-blue-700 dark:text-blue-500">진행중</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {testResults.statistics.pending}
                      </div>
                      <div className="text-gray-700 dark:text-gray-500">준비중</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 공약 목록 */}
              {testResults.pledges && testResults.pledges.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    📋 공약 목록 (처음 5개)
                  </h3>
                  <div className="space-y-2">
                    {testResults.pledges.slice(0, 5).map((pledge, idx) => (
                      <div key={idx} className="text-sm text-yellow-800 dark:text-yellow-400 border-l-2 border-yellow-400 pl-3">
                        <strong>{idx + 1}. {pledge.pledge_title}</strong>
                        <div className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                          상태: {pledge.status} | 분야: {pledge.pledge_realm || '미지정'}
                        </div>
                      </div>
                    ))}
                    {testResults.pledges.length > 5 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 italic">
                        ... 외 {testResults.pledges.length - 5}개 공약
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 전체 통계 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {testResults.totalWinners && (
                  <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {testResults.totalWinners}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">총 당선자 수</div>
                  </div>
                )}

                {testResults.partyStats && (
                  <>
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-center">
                      <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                        {testResults.partyStats['더불어민주당']}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">더불어민주당</div>
                    </div>
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                      <div className="text-3xl font-bold text-red-900 dark:text-red-300">
                        {testResults.partyStats['국민의힘']}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-400">국민의힘</div>
                    </div>
                  </>
                )}
              </div>

              {/* 정당 목록 */}
              {testResults.parties && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    🎭 등록 정당 ({testResults.parties.length}개)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {testResults.parties.map((party, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full text-xs"
                      >
                        {party}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 에러 */}
              {testResults.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                    ❌ 에러 발생
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-400">
                    {testResults.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            💡 사용 가능한 선거구 예시
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {['종로구', '강남구 갑', '강남구 을', '서초구 갑', '마포구 갑', '관악구 을', '용산구', '송파구 병'].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-800 dark:text-gray-200 transition-colors"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionDataTest;
