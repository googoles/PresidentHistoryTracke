import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image, Link2, MapPin, Send, AlertCircle, CheckCircle, FileText, Camera, Smartphone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { reportOperations, dbUtils } from '../../utils/database';
import { processImageForMobile, validateImageFile } from '../../utils/imageUtils';

const ReportForm = ({ isOpen, onClose, promiseId, promiseTitle, onReportSubmitted }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    reportType: 'progress_update',
    title: '',
    content: '',
    location: '',
    newsUrl: ''
  });
  
  const [mediaFile, setMediaFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Report type options
  const reportTypes = {
    progress_update: {
      label: '진행 상황 업데이트',
      icon: FileText,
      description: '공약 진행 상황에 대한 현장 정보'
    },
    news: {
      label: '관련 뉴스',
      icon: Link2,
      description: '공약과 관련된 뉴스 기사나 언론 보도'
    },
    photo: {
      label: '현장 사진',
      icon: Camera,
      description: '공약 이행 현장의 사진이나 증거 자료'
    },
    concern: {
      label: '우려사항',
      icon: AlertCircle,
      description: '공약 이행 과정에서의 문제점이나 우려사항'
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      reportType: 'progress_update',
      title: '',
      content: '',
      location: '',
      newsUrl: ''
    });
    setMediaFile(null);
    setMediaPreview(null);
    setError(null);
    setSuccess(false);
  };

  // Handle form close
  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setError('지원되지 않는 파일 형식입니다. (JPEG, PNG, WebP, MP4, WebM만 지원)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    setMediaFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove media file
  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload media file (placeholder for actual implementation)
  const uploadMedia = async (file) => {
    // This would typically upload to Supabase Storage or another service
    // For now, we'll return a placeholder URL
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`/uploads/${Date.now()}-${file.name}`);
      }, 1000);
    });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      return '제목을 입력해주세요';
    }

    if (formData.title.length > 200) {
      return '제목은 200자 이하로 입력해주세요';
    }

    if (!formData.content.trim()) {
      return '내용을 입력해주세요';
    }

    if (formData.content.length > 2000) {
      return '내용은 2000자 이하로 입력해주세요';
    }

    if (formData.reportType === 'news' && formData.newsUrl && !isValidUrl(formData.newsUrl)) {
      return '올바른 URL을 입력해주세요';
    }

    return null;
  };

  // Validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let mediaUrl = null;

      // Upload media file if present
      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
      }

      // Prepare report data
      const reportData = {
        promise_id: promiseId,
        user_id: user.id,
        report_type: formData.reportType,
        title: dbUtils.sanitizeText(formData.title),
        content: dbUtils.sanitizeText(formData.content),
        location: formData.location ? dbUtils.sanitizeText(formData.location) : null,
        media_url: mediaUrl || (formData.newsUrl ? formData.newsUrl : null),
        verified: false,
        upvotes: 0
      };

      // Submit report
      const { data, error: submitError } = await reportOperations.createReport(reportData);

      if (submitError) {
        throw new Error(submitError.message);
      }

      setSuccess(true);

      // Call callback to refresh parent component
      if (onReportSubmitted) {
        onReportSubmitted(data);
      }

      // Close form after brief success display
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Failed to submit report:', err);
      setError(err.message || '제보 제출 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
              시민 제보 작성
            </h2>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Promise Title */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                제보할 공약
              </h3>
              <p className="text-gray-800 dark:text-slate-100 font-medium leading-relaxed p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                {promiseTitle}
              </p>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                제보 유형 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(reportTypes).map(([key, type]) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleInputChange('reportType', key)}
                      disabled={submitting}
                      className={`p-4 rounded-lg border-2 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        formData.reportType === key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-5 h-5 ${
                          formData.reportType === key 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-500 dark:text-slate-400'
                        }`} />
                        <span className={`font-medium ${
                          formData.reportType === key
                            ? 'text-blue-800 dark:text-blue-300'
                            : 'text-gray-800 dark:text-slate-100'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-400">
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="report-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                id="report-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="제보 제목을 입력해주세요"
                maxLength={200}
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {formData.title.length}/200
                </span>
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="report-content" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="report-content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="제보 내용을 자세히 설명해주세요..."
                maxLength={2000}
                rows={6}
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  사실에 기반한 정확한 정보를 제공해주세요
                </p>
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {formData.content.length}/2000
                </span>
              </div>
            </div>

            {/* Location (optional) */}
            <div>
              <label htmlFor="report-location" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                위치 (선택사항)
              </label>
              <input
                id="report-location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="관련 위치나 지역을 입력해주세요"
                maxLength={100}
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* News URL (for news reports) */}
            {formData.reportType === 'news' && (
              <div>
                <label htmlFor="report-url" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Link2 className="w-4 h-4 inline mr-1" />
                  뉴스 URL
                </label>
                <input
                  id="report-url"
                  type="url"
                  value={formData.newsUrl}
                  onChange={(e) => handleInputChange('newsUrl', e.target.value)}
                  placeholder="https://news.example.com/article"
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Media Upload */}
            {formData.reportType !== 'news' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Upload className="w-4 h-4 inline mr-1" />
                  첨부 파일 (선택사항)
                </label>
                
                {!mediaPreview ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                      onChange={handleFileSelect}
                      disabled={submitting}
                      className="hidden"
                    />
                    <Image className="w-8 h-8 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">
                      사진이나 동영상을 업로드하세요
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                      JPEG, PNG, WebP, MP4, WebM (최대 5MB)
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      파일 선택
                    </button>
                  </div>
                ) : (
                  <div className="relative border border-gray-300 dark:border-slate-600 rounded-lg p-4">
                    {mediaFile?.type.startsWith('image/') ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={removeMedia}
                      disabled={submitting}
                      className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-600 dark:text-slate-300 mt-2">
                      {mediaFile?.name} ({(mediaFile?.size / 1024 / 1024).toFixed(1)}MB)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    제보가 성공적으로 등록되었습니다. 검토 후 게시됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || success}
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
                    제보 등록
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

export default ReportForm;