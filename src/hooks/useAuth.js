import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Hook for protected routes
export const useRequireAuth = () => {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return auth;
};

// Hook for profile requirements
export const useRequireProfile = () => {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  if (!auth.hasProfile) {
    throw new Error('Profile setup required');
  }
  
  return auth;
};

export default useAuth;