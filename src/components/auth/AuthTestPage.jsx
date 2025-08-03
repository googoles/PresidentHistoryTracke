import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { testSupabaseConnection } from '../../utils/supabase';
import ProtectedRoute from './ProtectedRoute';
import { CheckCircle, XCircle, RefreshCw, Database, User, Shield } from 'lucide-react';

const AuthTestPage = () => {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    hasProfile, 
    loading, 
    error,
    signOut 
  } = useAuth();
  
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Test Supabase connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({ success: false, error: error.message });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Status indicator component
  const StatusIndicator = ({ status, label }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center">
        {status === true && <CheckCircle className="w-5 h-5 text-green-500" />}
        {status === false && <XCircle className="w-5 h-5 text-red-500" />}
        {status === null && <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            인증 시스템 테스트
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Supabase 인증 시스템의 상태와 기능을 확인합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                데이터베이스 연결
              </h2>
            </div>
            
            <div className="space-y-3">
              <StatusIndicator 
                status={connectionStatus?.success} 
                label="Supabase 연결 상태" 
              />
              
              {connectionStatus?.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    오류: {connectionStatus.error}
                  </p>
                </div>
              )}
              
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isTestingConnection ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                연결 테스트
              </button>
            </div>
          </div>

          {/* Authentication Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                인증 상태
              </h2>
            </div>
            
            <div className="space-y-3">
              <StatusIndicator 
                status={loading ? null : isAuthenticated} 
                label="로그인 상태" 
              />
              
              <StatusIndicator 
                status={loading ? null : hasProfile} 
                label="프로필 완성" 
              />
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    인증 오류: {error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                사용자 정보
              </h2>
            </div>
            
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">이메일</p>
                  <p className="text-gray-900 dark:text-slate-100">{user?.email}</p>
                </div>
                
                {profile && (
                  <>
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">이름</p>
                      <p className="text-gray-900 dark:text-slate-100">{profile.full_name || '설정되지 않음'}</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">사용자명</p>
                      <p className="text-gray-900 dark:text-slate-100">{profile.username || '설정되지 않음'}</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">지역</p>
                      <p className="text-gray-900 dark:text-slate-100">{profile.region || '설정되지 않음'}</p>
                    </div>
                  </>
                )}
                
                <button
                  onClick={signOut}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-slate-400 mb-4">
                  로그인이 필요합니다.
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-500">
                  상단의 로그인 버튼을 클릭하여 로그인하세요.
                </p>
              </div>
            )}
          </div>

          {/* Protected Content Test */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                보호된 콘텐츠 테스트
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                  인증 필요 영역
                </h3>
                <ProtectedRoute>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-green-700 dark:text-green-300">
                        인증된 사용자만 볼 수 있는 콘텐츠입니다.
                      </span>
                    </div>
                  </div>
                </ProtectedRoute>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                  프로필 완성 필요 영역
                </h3>
                <ProtectedRoute requireProfile={true}>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-blue-700 dark:text-blue-300">
                        프로필이 완성된 사용자만 볼 수 있는 콘텐츠입니다.
                      </span>
                    </div>
                  </div>
                </ProtectedRoute>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Information */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            환경 설정 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Supabase URL</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 font-mono">
                {process.env.REACT_APP_SUPABASE_URL ? '설정됨' : '설정되지 않음'}
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Supabase Key</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 font-mono">
                {process.env.REACT_APP_SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음'}
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Google OAuth</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 font-mono">
                {process.env.REACT_APP_GOOGLE_CLIENT_ID ? '설정됨' : '설정되지 않음'}
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">환경</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 font-mono">
                {process.env.NODE_ENV}
              </p>
            </div>
          </div>
          
          {(!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>경고:</strong> Supabase 환경 변수가 설정되지 않았습니다. 
                <code className="mx-1 px-1 bg-yellow-200 dark:bg-yellow-800 rounded">.env</code> 
                파일을 확인하세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthTestPage;