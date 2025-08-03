// Notification Service for Korea Promise Tracker
// Phase 4 Implementation - Real-time notifications and email system

import { supabase } from '../utils/supabase';
import { showSuccessNotification, showErrorNotification } from '../components/NotificationSystem';

// Notification types
export const NOTIFICATION_TYPES = {
  PROMISE_UPDATE: 'promise_update',
  NEW_COMMENT: 'new_comment',
  NEW_RATING: 'new_rating',
  NEW_REPORT: 'new_report',
  REPORT_VERIFIED: 'report_verified',
  PROMISE_STATUS_CHANGE: 'promise_status_change',
  WEEKLY_DIGEST: 'weekly_digest',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

// Notification delivery methods
export const DELIVERY_METHODS = {
  EMAIL: 'email',
  PUSH: 'push',
  IN_APP: 'in_app',
  SMS: 'sms'
};

class NotificationService {
  constructor() {
    this.emailQueue = [];
    this.pushQueue = [];
    this.isProcessing = false;
    this.batchSize = 50;
    this.batchDelay = 5000; // 5 seconds
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  // Initialize notification service
  async initialize() {
    try {
      // Set up periodic processing of notification queues
      this.startQueueProcessor();
      console.log('Notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  // Send immediate notification
  async sendNotification(notification) {
    try {
      const {
        userId,
        type,
        title,
        message,
        data = {},
        deliveryMethods = [DELIVERY_METHODS.IN_APP],
        priority = 'normal',
        scheduleFor = null
      } = notification;

      // Validate notification
      if (!userId || !type || !message) {
        throw new Error('Missing required notification fields');
      }

      // Get user preferences
      const userPreferences = await this.getUserNotificationPreferences(userId);
      if (!userPreferences) {
        console.warn(`No notification preferences found for user ${userId}`);
        return false;
      }

      // Filter delivery methods based on user preferences
      const allowedMethods = this.filterDeliveryMethods(deliveryMethods, userPreferences, type);
      
      if (allowedMethods.length === 0) {
        console.log(`User ${userId} has disabled notifications for type ${type}`);
        return false;
      }

      // Create notification record
      const notificationRecord = {
        user_id: userId,
        type,
        title,
        message,
        data: JSON.stringify(data),
        delivery_methods: allowedMethods,
        priority,
        scheduled_for: scheduleFor,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Save to database
      const { data: savedNotification, error } = await supabase
        .from('notifications')
        .insert(notificationRecord)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Send immediately if not scheduled
      if (!scheduleFor) {
        await this.processNotification(savedNotification);
      }

      return savedNotification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(notifications) {
    try {
      const results = [];
      const batches = this.chunkArray(notifications, this.batchSize);

      for (const batch of batches) {
        const batchPromises = batch.map(notification => 
          this.sendNotification(notification).catch(error => ({
            error,
            notification
          }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid overwhelming the system
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(this.batchDelay);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  // Process individual notification
  async processNotification(notification, attempt = 1) {
    try {
      const deliveryPromises = notification.delivery_methods.map(method => {
        switch (method) {
          case DELIVERY_METHODS.EMAIL:
            return this.sendEmailNotification(notification);
          case DELIVERY_METHODS.PUSH:
            return this.sendPushNotification(notification);
          case DELIVERY_METHODS.IN_APP:
            return this.sendInAppNotification(notification);
          case DELIVERY_METHODS.SMS:
            return this.sendSMSNotification(notification);
          default:
            return Promise.resolve({ success: false, error: 'Unknown delivery method' });
        }
      });

      const results = await Promise.allSettled(deliveryPromises);
      
      // Check if all deliveries were successful
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      const totalMethods = notification.delivery_methods.length;
      const allSuccessful = successCount === totalMethods;

      // Update notification status
      await this.updateNotificationStatus(
        notification.id,
        allSuccessful ? 'delivered' : 'partial_failure',
        {
          delivery_results: results,
          attempt_count: attempt,
          delivered_at: allSuccessful ? new Date().toISOString() : null
        }
      );

      // Retry if not all methods succeeded and we haven't exceeded retry limit
      if (!allSuccessful && attempt < this.retryAttempts) {
        console.log(`Retrying notification ${notification.id}, attempt ${attempt + 1}`);
        await this.delay(this.retryDelay * attempt); // Exponential backoff
        return this.processNotification(notification, attempt + 1);
      }

      return allSuccessful;
    } catch (error) {
      console.error('Failed to process notification:', error);
      
      // Update notification as failed
      await this.updateNotificationStatus(
        notification.id,
        'failed',
        {
          error_message: error.message,
          attempt_count: attempt,
          failed_at: new Date().toISOString()
        }
      );

      return false;
    }
  }

  // Send email notification
  async sendEmailNotification(notification) {
    try {
      // Get user email
      const userProfile = await this.getUserProfile(notification.user_id);
      if (!userProfile?.email) {
        throw new Error('User email not found');
      }

      // Prepare email data
      const emailData = {
        to: userProfile.email,
        subject: notification.title,
        html: this.generateEmailHTML(notification, userProfile),
        text: this.generateEmailText(notification, userProfile)
      };

      // Send via Supabase Edge Function (email service)
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification (prepare for future web push implementation)
  async sendPushNotification(notification) {
    try {
      // Check if user has push subscription
      const pushSubscription = await this.getUserPushSubscription(notification.user_id);
      if (!pushSubscription) {
        return { success: false, error: 'No push subscription found' };
      }

      // Prepare push data
      const pushData = {
        title: notification.title,
        body: notification.message,
        icon: '/logo192.png',
        badge: '/badge-72x72.png',
        data: JSON.parse(notification.data || '{}'),
        actions: this.generatePushActions(notification.type)
      };

      // Send via Supabase Edge Function (push service)
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          subscription: pushSubscription,
          payload: pushData
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send in-app notification
  async sendInAppNotification(notification) {
    try {
      // Create real-time notification via Supabase
      const { error } = await supabase
        .from('real_time_notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Also trigger browser notification if user has notifications enabled
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png',
          tag: `promise-tracker-${notification.id}`
        });

        // Auto-close after 5 seconds
        setTimeout(() => notif.close(), 5000);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification (placeholder for future implementation)
  async sendSMSNotification(notification) {
    // SMS functionality would be implemented here
    // For now, return success to avoid blocking other delivery methods
    console.log('SMS notification queued for future implementation');
    return { success: true, note: 'SMS not implemented yet' };
  }

  // Get user notification preferences
  async getUserNotificationPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      // Return default preferences if none found
      return data || this.getDefaultNotificationPreferences();
    } catch (error) {
      console.error('Failed to get user notification preferences:', error);
      return this.getDefaultNotificationPreferences();
    }
  }

  // Filter delivery methods based on user preferences
  filterDeliveryMethods(requestedMethods, userPreferences, notificationType) {
    const allowedMethods = [];

    for (const method of requestedMethods) {
      const preferenceKey = `${method}_${notificationType}`;
      const globalKey = `${method}_enabled`;

      // Check if this specific type is enabled for this method
      if (userPreferences[preferenceKey] !== false && userPreferences[globalKey] !== false) {
        allowedMethods.push(method);
      }
    }

    return allowedMethods;
  }

  // Generate email HTML template
  generateEmailHTML(notification, userProfile) {
    const data = JSON.parse(notification.data || '{}');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .promise-info { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #1e40af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>대한민국 공약 추적기</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            
            ${data.promiseTitle ? `
              <div class="promise-info">
                <h3>관련 공약</h3>
                <p><strong>${data.promiseTitle}</strong></p>
                ${data.promiseId ? `<a href="${process.env.REACT_APP_BASE_URL || 'https://promise-tracker.vercel.app'}/?promise=${data.promiseId}" class="button">공약 보기</a>` : ''}
              </div>
            ` : ''}
            
            <p>안녕하세요 ${userProfile.full_name || userProfile.username}님,</p>
            <p>구독하신 공약에 새로운 업데이트가 있어 알려드립니다.</p>
          </div>
          <div class="footer">
            <p>이 이메일은 대한민국 공약 추적기에서 발송되었습니다.</p>
            <p><a href="${process.env.REACT_APP_BASE_URL || 'https://promise-tracker.vercel.app'}/preferences">알림 설정 변경</a> | <a href="${process.env.REACT_APP_BASE_URL || 'https://promise-tracker.vercel.app'}/unsubscribe?token=${userProfile.id}">구독 해지</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate email text version
  generateEmailText(notification, userProfile) {
    const data = JSON.parse(notification.data || '{}');
    
    return `
      대한민국 공약 추적기
      
      ${notification.title}
      
      ${notification.message}
      
      ${data.promiseTitle ? `관련 공약: ${data.promiseTitle}` : ''}
      
      안녕하세요 ${userProfile.full_name || userProfile.username}님,
      구독하신 공약에 새로운 업데이트가 있어 알려드립니다.
      
      공약 보기: ${process.env.REACT_APP_BASE_URL || 'https://promise-tracker.vercel.app'}${data.promiseId ? `/?promise=${data.promiseId}` : ''}
      
      알림 설정 변경: ${process.env.REACT_APP_BASE_URL || 'https://promise-tracker.vercel.app'}/preferences
      구독 해지: ${process.env.REACT_APP_BASE_URL || 'https://promise-tracker.vercel.app'}/unsubscribe?token=${userProfile.id}
    `;
  }

  // Generate push notification actions
  generatePushActions(notificationType) {
    const actions = [];
    
    switch (notificationType) {
      case NOTIFICATION_TYPES.NEW_COMMENT:
      case NOTIFICATION_TYPES.NEW_RATING:
        actions.push(
          { action: 'view', title: '보기', icon: '/icons/view.png' },
          { action: 'dismiss', title: '닫기', icon: '/icons/close.png' }
        );
        break;
      case NOTIFICATION_TYPES.PROMISE_UPDATE:
        actions.push(
          { action: 'view', title: '공약 보기', icon: '/icons/view.png' },
          { action: 'share', title: '공유', icon: '/icons/share.png' }
        );
        break;
      default:
        actions.push(
          { action: 'view', title: '보기', icon: '/icons/view.png' }
        );
    }
    
    return actions;
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Get user push subscription
  async getUserPushSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.subscription_data ? JSON.parse(data.subscription_data) : null;
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  // Update notification status
  async updateNotificationStatus(notificationId, status, metadata = {}) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status,
          metadata: JSON.stringify(metadata),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to update notification status:', error);
      return false;
    }
  }

  // Get default notification preferences
  getDefaultNotificationPreferences() {
    return {
      email_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      sms_enabled: false,
      email_promise_update: true,
      email_new_comment: false,
      email_new_rating: false,
      email_new_report: true,
      email_weekly_digest: true,
      push_promise_update: true,
      push_new_comment: true,
      push_new_rating: true,
      push_new_report: true,
      in_app_promise_update: true,
      in_app_new_comment: true,
      in_app_new_rating: true,
      in_app_new_report: true,
      digest_frequency: 'weekly',
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    };
  }

  // Start queue processor
  startQueueProcessor() {
    setInterval(async () => {
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      
      try {
        // Process pending notifications
        await this.processPendingNotifications();
        
        // Process scheduled notifications
        await this.processScheduledNotifications();
        
        // Clean up old notifications
        await this.cleanupOldNotifications();
      } catch (error) {
        console.error('Queue processor error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 30000); // Process every 30 seconds
  }

  // Process pending notifications
  async processPendingNotifications() {
    try {
      const { data: pendingNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(this.batchSize);

      if (error) {
        throw error;
      }

      if (pendingNotifications && pendingNotifications.length > 0) {
        console.log(`Processing ${pendingNotifications.length} pending notifications`);
        
        for (const notification of pendingNotifications) {
          await this.processNotification(notification);
          await this.delay(100); // Small delay between notifications
        }
      }
    } catch (error) {
      console.error('Failed to process pending notifications:', error);
    }
  }

  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const { data: scheduledNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(this.batchSize);

      if (error) {
        throw error;
      }

      if (scheduledNotifications && scheduledNotifications.length > 0) {
        console.log(`Processing ${scheduledNotifications.length} scheduled notifications`);
        
        for (const notification of scheduledNotifications) {
          // Update status to pending first
          await this.updateNotificationStatus(notification.id, 'pending');
          await this.processNotification(notification);
          await this.delay(100);
        }
      }
    } catch (error) {
      console.error('Failed to process scheduled notifications:', error);
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep notifications for 30 days

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .in('status', ['delivered', 'failed']);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
    }
  }

  // Utility functions
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Convenience functions for common notification types
export const sendPromiseUpdateNotification = async (userId, promiseId, promiseTitle, updateType, message) => {
  return notificationService.sendNotification({
    userId,
    type: NOTIFICATION_TYPES.PROMISE_UPDATE,
    title: '공약 업데이트',
    message,
    data: {
      promiseId,
      promiseTitle,
      updateType
    },
    deliveryMethods: [DELIVERY_METHODS.EMAIL, DELIVERY_METHODS.PUSH, DELIVERY_METHODS.IN_APP]
  });
};

export const sendNewCommentNotification = async (userId, promiseId, promiseTitle, commenterName) => {
  return notificationService.sendNotification({
    userId,
    type: NOTIFICATION_TYPES.NEW_COMMENT,
    title: '새 댓글',
    message: `${commenterName}님이 "${promiseTitle}"에 댓글을 남겼습니다.`,
    data: {
      promiseId,
      promiseTitle,
      commenterName
    },
    deliveryMethods: [DELIVERY_METHODS.PUSH, DELIVERY_METHODS.IN_APP]
  });
};

export const sendWeeklyDigest = async (userId, promises, stats) => {
  return notificationService.sendNotification({
    userId,
    type: NOTIFICATION_TYPES.WEEKLY_DIGEST,
    title: '주간 공약 업데이트',
    message: `이번 주 구독하신 공약에 ${stats.totalUpdates}개의 업데이트가 있었습니다.`,
    data: {
      promises,
      stats
    },
    deliveryMethods: [DELIVERY_METHODS.EMAIL]
  });
};

export default notificationService;