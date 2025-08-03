import { useEffect, useRef, useCallback, useState } from 'react';
import { realtimeOperations } from '../utils/database';
import { showSuccessNotification, showErrorNotification } from '../components/NotificationSystem';

// Custom hook for enhanced real-time subscriptions with connection monitoring
export const useRealtime = () => {
  const subscriptionsRef = useRef(new Map());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  // Enhanced subscribe to promise comments with error handling and notifications
  const subscribeToPromiseComments = useCallback((promiseId, callback, options = {}) => {
    const subscriptionKey = `comments-${promiseId}`;
    const { showNotifications = true, batchUpdates = false } = options;
    
    // Unsubscribe existing subscription if any
    if (subscriptionsRef.current.has(subscriptionKey)) {
      realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
    }

    // Enhanced callback with error handling and batching
    const enhancedCallback = (payload) => {
      try {
        if (batchUpdates) {
          // Debounce updates to prevent excessive re-renders
          clearTimeout(window[`debounce_${subscriptionKey}`]);
          window[`debounce_${subscriptionKey}`] = setTimeout(() => {
            callback(payload);
          }, 100);
        } else {
          callback(payload);
        }

        // Show notification for new comments
        if (showNotifications && payload.eventType === 'INSERT' && payload.new) {
          showSuccessNotification(
            `${payload.new.profile?.username || '사용자'}님이 새 댓글을 작성했습니다.`,
            '새 댓글'
          );
        }

        setConnectionStatus('connected');
        setReconnectAttempts(0);
      } catch (error) {
        console.error('Comment subscription callback error:', error);
        if (showNotifications) {
          showErrorNotification('댓글 업데이트 처리 중 오류가 발생했습니다.');
        }
      }
    };

    // Create new subscription with error handling
    try {
      const subscription = realtimeOperations.subscribeToPromiseComments(promiseId, enhancedCallback);
      
      // Add connection event listeners
      subscription.on('error', (error) => {
        console.error('Real-time subscription error:', error);
        setConnectionStatus('error');
        attemptReconnect(subscriptionKey, () => 
          subscribeToPromiseComments(promiseId, callback, options)
        );
      });

      subscription.on('close', () => {
        setConnectionStatus('disconnected');
        attemptReconnect(subscriptionKey, () => 
          subscribeToPromiseComments(promiseId, callback, options)
        );
      });

      subscriptionsRef.current.set(subscriptionKey, subscription);

      return () => {
        if (subscriptionsRef.current.has(subscriptionKey)) {
          realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
          subscriptionsRef.current.delete(subscriptionKey);
        }
        clearTimeout(window[`debounce_${subscriptionKey}`]);
      };
    } catch (error) {
      console.error('Failed to create comment subscription:', error);
      setConnectionStatus('error');
      return () => {};
    }
  }, []);

  // Enhanced subscribe to promise ratings with statistics updates
  const subscribeToPromiseRatings = useCallback((promiseId, callback, options = {}) => {
    const subscriptionKey = `ratings-${promiseId}`;
    const { showNotifications = true, updateStats = true } = options;
    
    // Unsubscribe existing subscription if any
    if (subscriptionsRef.current.has(subscriptionKey)) {
      realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
    }

    // Enhanced callback with statistics and notifications
    const enhancedCallback = (payload) => {
      try {
        callback(payload);

        // Show notification for new ratings
        if (showNotifications && payload.eventType === 'INSERT' && payload.new) {
          showSuccessNotification(
            `새로운 평가가 등록되었습니다. (${payload.new.rating}점)`,
            '새 평가'
          );
        }

        // Update real-time statistics if enabled
        if (updateStats && payload.eventType === 'INSERT') {
          // Trigger stats recalculation
          window.dispatchEvent(new CustomEvent('promise-stats-update', {
            detail: { promiseId, type: 'rating', payload }
          }));
        }

        setConnectionStatus('connected');
        setReconnectAttempts(0);
      } catch (error) {
        console.error('Rating subscription callback error:', error);
        if (showNotifications) {
          showErrorNotification('평가 업데이트 처리 중 오류가 발생했습니다.');
        }
      }
    };

    try {
      const subscription = realtimeOperations.subscribeToPromiseRatings(promiseId, enhancedCallback);
      
      subscription.on('error', (error) => {
        console.error('Rating subscription error:', error);
        setConnectionStatus('error');
        attemptReconnect(subscriptionKey, () => 
          subscribeToPromiseRatings(promiseId, callback, options)
        );
      });

      subscriptionsRef.current.set(subscriptionKey, subscription);

      return () => {
        if (subscriptionsRef.current.has(subscriptionKey)) {
          realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
          subscriptionsRef.current.delete(subscriptionKey);
        }
      };
    } catch (error) {
      console.error('Failed to create rating subscription:', error);
      setConnectionStatus('error');
      return () => {};
    }
  }, []);

  // Enhanced subscribe to new reports with filtering and notifications
  const subscribeToNewReports = useCallback((callback, options = {}) => {
    const subscriptionKey = 'new-reports';
    const { showNotifications = true, filterByUser = null, promiseIds = null } = options;
    
    // Unsubscribe existing subscription if any
    if (subscriptionsRef.current.has(subscriptionKey)) {
      realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
    }

    // Enhanced callback with filtering and notifications
    const enhancedCallback = (payload) => {
      try {
        // Apply filters
        if (filterByUser && payload.new?.user_id !== filterByUser) {
          return;
        }

        if (promiseIds && !promiseIds.includes(payload.new?.promise_id)) {
          return;
        }

        callback(payload);

        // Show notification for new reports
        if (showNotifications && payload.eventType === 'INSERT' && payload.new) {
          const reportTypeMap = {
            'news': '뉴스',
            'photo': '사진',
            'progress_update': '진행상황',
            'concern': '우려사항'
          };
          
          showSuccessNotification(
            `새로운 ${reportTypeMap[payload.new.report_type] || '보고서'}가 등록되었습니다.`,
            '새 시민 보고서'
          );
        }

        setConnectionStatus('connected');
        setReconnectAttempts(0);
      } catch (error) {
        console.error('Report subscription callback error:', error);
        if (showNotifications) {
          showErrorNotification('보고서 업데이트 처리 중 오류가 발생했습니다.');
        }
      }
    };

    try {
      const subscription = realtimeOperations.subscribeToNewReports(enhancedCallback);
      
      subscription.on('error', (error) => {
        console.error('Report subscription error:', error);
        setConnectionStatus('error');
        attemptReconnect(subscriptionKey, () => 
          subscribeToNewReports(callback, options)
        );
      });

      subscriptionsRef.current.set(subscriptionKey, subscription);

      return () => {
        if (subscriptionsRef.current.has(subscriptionKey)) {
          realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
          subscriptionsRef.current.delete(subscriptionKey);
        }
      };
    } catch (error) {
      console.error('Failed to create report subscription:', error);
      setConnectionStatus('error');
      return () => {};
    }
  }, []);

  // Reconnection logic
  const attemptReconnect = useCallback((subscriptionKey, reconnectFunction) => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setConnectionStatus('failed');
      showErrorNotification(
        '실시간 연결을 복구할 수 없습니다. 페이지를 새로고침해주세요.',
        '연결 실패'
      );
      return;
    }

    clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      setConnectionStatus('reconnecting');
      
      try {
        reconnectFunction();
      } catch (error) {
        console.error('Reconnection failed:', error);
        attemptReconnect(subscriptionKey, reconnectFunction);
      }
    }, reconnectDelay * Math.pow(2, reconnectAttempts)); // Exponential backoff
  }, [reconnectAttempts, maxReconnectAttempts, reconnectDelay]);

  // Generic subscribe function with enhanced error handling
  const subscribe = useCallback((subscriptionKey, subscriptionFunction, options = {}) => {
    const { autoReconnect = true } = options;
    
    // Unsubscribe existing subscription if any
    if (subscriptionsRef.current.has(subscriptionKey)) {
      realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
    }

    try {
      // Create new subscription
      const subscription = subscriptionFunction();
      
      if (autoReconnect) {
        subscription.on('error', (error) => {
          console.error(`Subscription ${subscriptionKey} error:`, error);
          setConnectionStatus('error');
          attemptReconnect(subscriptionKey, () => subscribe(subscriptionKey, subscriptionFunction, options));
        });

        subscription.on('close', () => {
          setConnectionStatus('disconnected');
          attemptReconnect(subscriptionKey, () => subscribe(subscriptionKey, subscriptionFunction, options));
        });
      }

      subscriptionsRef.current.set(subscriptionKey, subscription);

      return () => {
        if (subscriptionsRef.current.has(subscriptionKey)) {
          realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
          subscriptionsRef.current.delete(subscriptionKey);
        }
      };
    } catch (error) {
      console.error(`Failed to create subscription ${subscriptionKey}:`, error);
      setConnectionStatus('error');
      return () => {};
    }
  }, [attemptReconnect]);

  // Unsubscribe from specific subscription
  const unsubscribe = useCallback((subscriptionKey) => {
    if (subscriptionsRef.current.has(subscriptionKey)) {
      realtimeOperations.unsubscribe(subscriptionsRef.current.get(subscriptionKey));
      subscriptionsRef.current.delete(subscriptionKey);
    }
  }, []);

  // Unsubscribe from all subscriptions
  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach((subscription) => {
      realtimeOperations.unsubscribe(subscription);
    });
    subscriptionsRef.current.clear();
  }, []);

  // Get subscription status
  const getSubscriptionStatus = useCallback((subscriptionKey) => {
    return subscriptionsRef.current.has(subscriptionKey);
  }, []);

  // Get all active subscriptions
  const getActiveSubscriptions = useCallback(() => {
    return Array.from(subscriptionsRef.current.keys());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('connecting');
      setReconnectAttempts(0);
      // Reestablish all subscriptions
      subscriptionsRef.current.forEach((subscription, key) => {
        if (subscription.state === 'closed') {
          console.log(`Reestablishing subscription: ${key}`);
          // Note: Would need to store original subscription functions to reestablish
        }
      });
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    subscribeToPromiseComments,
    subscribeToPromiseRatings,
    subscribeToNewReports,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    getSubscriptionStatus,
    getActiveSubscriptions,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts
  };
};

