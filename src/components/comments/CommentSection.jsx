import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, SortAsc, SortDesc, Filter, RefreshCw, TrendingUp, Clock, Pin, ChevronDown, Menu } from 'lucide-react';
import { commentOperations, realtimeOperations } from '../../utils/database';
import { useAuth } from '../../hooks/useAuth';
import CommentForm from './CommentForm';
import CommentThread from './CommentThread';

const CommentSection = ({ promiseId, promiseTitle, compact = false }) => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'upvotes', 'pinned'
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterPinned, setFilterPinned] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Real-time subscription
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  // Sort options
  const sortOptions = {
    'created_at': { label: '최신순', icon: Clock },
    'upvotes': { label: '추천순', icon: TrendingUp },
    'pinned': { label: '고정순', icon: Pin }
  };

  // Load comments
  const loadComments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const { data, error: loadError } = await commentOperations.getPromiseComments(promiseId);

      if (loadError) {
        throw new Error(loadError.message);
      }

      setComments(data || []);

    } catch (err) {
      console.error('Failed to load comments:', err);
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [promiseId]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    loadComments();

    // Subscribe to real-time comment changes
    const subscription = realtimeOperations.subscribeToPromiseComments(
      promiseId,
      (payload) => {
        console.log('Real-time comment update:', payload);
        
        switch (payload.eventType) {
          case 'INSERT':
            // New comment added
            loadComments(false);
            break;
          case 'UPDATE':
            // Comment updated
            setComments(prev => prev.map(comment => 
              comment.id === payload.new.id ? { ...comment, ...payload.new } : comment
            ));
            break;
          case 'DELETE':
            // Comment deleted
            setComments(prev => prev.map(comment => 
              comment.id === payload.old.id ? { ...comment, is_deleted: true } : comment
            ));
            break;
          default:
            break;
        }
      }
    );

    setRealtimeSubscription(subscription);

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        realtimeOperations.unsubscribe(subscription);
      }
    };
  }, [promiseId, loadComments]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComments(false);
    setRefreshing(false);
  };

  // Handle new comment submission
  const handleCommentSubmitted = (newComment) => {
    // Optimistically add comment to UI
    setComments(prev => [newComment, ...prev]);
  };

  // Handle comment update
  const handleCommentUpdate = (updatedComment) => {
    setComments(prev => prev.map(comment => 
      comment.id === updatedComment.id ? updatedComment : comment
    ));
  };

  // Handle reply added
  const handleReplyAdded = (newReply) => {
    // Find parent comment and add reply
    setComments(prev => prev.map(comment => {
      if (comment.id === newReply.parent_comment_id) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      return comment;
    }));
  };

  // Sort and filter comments
  const sortedAndFilteredComments = React.useMemo(() => {
    let filtered = [...comments];

    // Filter pinned comments if requested
    if (filterPinned) {
      filtered = filtered.filter(comment => comment.is_pinned);
    }

    // Sort comments
    filtered.sort((a, b) => {
      // Always show pinned comments first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      let valueA, valueB;

      switch (sortBy) {
        case 'upvotes':
          valueA = (a.upvotes || 0) - (a.downvotes || 0);
          valueB = (b.upvotes || 0) - (b.downvotes || 0);
          break;
        case 'created_at':
        default:
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'desc') {
        return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });

    return filtered;
  }, [comments, sortBy, sortOrder, filterPinned]);

  // Get comment count
  const totalComments = comments.reduce((count, comment) => {
    return count + 1 + (comment.replies ? comment.replies.length : 0);
  }, 0);

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-700 p-6">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 mb-4">댓글을 불러오는 중 오류가 발생했습니다</p>
          <button
            onClick={() => loadComments()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
            댓글 ({totalComments})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 sm:p-2 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
            aria-label="새로고침"
          >
            <RefreshCw className={`w-5 h-5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Mobile Filter Toggle */}
          {isMobile ? (
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="p-3 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="필터 메뉴"
            >
              <Menu className="w-5 h-5" />
            </button>
          ) : (
            <>
              {/* Filter Pinned */}
              <button
                onClick={() => setFilterPinned(!filterPinned)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition-colors touch-manipulation min-h-[44px] ${
                  filterPinned
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'
                }`}
                aria-label="고정된 댓글만 보기"
              >
                <Pin className="w-4 h-4" />
                {!compact && <span>고정</span>}
              </button>

              {/* Sort Options */}
              <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 text-sm border-none focus:ring-0 text-gray-700 dark:text-slate-300 min-h-[44px]"
                >
                  {Object.entries(sortOptions).map(([key, option]) => (
                    <option key={key} value={key}>{option.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-3 py-2 border-l border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                  aria-label={sortOrder === 'desc' ? '오름차순 정렬' : '내림차순 정렬'}
                >
                  {sortOrder === 'desc' ? 
                    <SortDesc className="w-4 h-4" /> : 
                    <SortAsc className="w-4 h-4" />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Panel */}
      {isMobile && showMobileFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 space-y-4">
          {/* Filter Pinned */}
          <button
            onClick={() => {
              setFilterPinned(!filterPinned);
              setShowMobileFilters(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 text-left transition-colors touch-manipulation ${
              filterPinned
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Pin className="w-5 h-5" />
              <span>고정된 댓글만 보기</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${filterPinned ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              정렬 방식
            </label>
            <div className="space-y-2">
              {Object.entries(sortOptions).map(([key, option]) => {
                const Icon = option.icon;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSortBy(key);
                      setShowMobileFilters(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors touch-manipulation ${
                      sortBy === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{option.label}</span>
                    {sortBy === key && (
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-xs">{sortOrder === 'desc' ? '내림차순' : '오름차순'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                          }}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                        >
                          {sortOrder === 'desc' ? 
                            <SortDesc className="w-4 h-4" /> : 
                            <SortAsc className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Comment Form - Mobile optimized */}
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 ${isMobile ? 'p-4' : 'p-6'}`}>
        <CommentForm
          promiseId={promiseId}
          onCommentSubmitted={handleCommentSubmitted}
          placeholder={`"${promiseTitle}" 공약에 대한 의견을 남겨주세요...`}
          isMobile={isMobile}
        />
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedAndFilteredComments.length > 0 ? (
        <div className="space-y-4">
          {sortedAndFilteredComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onCommentUpdate={handleCommentUpdate}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 dark:text-slate-300 mb-2">
            {filterPinned ? '고정된 댓글이 없습니다' : '아직 댓글이 없습니다'}
          </h4>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            {filterPinned 
              ? '고정 필터를 해제하여 모든 댓글을 확인해보세요'
              : '이 공약에 대한 첫 번째 의견을 남겨보세요'
            }
          </p>
          {!filterPinned && isAuthenticated && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              위의 댓글 작성 폼을 사용해 의견을 남겨주세요
            </p>
          )}
        </div>
      )}

      {/* Real-time Indicator */}
      {realtimeSubscription && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            실시간 업데이트 활성화
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;