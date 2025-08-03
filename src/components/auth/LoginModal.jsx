import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: '',
    region: 'seoul'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, signInWithProvider, resetPassword, loading, error, clearError } = useAuth();

  // Available regions for registration
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

  // Reset form when modal opens/closes or tab changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        username: '',
        region: 'seoul'
      });
      setLocalError('');
      setSuccessMessage('');
      clearError();
    }
  }, [isOpen, activeTab, clearError]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (localError) setLocalError('');
    if (error) clearError();
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setLocalError('이메일과 비밀번호를 입력해주세요.');
      return false;
    }

    if (activeTab === 'register') {
      if (!formData.fullName || !formData.username) {
        setLocalError('이름과 사용자명을 입력해주세요.');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setLocalError('비밀번호가 일치하지 않습니다.');
        return false;
      }

      if (formData.password.length < 6) {
        setLocalError('비밀번호는 최소 6자 이상이어야 합니다.');
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLocalError('');
    setSuccessMessage('');

    try {
      if (activeTab === 'login') {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          setSuccessMessage('로그인되었습니다.');
          setTimeout(() => onClose(), 1000);
        } else {
          setLocalError(result.error || '로그인에 실패했습니다.');
        }
      } else if (activeTab === 'register') {
        const userData = {
          fullName: formData.fullName,
          username: formData.username,
          region: formData.region
        };
        
        const result = await signUp(formData.email, formData.password, userData);
        if (result.success) {
          if (result.message) {
            setSuccessMessage(result.message);
            setActiveTab('login');
          } else {
            setSuccessMessage('회원가입이 완료되었습니다.');
            setTimeout(() => onClose(), 1000);
          }
        } else {
          setLocalError(result.error || '회원가입에 실패했습니다.');
        }
      } else if (activeTab === 'reset') {
        const result = await resetPassword(formData.email);
        if (result.success) {
          setSuccessMessage(result.message);
          setActiveTab('login');
        } else {
          setLocalError(result.error || '비밀번호 재설정에 실패했습니다.');
        }
      }
    } catch (error) {
      setLocalError('예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider) => {
    setIsSubmitting(true);
    setLocalError('');

    try {
      const result = await signInWithProvider(provider);
      if (result.success) {
        setSuccessMessage(`${provider} 로그인되었습니다.`);
        // For OAuth, the redirect will handle the rest
      } else {
        setLocalError(result.error || `${provider} 로그인에 실패했습니다.`);
      }
    } catch (error) {
      setLocalError('소셜 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentError = localError || error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            {activeTab === 'login' && '로그인'}
            {activeTab === 'register' && '회원가입'}
            {activeTab === 'reset' && '비밀번호 재설정'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isSubmitting || loading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
            disabled={isSubmitting || loading}
          >
            로그인
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
            disabled={isSubmitting || loading}
          >
            회원가입
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
          {currentError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{currentError}</span>
            </div>
          )}

          {/* Social Login (only for login tab) */}
          {activeTab === 'login' && (
            <div className="mb-6">
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={isSubmitting || loading}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkuMDA0NzUgNy4yMzg0VjEwLjU1NEgxNC4zNjE5QzE0LjE0NDcgMTEuNjY0IDEzLjU1OSAxMi41NDE2IDEyLjY4NDcgMTMuMTI2OEwxNS41NDk1IDE1LjMzMzJDMTcuMjEwOSAxMy43NzE2IDE4LjE3OTUgMTEuNTQwNCAxOC4xNzk1IDguOTkyOEMxOC4xNzk1IDguMzE4NCAxOC4xMjU5IDcuNjcyOCAxOC4wMjY3IDcuMDU4NEwxOC4wMTc5IDcuMDA0OEg5LjAwNDc1VjcuMjM4NFoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTQuNTA5NSAxMC4yODg4TDMuNTEzNSAxMS4wMjI0TDAuNzcwNTEgMTMuMTA0QzIuNzIyOTkgMTYuOTgwOCA2LjE4MTgzIDE5LjggMTAuMDA0OCAxOS44QzEyLjUzNTMgMTkuOCAxNC42NTcxIDE4Ljk5ODQgMTYuMDczOSAxNy41NDRMMTMuMTkxOSAxNS4zNDA4QzEyLjM2OTUgMTUuOTI2IDExLjIzODMgMTYuMTQzMiAxMC4wMDQ4IDE2LjE0MzJDNy41Njk5MSAxNi4xNDMyIDUuNDkzMjcgMTUuMTEyOCA0LjYwNjE5IDEzLjYyNjRMNC41MDk1IDEwLjI4ODhaIiBmaWxsPSIjMzRBODUzIi8+CjxwYXRoIGQ9Ik0wLjc3MDE5NCA1LjMxNjhDMi43MjI3MSAxLjQ0IDYuMTgxNTQgLTEuMzggMTAuMDA0OCAtMS4zOEMxMS45NjYzIC0xLjM4IDEzLjcyMjcgLTAuNjkyOCAxNS4wNTM5IDAuNTM4NEwxMi40NDU1IDMuMDIxNkMxMS42NTA3IDIuNDM2NCAxMC42MjI3IDIuMDY5NiA5LjcyNjI3IDIuMDY5NkM2LjE5MTU0IDIuMDY5NiA0LjU2NDI3IDUuNTAzMiA0LjU2NDI3IDguNTA5NkM0LjU2NDI3IDguNzM0NCA0LjU5MTI3IDguOTQ4OCA0LjY0MzUxIDkuMTU0NEw0LjU1NDI3IDkuODI1NkM0LjYwMjkxIDEwLjA0MTYgNC42NDM1MSAxMC4yNzUyIDQuNTA5MjcgMTAuMjg4OEw0LjU2NDI3IDguNTA5NkM0LjU2NDI3IDUuNTAzMiA2LjE5MTU0IDIuMDY5NiA5LjcyNjI3IDIuMDY5NkMxMC42MjI3IDIuMDY5NiAxMS42NTA3IDIuNDM2NCAxMi40NDU1IDMuMDIxNkwxNS4wNTM5IDAuNTM4NEMxMy43MjI3IC0wLjY5MjggMTEuOTY2MyAtMS4zOCAxMC4wMDQ4IC0xLjM4QzYuMTgxNTQgLTEuMzggMi43MjI3MSAxLjQ0IDAuNzcwMTk0IDUuMzE2OFoiIGZpbGw9IiNGQkJDMDQiLz4KPHBhdGggZD0iTTQuNTA5NSAxMC4yODg4QzQuNjQzNzUgMTAuMjc1MiA0LjYwMjkxIDEwLjA0MTYgNC41NTQyNyA5LjgyNTZMNC42NDM1MSA5LjE1NDRDNC41OTE2IDguOTQ4OCA0LjU2NDYgOC43MzQ0IDQuNTY0NiA4LjUwOTZMNC41MDk1IDEwLjI4ODhaIiBmaWxsPSIjRkJCQzA0Ii8+CjxwYXRoIGQ9Ik0xMC4wMDQ4IDE5LjhDNi4xODE4MyAxOS44IDIuNzIyOTkgMTYuOTgwOCAwLjc3MDUxIDEzLjEwNEwzLjUxMzUgMTEuMDIyNEw0LjUwOTUgMTAuMjg4OEM0LjU2NDI3IDguNTA5NiA0LjU2NDI3IDguNTA5NiA0LjU2NDI3IDguNTA5NkM0LjU2NDI3IDUuNTAzMiA2LjE5MTU0IDIuMDY5NiA5LjcyNjI3IDIuMDY5NkMxMC42MjI3IDIuMDY5NiAxMS42NTA3IDIuNDM2NCAxMi40NDU1IDMuMDIxNkwxNS4wNTM5IDAuNTM4NEMxMy43MjI3IC0wLjY5MjggMTEuOTY2MyAtMS4zOCAxMC4wMDQ4IC0xLjM4QzYuMTgxNTQgLTEuMzggMi43MjI3MSAxLjQ0IDAuNzcwMTk0IDUuMzE2OFYxMy4xMDRMMy41MTM1IDExLjAyMjRMNC41MDk1IDEwLjI4ODhDNC41NjQyNyA4LjUwOTYgNC41NjQyNyA4LjUwOTYgNC41NjQyNyA4LjUwOTZDNC41NjQyNyA1LjUwMzIgNi4xOTE1NCAyLjA2OTYgOS43MjYyNyAyLjA2OTZDMTAuNjIyNyAyLjA2OTYgMTEuNjUwNyAyLjQzNjQgMTIuNDQ1NSAzLjAyMTZMMTUuMDUzOSAwLjUzODRDMTMuNzIyNyAtMC42OTI4IDExLjk2NjMgLTEuMzggMTAuMDA0OCAtMS4zOEM2LjE4MTU0IC0xLjM4IDIuNzIyNzEgMS40NCAwLjc3MDE5NCA1LjMxNjhWMTMuMTA0TDMuNTEzNSAxMS4wMjI0TDQuNTA5NSAxMC4yODg4QzQuNTY0MjcgOC41MDk2IDQuNTY0MjcgOC41MDk2IDQuNTY0MjcgOC41MDk2QzQuNTY0MjcgNS41MDMyIDYuMTkxNTQgMi4wNjk2IDkuNzI2MjcgMi4wNjk2QzEwLjYyMjcgMi4wNjk2IDExLjY1MDcgMi40MzY0IDEyLjQ0NTUgMy4wMjE2TDE1LjA1MzkgMC41Mzg0QzEzLjcyMjcgLTAuNjkyOCAxMS45NjYzIC0xLjM4IDEwLjAwNDggLTEuMzhDNi4xODE1NCAtMS4zOCAyLjcyMjcxIDEuNDQgMC43NzAxOTQgNS4zMTY4VjEzLjEwNEwzLjUxMzUgMTEuMDIyNEw0LjUwOTUgMTAuMjg4OFoiIGZpbGw9IiNGQkJDMDQiLz4KPC9zdmc+" alt="Google" className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Google로 로그인</span>
                </button>
                
                <button
                  onClick={() => handleSocialLogin('kakao')}
                  disabled={isSubmitting || loading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-medium">카카오로 로그인</span>
                </button>
                
                <button
                  onClick={() => handleSocialLogin('naver')}
                  disabled={isSubmitting || loading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-medium">네이버로 로그인</span>
                </button>
              </div>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">또는</span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  placeholder="이메일을 입력하세요"
                  disabled={isSubmitting || loading}
                  required
                />
              </div>
            </div>

            {/* Password (except for reset tab) */}
            {activeTab !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    placeholder="비밀번호를 입력하세요"
                    disabled={isSubmitting || loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isSubmitting || loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Registration fields */}
            {activeTab === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      placeholder="비밀번호를 다시 입력하세요"
                      disabled={isSubmitting || loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={isSubmitting || loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    이름
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      placeholder="실명을 입력하세요"
                      disabled={isSubmitting || loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    사용자명
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      placeholder="사용자명을 입력하세요"
                      disabled={isSubmitting || loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    거주 지역
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    disabled={isSubmitting || loading}
                    required
                  >
                    {regions.map(region => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {(isSubmitting || loading) ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {activeTab === 'login' && '로그인'}
                  {activeTab === 'register' && '회원가입'}
                  {activeTab === 'reset' && '재설정 링크 발송'}
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            {activeTab === 'login' && (
              <button
                onClick={() => setActiveTab('reset')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                disabled={isSubmitting || loading}
              >
                비밀번호를 잊으셨나요?
              </button>
            )}
            {activeTab === 'reset' && (
              <button
                onClick={() => setActiveTab('login')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                disabled={isSubmitting || loading}
              >
                로그인으로 돌아가기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;