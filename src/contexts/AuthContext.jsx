import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { session } = await auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
          setError(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Load user profile from database
  const loadUserProfile = async (userId) => {
    try {
      const result = await db.getProfile(userId);
      if (result.success) {
        setProfile(result.data);
      } else {
        // Profile doesn't exist, create one
        const user = await auth.getCurrentUser();
        if (user.success && user.user) {
          const profileData = {
            username: user.user.user_metadata?.username || '',
            full_name: user.user.user_metadata?.full_name || '',
            avatar_url: user.user.user_metadata?.avatar_url || '',
            region: user.user.user_metadata?.region || 'seoul'
          };
          
          const createResult = await db.createProfile(userId, profileData);
          if (createResult.success) {
            setProfile(createResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
      setError(error.message);
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, userData = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await auth.signUp(email, password, userData);
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      // If email confirmation is disabled, user will be signed in immediately
      if (result.data.user && !result.data.user.email_confirmed_at) {
        // Email confirmation required
        return { 
          success: true, 
          message: '이메일 확인 링크를 발송했습니다. 이메일을 확인하고 링크를 클릭해주세요.' 
        };
      }
      
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error.message || '회원가입 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await auth.signIn(email, password);
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error.message || '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with OAuth provider
  const signInWithProvider = async (provider) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await auth.signInWithProvider(provider);
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error.message || `${provider} 로그인 중 오류가 발생했습니다.`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await auth.signOut();
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || '로그아웃 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await auth.resetPassword(email);
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { 
        success: true, 
        message: '비밀번호 재설정 링크를 이메일로 발송했습니다.' 
      };
    } catch (error) {
      const errorMessage = error.message || '비밀번호 재설정 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: '로그인이 필요합니다.' };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await db.updateProfile(user.id, updates);
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      setProfile(result.data);
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error.message || '프로필 업데이트 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Check if user has completed profile
  const hasProfile = !!profile;

  const value = {
    // State
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    hasProfile,
    
    // Methods
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updateProfile,
    
    // Utility
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;