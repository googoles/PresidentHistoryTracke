import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X, Share2, Bookmark } from 'lucide-react';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: Date.now(),
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, notification.duration || 5000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Create notification system context
  useEffect(() => {
    window.showNotification = addNotification;
    return () => {
      delete window.showNotification;
    };
  }, [addNotification]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-blue-500" />;
      case 'bookmark':
        return <Bookmark className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyleClass = (type) => {
    const baseClass = "bg-white dark:bg-slate-800 border-l-4 shadow-lg rounded-lg";
    switch (type) {
      case 'success':
        return `${baseClass} border-green-500`;
      case 'error':
        return `${baseClass} border-red-500`;
      case 'share':
        return `${baseClass} border-blue-500`;
      case 'bookmark':
        return `${baseClass} border-yellow-500`;
      default:
        return `${baseClass} border-blue-500`;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getStyleClass(notification.type)} p-4 animate-in slide-in-from-right duration-300`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              {notification.title && (
                <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1">
                  {notification.title}
                </h4>
              )}
              <p className="text-sm text-gray-600 dark:text-slate-300">
                {notification.message}
              </p>
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="알림 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Utility functions for common notifications
export const showSuccessNotification = (message, title) => {
  window.showNotification?.({
    type: 'success',
    title,
    message,
    duration: 3000
  });
};

export const showErrorNotification = (message, title) => {
  window.showNotification?.({
    type: 'error',
    title,
    message,
    duration: 5000
  });
};

export const showShareNotification = (method) => {
  const message = method === 'native' 
    ? '공약이 공유되었습니다.' 
    : '공약 링크가 클립보드에 복사되었습니다.';
  
  window.showNotification?.({
    type: 'share',
    title: '공유 완료',
    message,
    duration: 3000
  });
};

export const showBookmarkNotification = (isBookmarked, promiseTitle) => {
  const message = isBookmarked 
    ? `"${promiseTitle}"이(가) 북마크에 추가되었습니다.`
    : `"${promiseTitle}"이(가) 북마크에서 제거되었습니다.`;
  
  window.showNotification?.({
    type: 'bookmark',
    title: isBookmarked ? '북마크 추가' : '북마크 제거',
    message,
    duration: 2000
  });
};

export default NotificationSystem;