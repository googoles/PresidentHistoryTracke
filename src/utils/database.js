// Database utilities and helper functions for Supabase integration
// Korea Promise Tracker - Phase 2 Implementation

import { supabase } from './supabase.js';

// Error handling utility
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  return {
    message: error.message || 'An unexpected database error occurred',
    details: error.details,
    hint: error.hint,
    code: error.code
  };
};

// Generic database operation wrapper
const executeQuery = async (queryFunction) => {
  try {
    const result = await queryFunction();
    if (result.error) {
      return { data: null, error: handleDatabaseError(result.error) };
    }
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: handleDatabaseError(error) };
  }
};

// Profile operations
export const profileOperations = {
  // Get user profile by ID
  async getProfile(userId) {
    return executeQuery(() =>
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    );
  },

  // Get profile by username
  async getProfileByUsername(username) {
    return executeQuery(() =>
      supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
    );
  },

  // Update user profile
  async updateProfile(userId, updates) {
    return executeQuery(() =>
      supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
    );
  },

  // Check if username is available
  async isUsernameAvailable(username, excludeUserId = null) {
    const query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username);
    
    if (excludeUserId) {
      query.neq('id', excludeUserId);
    }

    const result = await executeQuery(() => query.single());
    return { available: result.data === null, error: result.error };
  }
};

// Promise Rating operations
export const ratingOperations = {
  // Get ratings for a promise
  async getPromiseRatings(promiseId, options = {}) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    return executeQuery(() =>
      supabase
        .from('promise_ratings')
        .select(`
          *,
          profile:profiles(id, username, full_name, avatar_url)
        `)
        .eq('promise_id', promiseId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1)
    );
  },

  // Get user's rating for a promise
  async getUserRating(promiseId, userId) {
    return executeQuery(() =>
      supabase
        .from('promise_ratings')
        .select('*')
        .eq('promise_id', promiseId)
        .eq('user_id', userId)
        .single()
    );
  },

  // Create or update rating
  async upsertRating(rating) {
    return executeQuery(() =>
      supabase
        .from('promise_ratings')
        .upsert(rating, { 
          onConflict: 'promise_id,user_id',
          returning: 'representation'
        })
        .select()
        .single()
    );
  },

  // Delete rating
  async deleteRating(promiseId, userId) {
    return executeQuery(() =>
      supabase
        .from('promise_ratings')
        .delete()
        .eq('promise_id', promiseId)
        .eq('user_id', userId)
    );
  },

  // Get promise statistics
  async getPromiseStats(promiseId) {
    return executeQuery(() =>
      supabase
        .from('promise_stats')
        .select('*')
        .eq('promise_id', promiseId)
        .single()
    );
  }
};

