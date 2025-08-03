// Subscription Manager Component for Korea Promise Tracker
// Phase 4 Implementation - Manage user subscriptions to promises and regions

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Plus, X, Settings, Mail, Smartphone, Globe, MapPin, BookOpen } from 'lucide-react';
import { subscriptionOperations } from '../../utils/database';
import { useAuth } from '../../hooks/useAuth';
import { showSuccessNotification, showErrorNotification } from '../NotificationSystem';
import { notificationService } from '../../services/notificationService';

const SUBSCRIPTION_TYPES = {
  PROMISE: 'promise',
  REGION: 'region',
  CATEGORY: 'category'
};

const NOTIFICATION_METHODS = {
  EMAIL: 'email',
  PUSH: 'push',
  BOTH: 'both'
};

const DELIVERY_METHOD_LABELS = {
  [NOTIFICATION_METHODS.EMAIL]: '이메일',
  [NOTIFICATION_METHODS.PUSH]: '푸시 알림',
  [NOTIFICATION_METHODS.BOTH]: '이메일 + 푸시'
};

const SubscriptionManager = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('promises');
  const [showAddModal, setShowAddModal] = useState(false);
  const [availablePromises, setAvailablePromises] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Load user subscriptions
  const loadSubscriptions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await subscriptionOperations.getUserSubscriptions(user.id);
      
      if (error) {
        throw error;
      }

      setSubscriptions(data || []);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      showErrorNotification('구독 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load available promises for subscription
  const loadAvailablePromises = useCallback(async () => {
    try {
      // This would typically come from your promises data
      // For now, we'll use the existing promises from the app
      const response = await fetch('/src/data/promises.json');
      const promisesData = await response.json();
      
      // Filter out already subscribed promises
      const subscribedPromiseIds = subscriptions
        .filter(sub => sub.promise_id)
        .map(sub => sub.promise_id);
      
      const available = promisesData.filter(promise => 
        !subscribedPromiseIds.includes(promise.id) &&
        (searchTerm === '' || 
         promise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         promise.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setAvailablePromises(available);
    } catch (error) {
      console.error('Failed to load available promises:', error);
    }
  }, [subscriptions, searchTerm]);

  // Load available regions
  const loadAvailableRegions = useCallback(async () => {
    try {
      const { regions } = await import('../../data/regions.js');
      
      // Filter out already subscribed regions
      const subscribedRegions = subscriptions
        .filter(sub => sub.region)
        .map(sub => sub.region);
      
      const available = Object.entries(regions).filter(([key, region]) => 
        !subscribedRegions.includes(key) &&
        (searchTerm === '' || 
         region.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setAvailableRegions(available);
    } catch (error) {
      console.error('Failed to load available regions:', error);
    }
  }, [subscriptions, searchTerm]);

  // Subscribe to promise
  const subscribeToPromise = useCallback(async (promiseId, notificationMethod = NOTIFICATION_METHODS.BOTH) => {
    if (!user?.id) return;

    try {
      const { data, error } = await subscriptionOperations.subscribeToPromise(
        user.id, 
        promiseId, 
        notificationMethod
      );
      
      if (error) {
        throw error;
      }

      await loadSubscriptions();
      showSuccessNotification('공약 구독이 완료되었습니다.');
      
      // Send welcome notification for new subscription
      const promise = availablePromises.find(p => p.id === promiseId);
      if (promise) {
        await notificationService.sendNotification({
          userId: user.id,
          type: 'subscription_confirmed',
          title: '구독 확인',
          message: `"${promise.title}" 공약 구독이 완료되었습니다.`,
          data: {
            promiseId,
            promiseTitle: promise.title
          },
          deliveryMethods: [notificationMethod === NOTIFICATION_METHODS.EMAIL ? 'email' : 'in_app']
        });
      }
      
      return data;
    } catch (error) {
      console.error('Failed to subscribe to promise:', error);
      showErrorNotification('공약 구독에 실패했습니다.');
      return null;
    }
  }, [user?.id, loadSubscriptions, availablePromises]);

  // Subscribe to region
  const subscribeToRegion = useCallback(async (region, notificationMethod = NOTIFICATION_METHODS.BOTH) => {
    if (!user?.id) return;

    try {
      const { data, error } = await subscriptionOperations.subscribeToRegion(
        user.id, 
        region, 
        notificationMethod
      );
      
      if (error) {
        throw error;
      }

      await loadSubscriptions();
      showSuccessNotification('지역 구독이 완료되었습니다.');
      return data;
    } catch (error) {
      console.error('Failed to subscribe to region:', error);
      showErrorNotification('지역 구독에 실패했습니다.');
      return null;
    }
  }, [user?.id, loadSubscriptions]);

  // Unsubscribe
  const unsubscribe = useCallback(async (subscriptionId) => {
    if (!user?.id) return;

    try {
      const { error } = await subscriptionOperations.unsubscribe(subscriptionId);
      
      if (error) {
        throw error;
      }

      await loadSubscriptions();
      showSuccessNotification('구독이 해지되었습니다.');
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      showErrorNotification('구독 해지에 실패했습니다.');
    }
  }, [user?.id, loadSubscriptions]);

  // Bulk subscribe to selected items
  const bulkSubscribe = useCallback(async (notificationMethod) => {
    if (!user?.id || selectedItems.size === 0) return;

    try {
      setLoading(true);
      const promises = [];
      
      for (const itemId of selectedItems) {
        if (activeTab === 'promises') {
          promises.push(subscribeToPromise(itemId, notificationMethod));
        } else if (activeTab === 'regions') {
          promises.push(subscribeToRegion(itemId, notificationMethod));
        }
      }
      
      await Promise.all(promises);
      setSelectedItems(new Set());
      setShowAddModal(false);
      showSuccessNotification(`${selectedItems.size}개 항목 구독이 완료되었습니다.`);
    } catch (error) {
      console.error('Failed to bulk subscribe:', error);
      showErrorNotification('일괄 구독에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedItems, activeTab, subscribeToPromise, subscribeToRegion]);

  // Load data on mount and tab changes
  useEffect(() => {
    if (isOpen) {
      loadSubscriptions();
    }
  }, [isOpen, loadSubscriptions]);

  useEffect(() => {
    if (showAddModal) {
      if (activeTab === 'promises') {
        loadAvailablePromises();
      } else if (activeTab === 'regions') {
        loadAvailableRegions();
      }
    }
  }, [showAddModal, activeTab, loadAvailablePromises, loadAvailableRegions]);

  // Filter subscriptions by tab
  const filteredSubscriptions = subscriptions.filter(sub => {
    switch (activeTab) {
      case 'promises':
        return sub.promise_id;
      case 'regions':
        return sub.region;
      default:
        return true;
    }
  });

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Get subscription type icon
  const getSubscriptionIcon = (subscription) => {
    if (subscription.promise_id) return <BookOpen className="w-4 h-4" />;
    if (subscription.region) return <MapPin className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  // Get notification method icon
  const getNotificationMethodIcon = (method) => {
    switch (method) {
      case NOTIFICATION_METHODS.EMAIL:
        return <Mail className="w-4 h-4" />;
      case NOTIFICATION_METHODS.PUSH:
        return <Smartphone className="w-4 h-4" />;
      case NOTIFICATION_METHODS.BOTH:
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6" />
            <h2 className="text-xl font-semibold">구독 관리</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
          <button
            onClick={() => setActiveTab('promises')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'promises'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-slate-800'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            공약 구독
          </button>
          <button
            onClick={() => setActiveTab('regions')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'regions'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-slate-800'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            지역 구독
          </button>
        </div>

        {/* Add subscription button */}
        <div className="p-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 구독 추가
          </button>
        </div>

        {/* Subscriptions list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-slate-400">구독 정보를 불러오는 중...</p>
              </div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-slate-400 mb-2">
                {activeTab === 'promises' ? '구독한 공약이 없습니다' : '구독한 지역이 없습니다'}
              </p>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                새 구독을 추가하여 업데이트를 받아보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getSubscriptionIcon(subscription)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-slate-100 truncate">
                        {subscription.promise_title || subscription.region_name || subscription.promise_id || subscription.region}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getNotificationMethodIcon(subscription.notification_type)}
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          {DELIVERY_METHOD_LABELS[subscription.notification_type]}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          subscription.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {subscription.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => unsubscribe(subscription.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="구독 해지"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add subscription modal */}
        {showAddModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {activeTab === 'promises' ? '공약 구독 추가' : '지역 구독 추가'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder={activeTab === 'promises' ? '공약 검색...' : '지역 검색...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  />
                </div>

                {/* Items list */}
                <div className="max-h-60 overflow-y-auto mb-4">
                  {activeTab === 'promises' ? (
                    availablePromises.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-slate-400 py-4">
                        구독 가능한 공약이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {availablePromises.map((promise) => (
                          <label
                            key={promise.id}
                            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedItems.has(promise.id)}
                              onChange={() => toggleItemSelection(promise.id)}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-slate-100 truncate">
                                {promise.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-slate-400">
                                {promise.category} • {promise.level}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )
                  ) : (
                    availableRegions.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-slate-400 py-4">
                        구독 가능한 지역이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {availableRegions.map(([key, region]) => (
                          <label
                            key={key}
                            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedItems.has(key)}
                              onChange={() => toggleItemSelection(key)}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-slate-100">
                                {region.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-slate-400">
                                {region.type}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )
                  )}
                </div>

                {/* Notification method selection */}
                {selectedItems.size > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      알림 방법 선택
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(DELIVERY_METHOD_LABELS).map(([method, label]) => (
                        <button
                          key={method}
                          onClick={() => bulkSubscribe(method)}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 p-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {getNotificationMethodIcon(method)}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItems.size > 0 && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
                    {selectedItems.size}개 항목이 선택됨
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;