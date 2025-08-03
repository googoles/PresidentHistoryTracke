import React, { useState, useEffect } from 'react';
import { X, Star, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ratingOperations, dbUtils } from '../../utils/database';

const RatingModal = ({ isOpen, onClose, promiseId, promiseTitle, existingRating, onRatingSubmitted }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Rating labels for better UX
  const ratingLabels = {
    1: '매우 불만족',
    2: '불만족',
    3: '보통',
    4: '만족',
    5: '매우 만족'
  };

  // Initialize form with existing rating if available
  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setError(null);
    setSuccess(false);
  }, [existingRating, isOpen]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      setError('평점을 선택해주세요');
      return;
    }

    if (!dbUtils.isValidRating(rating)) {
      setError('올바른 평점을 선택해주세요 (1-5점)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ratingData = {
        promise_id: promiseId,
        user_id: user.id,
        rating: rating,
        comment: dbUtils.sanitizeText(comment),
        helpful_count: existingRating?.helpful_count || 0
      };

      const { data, error: submitError } = await ratingOperations.upsertRating(ratingData);

      if (submitError) {
        throw new Error(submitError.message);
      }

      setSuccess(true);
      
      // Call callback to refresh parent component
      if (onRatingSubmitted) {
        onRatingSubmitted(data);
      }

      // Close modal after brief success display
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to submit rating:', err);
      setError(err.message || '평가 제출 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle star click
  const handleStarClick = (value) => {
    setRating(value);
    setError(null);
  };

  // Handle star hover
  const handleStarHover = (value) => {
    setHoveredRating(value);
  };

  // Handle star hover leave
  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  // Render star rating interface
  const renderStars = () => {
    const stars = [];
    const currentRating = hoveredRating || rating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleStarLeave}
          className={`p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded ${
            submitting ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          disabled={submitting}
          aria-label={`${i}점 평가`}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              i <= currentRating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
            }`}
          />
        </button>
      );
    }

    return stars;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
              {existingRating ? '평가 수정' : '공약 평가'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Promise Title */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                평가할 공약
              </h3>
              <p className="text-gray-800 dark:text-slate-100 font-medium leading-relaxed">
                {promiseTitle}
              </p>
            </div>

            {/* Rating Stars */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                평점 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1 mb-2">
                {renderStars()}
              </div>
              {(hoveredRating || rating) > 0 && (
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {ratingLabels[hoveredRating || rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label htmlFor="rating-comment" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                의견 (선택사항)
              </label>
              <textarea
                id="rating-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="이 공약에 대한 의견을 자유롭게 남겨주세요..."
                maxLength={1000}
                rows={4}
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  건설적인 의견을 남겨주세요
                </p>
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {comment.length}/1000
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    평가가 성공적으로 {existingRating ? '수정' : '등록'}되었습니다
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !rating || success}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    제출 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {existingRating ? '수정' : '평가'} 완료
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;