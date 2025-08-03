# Korea Promise Tracker - Database Documentation

## Overview

This document describes the complete database schema for the Korea Promise Tracker application's Phase 2 implementation. The database uses PostgreSQL with Supabase and implements comprehensive Row Level Security (RLS) policies for data protection.

## Architecture

### Database Schema Overview

The database consists of 5 main tables and 2 voting tables that support the citizen engagement features:

1. **profiles** - User profile information extending Supabase auth
2. **promise_ratings** - User ratings and reviews for promises
3. **citizen_reports** - User-submitted reports about promise progress
4. **subscriptions** - User notification preferences
5. **comments** - Threaded discussion system
6. **report_votes** - Voting system for citizen reports
7. **comment_votes** - Voting system for comments

### Entity Relationship Diagram

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles
    ↓ (1:many)
    ├── promise_ratings
    ├── citizen_reports ←→ report_votes
    ├── subscriptions
    └── comments ←→ comment_votes
```

## Table Specifications

### 1. profiles

Extends Supabase auth.users with additional user information.

**Columns:**
- `id` (UUID, PK) - References auth.users(id)
- `username` (TEXT, UNIQUE) - User's chosen username
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - Profile picture URL
- `region` (TEXT) - User's location/region
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last profile update

**Indexes:**
- Primary key on `id`
- Unique index on `username`
- Index on `region` for filtering
- Index on `created_at` for sorting

**RLS Policies:**
- SELECT: Public (all profiles viewable)
- INSERT: Users can create their own profile only
- UPDATE: Users can update their own profile only
- DELETE: Prevented (handled by CASCADE)

**Triggers:**
- Auto-create profile on user signup
- Auto-update `updated_at` timestamp

### 2. promise_ratings

Stores user ratings and reviews for government promises.

**Columns:**
- `id` (UUID, PK) - Unique rating identifier
- `promise_id` (TEXT) - Reference to promise
- `user_id` (UUID, FK) - References profiles(id)
- `rating` (INTEGER, 1-5) - Star rating
- `comment` (TEXT) - Optional review text
- `helpful_count` (INTEGER) - Number of helpful votes
- `created_at` (TIMESTAMP) - Rating creation time
- `updated_at` (TIMESTAMP) - Last rating update

**Constraints:**
- Unique constraint on (promise_id, user_id)
- Check constraint: rating BETWEEN 1 AND 5
- Check constraint: helpful_count >= 0

**Indexes:**
- Primary key on `id`
- Index on `promise_id` for promise queries
- Index on `user_id` for user queries
- Index on `rating` for filtering
- Unique composite index on (promise_id, user_id)

**RLS Policies:**
- SELECT: Public (all ratings viewable)
- INSERT: Authenticated users only
- UPDATE: Users can update their own ratings
- DELETE: Users can delete their own ratings

### 3. citizen_reports

User-submitted reports about promise progress with verification system.

**Columns:**
- `id` (UUID, PK) - Unique report identifier
- `promise_id` (TEXT) - Reference to promise
- `user_id` (UUID, FK) - References profiles(id)
- `report_type` (TEXT) - Type: 'news', 'photo', 'progress_update', 'concern'
- `title` (TEXT) - Report title
- `content` (TEXT) - Report content
- `media_url` (TEXT) - Optional media attachment
- `location` (TEXT) - Geographic location
- `verified` (BOOLEAN) - Verification status
- `verified_by` (UUID, FK) - References profiles(id)
- `verified_at` (TIMESTAMP) - Verification timestamp
- `upvotes` (INTEGER) - Upvote count
- `downvotes` (INTEGER) - Downvote count
- `created_at` (TIMESTAMP) - Report creation time
- `updated_at` (TIMESTAMP) - Last update time

**Constraints:**
- Check constraint: report_type IN ('news', 'photo', 'progress_update', 'concern')
- Check constraint: upvotes >= 0, downvotes >= 0

**Indexes:**
- Primary key on `id`
- Index on `promise_id`
- Index on `user_id`
- Index on `report_type`
- Index on `verified`
- Index on `location`

**RLS Policies:**
- SELECT: Public (all reports viewable)
- INSERT: Authenticated users only
- UPDATE: Users can update their own reports (except verification fields)
- DELETE: Users can delete their own reports

### 4. report_votes

Tracks user votes on citizen reports.

**Columns:**
- `id` (UUID, PK) - Unique vote identifier
- `report_id` (UUID, FK) - References citizen_reports(id)
- `user_id` (UUID, FK) - References profiles(id)
- `vote_type` (TEXT) - 'up' or 'down'
- `created_at` (TIMESTAMP) - Vote timestamp

**Constraints:**
- Unique constraint on (report_id, user_id)
- Check constraint: vote_type IN ('up', 'down')

**Triggers:**
- Automatically updates upvotes/downvotes in citizen_reports table

### 5. subscriptions

Manages user notification preferences for promises and regions.

**Columns:**
- `id` (UUID, PK) - Unique subscription identifier
- `user_id` (UUID, FK) - References profiles(id)
- `promise_id` (TEXT) - Specific promise (mutually exclusive with region)
- `region` (TEXT) - Region subscription (mutually exclusive with promise_id)
- `notification_type` (TEXT) - 'email', 'push', 'both'
- `is_active` (BOOLEAN) - Subscription status
- `created_at` (TIMESTAMP) - Subscription creation time
- `updated_at` (TIMESTAMP) - Last update time

**Constraints:**
- Check constraint: Either promise_id OR region must be set (not both)
- Check constraint: notification_type IN ('email', 'push', 'both')
- Unique constraints prevent duplicate subscriptions

**RLS Policies:**
- SELECT: Users can view their own subscriptions only
- INSERT: Users can create their own subscriptions only
- UPDATE: Users can update their own subscriptions only
- DELETE: Users can delete their own subscriptions only

### 6. comments

Threaded comment system for promise discussions.

**Columns:**
- `id` (UUID, PK) - Unique comment identifier
- `promise_id` (TEXT) - Reference to promise
- `user_id` (UUID, FK) - References profiles(id)
- `parent_comment_id` (UUID, FK) - References comments(id) for threading
- `content` (TEXT) - Comment content
- `upvotes` (INTEGER) - Upvote count
- `downvotes` (INTEGER) - Downvote count
- `is_pinned` (BOOLEAN) - Pinned status
- `is_deleted` (BOOLEAN) - Soft delete flag
- `created_at` (TIMESTAMP) - Comment creation time
- `updated_at` (TIMESTAMP) - Last update time

**Indexes:**
- Primary key on `id`
- Index on `promise_id`
- Index on `parent_comment_id`
- Composite index on (promise_id, parent_comment_id)

**RLS Policies:**
- SELECT: Public (non-deleted comments viewable)
- INSERT: Authenticated users only
- UPDATE: Users can update their own comments (content only)
- DELETE: Soft delete for own comments only

### 7. comment_votes

Tracks user votes on comments.

**Columns:**
- `id` (UUID, PK) - Unique vote identifier
- `comment_id` (UUID, FK) - References comments(id)
- `user_id` (UUID, FK) - References profiles(id)
- `vote_type` (TEXT) - 'up' or 'down'
- `created_at` (TIMESTAMP) - Vote timestamp

**Constraints:**
- Unique constraint on (comment_id, user_id)
- Check constraint: vote_type IN ('up', 'down')

**Triggers:**
- Automatically updates upvotes/downvotes in comments table

## Database Views

### promise_stats

Aggregated statistics for each promise.

**Columns:**
- `promise_id` - Promise identifier
- `total_ratings` - Total number of ratings
- `average_rating` - Average rating (1-5 scale)
- `five_star_count` - Number of 5-star ratings
- `four_star_count` - Number of 4-star ratings
- `three_star_count` - Number of 3-star ratings
- `two_star_count` - Number of 2-star ratings
- `one_star_count` - Number of 1-star ratings
- `latest_rating_date` - Most recent rating timestamp

### promise_engagement

Overall engagement metrics for each promise.

**Columns:**
- `promise_id` - Promise identifier
- `total_ratings` - Number of ratings
- `average_rating` - Average rating
- `total_comments` - Number of comments
- `total_reports` - Number of citizen reports
- `total_subscriptions` - Number of active subscriptions
- `last_activity_date` - Most recent activity timestamp

## Database Functions

### Rating Functions

**`get_promise_average_rating(p_promise_id TEXT)`**
- Returns: DECIMAL(3,2)
- Calculates average rating for a promise

**`get_promise_rating_count(p_promise_id TEXT)`**
- Returns: INTEGER
- Returns total number of ratings for a promise

### Subscription Functions

**`is_user_subscribed_to_promise(p_user_id UUID, p_promise_id TEXT)`**
- Returns: BOOLEAN
- Checks if user is subscribed to specific promise

**`is_user_subscribed_to_region(p_user_id UUID, p_region TEXT)`**
- Returns: BOOLEAN
- Checks if user is subscribed to region updates

**`get_user_subscriptions(p_user_id UUID)`**
- Returns: TABLE
- Returns all active subscriptions for a user

### Comment Functions

**`get_promise_comments(p_promise_id TEXT)`**
- Returns: TABLE
- Returns threaded comments with user profiles
- Includes reply counts and hierarchical structure

## Security Implementation

### Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

1. **Public Data**: Ratings, reports, and comments are publicly viewable
2. **User Ownership**: Users can only modify their own data
3. **Authentication Required**: All write operations require authentication
4. **Verification Protection**: Only admins can modify verification status
5. **Soft Deletes**: Comments use soft deletes to preserve discussion context

### Data Validation

1. **Input Sanitization**: All text inputs are validated and sanitized
2. **Type Checking**: Strict type checking on all enum values
3. **Range Validation**: Ratings must be 1-5, vote counts >= 0
4. **Uniqueness**: Prevents duplicate votes and ratings

### Performance Optimization

1. **Strategic Indexing**: Indexes on all frequently queried columns
2. **Composite Indexes**: Multi-column indexes for complex queries
3. **Partial Indexes**: Conditional indexes for specific use cases
4. **Query Optimization**: Views and functions for complex aggregations

## Migration Instructions

### 1. Initial Setup

Run migrations in order:

```sql
-- Execute in Supabase SQL Editor
\i database/migrations/000_run_all_migrations.sql
```

Or run individually:

```sql
\i database/migrations/001_create_profiles_table.sql
\i database/migrations/002_create_promise_ratings_table.sql
\i database/migrations/003_create_citizen_reports_table.sql
\i database/migrations/004_create_subscriptions_table.sql
\i database/migrations/005_create_comments_table.sql
```

### 2. Seed Test Data

```sql
\i database/seeds/001_seed_test_data.sql
```

### 3. Verify Installation

```sql
-- Check table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'promise_ratings', 'citizen_reports', 'subscriptions', 'comments');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test functions
SELECT get_promise_average_rating('nat-001');
SELECT get_promise_rating_count('nat-001');
```

## Backup and Restore

### Backup Procedures

1. **Full Database Backup**:
```bash
pg_dump -h your-host -U postgres -d your-database > backup.sql
```

2. **Schema Only**:
```bash
pg_dump -h your-host -U postgres -d your-database --schema-only > schema.sql
```

3. **Data Only**:
```bash
pg_dump -h your-host -U postgres -d your-database --data-only > data.sql
```

### Restore Procedures

1. **Full Restore**:
```bash
psql -h your-host -U postgres -d your-database < backup.sql
```

2. **Selective Restore**:
```sql
-- Restore specific tables
\i backup.sql
```

## Monitoring and Maintenance

### Performance Monitoring

1. **Query Performance**:
```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

