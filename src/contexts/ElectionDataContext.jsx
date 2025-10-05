import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalDBDataSource } from '../services/LocalDBDataSource';
import { SupabaseDataSource } from '../services/SupabaseDataSource';

/**
 * Election Data Context
 *
 * 선거 데이터 소스를 전역적으로 제공하는 Context입니다.
 * 환경변수에 따라 Local DB 또는 Supabase를 자동으로 선택합니다.
 */

const ElectionDataContext = createContext(null);

export const ElectionDataProvider = ({ children }) => {
  const [dataSource, setDataSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeDataSource = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 환경변수로 데이터 소스 선택
        const useSupabase = process.env.REACT_APP_USE_SUPABASE === 'true';

        let source;

        if (useSupabase) {
          console.log('[ElectionData] Using Supabase data source');
          source = new SupabaseDataSource();
        } else {
          console.log('[ElectionData] Using Local DB data source');
          const dbPath = process.env.REACT_APP_LOCAL_DB_PATH || '/data/election_data.db';
          source = new LocalDBDataSource(dbPath);
        }

        // 데이터 소스 초기화
        await source.init();

        setDataSource(source);
        console.log('[ElectionData] Data source initialized successfully');

      } catch (err) {
        console.error('[ElectionData] Failed to initialize data source:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDataSource();

    // Cleanup: 컴포넌트 unmount 시 연결 종료
    return () => {
      if (dataSource) {
        dataSource.close().catch(console.error);
      }
    };
  }, []); // 빈 배열: 한 번만 실행

  const value = {
    dataSource,
    isLoading,
    error
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-slate-300 text-lg font-medium">
            선거 데이터를 불러오는 중...
          </p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-2">
            잠시만 기다려주세요
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 dark:text-red-300 text-xl font-bold mb-2">
            데이터 로딩 실패
          </h2>
          <p className="text-red-700 dark:text-red-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <ElectionDataContext.Provider value={value}>
      {children}
    </ElectionDataContext.Provider>
  );
};

/**
 * Election Data Hook
 *
 * 컴포넌트에서 선거 데이터 소스에 접근할 때 사용합니다.
 *
 * @example
 * const { dataSource } = useElectionData();
 * const winner = await dataSource.getWinnerByDistrict('종로구');
 */
export const useElectionData = () => {
  const context = useContext(ElectionDataContext);

  if (!context) {
    throw new Error('useElectionData must be used within ElectionDataProvider');
  }

  return context;
};
