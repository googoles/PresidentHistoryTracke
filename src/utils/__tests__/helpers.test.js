import {
  getStatusColor,
  calculateAchievementRate,
  filterPromises,
  formatNumber,
  debounce,
  calculateEngagementScore,
  validatePromiseData
} from '../helpers';

// Mock data for testing
const mockPromises = [
  {
    id: 'test-001',
    title: 'Test Promise 1',
    description: 'Test description',
    category: 'Housing',
    level: 'national',
    status: 'Achieved',
    progress: 100,
    startDate: '2022-01-01',
    targetDate: '2025-01-01',
    relatedArticles: [{ title: 'Test Article', url: 'http://test.com', date: '2024-01-01' }],
    statistics: [{ label: 'Test Stat', value: '100', unit: '%' }]
  },
  {
    id: 'test-002',
    title: 'Test Promise 2',
    description: 'Test description 2',
    category: 'Welfare',
    level: 'local',
    status: 'In Progress',
    progress: 60,
    startDate: '2022-06-01',
    targetDate: '2025-06-01',
    relatedArticles: [],
    statistics: []
  }
];

describe('Utility Functions', () => {
  describe('getStatusColor', () => {
    test('returns correct color for achieved status', () => {
      expect(getStatusColor('달성')).toBe('text-green-600 bg-green-100');
    });

    test('returns default color for invalid status', () => {
      expect(getStatusColor('invalid')).toBe('text-gray-600 bg-gray-100');
      expect(getStatusColor(null)).toBe('text-gray-600 bg-gray-100');
      expect(getStatusColor(undefined)).toBe('text-gray-600 bg-gray-100');
    });
  });

  describe('calculateAchievementRate', () => {
    test('calculates correct achievement rate with mixed statuses', () => {
      const promises = [
        { status: '달성' },
        { status: '진행중' },
        { status: '부분달성' }
      ];
      // 1 achieved + 0.5 partial = 1.5/3 = 50%
      expect(calculateAchievementRate(promises)).toBe(50);
    });

    test('handles empty array', () => {
      expect(calculateAchievementRate([])).toBe(0);
    });

    test('handles null/undefined input', () => {
      expect(calculateAchievementRate(null)).toBe(0);
      expect(calculateAchievementRate(undefined)).toBe(0);
    });
  });

  describe('filterPromises', () => {
    test('filters by status', () => {
      const filters = { level: 'all', category: 'all', status: 'Achieved', searchTerm: '' };
      const result = filterPromises(mockPromises, filters);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Achieved');
    });

    test('filters by category', () => {
      const filters = { level: 'all', category: 'Housing', status: 'all', searchTerm: '' };
      const result = filterPromises(mockPromises, filters);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Housing');
    });

    test('filters by search term', () => {
      const filters = { level: 'all', category: 'all', status: 'all', searchTerm: 'Test Promise 1' };
      const result = filterPromises(mockPromises, filters);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Promise 1');
    });
  });

  describe('formatNumber', () => {
    test('formats numbers with locale', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('debounce', () => {
    test('debounces function calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
  });

  describe('calculateEngagementScore', () => {
    test('calculates engagement score correctly', () => {
      const score = calculateEngagementScore(mockPromises[0]);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('handles promise without optional fields', () => {
      const minimalPromise = {
        status: 'In Progress',
        progress: 50
      };
      const score = calculateEngagementScore(minimalPromise);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('validatePromiseData', () => {
    test('validates correct promise data', () => {
      const validPromise = {
        id: 'test-123',
        title: 'Test Promise',
        category: 'Test Category',
        level: 'national',
        progress: 50,
        status: '진행중'
      };
      const result = validatePromiseData(validPromise);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('identifies missing required fields', () => {
      const invalidPromise = {
        progress: 50,
        status: '진행중'
      };
      const result = validatePromiseData(invalidPromise);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('ID is required');
      expect(result.errors).toContain('Title is required');
    });

    test('validates progress range', () => {
      const invalidPromise = {
        id: 'test',
        title: 'Test',
        category: 'Test',
        level: 'national',
        progress: 150, // Invalid: > 100
        status: '진행중'
      };
      const result = validatePromiseData(invalidPromise);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Progress must be a number between 0 and 100');
    });
  });
});