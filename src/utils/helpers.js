import { regions } from '../data/regions';

export const getStatusColor = (status) => {
  const colors = {
    '달성': 'text-green-600 bg-green-100',
    '진행중': 'text-blue-600 bg-blue-100', 
    '부분달성': 'text-yellow-600 bg-yellow-100',
    '미달성': 'text-red-600 bg-red-100',
    '중단': 'text-gray-600 bg-gray-100'
  };
  return colors[status] || colors['중단'];
};

export const calculateAchievementRate = (promises) => {
  if (!promises || promises.length === 0) return 0;
  
  const achieved = promises.filter(p => p.status === '달성').length;
  const partiallyAchieved = promises.filter(p => p.status === '부분달성').length;
  
  const totalScore = achieved + (partiallyAchieved * 0.5);
  return Math.round((totalScore / promises.length) * 100);
};

export const filterPromises = (promises, filters) => {
  return promises.filter(promise => {
    const matchesLevel = filters.level === 'all' || promise.level === filters.level;
    const matchesCategory = filters.category === 'all' || promise.category === filters.category;
    const matchesStatus = filters.status === 'all' || promise.status === filters.status;
    const matchesSearch = filters.searchTerm === '' || 
      promise.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      promise.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesLevel && matchesCategory && matchesStatus && matchesSearch;
  });
};

export const getPromisesByRegion = (promises, selectedRegion) => {
  const allPromises = [];
  
  if (selectedRegion === 'national' || promises.national) {
    const nationalPromises = promises.national || [];
    const applicableNationalPromises = nationalPromises.filter(promise => 
      !promise.applicableRegions || 
      promise.applicableRegions.includes('all') ||
      promise.applicableRegions.includes(selectedRegion)
    );
    allPromises.push(...applicableNationalPromises);
  }
  
  if (selectedRegion !== 'national' && promises[selectedRegion]) {
    allPromises.push(...promises[selectedRegion]);
  }
  
  return allPromises;
};

export const sortPromisesByStatus = (promises) => {
  const statusOrder = {
    '진행중': 1,
    '달성': 2,
    '부분달성': 3,
    '미달성': 4,
    '중단': 5
  };
  
  return [...promises].sort((a, b) => {
    return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
  });
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

export const getDaysRemaining = (targetDate) => {
  const target = new Date(targetDate);
  const today = new Date();
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '기한 만료';
  if (diffDays === 0) return '오늘 마감';
  if (diffDays <= 30) return `${diffDays}일 남음`;
  if (diffDays <= 365) return `${Math.floor(diffDays / 30)}개월 남음`;
  return `${Math.floor(diffDays / 365)}년 남음`;
};

// Performance optimization utilities
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Analytics and engagement utilities
export const calculateEngagementScore = (promise) => {
  let score = 0;
  
  // Progress weight (40%)
  score += promise.progress * 0.4;
  
  // Status weight (30%)
  const statusScores = {
    '달성': 100,
    '진행중': 70,
    '부분달성': 50,
    '미달성': 20,
    '중단': 0
  };
  score += (statusScores[promise.status] || 0) * 0.3;
  
  // Article count weight (20%)
  const articleCount = promise.relatedArticles?.length || 0;
  score += Math.min(articleCount * 10, 100) * 0.2;
  
  // Statistics availability weight (10%)
  const hasStats = promise.statistics?.length > 0;
  score += (hasStats ? 100 : 0) * 0.1;
  
  return Math.round(score);
};

export const getPromiseCategories = (promises) => {
  const categories = new Set();
  promises.forEach(promise => categories.add(promise.category));
  return Array.from(categories).sort();
};

export const getPromiseStatistics = (promises) => {
  const stats = {
    total: promises.length,
    byStatus: {},
    byCategory: {},
    byLevel: { national: 0, local: 0 },
    averageProgress: 0,
    engagementScore: 0
  };
  
  let totalProgress = 0;
  let totalEngagement = 0;
  
  promises.forEach(promise => {
    // Status stats
    stats.byStatus[promise.status] = (stats.byStatus[promise.status] || 0) + 1;
    
    // Category stats
    stats.byCategory[promise.category] = (stats.byCategory[promise.category] || 0) + 1;
    
    // Level stats
    stats.byLevel[promise.level] = (stats.byLevel[promise.level] || 0) + 1;
    
    // Progress accumulation
    totalProgress += promise.progress || 0;
    
    // Engagement accumulation
    totalEngagement += calculateEngagementScore(promise);
  });
  
  stats.averageProgress = promises.length > 0 ? Math.round(totalProgress / promises.length) : 0;
  stats.engagementScore = promises.length > 0 ? Math.round(totalEngagement / promises.length) : 0;
  
  return stats;
};

// SEO and sharing utilities
export const generatePromiseShareText = (promise) => {
  const progress = `진행률 ${promise.progress}%`;
  const status = promise.status;
  const category = promise.category;
  
  return `🏛️ ${promise.title}\n\n📊 ${progress} (${status})\n🏷️ ${category}\n\n대한민국 공약 추적 시스템에서 더 자세히 확인하세요!`;
};

export const generateSEOData = (promise, region) => {
  return {
    title: `${promise.title} - ${region ? regions[region]?.name : '대한민국'} 공약 추적`,
    description: `${promise.description} (진행률: ${promise.progress}%, 상태: ${promise.status})`,
    keywords: [promise.category, promise.status, promise.level, region, '공약', '추적', '정치'].filter(Boolean),
    ogImage: `/api/og-image?title=${encodeURIComponent(promise.title)}&progress=${promise.progress}&status=${promise.status}`
  };
};

// Accessibility utilities
export const getAriaLabel = (promise) => {
  return `${promise.title}, ${promise.category} 분야, ${promise.level === 'national' ? '대통령' : '지자체'} 공약, 현재 진행률 ${promise.progress}%, 상태 ${promise.status}`;
};

export const getStatusDescription = (status) => {
  const descriptions = {
    '달성': '목표를 완전히 달성한 공약입니다.',
    '진행중': '현재 이행이 진행되고 있는 공약입니다.',
    '부분달성': '목표의 일부를 달성한 공약입니다.',
    '미달성': '아직 목표 달성이 미흡한 공약입니다.',
    '중단': '이행이 중단된 공약입니다.'
  };
  return descriptions[status] || '상태 미확인 공약입니다.';
};

// Data validation utilities
export const validatePromiseData = (promise) => {
  const errors = [];
  
  if (!promise.id) errors.push('ID is required');
  if (!promise.title) errors.push('Title is required');
  if (!promise.category) errors.push('Category is required');
  if (!promise.level) errors.push('Level is required');
  if (typeof promise.progress !== 'number' || promise.progress < 0 || promise.progress > 100) {
    errors.push('Progress must be a number between 0 and 100');
  }
  if (!['달성', '진행중', '부분달성', '미달성', '중단'].includes(promise.status)) {
    errors.push('Invalid status value');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export all utilities for easy access
export const PromiseUtils = {
  getStatusColor,
  calculateAchievementRate,
  filterPromises,
  getPromisesByRegion,
  sortPromisesByStatus,
  formatNumber,
  getDaysRemaining,
  debounce,
  throttle,
  calculateEngagementScore,
  getPromiseCategories,
  getPromiseStatistics,
  generatePromiseShareText,
  generateSEOData,
  getAriaLabel,
  getStatusDescription,
  validatePromiseData
};

export default PromiseUtils;