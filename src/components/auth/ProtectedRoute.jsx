import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoginModal from './LoginModal';

const ProtectedRoute = ({ children, requireProfile = false, fallback = null }) => {
  const { isAuthenticated, hasProfile, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-slate-400">인증 확인 중...</span>
        </div>
      </div>
    );
  }

  // User not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 max-w-md">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            로그인이 필요합니다
          </h3>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            이 기능을 사용하려면 로그인이 필요합니다.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            로그인하기
          </button>
          
          <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)}
            initialTab="login"
          />
        </div>
      </div>
    );
  }

  // User authenticated but profile incomplete (if required)
  if (requireProfile && !hasProfile) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 max-w-md">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            프로필 설정이 필요합니다
          </h3>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            이 기능을 사용하려면 프로필을 완성해주세요.
          </p>
          <button
            onClick={() => {
              // TODO: Open profile setup modal or redirect to profile page
              console.log('Profile setup required');
            }}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            프로필 설정하기
          </button>
        </div>
      </div>
    );
  }

  // User authenticated and has profile (if required)
  return children;
};

export default ProtectedRoute;