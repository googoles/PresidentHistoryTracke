// TypeScript interfaces for Supabase database tables
// Generated for Korea Promise Tracker Phase 2 implementation

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      promise_ratings: {
        Row: PromiseRating;
        Insert: PromiseRatingInsert;
        Update: PromiseRatingUpdate;
      };
      citizen_reports: {
        Row: CitizenReport;
        Insert: CitizenReportInsert;
        Update: CitizenReportUpdate;
      };
      report_votes: {
        Row: ReportVote;
        Insert: ReportVoteInsert;
        Update: ReportVoteUpdate;
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
      };
      comments: {
        Row: Comment;
        Insert: CommentInsert;
        Update: CommentUpdate;
      };
      comment_votes: {
        Row: CommentVote;
        Insert: CommentVoteInsert;
        Update: CommentVoteUpdate;
      };
    };
    Views: {
      promise_stats: {
        Row: PromiseStats;
      };
      promise_engagement: {
        Row: PromiseEngagement;
      };
    };
    Functions: {
      get_promise_average_rating: {
        Args: { p_promise_id: string };
        Returns: number;
      };
      get_promise_rating_count: {
        Args: { p_promise_id: string };
        Returns: number;
      };
      is_user_subscribed_to_promise: {
        Args: { p_user_id: string; p_promise_id: string };
        Returns: boolean;
      };
      is_user_subscribed_to_region: {
        Args: { p_user_id: string; p_region: string };
        Returns: boolean;
      };
      get_user_subscriptions: {
        Args: { p_user_id: string };
        Returns: UserSubscription[];
      };
      get_promise_comments: {
        Args: { p_promise_id: string };
        Returns: CommentWithProfile[];
      };
    };
  };
}

// Profile related types
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  region?: string | null;
}

export interface ProfileUpdate {
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  region?: string | null;
}

// Promise Rating related types
export interface PromiseRating {
  id: string;
  promise_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromiseRatingInsert {
  promise_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
}

export interface PromiseRatingUpdate {
  rating?: number;
  comment?: string | null;
}

// Citizen Report related types
export type ReportType = 'news' | 'photo' | 'progress_update' | 'concern';

export interface CitizenReport {
  id: string;
  promise_id: string;
  user_id: string;
  report_type: ReportType;
  title: string;
  content: string | null;
  media_url: string | null;
  location: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export interface CitizenReportInsert {
  promise_id: string;
  user_id: string;
  report_type: ReportType;
  title: string;
  content?: string | null;
  media_url?: string | null;
  location?: string | null;
}

export interface CitizenReportUpdate {
  report_type?: ReportType;
  title?: string;
  content?: string | null;
  media_url?: string | null;
  location?: string | null;
}

// Report Vote related types
export type VoteType = 'up' | 'down';

export interface ReportVote {
  id: string;
  report_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface ReportVoteInsert {
  report_id: string;
  user_id: string;
  vote_type: VoteType;
}

export interface ReportVoteUpdate {
  vote_type: VoteType;
}

// Subscription related types
export type NotificationType = 'email' | 'push' | 'both';

export interface Subscription {
  id: string;
  user_id: string;
  promise_id: string | null;
  region: string | null;
  notification_type: NotificationType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInsert {
  user_id: string;
  promise_id?: string | null;
  region?: string | null;
  notification_type: NotificationType;
  is_active?: boolean;
}

export interface SubscriptionUpdate {
  notification_type?: NotificationType;
  is_active?: boolean;
}

// Comment related types
export interface Comment {
  id: string;
  promise_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentInsert {
  promise_id: string;
  user_id: string;
  parent_comment_id?: string | null;
  content: string;
}

export interface CommentUpdate {
  content?: string;
  is_deleted?: boolean;
}

// Comment Vote related types
export interface CommentVote {
  id: string;
  comment_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface CommentVoteInsert {
  comment_id: string;
  user_id: string;
  vote_type: VoteType;
}

export interface CommentVoteUpdate {
  vote_type: VoteType;
}

// View types
export interface PromiseStats {
  promise_id: string;
  total_ratings: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  latest_rating_date: string | null;
}

export interface PromiseEngagement {
  promise_id: string;
  total_ratings: number;
  average_rating: number;
  total_comments: number;
  total_reports: number;
  total_subscriptions: number;
  last_activity_date: string | null;
}

// Function return types
export interface UserSubscription {
  id: string;
  promise_id: string | null;
  region: string | null;
  notification_type: NotificationType;
  created_at: string;
}

export interface CommentWithProfile {
  id: string;
  promise_id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  parent_comment_id: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  created_at: string;
  reply_count: number;
}

// Extended types with related data
export interface PromiseRatingWithProfile extends PromiseRating {
  profile: Profile;
}

export interface CitizenReportWithProfile extends CitizenReport {
  profile: Profile;
  verified_by_profile?: Profile;
}

export interface CommentWithReplies extends CommentWithProfile {
  replies?: CommentWithProfile[];
  user_vote?: VoteType | null;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Utility types for API operations
export type DatabaseResult<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: DatabaseError;
};

export type DatabaseArrayResult<T> = {
  data: T[];
  error: null;
  count?: number;
} | {
  data: null;
  error: DatabaseError;
  count?: undefined;
};

// Filter and sort types
export interface PromiseFilters {
  region?: string;
  status?: string;
  category?: string;
  search?: string;
  rating_min?: number;
  verified_only?: boolean;
  has_reports?: boolean;
}

export interface SortOptions {
  field: 'created_at' | 'updated_at' | 'rating' | 'upvotes' | 'comments_count';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}