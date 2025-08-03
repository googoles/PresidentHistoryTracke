import React, { useState } from 'react';
import { Send, X, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { commentOperations, dbUtils } from '../../utils/database';

const CommentForm = ({ 
  promiseId, 
  parentCommentId = null, 
  onCommentSubmitted, 
  onCancel,
  placeholder = "이 공약에 대한 의견을 남겨주세요...",
  autoFocus = false 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('댓글을 작성하려면 로그인이 필요합니다');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('댓글 내용을 입력해주세요');
      return;
    }

    if (trimmedContent.length > 2000) {
      setError('댓글은 2000자 이하로 작성해주세요');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const commentData = {
        promise_id: promiseId,
        user_id: user.id,
        parent_comment_id: parentCommentId,
        content: dbUtils.sanitizeText(trimmedContent),
        upvotes: 0,
        downvotes: 0,
        is_pinned: false
      };

      const { data, error: submitError } = await commentOperations.createComment(commentData);

      if (submitError) {
        throw new Error(submitError.message);
      }

      // Reset form
      setContent('');
      setError(null);

      // Call callback to refresh parent component
      if (onCommentSubmitted) {
        onCommentSubmitted(data);
      }

    } catch (err) {
      console.error('Failed to submit comment:', err);
      setError(err.message || '댓글 작성 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setContent('');
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
        <p className="text-gray-600 dark:text-slate-400 mb-3">
          댓글을 작성하려면 로그인이 필요합니다
        </p>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          로그인
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* User Info */}
      <div className="flex items-center gap-3">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name || user.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600 dark:text-slate-300" />
          </div>
        )}
        <span className="text-sm font-medium text-gray-800 dark:text-slate-100">
          {user.full_name || user.username}
        </span>
      </div>

      {/* Comment Input */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength={2000}
          rows={parentCommentId ? 3 : 4}
          autoFocus={autoFocus}
          disabled={submitting}
          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-slate-500">
          {content.length}/2000
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-slate-400">
          {parentCommentId ? '답글을 작성 중입니다' : '건설적인 의견을 남겨주세요'}
        </div>
        
        <div className="flex items-center gap-2">
          {parentCommentId && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
          )}
          
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                작성 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {parentCommentId ? '답글 작성' : '댓글 작성'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;