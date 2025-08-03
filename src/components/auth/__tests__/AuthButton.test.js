import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../../../contexts/AuthContext';
import AuthButton from '../AuthButton';

// Mock Supabase client
jest.mock('../../../utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn().mockImplementation((callback) => {
        // Call the callback with initial state
        setTimeout(() => callback('SIGNED_OUT', null), 0);
        return {
          data: { 
            subscription: { 
              unsubscribe: jest.fn() 
            } 
          }
        };
      })
    }
  },
  auth: {
    getSession: jest.fn().mockResolvedValue({ success: true, session: null }),
    getCurrentUser: jest.fn().mockResolvedValue({ success: true, user: null })
  },
  db: {
    getProfile: jest.fn().mockResolvedValue({ success: false, error: 'Profile not found' })
  },
  testSupabaseConnection: jest.fn().mockResolvedValue({ success: true })
}));

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthButton', () => {
  test('renders login button when user is not authenticated', async () => {
    renderWithAuth(<AuthButton />);
    
    // Wait for the auth state to load
    await screen.findByText('로그인');
    
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  test('opens login modal when login button is clicked', async () => {
    renderWithAuth(<AuthButton />);
    
    const loginButton = await screen.findByText('로그인');
    fireEvent.click(loginButton);
    
    // Check if modal opens
    expect(screen.getByText('이메일')).toBeInTheDocument();
  });

  test('closes login modal when close button is clicked', async () => {
    renderWithAuth(<AuthButton />);
    
    const loginButton = await screen.findByText('로그인');
    fireEvent.click(loginButton);
    
    // Modal should be open
    expect(screen.getByText('이메일')).toBeInTheDocument();
    
    // Click close button (using X icon)
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(button => 
      button.querySelector('svg') // Find button with SVG (X icon)
    );
    
    if (closeButton) {
      fireEvent.click(closeButton);
      
      // Modal should be closed
      expect(screen.queryByText('이메일')).not.toBeInTheDocument();
    }
  });
});

describe('Authentication Context', () => {
  test('provides authentication state', async () => {
    const TestComponent = () => {
      const { isAuthenticated, loading } = require('../../../hooks/useAuth').useAuth();
      
      if (loading) return <div>Loading...</div>;
      
      return (
        <div>
          <span data-testid="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
      );
    };

    renderWithAuth(<TestComponent />);
    
    // Wait for loading to finish
    await screen.findByTestId('auth-status');
    
    expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
  });
});