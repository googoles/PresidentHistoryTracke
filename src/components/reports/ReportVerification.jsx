import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, X, Check, AlertTriangle, Clock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { reportOperations, dbUtils } from '../../utils/database';

const ReportVerification = ({ isOpen, onClose, report, onVerificationComplete }) => {
  const { user } = useAuth();
  const [verificationNote, setVerificationNote] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  // Check if user can verify reports (admin/moderator role would be checked here)
  const canVerify = user && (user.role === 'admin' || user.role === 'moderator');

  useEffect(() => {
    if (isOpen) {
      setVerificationNote('');
      setError(null);
    }
  }, [isOpen]);

  // Handle verification
  const handleVerification = async (isVerified) => {
    if (!canVerify || verifying) return;

    setVerifying(true);
    setError(null);

    try {
      const updates = {
        verified: isVerified,
        verified_by: isVerified ? user.id : null,
        verified_at: isVerified ? new Date().toISOString() : null,
        verification_note: isVerified ? dbUtils.sanitizeText(verificationNote) : null
      };

      const { data, error: updateError } = await reportOperations.updateReport(report.id, updates);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Call callback to refresh parent component
      if (onVerificationComplete) {
        onVerificationComplete(data);
      }

      onClose();

    } catch (err) {
      console.error('Failed to update verification status:', err);
      setError(err.message || '검증 상태 업데이트 중 오류가 발생했습니다');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen || !canVerify) return null;

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
          className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              제보 검증
            </h2>
            <button
              onClick={onClose}
              disabled={verifying}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Report Summary */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                  {report.profile?.avatar_url ? (
                    <img
                      src={report.profile.avatar_url}
                      alt={report.profile.full_name || report.profile.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-100">
                      {report.profile?.full_name || report.profile?.username || '익명'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {dbUtils.getRelativeTime(report.created_at)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-2">
                    {report.title}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                    {report.content.length > 200 
                      ? `${report.content.slice(0, 200)}...`
                      : report.content
                    }
                  </p>
                  {report.location && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                      📍 {report.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Media Preview */}
              {report.media_url && (
                <div className="mt-3">
                  {report.report_type === 'news' ? (
                    <a
                      href={report.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      🔗 뉴스 링크 확인
                    </a>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                      {report.media_url.includes('.mp4') || report.media_url.includes('.webm') ? (
                        <video
                          src={report.media_url}
                          controls
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <img
                          src={report.media_url}
                          alt="Report media"
                          className="w-full h-32 object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Current Status */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  {report.verified ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300">검증됨</span>
                      {report.verified_by_profile && (
                        <span className="text-gray-600 dark:text-slate-400">
                          ({report.verified_by_profile.full_name || report.verified_by_profile.username})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-yellow-700 dark:text-yellow-300">검증 대기 중</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Note */}
            <div className="mb-6">
              <label htmlFor="verification-note" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                검증 메모 (선택사항)
              </label>
              <textarea
                id="verification-note"
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                placeholder="검증 과정이나 근거에 대한 메모를 남겨주세요..."
                maxLength={500}
                rows={4}
                disabled={verifying}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {verificationNote.length}/500
                </span>
              </div>
            </div>

            {/* Verification Guidelines */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                검증 가이드라인
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 제보 내용의 사실성과 신뢰성을 확인해주세요</li>
                <li>• 첨부된 미디어가 제보 내용과 일치하는지 검토해주세요</li>
                <li>• 위치 정보가 정확한지 확인해주세요</li>
                <li>• 허위 정보나 스팸성 제보는 승인하지 마세요</li>
                <li>• 의심스러운 경우 다른 관리자와 상의해주세요</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={verifying}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              
              {!report.verified && (
                <>
                  <button
                    onClick={() => handleVerification(false)}
                    disabled={verifying}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        거부
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleVerification(true)}
                    disabled={verifying}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        승인
                      </>
                    )}
                  </button>
                </>
              )}

              {report.verified && (
                <button
                  onClick={() => handleVerification(false)}
                  disabled={verifying}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      검증 취소
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportVerification;