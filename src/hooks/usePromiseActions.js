import { useState, useCallback, useEffect } from 'react';

// Custom hook for promise sharing and bookmarking functionality
export const usePromiseActions = () => {
  const [bookmarkedPromises, setBookmarkedPromises] = useState(() => {
    // Load bookmarks from localStorage on initialization
    try {
      const saved = localStorage.getItem('bookmarkedPromises');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  });

  // Save bookmarks to localStorage whenever bookmarks change
  useEffect(() => {
    try {
      localStorage.setItem('bookmarkedPromises', JSON.stringify(bookmarkedPromises));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }, [bookmarkedPromises]);

  const toggleBookmark = useCallback((promise) => {
    setBookmarkedPromises(prev => {
      const isBookmarked = prev.some(p => p.id === promise.id);
      if (isBookmarked) {
        return prev.filter(p => p.id !== promise.id);
      } else {
        return [...prev, { 
          id: promise.id, 
          title: promise.title, 
          category: promise.category,
          level: promise.level,
          bookmarkedAt: new Date().toISOString()
        }];
      }
    });
  }, []);

  const isBookmarked = useCallback((promiseId) => {
    return bookmarkedPromises.some(p => p.id === promiseId);
  }, [bookmarkedPromises]);

  const sharePromise = useCallback(async (promise) => {
    const shareData = {
      title: `공약: ${promise.title}`,
      text: `${promise.description}\n\n진행률: ${promise.progress}%`,
      url: window.location.href
    };

    try {
      // Use Web Share API if available (mobile browsers)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { success: true, method: 'native' };
      } else {
        // Fallback to clipboard
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n자세히 보기: ${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        return { success: true, method: 'clipboard' };
      }
    } catch (error) {
      console.error('Error sharing promise:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarkedPromises([]);
  }, []);

  const getBookmarkStats = useCallback(() => {
    const categories = {};
    const levels = { national: 0, local: 0 };
    
    bookmarkedPromises.forEach(promise => {
      categories[promise.category] = (categories[promise.category] || 0) + 1;
      levels[promise.level] = (levels[promise.level] || 0) + 1;
    });

    return {
      total: bookmarkedPromises.length,
      categories,
      levels,
      recentlyBookmarked: bookmarkedPromises
        .sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt))
        .slice(0, 5)
    };
  }, [bookmarkedPromises]);

  return {
    bookmarkedPromises,
    toggleBookmark,
    isBookmarked,
    sharePromise,
    clearBookmarks,
    getBookmarkStats
  };
};

export default usePromiseActions;