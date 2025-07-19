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