// Citizen Report operations
export const reportOperations = {
  // Get reports for a promise
  async getPromiseReports(promiseId, options = {}) {
    const { page = 1, limit = 20, reportType, verifiedOnly = false } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('citizen_reports')
      .select(`
        *,
        profile:profiles(id, username, full_name, avatar_url),
        verified_by_profile:profiles!verified_by(id, username, full_name)
      `)
      .eq('promise_id', promiseId);

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    if (verifiedOnly) {
      query = query.eq('verified', true);
    }

    return executeQuery(() =>
      query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    );
  },

  // Create new report
  async createReport(report) {
    return executeQuery(() =>
      supabase
        .from('citizen_reports')
        .insert(report)
        .select(`
          *,
          profile:profiles(id, username, full_name, avatar_url)
        `)
        .single()
    );
  },

  // Update report
  async updateReport(reportId, updates) {
    return executeQuery(() =>
      supabase
        .from('citizen_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single()
    );
  },

  // Delete report
  async deleteReport(reportId) {
    return executeQuery(() =>
      supabase
        .from('citizen_reports')
        .delete()
        .eq('id', reportId)
    );
  },

  // Vote on report
  async voteOnReport(reportId, userId, voteType) {
    return executeQuery(() =>
      supabase
        .from('report_votes')
        .upsert(
          { report_id: reportId, user_id: userId, vote_type: voteType },
          { onConflict: 'report_id,user_id' }
        )
        .select()
        .single()
    );
  },

  // Remove vote from report
  async removeReportVote(reportId, userId) {
    return executeQuery(() =>
      supabase
        .from('report_votes')
        .delete()
        .eq('report_id', reportId)
        .eq('user_id', userId)
    );
  },

  // Get user's vote for report
  async getUserReportVote(reportId, userId) {
    return executeQuery(() =>
      supabase
        .from('report_votes')
        .select('vote_type')
        .eq('report_id', reportId)
        .eq('user_id', userId)
        .single()
    );
  }
};

// Comment operations
export const commentOperations = {
  // Get comments for a promise using the database function
  async getPromiseComments(promiseId) {
    return executeQuery(() =>
      supabase
        .rpc('get_promise_comments', { p_promise_id: promiseId })
    );
  },

  // Create new comment
  async createComment(comment) {
    return executeQuery(() =>
      supabase
        .from('comments')
        .insert(comment)
        .select(`
          *,
          profile:profiles(id, username, full_name, avatar_url)
        `)
        .single()
    );
  },

  // Update comment
  async updateComment(commentId, updates) {
    return executeQuery(() =>
      supabase
        .from('comments')
        .update(updates)
        .eq('id', commentId)
        .select()
        .single()
    );
  },

  // Soft delete comment
  async deleteComment(commentId) {
    return executeQuery(() =>
      supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
    );
  },

  // Vote on comment
  async voteOnComment(commentId, userId, voteType) {
    return executeQuery(() =>
      supabase
        .from('comment_votes')
        .upsert(
          { comment_id: commentId, user_id: userId, vote_type: voteType },
          { onConflict: 'comment_id,user_id' }
        )
        .select()
        .single()
    );
  },

  // Remove vote from comment
  async removeCommentVote(commentId, userId) {
    return executeQuery(() =>
      supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
    );
  },

  // Get user's vote for comment
  async getUserCommentVote(commentId, userId) {
    return executeQuery(() =>
      supabase
        .from('comment_votes')
        .select('vote_type')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single()
    );
  }
};

// Subscription operations
export const subscriptionOperations = {
  // Get user subscriptions
  async getUserSubscriptions(userId) {
    return executeQuery(() =>
      supabase
        .rpc('get_user_subscriptions', { p_user_id: userId })
    );
  },

  // Subscribe to promise
  async subscribeToPromise(userId, promiseId, notificationType = 'both') {
    return executeQuery(() =>
      supabase
        .from('subscriptions')
        .upsert(
          { 
            user_id: userId, 
            promise_id: promiseId, 
            notification_type: notificationType,
            is_active: true
          },
          { onConflict: 'user_id,promise_id' }
        )
        .select()
        .single()
    );
  },

  // Subscribe to region
  async subscribeToRegion(userId, region, notificationType = 'both') {
    return executeQuery(() =>
      supabase
        .from('subscriptions')
        .upsert(
          { 
            user_id: userId, 
            region: region, 
            notification_type: notificationType,
            is_active: true
          },
          { onConflict: 'user_id,region,notification_type' }
        )
        .select()
        .single()
    );
  },

  // Unsubscribe
  async unsubscribe(subscriptionId) {
    return executeQuery(() =>
      supabase
        .from('subscriptions')
        .update({ is_active: false })
        .eq('id', subscriptionId)
    );
  },

  // Check if user is subscribed to promise
  async isSubscribedToPromise(userId, promiseId) {
    return executeQuery(() =>
      supabase
        .rpc('is_user_subscribed_to_promise', { 
          p_user_id: userId, 
          p_promise_id: promiseId 
        })
    );
  },

  // Check if user is subscribed to region
  async isSubscribedToRegion(userId, region) {
    return executeQuery(() =>
      supabase
        .rpc('is_user_subscribed_to_region', { 
          p_user_id: userId, 
          p_region: region 
        })
    );
  }
};

// Analytics and engagement operations
export const analyticsOperations = {
  // Get engagement metrics for all promises
  async getPromiseEngagementMetrics() {
    return executeQuery(() =>
      supabase
        .from('promise_engagement')
        .select('*')
        .order('last_activity_date', { ascending: false })
    );
  },

  // Get top rated promises
  async getTopRatedPromises(limit = 10) {
    return executeQuery(() =>
      supabase
        .from('promise_stats')
        .select('*')
        .gte('total_ratings', 5) // Only promises with at least 5 ratings
        .order('average_rating', { ascending: false })
        .limit(limit)
    );
  },

  // Get most active promises (by comments and reports)
  async getMostActivePromises(limit = 10) {
    return executeQuery(() =>
      supabase
        .from('promise_engagement')
        .select('*')
        .order('total_comments', { ascending: false })
        .limit(limit)
    );
  },

  // Get recent activity for a user's subscribed promises
  async getUserActivityFeed(userId, limit = 20) {
    return executeQuery(async () => {
      // First get user's subscribed promises
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('promise_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .not('promise_id', 'is', null);

      if (!subscriptions || subscriptions.length === 0) {
        return { data: [], error: null };
      }

      const promiseIds = subscriptions.map(s => s.promise_id);

      // Get recent activity for these promises
      return supabase
        .from('citizen_reports')
        .select(`
          id,
          promise_id,
          title,
          report_type,
          created_at,
          profile:profiles(username, full_name, avatar_url)
        `)
        .in('promise_id', promiseIds)
        .order('created_at', { ascending: false })
        .limit(limit);
    });
  }
};

// Enhanced Real-time subscriptions with comprehensive monitoring
export const realtimeOperations = {
  // Subscribe to comment changes for a promise with enhanced payload
  subscribeToPromiseComments(promiseId, callback) {
    return supabase
      .channel(`promise-comments-${promiseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `promise_id=eq.${promiseId}`
        },
        (payload) => {
          // Enhance payload with additional context
          const enhancedPayload = {
            ...payload,
            eventType: payload.eventType || payload.eventType,
            timestamp: new Date().toISOString(),
            promiseId
          };
          callback(enhancedPayload);
        }
      )
      .subscribe();
  },

  // Subscribe to rating changes for a promise with statistics updates
  subscribeToPromiseRatings(promiseId, callback) {
    return supabase
      .channel(`promise-ratings-${promiseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promise_ratings',
          filter: `promise_id=eq.${promiseId}`
        },
        async (payload) => {
          // Enhance payload with real-time statistics
          const enhancedPayload = {
            ...payload,
            eventType: payload.eventType || payload.eventType,
            timestamp: new Date().toISOString(),
            promiseId
          };
          
          // Fetch updated statistics if this is a new rating
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            try {
              const stats = await ratingOperations.getPromiseStats(promiseId);
              enhancedPayload.updatedStats = stats.data;
            } catch (error) {
              console.warn('Failed to fetch updated rating stats:', error);
            }
          }
          
          callback(enhancedPayload);
        }
      )
      .subscribe();
  },

  // Subscribe to new reports with filtering options
  subscribeToNewReports(callback, options = {}) {
    const { filterByRegion, filterByType, includeVerifiedOnly } = options;
    let filter = '';
    
    if (filterByRegion) {
      filter += `region=eq.${filterByRegion}`;
    }
    
    if (filterByType) {
      filter += filter ? ` AND report_type=eq.${filterByType}` : `report_type=eq.${filterByType}`;
    }
    
    if (includeVerifiedOnly) {
      filter += filter ? ' AND verified=eq.true' : 'verified=eq.true';
    }

    return supabase
      .channel('new-reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'citizen_reports',
          ...(filter && { filter })
        },
        (payload) => {
          const enhancedPayload = {
            ...payload,
            eventType: 'INSERT',
            timestamp: new Date().toISOString()
          };
          callback(enhancedPayload);
        }
      )
      .subscribe();
  },

  // Subscribe to user-specific real-time notifications
  subscribeToUserNotifications(userId, callback) {
    return supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'real_time_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const enhancedPayload = {
            ...payload,
            eventType: 'INSERT',
            timestamp: new Date().toISOString(),
            userId
          };
          callback(enhancedPayload);
        }
      )
      .subscribe();
  },

  // Enhanced unsubscribe with cleanup
  unsubscribe(subscription) {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    } else if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  // Get connection status
  getConnectionStatus() {
    return supabase.realtime.connection_state;
  },

  // Get all active channels
  getActiveChannels() {
    return supabase.getChannels();
  },

  // Reconnect realtime connection
  async reconnect() {
    try {
      await supabase.realtime.disconnect();
      await supabase.realtime.connect();
      return true;
    } catch (error) {
      console.error('Failed to reconnect realtime:', error);
      return false;
    }
  }
};

