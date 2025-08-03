Claude Code Instructions: Supabase Integration for Korea Promise Tracker
🎯 Project Overview
Enhance the existing Korea Promise Tracker application by integrating Supabase for citizen engagement features, real-time updates, and user-generated content management.
📋 Phase 1: Supabase Setup & Authentication (Priority: HIGH)
Task 1.1: Supabase Project Initialization
bash# Initialize Supabase in the existing project
npm install @supabase/supabase-js @supabase/auth-ui-react
Requirements:

Set up Supabase project configuration
Create environment variables for Supabase connection
Initialize Supabase client in src/utils/supabase.js
Implement error handling and connection testing

Task 1.2: Authentication System
Features to implement:

Social login (Google, Kakao, Naver)
Email/password authentication
User profile management
Protected routes and auth guards

Files to create/modify:

src/components/auth/LoginModal.jsx
src/components/auth/UserProfile.jsx
src/hooks/useAuth.js
src/contexts/AuthContext.jsx

📋 Phase 2: Database Schema & Core Tables (Priority: HIGH)
Task 2.1: Database Schema Creation
Create the following tables in Supabase:
sql-- User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  region TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Promise Ratings
CREATE TABLE promise_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Citizen Reports
CREATE TABLE citizen_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  report_type TEXT CHECK (report_type IN ('news', 'photo', 'progress_update', 'concern')),
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  promise_id TEXT,
  region TEXT,
  notification_type TEXT CHECK (notification_type IN ('email', 'push', 'both')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  parent_comment_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
Task 2.2: Row Level Security (RLS) Policies
Implement security policies for each table to ensure data protection and proper access control.
📋 Phase 3: Citizen Engagement Features (Priority: HIGH)
Task 3.1: Promise Rating System
Components to create:

src/components/engagement/RatingCard.jsx
src/components/engagement/RatingModal.jsx
src/components/engagement/RatingStats.jsx

Features:

5-star rating system for each promise
Comment functionality with ratings
Average rating calculation and display
Sorting promises by rating

Task 3.2: Citizen Reporting System
Components to create:

src/components/reports/ReportForm.jsx
src/components/reports/ReportCard.jsx
src/components/reports/ReportGallery.jsx
src/components/reports/ReportVerification.jsx

Features:

Photo/video upload for progress evidence
News article sharing
Location-based reporting
Report verification system
Report categorization and filtering

Task 3.3: Comments & Discussion
Components to create:

src/components/comments/CommentSection.jsx
src/components/comments/CommentForm.jsx
src/components/comments/CommentThread.jsx

Features:

Nested comment threads
Upvote/downvote system
Comment moderation
Real-time comment updates using Supabase Realtime

📋 Phase 4: Real-time Features (Priority: MEDIUM)
Task 4.1: Real-time Updates
Features to implement:

Live comment updates
Real-time rating changes
Live notification system
Progress update notifications

Files to create/modify:

src/hooks/useRealtime.js
src/components/notifications/NotificationCenter.jsx
Modify existing components to support real-time data

Task 4.2: Subscription & Notification System
Components to create:

src/components/notifications/SubscriptionManager.jsx
src/components/notifications/NotificationPreferences.jsx

Features:

Email notifications for promise updates
Push notifications (future web push)
Customizable notification preferences
Digest email system

📋 Phase 5: Advanced Features (Priority: MEDIUM)
Task 5.1: Data Analytics Dashboard
Components to create:

src/components/analytics/CitizenEngagement.jsx
src/components/analytics/TrendingPromises.jsx
src/components/analytics/RegionalComparison.jsx

Features:

Most discussed promises
Regional engagement statistics
Trending topics and concerns
User engagement metrics

Task 5.2: Social Sharing Enhancement
Features to implement:

Enhanced social media sharing with custom meta tags
Shareable promise cards with citizen ratings
Social proof integration
Viral content identification

📋 Phase 6: Mobile Optimization (Priority: LOW)
Task 6.1: Progressive Web App (PWA)
Features to implement:

Service worker for offline functionality
App-like experience on mobile
Push notification support
Offline data caching

Task 6.2: Mobile-First UI Improvements
Components to optimize:

Touch-friendly rating interfaces
Swipe gestures for promise navigation
Mobile-optimized image upload
Responsive comment system

🔧 Technical Requirements
Performance Standards:

Page load time < 2 seconds
Real-time updates < 100ms latency
Image upload < 5MB with compression
99.9% uptime target

Security Requirements:

Input sanitization for all user content
Image upload validation and processing
Rate limiting for API calls
Content moderation system

Accessibility Standards:

WCAG 2.1 AA compliance
Screen reader compatibility
Keyboard navigation support
High contrast mode support

🚀 Implementation Strategy
Week 1-2: Foundation

Supabase setup and authentication
Database schema implementation
Basic CRUD operations

Week 3-4: Core Features

Rating and commenting system
Citizen reporting functionality
Real-time updates integration

Week 5-6: Enhancement & Polish

Advanced analytics
Performance optimization
Testing and bug fixes

📊 Success Metrics
User Engagement:

Daily active users increase by 200%
Average session time increase by 150%
User-generated content growth of 500%

Technical Metrics:

95% lighthouse performance score
<2 second page load times
99.9% API uptime

🛠 Development Commands
bash# Start development with Supabase
npm run dev:supabase

# Run tests with Supabase mocking
npm run test:supabase

# Deploy with Supabase migrations
npm run deploy:production

# Backup database
npm run db:backup

# Run security audit
npm run security:audit
📋 Acceptance Criteria
Phase 1 Complete When:

 Users can register and login via social providers
 User profiles are created automatically
 Authentication state is managed globally
 Protected routes work correctly

Phase 2 Complete When:

 All database tables are created with proper relationships
 RLS policies are implemented and tested
 Data validation is working
 Basic CRUD operations are functional

Phase 3 Complete When:

 Users can rate and comment on promises
 Citizens can submit reports with media
 Comments support threading and voting
 All features work on mobile devices

Final Acceptance:

 All features work seamlessly together
 Performance meets specified targets
 Security audit passes
 User testing feedback incorporated
 Documentation is complete

🎯 Priority Order for Implementation:

Authentication System (Blocking for all other features)
Database Schema (Foundation for data storage)
Rating System (High user engagement value)
Citizen Reports (Unique value proposition)
Real-time Features (Enhanced user experience)
Analytics Dashboard (Data insights)
PWA Features (Mobile experience)

Start with Phase 1 and work sequentially. Each phase should be fully functional before moving to the next phase.