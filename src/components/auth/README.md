# Authentication System

This directory contains the complete authentication system for the Korea Promise Tracker application, built with Supabase.

## Components

### AuthButton.jsx
- Main authentication entry point
- Shows login button for unauthenticated users
- Shows user profile button for authenticated users
- Handles modal state management

### LoginModal.jsx
- Comprehensive authentication modal
- Supports email/password and social login (Google, Kakao, Naver)
- Tabbed interface for login, registration, and password reset
- Form validation and error handling
- Korean UI with responsive design

### UserProfile.jsx
- User profile management interface
- Profile editing with real-time updates
- Avatar upload placeholder (to be implemented)
- Account settings and logout functionality

### ProtectedRoute.jsx
- Route protection component
- Handles authentication requirements
- Shows appropriate fallback UI for unauthenticated users
- Supports profile completion requirements

## Features

### Authentication Methods
- **Email/Password**: Standard email-based authentication
- **Google OAuth**: Google social login
- **Kakao OAuth**: Kakao social login (Korean platform)
- **Naver OAuth**: Naver social login (Korean platform)

### User Management
- User registration with profile creation
- Email verification support
- Password reset functionality
- Profile management (name, username, region)
- Account settings and preferences

### Security Features
- Supabase Row Level Security (RLS) integration
- Secure session management
- Protected routes and components
- Input validation and sanitization

## Usage

### Basic Authentication
```jsx
import { AuthProvider } from '../contexts/AuthContext';
import AuthButton from './components/auth/AuthButton';

function App() {
  return (
    <AuthProvider>
      <div>
        <AuthButton />
        {/* Your app content */}
      </div>
    </AuthProvider>
  );
}
```

### Protected Routes
```jsx
import ProtectedRoute from './components/auth/ProtectedRoute';

function MyProtectedPage() {
  return (
    <ProtectedRoute requireProfile={true}>
      <div>This content requires authentication and profile</div>
    </ProtectedRoute>
  );
}
```

### Using Auth Hook
```jsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    signIn, 
    signOut, 
    loading 
  } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {profile?.full_name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## Configuration

### Environment Variables
Required environment variables in `.env`:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# OAuth Providers (optional)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_KAKAO_CLIENT_ID=your_kakao_client_id
REACT_APP_NAVER_CLIENT_ID=your_naver_client_id
```

### Supabase Setup
1. Create a new Supabase project
2. Set up authentication providers in the Supabase dashboard
3. Configure OAuth redirect URLs
4. Set up the profiles table (see database schema in project docs)

### OAuth Provider Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs in Supabase format

#### Kakao OAuth
1. Go to [Kakao Developers](https://developers.kakao.com/)
2. Create a new application
3. Set up Kakao Login
4. Configure redirect URIs
5. Add client ID to Supabase and environment variables

#### Naver OAuth
1. Go to [Naver Developers](https://developers.naver.com/)
2. Create a new application
3. Set up Naver Login
4. Configure callback URLs
5. Add client ID to Supabase and environment variables

## Styling

The authentication components use Tailwind CSS with support for:
- Dark mode (automatically follows system/app theme)
- Responsive design (mobile-first approach)
- Korean typography and spacing
- Accessibility features (WCAG 2.1 AA compliant)

## Error Handling

The system includes comprehensive error handling:
- Network connection errors
- Authentication failures
- Validation errors
- User-friendly Korean error messages
- Loading states and feedback

## Testing

Test files are included for critical components:
- `AuthButton.test.js`: Tests authentication button functionality
- Mock Supabase client for testing
- Jest and React Testing Library setup

Run tests with:
```bash
npm test
npm run test:supabase
```

## Future Enhancements

### Planned Features
- Avatar upload to Supabase Storage
- Two-factor authentication (2FA)
- Social profile import
- Account deletion and data export
- Advanced role-based permissions

### Security Improvements
- Rate limiting for authentication attempts
- Advanced password requirements
- Session timeout management
- Suspicious activity detection

## Troubleshooting

### Common Issues
1. **"Missing environment variables"**: Check `.env` file setup
2. **"Connection test failed"**: Verify Supabase URL and key
3. **OAuth redirect errors**: Check redirect URIs in provider settings
4. **Profile creation errors**: Ensure database tables exist

### Debug Mode
Enable debug logging by setting:
```bash
REACT_APP_DEBUG_AUTH=true
```

## Support

For authentication-related issues:
1. Check Supabase dashboard logs
2. Review browser console for errors
3. Verify environment variable configuration
4. Test with different browsers/incognito mode