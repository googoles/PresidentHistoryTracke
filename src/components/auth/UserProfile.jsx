import React, { useState, useRef } from 'react';
import { User, Mail, MapPin, Calendar, Edit3, Save, X, LogOut, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile, signOut, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    region: profile?.region || 'seoul'
  });

  const fileInputRef = useRef(null);

  // Available regions
  const regions = [
    { id: 'seoul', name: '서울특별시' },
    { id: 'busan', name: '부산광역시' },
    { id: 'daegu', name: '대구광역시' },
    { id: 'incheon', name: '인천광역시' },
    { id: 'gwangju', name: '광주광역시' },
    { id: 'daejeon', name: '대전광역시' },
    { id: 'ulsan', name: '울산광역시' },
    { id: 'sejong', name: '세종특별자치시' },
    { id: 'gyeonggi', name: '경기도' },
    { id: 'gangwon', name: '강원특별자치도' },
    { id: 'chungbuk', name: '충청북도' },
    { id: 'chungnam', name: '충청남도' },
    { id: 'jeonbuk', name: '전북특별자치도' },
    { id: 'jeonnam', name: '전라남도' },
    { id: 'gyeongbuk', name: '경상북도' },
    { id: 'gyeongnam', name: '경상남도' },
    { id: 'jeju', name: '제주특별자치도' }
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  // Start editing
  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      region: profile?.region || 'seoul'
    });
    setIsEditing(true);
    setError('');
    setSuccessMessage('');
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      region: profile?.region || 'seoul'
    });
    setError('');
    setSuccessMessage('');
  };

  // Save profile
  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.username.trim()) {
      setError('이름과 사용자명을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await updateProfile({
        full_name: formData.full_name.trim(),
        username: formData.username.trim(),
        region: formData.region
      });

      if (result.success) {
        setSuccessMessage('프로필이 성공적으로 업데이트되었습니다.');
        setIsEditing(false);
      } else {
        setError(result.error || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      setError('예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    const confirmed = window.confirm('로그아웃하시겠습니까?');
    if (!confirmed) return;

    try {
      const result = await signOut();
      if (result.success) {
        onClose();
      } else {
        setError(result.error || '로그아웃에 실패했습니다.');
      }
    } catch (error) {
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // Handle avatar upload (placeholder for future implementation)
  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement avatar upload to Supabase Storage
      console.log('Avatar upload not yet implemented:', file);
      setError('아바타 업로드 기능은 곧 추가될 예정입니다.');
    }
  };

  // Get region name
  const getRegionName = (regionId) => {
    const region = regions.find(r => r.id === regionId);
    return region?.name || regionId;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            프로필
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isSaving || loading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <button
                onClick={handleAvatarUpload}
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                disabled={isSaving || loading}
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                이메일
              </label>
              <div className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-900 dark:text-slate-100">{user?.email}</span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                이름
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  placeholder="이름을 입력하세요"
                  disabled={isSaving || loading}
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900 dark:text-slate-100">
                    {profile?.full_name || '이름 없음'}
                  </span>
                </div>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                사용자명
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  placeholder="사용자명을 입력하세요"
                  disabled={isSaving || loading}
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900 dark:text-slate-100">
                    {profile?.username || '사용자명 없음'}
                  </span>
                </div>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                거주 지역
              </label>
              {isEditing ? (
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  disabled={isSaving || loading}
                >
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900 dark:text-slate-100">
                    {getRegionName(profile?.region)}
                  </span>
                </div>
              )}
            </div>

            {/* Join Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                가입일
              </label>
              <div className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-900 dark:text-slate-100">
                  {profile?.created_at ? formatDate(profile.created_at) : '정보 없음'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {isEditing ? (
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || loading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  저장
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving || loading}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={handleEdit}
                disabled={isSaving || loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                프로필 수정
              </button>
            )}

            {/* Additional Actions */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
              <button
                onClick={() => setError('설정 기능은 곧 추가될 예정입니다.')}
                disabled={isSaving || loading}
                className="w-full flex items-center justify-center px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                설정
              </button>
              
              <button
                onClick={handleLogout}
                disabled={isSaving || loading}
                className="w-full flex items-center justify-center px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;