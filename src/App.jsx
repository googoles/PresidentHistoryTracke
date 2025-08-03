import React, { useState, useMemo, useEffect } from 'react';
import StaticMapSelector from './components/StaticMapSelector';
import PromiseCard from './components/PromiseCard';
import FilterPanel from './components/FilterPanel';
import StatsOverview from './components/StatsOverview';
import OfficialsList from './components/OfficialsList';
import OfficialDetail from './components/OfficialDetail';
import DarkModeToggle from './components/DarkModeToggle';
import NotificationSystem, { showShareNotification, showBookmarkNotification } from './components/NotificationSystem';
import NotificationCenter from './components/notifications/NotificationCenter';
import SubscriptionManager from './components/notifications/SubscriptionManager';
import NotificationPreferences from './components/notifications/NotificationPreferences';
import AuthButton from './components/auth/AuthButton';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import InstallPrompt from './components/pwa/InstallPrompt';
import UpdatePrompt from './components/pwa/UpdatePrompt';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import useRealtime from './hooks/useRealtime';
import { testSupabaseConnection } from './utils/supabase';
import { connectionUtils, notificationHelpers } from './utils/database';
import { notificationService } from './services/notificationService';
import offlineService from './services/offlineService';
import { promises } from './data/promises';
import { regions } from './data/regions';
import officialsData from './data/officials.json';
import { filterPromises, getPromisesByRegion, sortPromisesByStatus } from './utils/helpers';
import { usePromiseActions } from './hooks/usePromiseActions';
import { Building2, Map, Users, AlertTriangle, Bell, Settings, Wifi, WifiOff, BarChart3, Download } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState('seoul');
  const [supabaseStatus, setSupabaseStatus] = useState({ connected: null, error: null });
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mainView, setMainView] = useState('regions'); // 'regions' or 'officials'
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current'); // 'current' or 'historical'
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Notification states
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // PWA states
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  
  // Real-time hooks
  const realtime = useRealtime();
  
  // Listen for service worker updates
  useEffect(() => {
    const handleSwUpdate = (event) => {
      setServiceWorkerRegistration(event.detail);
      setShowUpdatePrompt(true);
    };
    
    window.addEventListener('sw-update', handleSwUpdate);
    
    return () => {
      window.removeEventListener('sw-update', handleSwUpdate);
    };
  }, []);

  // Test Supabase connection and initialize real-time features
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testSupabaseConnection();
        setSupabaseStatus({ 
          connected: result.success, 
          error: result.success ? null : result.error 
        });
        
        if (result.success) {
          // Initialize notification service
          await notificationService.initialize();
          
          // Monitor connection status
          const cleanup = connectionUtils.monitorConnection((status) => {
            setConnectionStatus(status);
          });
          
          return cleanup;
        }
      } catch (error) {
        setSupabaseStatus({ 
          connected: false, 
          error: 'Connection test failed' 
        });
        setConnectionStatus('error');
      }
    };
    
    checkConnection();
  }, []);

  // Initialize PWA features
  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      setConnectionStatus('connected');
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setConnectionStatus('error');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for pending offline actions
    const checkPendingActions = async () => {
      const count = await offlineService.getPendingCount();
      setPendingOfflineCount(count);
    };
    
    checkPendingActions();
    
    // Cache promises data for offline access
    const cachePromisesData = async () => {
      const allPromisesData = [];
      Object.entries(promises).forEach(([region, regionPromises]) => {
        if (Array.isArray(regionPromises)) {
          regionPromises.forEach(promise => {
            allPromisesData.push({ ...promise, region });
          });
        }
      });
      await offlineService.cachePromises(allPromisesData);
    };
    
    cachePromisesData();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load unread notification count for authenticated users
  useEffect(() => {
    if (user?.id) {
      const loadUnreadCount = async () => {
        try {
          const count = await notificationHelpers.getUnreadCount(user.id);
          setUnreadNotificationCount(count);
        } catch (error) {
          console.error('Failed to load unread notification count:', error);
        }
      };
      
      loadUnreadCount();
      
      // Set up real-time subscription for new notifications
      const unsubscribe = realtime.subscribe(
        `user-notifications-${user.id}`,
        () => realtime.subscribeToUserNotifications?.(user.id, (payload) => {
          if (payload.eventType === 'INSERT') {
            setUnreadNotificationCount(prev => prev + 1);
          }
        })
      );
      
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id, realtime]);

  const regionPromises = useMemo(() => {
    if (selectedPeriod === 'historical' && selectedRegion === 'gyeonggi') {
      return promises.gyeonggi_historical || [];
    }
    return getPromisesByRegion(promises, selectedRegion);
  }, [selectedRegion, selectedPeriod]);

  const filteredPromises = useMemo(() => {
    const filters = {
      level: selectedLevel,
      category: selectedCategory,
      status: selectedStatus,
      searchTerm: searchTerm
    };
    const filtered = filterPromises(regionPromises, filters);
    return sortPromisesByStatus(filtered);
  }, [regionPromises, selectedLevel, selectedCategory, selectedStatus, searchTerm]);

  const currentRegion = regions[selectedRegion];
  
  // Use the promise actions hook for sharing and bookmarking
  const { toggleBookmark, isBookmarked, sharePromise } = usePromiseActions();
  
  // Handle promise sharing
  const handlePromiseShare = async (promise) => {
    try {
      const result = await sharePromise(promise);
      if (result.success) {
        showShareNotification(result.method);
      }
    } catch (error) {
      console.error('Failed to share promise:', error);
    }
  };
  
  // Handle promise bookmarking
  const handlePromiseBookmark = (promise) => {
    const wasBookmarked = isBookmarked(promise.id);
    toggleBookmark(promise);
    showBookmarkNotification(!wasBookmarked, promise.title);
  };
  
  const getCurrentOfficialInfo = () => {
    if (selectedRegion === 'gyeonggi' && selectedPeriod === 'historical') {
      return {
        leader: '이재명',
        party: '더불어민주당',
        term: '2018.07.01 ~ 2022.06.30'
      };
    }
    return currentRegion;
  };

  const allPromises = useMemo(() => {
    const promisesList = [];
    Object.entries(promises).forEach(([region, regionPromises]) => {
      regionPromises.forEach(promise => {
        promisesList.push(promise);
      });
    });
    return promisesList;
  }, []);

  const handleSelectOfficial = (official) => {
    setSelectedOfficial(official);
  };

  const handleBackToList = () => {
    setSelectedOfficial(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">대한민국 공약 추적 시스템</h1>
                  <p className="text-sm text-gray-600 dark:text-slate-300">대통령 및 지자체장 공약 이행 현황</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Connection status indicator */}
                <div className="flex items-center gap-2">
                  {connectionStatus === 'connected' ? (
                    <Wifi className="w-4 h-4 text-green-500" title="실시간 연결됨" />
                  ) : connectionStatus === 'connecting' ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" title="연결 중..." />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" title="연결 끊김" />
                  )}
                  {pendingOfflineCount > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium" title="오프라인 대기 중인 작업">
                      ({pendingOfflineCount}개 대기중)
                    </span>
                  )}
                </div>
                
                {/* Notification center button - only show if user is authenticated */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowNotificationCenter(true)}
                      className="relative p-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="알림 센터"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Subscription manager button - only show if user is authenticated */}
                {user && (
                  <button
                    onClick={() => setShowSubscriptionManager(true)}
                    className="p-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="구독 관리"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
                
                <AuthButton />
                <DarkModeToggle />
              </div>
            </div>
          </div>
          {/* Supabase Connection Status */}
          {supabaseStatus.connected === false && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 py-2">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="text-yellow-800 dark:text-yellow-200">
                    데이터베이스 연결 실패: {supabaseStatus.error} (일부 기능이 제한될 수 있습니다)
                  </span>
                </div>
              </div>
            </div>
          )}
        </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main View Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-1 flex gap-1">
            <button
              onClick={() => {
                setMainView('regions');
                setSelectedOfficial(null);
                setShowAnalytics(false);
              }}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                mainView === 'regions' && !showAnalytics
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Map className="w-4 h-4 mr-2 flex-shrink-0" />
              지역별 공약
            </button>
            <button
              onClick={() => {
                setMainView('officials');
                setShowAnalytics(false);
              }}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                mainView === 'officials' && !showAnalytics
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              인물별 공약
            </button>
            <button
              onClick={() => {
                setShowAnalytics(true);
                setSelectedOfficial(null);
              }}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                showAnalytics
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2 flex-shrink-0" />
              분석 대시보드
            </button>
          </div>
        </div>

        {showAnalytics ? (
          <AnalyticsDashboard />
        ) : mainView === 'officials' ? (
          selectedOfficial ? (
            <OfficialDetail 
              official={selectedOfficial}
              promises={allPromises}
              onBack={handleBackToList}
            />
          ) : (
            <OfficialsList 
              officials={officialsData.officials}
              onSelectOfficial={handleSelectOfficial}
            />
          )
        ) : (
          <>
            {/* Region Selector */}
            <StaticMapSelector 
              selectedRegion={selectedRegion} 
              onRegionSelect={setSelectedRegion} 
            />

            {/* Historical Period Selector */}
            {selectedRegion === 'gyeonggi' && (
              <div className="mb-6 flex justify-center">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-1 flex gap-1">
                  <button
                    onClick={() => setSelectedPeriod('current')}
                    className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                      selectedPeriod === 'current'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    현재 (김동연)
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('historical')}
                    className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                      selectedPeriod === 'historical'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    이전 (이재명)
                  </button>
                </div>
              </div>
            )}

        {currentRegion && (
          <div className="mb-6 bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-600 rounded-lg p-4">
            <h2 className="text-xl font-bold text-blue-900 dark:text-slate-100 mb-2">
              {currentRegion.name} 공약 현황
              {selectedRegion === 'gyeonggi' && selectedPeriod === 'historical' && (
                <span className="text-sm font-normal text-blue-700 dark:text-blue-300 ml-2">(이재명 시기)</span>
              )}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">단체장:</span>{' '}
                <span className="text-gray-900 dark:text-white">{getCurrentOfficialInfo().leader}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">소속정당:</span>{' '}
                <span className={getCurrentOfficialInfo().party === '국민의힘' ? 'text-red-600' : 'text-blue-600'}>
                  {getCurrentOfficialInfo().party}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">임기:</span>{' '}
                <span className="text-gray-900 dark:text-white">{getCurrentOfficialInfo().term}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">인구:</span>{' '}
                <span className="text-gray-900 dark:text-white">{currentRegion.population}명</span>
              </div>
            </div>
          </div>
        )}

        <StatsOverview promises={filteredPromises} />

        <FilterPanel
          selectedLevel={selectedLevel}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          searchTerm={searchTerm}
          onLevelChange={setSelectedLevel}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onSearchChange={setSearchTerm}
        />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            공약 목록 ({filteredPromises.length}개)
          </h3>
        </div>

        {filteredPromises.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              검색 조건에 맞는 공약이 없습니다.
            </p>
            <button
              onClick={() => {
                setSelectedLevel('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPromises.map((promise) => (
              <PromiseCard 
                key={promise.id} 
                promise={promise}
                onShare={handlePromiseShare}
                onBookmark={handlePromiseBookmark}
                isBookmarked={isBookmarked(promise.id)}
              />
            ))}
          </div>
        )}
          </>
        )}
      </main>

      <footer className="bg-gray-800 dark:bg-slate-950 text-white py-8 mt-16 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-400 dark:text-slate-400">
              © 2024 대한민국 공약 추적 시스템. 모든 데이터는 공개된 정보를 기반으로 합니다.
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
              본 시스템은 시민들의 알권리 증진을 위해 제작되었습니다.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Notification System */}
      <NotificationSystem />
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        onOpenPreferences={() => {
          setShowNotificationCenter(false);
          setShowNotificationPreferences(true);
        }}
      />
      
      {/* Subscription Manager */}
      <SubscriptionManager 
        isOpen={showSubscriptionManager}
        onClose={() => setShowSubscriptionManager(false)}
      />
      
      {/* Notification Preferences */}
      <NotificationPreferences 
        isOpen={showNotificationPreferences}
        onClose={() => setShowNotificationPreferences(false)}
      />
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
      
      {/* PWA Update Prompt */}
      {showUpdatePrompt && serviceWorkerRegistration && (
        <UpdatePrompt 
          onUpdate={() => {
            if (serviceWorkerRegistration.waiting) {
              serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
              serviceWorkerRegistration.waiting.addEventListener('statechange', e => {
                if (e.target.state === 'activated') {
                  window.location.reload();
                }
              });
            }
            setShowUpdatePrompt(false);
          }}
          onDismiss={() => setShowUpdatePrompt(false)}
        />
      )}
      
      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-40">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">오프라인 모드 - 일부 기능이 제한됩니다</span>
        </div>
      )}
    </div>
  );
}

// Main App component with AuthProvider
function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      import('./utils/serviceWorkerRegistration').then(({ register }) => {
        register({
          onUpdate: (registration) => {
            // Store registration for later use
            window.swRegistration = registration;
            // Show update prompt
            const event = new CustomEvent('sw-update', { detail: registration });
            window.dispatchEvent(event);
          },
          onSuccess: (registration) => {
            console.log('Service Worker registered successfully:', registration);
          }
        });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;