// Hook for promise-specific real-time data
export const usePromiseRealtime = (promiseId) => {
  const { subscribeToPromiseComments, subscribeToPromiseRatings, unsubscribe } = useRealtime();

  const subscribeToComments = useCallback((callback) => {
    return subscribeToPromiseComments(promiseId, callback);
  }, [promiseId, subscribeToPromiseComments]);

  const subscribeToRatings = useCallback((callback) => {
    return subscribeToPromiseRatings(promiseId, callback);
  }, [promiseId, subscribeToPromiseRatings]);

  // Cleanup subscriptions for this promise when component unmounts or promiseId changes
  useEffect(() => {
    return () => {
      unsubscribe(`comments-${promiseId}`);
      unsubscribe(`ratings-${promiseId}`);
    };
  }, [promiseId, unsubscribe]);

  return {
    subscribeToComments,
    subscribeToRatings
  };
};

// Hook for engagement statistics with real-time updates
export const useEngagementStats = (promiseId) => {
  const { subscribeToPromiseComments, subscribeToPromiseRatings } = useRealtime();

  const subscribeToStats = useCallback((callback) => {
    // Subscribe to both comments and ratings for engagement stats
    const unsubscribeComments = subscribeToPromiseComments(promiseId, (payload) => {
      callback({ type: 'comment', payload });
    });

    const unsubscribeRatings = subscribeToPromiseRatings(promiseId, (payload) => {
      callback({ type: 'rating', payload });
    });

    // Return cleanup function
    return () => {
      unsubscribeComments();
      unsubscribeRatings();
    };
  }, [promiseId, subscribeToPromiseComments, subscribeToPromiseRatings]);

  return { subscribeToStats };
};

export default useRealtime;