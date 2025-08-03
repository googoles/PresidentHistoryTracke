// Notification Preferences Component for Korea Promise Tracker
// Phase 4 Implementation - User notification settings and preferences

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Bell, Mail, Smartphone, Clock, Volume, VolumeOff } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../hooks/useAuth';
import { showSuccessNotification, showErrorNotification } from '../NotificationSystem';
import { notificationService } from '../../services/notificationService';

const NOTIFICATION_TYPES = {
  PROMISE_UPDATE: 'promise_update',
  NEW_COMMENT: 'new_comment',
  NEW_RATING: 'new_rating',
  NEW_REPORT: 'new_report',
  REPORT_VERIFIED: 'report_verified',
  WEEKLY_DIGEST: 'weekly_digest',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.PROMISE_UPDATE]: '공약 업데이트',
  [NOTIFICATION_TYPES.NEW_COMMENT]: '새 댓글',
  [NOTIFICATION_TYPES.NEW_RATING]: '새 평가',
  [NOTIFICATION_TYPES.NEW_REPORT]: '새 시민 보고서',
  [NOTIFICATION_TYPES.REPORT_VERIFIED]: '보고서 검증',
  [NOTIFICATION_TYPES.WEEKLY_DIGEST]: '주간 요약',
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: '시스템 공지'
};

const DIGEST_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  NEVER: 'never'
};

const DIGEST_FREQUENCY_LABELS = {
  [DIGEST_FREQUENCIES.DAILY]: '매일',
  [DIGEST_FREQUENCIES.WEEKLY]: '주간',
  [DIGEST_FREQUENCIES.MONTHLY]: '월간',
  [DIGEST_FREQUENCIES.NEVER]: '받지 않음'
};

const NotificationPreferences = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [browserNotificationEnabled, setBrowserNotificationEnabled] = useState(false);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      // Use loaded preferences or defaults
      const userPreferences = data || notificationService.getDefaultNotificationPreferences();
      setPreferences({
        user_id: user.id,
        ...userPreferences
      });
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      setPreferences({
        user_id: user.id,
        ...notificationService.getDefaultNotificationPreferences()
      });
      showErrorNotification('알림 설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Save preferences
  const savePreferences = useCallback(async () => {
    if (!user?.id || !preferences) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      showSuccessNotification('알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      showErrorNotification('알림 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [user?.id, preferences]);

  // Update preference value
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Check push notification support
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }

    // Check if browser notifications are enabled
    setBrowserNotificationEnabled(Notification.permission === 'granted');
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      showErrorNotification('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      setBrowserNotificationEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        showSuccessNotification('브라우저 알림이 활성화되었습니다.');
        
        // Update preferences to enable push notifications
        updatePreference('push_enabled', true);
      } else {
        showErrorNotification('알림 권한이 거부되었습니다.');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      showErrorNotification('알림 권한 요청에 실패했습니다.');
    }
  }, [updatePreference]);

  // Test notification
  const testNotification = useCallback(async () => {
    try {
      await notificationService.sendNotification({
        userId: user.id,
        type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
        title: '테스트 알림',
        message: '알림 설정이 올바르게 작동합니다!',
        data: {},
        deliveryMethods: ['in_app']
      });
      
      showSuccessNotification('테스트 알림이 전송되었습니다.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      showErrorNotification('테스트 알림 전송에 실패했습니다.');
    }
  }, [user?.id]);

  // Load preferences on mount
  useEffect(() => {
    if (isOpen && user?.id) {
      loadPreferences();
    }
  }, [isOpen, user?.id, loadPreferences]);

  if (!isOpen || !preferences) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-xl font-semibold">알림 설정</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-slate-400">설정을 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Global notification settings */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                전체 알림 설정
              </h3>
              
              <div className="space-y-4">
                {/* Email notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        이메일 알림
                      </label>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        이메일로 알림을 받습니다
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.email_enabled}
                      onChange={(e) => updatePreference('email_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Push notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        푸시 알림
                      </label>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        브라우저 푸시 알림을 받습니다
                        {!pushSupported && ' (지원되지 않음)'}
                        {pushPermission === 'denied' && ' (권한 없음)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pushPermission !== 'granted' && (
                      <button
                        onClick={requestNotificationPermission}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        권한 요청
                      </button>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.push_enabled && browserNotificationEnabled}
                        onChange={(e) => updatePreference('push_enabled', e.target.checked)}
                        disabled={!browserNotificationEnabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                    </label>
                  </div>
                </div>

                {/* In-app notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-purple-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        앱 내 알림
                      </label>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        앱 내에서 알림을 표시합니다
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.in_app_enabled}
                      onChange={(e) => updatePreference('in_app_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Notification type settings */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                알림 유형별 설정
              </h3>
              
              <div className="space-y-3">
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, label]) => (
                  <div key={type} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-slate-100">{label}</h4>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {/* Email */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[`email_${type}`] ?? true}
                          onChange={(e) => updatePreference(`email_${type}`, e.target.checked)}
                          disabled={!preferences.email_enabled}
                          className="rounded"
                        />
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700 dark:text-slate-300">이메일</span>
                      </label>
                      
                      {/* Push */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[`push_${type}`] ?? true}
                          onChange={(e) => updatePreference(`push_${type}`, e.target.checked)}
                          disabled={!preferences.push_enabled}
                          className="rounded"
                        />
                        <Smartphone className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700 dark:text-slate-300">푸시</span>
                      </label>
                      
                      {/* In-app */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[`in_app_${type}`] ?? true}
                          onChange={(e) => updatePreference(`in_app_${type}`, e.target.checked)}
                          disabled={!preferences.in_app_enabled}
                          className="rounded"
                        />
                        <Bell className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700 dark:text-slate-300">앱 내</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Digest settings */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                요약 알림 설정
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      요약 알림 주기
                    </label>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      구독한 공약들의 요약 정보를 받을 주기를 설정합니다
                    </p>
                  </div>
                  <select
                    value={preferences.digest_frequency || 'weekly'}
                    onChange={(e) => updatePreference('digest_frequency', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  >
                    {Object.entries(DIGEST_FREQUENCY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Quiet hours */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <VolumeOff className="w-5 h-5" />
                방해 금지 시간
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start || '22:00'}
                    onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end || '08:00'}
                    onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                이 시간 동안에는 푸시 알림을 받지 않습니다. (이메일 알림은 계속 전송됩니다)
              </p>
            </section>

            {/* Test notification */}
            <section>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">알림 테스트</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    현재 설정으로 테스트 알림을 전송합니다
                  </p>
                </div>
                <button
                  onClick={testNotification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  테스트 전송
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPreferences;