import React, { useState } from 'react';
import { User, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LoginModal from './LoginModal';
import UserProfile from './UserProfile';

const AuthButton = () => {
  const { isAuthenticated, user, profile, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    );
  }

  // User not authenticated - show login button
  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowLoginModal(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <LogIn className="w-4 h-4 mr-2" />
          로그인
        </button>
        
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  // User authenticated - show profile button
  return (
    <>
      <button
        onClick={() => setShowProfile(true)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-2">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <span className="hidden sm:inline max-w-24 truncate">
          {profile?.username || profile?.full_name || user?.email?.split('@')[0] || '사용자'}
        </span>
      </button>
      
      <UserProfile 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)}
      />
    </>
  );
};

export default AuthButton;