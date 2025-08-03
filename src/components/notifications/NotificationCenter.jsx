// Notification Center Component for Korea Promise Tracker
// Phase 4 Implementation - Centralized notification management

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, Settings, Filter, Trash2, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../hooks/useAuth';
import { showSuccessNotification, showErrorNotification } from '../NotificationSystem';
import { dbUtils } from '../../utils/database';

const NOTIFICATION_TYPES = {
  PROMISE_UPDATE: 'promise_update',
  NEW_COMMENT: 'new_comment', 
  NEW_RATING: 'new_rating',
  NEW_REPORT: 'new_report',
  REPORT_VERIFIED: 'report_verified',
  WEEKLY_DIGEST: 'weekly_digest',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.PROMISE_UPDATE]: '공약 업데이트',
  [NOTIFICATION_TYPES.NEW_COMMENT]: '새 댓글',
  [NOTIFICATION_TYPES.NEW_RATING]: '새 평가',
  [NOTIFICATION_TYPES.NEW_REPORT]: '새 보고서',
  [NOTIFICATION_TYPES.REPORT_VERIFIED]: '보고서 검증',
  [NOTIFICATION_TYPES.WEEKLY_DIGEST]: '주간 요약',
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: '시스템 공지'
};

const NotificationCenter = ({ isOpen, onClose, onOpenPreferences }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load notifications
  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('real_time_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * 20, pageNum * 20 - 1);

      // Apply filters
      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter === 'read') {
        query = query.eq('read', true);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (append) {
        setNotifications(prev => [...prev, ...(data || [])]);
      } else {
        setNotifications(data || []);
      }

      setHasMore(data && data.length === 20);
      
      // Update unread count
      await updateUnreadCount();
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showErrorNotification('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, typeFilter]);

  // Update unread count
  const updateUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await supabase
        .from('real_time_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        throw error;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Failed to update unread count:', error);
    }
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );

      await updateUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [user?.id, updateUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        throw error;
      }

      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          read: true,
          read_at: notif.read_at || new Date().toISOString()
        }))
      );

      setUnreadCount(0);
      showSuccessNotification('모든 알림을 읽음으로 표시했습니다.');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showErrorNotification('알림을 읽음으로 표시하는데 실패했습니다.');
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      await updateUnreadCount();
      showSuccessNotification('알림이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showErrorNotification('알림 삭제에 실패했습니다.');
    }
  }, [user?.id, updateUnreadCount]);

  // Delete selected notifications
  const deleteSelectedNotifications = useCallback(async () => {
    if (!user?.id || selectedNotifications.size === 0) return;

    try {
      const notificationIds = Array.from(selectedNotifications);
      
      const { error } = await supabase
        .from('real_time_notifications')
        .delete()
        .eq('user_id', user.id)
        .in('id', notificationIds);

      if (error) {
        throw error;
      }

      setNotifications(prev => 
        prev.filter(notif => !selectedNotifications.has(notif.id))
      );
      
      setSelectedNotifications(new Set());
      await updateUnreadCount();
      showSuccessNotification(`${notificationIds.length}개의 알림이 삭제되었습니다.`);
    } catch (error) {
      console.error('Failed to delete selected notifications:', error);
      showErrorNotification('선택한 알림 삭제에 실패했습니다.');
    }
  }, [user?.id, selectedNotifications, updateUnreadCount]);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    const data = typeof notification.data === 'string' 
      ? JSON.parse(notification.data) 
      : notification.data || {};

    switch (notification.type) {
      case NOTIFICATION_TYPES.PROMISE_UPDATE:
      case NOTIFICATION_TYPES.NEW_COMMENT:
      case NOTIFICATION_TYPES.NEW_RATING:
      case NOTIFICATION_TYPES.NEW_REPORT:
        if (data.promiseId) {
          window.location.href = `/?promise=${data.promiseId}`;
        }
        break;
      case NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT:
        if (data.url) {
          window.open(data.url, '_blank');
        }
        break;
      default:
        console.log('Unknown notification type:', notification.type);
    }
  }, [markAsRead]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'real_time_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/logo192.png',
              tag: `notification-${newNotification.id}`
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  // Load notifications on mount and filter changes
  useEffect(() => {
    loadNotifications(1, false);
    setPage(1);
  }, [loadNotifications]);

  // Load more notifications
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, true);
  }, [page, loadNotifications]);

  // Toggle notification selection
  const toggleSelection = useCallback((notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  // Select all visible notifications
  const selectAll = useCallback(() => {
    const visibleIds = notifications.map(n => n.id);
    setSelectedNotifications(new Set(visibleIds));
  }, [notifications]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedNotifications(new Set());
  }, []);

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.PROMISE_UPDATE:
        return '📋';
      case NOTIFICATION_TYPES.NEW_COMMENT:
        return '💬';
      case NOTIFICATION_TYPES.NEW_RATING:
        return '⭐';
      case NOTIFICATION_TYPES.NEW_REPORT:
        return '📝';
      case NOTIFICATION_TYPES.REPORT_VERIFIED:
        return '✅';
      case NOTIFICATION_TYPES.WEEKLY_DIGEST:
        return '📊';
      case NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT:
        return '📢';
      default:
        return '🔔';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="text-lg font-semibold">알림 센터</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
              title="필터"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPreferences}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
              title="알림 설정"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                  상태별 필터
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                >
                  <option value="all">전체</option>
                  <option value="unread">읽지 않음</option>
                  <option value="read">읽음</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                  유형별 필터
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                >
                  <option value="all">전체 유형</option>
                  {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action bar */}
        {notifications.length > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedNotifications.size > 0 ? (
                  <>
                    <span className="text-sm text-gray-600 dark:text-slate-300">
                      {selectedNotifications.size}개 선택됨
                    </span>
                    <button
                      onClick={clearSelection}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      선택 해제
                    </button>
                  </>
                ) : (
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    전체 선택
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {selectedNotifications.size > 0 && (
                  <button
                    onClick={deleteSelectedNotifications}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    삭제
                  </button>
                )}
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    모두 읽음
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-slate-400">알림을 불러오는 중...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Bell className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-400 mb-2">알림이 없습니다</p>
                <p className="text-sm text-gray-400 dark:text-slate-500">
                  새로운 알림이 오면 여기에 표시됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    !notification.read 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => toggleSelection(notification.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-slate-100' 
                              : 'text-gray-700 dark:text-slate-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            !notification.read 
                              ? 'text-gray-700 dark:text-slate-200' 
                              : 'text-gray-500 dark:text-slate-400'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-slate-500">
                              {dbUtils.getRelativeTime(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                          title="삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {loading ? '불러오는 중...' : '더 보기'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;