2. **Index Usage**:
```sql
-- Check index usage
SELECT indexrelname, idx_tup_read, idx_tup_fetch, idx_scan
FROM pg_stat_user_indexes;
```

3. **Table Statistics**:
```sql
-- Check table statistics
SELECT relname, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup
FROM pg_stat_user_tables;
```

### Maintenance Tasks

1. **Vacuum and Analyze** (automated in Supabase)
2. **Index Maintenance** (automated in Supabase)
3. **Log Rotation** (automated in Supabase)
4. **Statistics Updates** (automated in Supabase)

## Troubleshooting

### Common Issues

1. **RLS Policy Violations**
   - Ensure user is authenticated
   - Check policy conditions
   - Verify user ownership

2. **Foreign Key Violations**
   - Ensure referenced records exist
   - Check CASCADE settings
   - Verify data integrity

3. **Unique Constraint Violations**
   - Check for duplicate data
   - Verify upsert logic
   - Review unique indexes

4. **Performance Issues**
   - Check query execution plans
   - Verify index usage
   - Monitor connection pools
   - Review query complexity

### Debugging Tools

1. **Supabase Dashboard**: Real-time monitoring
2. **SQL Editor**: Direct database queries
3. **API Logs**: Request/response monitoring
4. **Performance Insights**: Query analysis

## Future Enhancements

### Planned Features

1. **Content Moderation**: Automated content filtering
2. **Analytics Tables**: Detailed usage analytics
3. **Notification Queue**: Async notification processing
4. **File Storage**: Integration with Supabase Storage
5. **Full-Text Search**: PostgreSQL text search
6. **Audit Logs**: Comprehensive change tracking

### Scalability Considerations

1. **Read Replicas**: For read-heavy workloads
2. **Connection Pooling**: For high concurrency
3. **Caching Layer**: Redis for frequently accessed data
4. **Data Archiving**: For historical data management
5. **Partitioning**: For large tables

## Support and Documentation

### Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

### Contact Information

For database-related issues or questions, please refer to the project repository or contact the development team.

---

**Last Updated**: 2025-08-03
**Version**: 2.0.0
**Database Version**: PostgreSQL 15.x with Supabase Extensions