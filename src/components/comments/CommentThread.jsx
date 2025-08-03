import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Calendar, 
  User, 
  Pin,
  Flag,
  Edit3,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { commentOperations, dbUtils } from '../../utils/database';
import CommentForm from './CommentForm';

const CommentThread = ({ comment, onCommentUpdate, onReplyAdded, level = 0 }) => {
  const { user, isAuthenticated } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [userVote, setUserVote] = useState(null);
  const [voteCount, setVoteCount] = useState({
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0
  });
  const [voting, setVoting] = useState(false);
  const [editing, setEditing] = useState(false);

  // Maximum nesting level for replies
  const MAX_NESTING_LEVEL = 3;

  // Load user's vote for this comment
  useEffect(() => {
    const loadUserVote = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const { data, error } = await commentOperations.getUserCommentVote(comment.id, user.id);
        if (!error && data) {
          setUserVote(data.vote_type);
        }
      } catch (err) {
        console.error('Failed to load user vote:', err);
      }
    };

    loadUserVote();
  }, [comment.id, user, isAuthenticated]);

  // Check if user can edit/delete this comment
  const canModify = isAuthenticated && user && (
    user.id === comment.user_id || 
    user.role === 'admin' || 
    user.role === 'moderator'
  );

  // Handle vote
  const handleVote = async (voteType) => {
    if (!isAuthenticated || voting) return;

    setVoting(true);
    
    try {
      let result;
      
      if (userVote === voteType) {
        // Remove vote if clicking same vote type
        result = await commentOperations.removeCommentVote(comment.id, user.id);
        if (!result.error) {
          setUserVote(null);
          setVoteCount(prev => ({
            ...prev,
            [voteType + 's']: Math.max(0, prev[voteType + 's'] - 1)
          }));
        }
      } else {
        // Add or change vote
        result = await commentOperations.voteOnComment(comment.id, user.id, voteType);
        if (!result.error) {
          const previousVote = userVote;
          setUserVote(voteType);
          
          // Update vote counts
          setVoteCount(prev => {
            let newCounts = { ...prev };
            
            // Remove previous vote count
            if (previousVote) {
              newCounts[previousVote + 's'] = Math.max(0, newCounts[previousVote + 's'] - 1);
            }
            
            // Add new vote count
            newCounts[voteType + 's'] = newCounts[voteType + 's'] + 1;
            
            return newCounts;
          });
        }
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

    } catch (err) {
      console.error('Failed to vote on comment:', err);
    } finally {
      setVoting(false);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!canModify || editing) return;

    const trimmedContent = editContent.trim();
    if (!trimmedContent) return;

    setEditing(true);

    try {
      const { data, error } = await commentOperations.updateComment(comment.id, {
        content: dbUtils.sanitizeText(trimmedContent),
        updated_at: new Date().toISOString()
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsEditing(false);
      
      // Update parent component
      if (onCommentUpdate) {
        onCommentUpdate(data);
      }

    } catch (err) {
      console.error('Failed to edit comment:', err);
    } finally {
      setEditing(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!canModify || !window.confirm('이 댓글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await commentOperations.deleteComment(comment.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update parent component
      if (onCommentUpdate) {
        onCommentUpdate({ ...comment, is_deleted: true });
      }

    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Handle reply submission
  const handleReplySubmitted = (newReply) => {
    setShowReplyForm(false);
    if (onReplyAdded) {
      onReplyAdded(newReply);
    }
  };

  // Handle flag
  const handleFlag = () => {
    // This would implement comment flagging functionality
    console.log('Flag comment:', comment.id);
    setShowMenu(false);
  };

  // Calculate indentation based on nesting level
  const indentClass = level > 0 ? `ml-${Math.min(level * 4, 12)}` : '';

  // Don't render deleted comments (unless it has replies)
  if (comment.is_deleted && (!comment.replies || comment.replies.length === 0)) {
    return null;
  }

  return (
    <div className={`${indentClass} ${level > 0 ? 'border-l border-gray-200 dark:border-slate-700 pl-4' : ''}`}>
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {comment.profile?.avatar_url ? (
                <img
                  src={comment.profile.avatar_url}
                  alt={comment.profile.full_name || comment.profile.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                </div>
              )}
            </div>

            {/* Comment Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800 dark:text-slate-100">
                  {comment.profile?.full_name || comment.profile?.username || '익명'}
                </span>
                {comment.is_pinned && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full text-xs">
                    <Pin className="w-3 h-3" />
                    <span>고정됨</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{dbUtils.getRelativeTime(comment.created_at)}</span>
                  {comment.updated_at && comment.updated_at !== comment.created_at && (
                    <span>(수정됨)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label="메뉴"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-10 min-w-32">
                {canModify && !comment.is_deleted && (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" />
                      수정
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      삭제
                    </button>
                  </>
                )}
                <button
                  onClick={handleFlag}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Flag className="w-3 h-3" />
                  신고
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-3">
          {comment.is_deleted ? (
            <p className="text-gray-500 dark:text-slate-400 italic">
              삭제된 댓글입니다.
            </p>
          ) : isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleEdit}
                  disabled={editing || !editContent.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm"
                >
                  {editing ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
        </div>

        {/* Actions */}
        {!comment.is_deleted && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              {/* Upvote */}
              <button
                onClick={() => handleVote('upvote')}
                disabled={!isAuthenticated || voting}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  userVote === 'upvote'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                }`}
                aria-label="추천"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">{voteCount.upvotes}</span>
              </button>

              {/* Downvote */}
              <button
                onClick={() => handleVote('downvote')}
                disabled={!isAuthenticated || voting}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  userVote === 'downvote'
                    ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
                    : 'text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'
                }`}
                aria-label="비추천"
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-sm">{voteCount.downvotes}</span>
              </button>

              {/* Reply Button */}
              {level < MAX_NESTING_LEVEL && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  disabled={!isAuthenticated}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="답글"
                >
                  <Reply className="w-4 h-4" />
                  <span className="text-sm">답글</span>
                </button>
              )}
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                로그인하여 참여해보세요
              </p>
            )}
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <CommentForm
              promiseId={comment.promise_id}
              parentCommentId={comment.id}
              onCommentSubmitted={handleReplySubmitted}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`${comment.profile?.full_name || comment.profile?.username || '댓글'}에 답글 작성...`}
              autoFocus={true}
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onCommentUpdate={onCommentUpdate}
              onReplyAdded={onReplyAdded}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* Click overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default CommentThread;