// Utility functions
export const dbUtils = {
  // Validate promise ID format
  isValidPromiseId(promiseId) {
    return typeof promiseId === 'string' && promiseId.length > 0;
  },

  // Validate UUID format
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Sanitize text input
  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.trim().replace(/\s+/g, ' ').substring(0, 5000); // Limit to 5000 chars
  },

  // Validate rating value
  isValidRating(rating) {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
  },

  // Format date for display
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Calculate relative time with live updates
  getRelativeTime(dateString, isLive = false) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return isLive ? '지금' : '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return this.formatDate(dateString);
  },

  // Real-time data deduplication
  createDeduplicator(keyFunction, windowMs = 1000) {
    const seen = new Map();
    
    return {
      isDuplicate(item) {
        const key = keyFunction(item);
        const now = Date.now();
        const lastSeen = seen.get(key);
        
        if (lastSeen && now - lastSeen < windowMs) {
          return true;
        }
        
        seen.set(key, now);
        return false;
      }
    };
  }
};

// Export all operations
// Connection monitoring utilities
export const connectionUtils = {
  // Monitor connection health
  monitorConnection(onStatusChange) {
    let isConnected = supabase.realtime.connection_state === 'open';
    
    const checkConnection = () => {
      const currentStatus = supabase.realtime.connection_state === 'open';
      if (currentStatus !== isConnected) {
        isConnected = currentStatus;
        onStatusChange(isConnected ? 'connected' : 'disconnected');
      }
    };
    
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    // Also listen to realtime events
    supabase.realtime.onOpen(() => onStatusChange('connected'));
    supabase.realtime.onClose(() => onStatusChange('disconnected'));
    supabase.realtime.onError(() => onStatusChange('error'));
    
    return () => {
      clearInterval(interval);
    };
  },
  
  // Get detailed connection info
  getConnectionInfo() {
    return {
      state: supabase.realtime.connection_state,
      channels: supabase.getChannels().length,
      isConnected: supabase.realtime.connection_state === 'open'
    };
  }
};

// Real-time notification helpers
export const notificationHelpers = {
  // Create real-time notification
  async createRealtimeNotification(notification) {
    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: JSON.stringify(notification.data || {}),
          read: false,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to create real-time notification:', error);
      return false;
    }
  },
  
  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('real_time_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
};

export {
  executeQuery,
  handleDatabaseError
};