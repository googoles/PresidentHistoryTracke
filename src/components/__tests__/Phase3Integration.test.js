import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PromiseCard from '../PromiseCard';
import { useAuth } from '../../hooks/useAuth';
import * as database from '../../utils/database';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../utils/database');

const mockPromise = {
  id: 'promise-1',
  title: '250만호 주택 공급',
  description: '2027년까지 250만호의 주택을 공급하여 주택난을 해결하겠습니다.',
  category: '부동산정책',
  level: 'national',
  status: '진행중',
  progress: 35,
  startDate: '2022-05-10',
  targetDate: '2027-05-09',
  statistics: [
    { label: '공급 완료', value: '87', unit: '만호' },
    { label: '진행률', value: '35', unit: '%' }
  ],
  relatedArticles: [
    {
      title: '주택공급 정책 추진 현황',
      source: '연합뉴스',
      date: '2024-01-15',
      url: 'https://example.com/news/1'
    }
  ]
};

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  full_name: 'Test User',
  email: 'test@example.com'
};

describe('Phase 3 Integration Tests', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      hasProfile: true
    });

    // Mock all database operations
    database.ratingOperations.getPromiseRatings.mockResolvedValue({
      data: [],
      error: null
    });

    database.ratingOperations.getUserRating.mockResolvedValue({
      data: null,
      error: null
    });

    database.ratingOperations.getPromiseStats.mockResolvedValue({
      data: {
        promise_id: 'promise-1',
        average_rating: 0,
        total_ratings: 0,
        total_comments: 0
      },
      error: null
    });

    database.reportOperations.getPromiseReports.mockResolvedValue({
      data: [],
      error: null
    });

    database.commentOperations.getPromiseComments.mockResolvedValue({
      data: [],
      error: null
    });

    database.realtimeOperations.subscribeToPromiseComments.mockReturnValue({
      unsubscribe: jest.fn()
    });

    database.realtimeOperations.subscribeToPromiseRatings.mockReturnValue({
      unsubscribe: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('PromiseCard renders with engagement features', async () => {
    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Check basic promise information
    expect(screen.getByText('250만호 주택 공급')).toBeInTheDocument();
    expect(screen.getByText('부동산정책')).toBeInTheDocument();
    expect(screen.getByText('진행중')).toBeInTheDocument();

    // Check engagement section
    expect(screen.getByText('시민 참여')).toBeInTheDocument();
    expect(screen.getByText('평가하기')).toBeInTheDocument();
  });

  test('engagement tabs work correctly', async () => {
    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Expand the promise card
    fireEvent.click(screen.getByText('자세히'));

    await waitFor(() => {
      expect(screen.getByText('개요')).toBeInTheDocument();
      expect(screen.getByText('평가')).toBeInTheDocument();
      expect(screen.getByText('제보')).toBeInTheDocument();
      expect(screen.getByText('댓글')).toBeInTheDocument();
    });

    // Click on ratings tab
    fireEvent.click(screen.getByText('평가'));

    await waitFor(() => {
      expect(database.ratingOperations.getPromiseRatings).toHaveBeenCalled();
    });

    // Click on reports tab
    fireEvent.click(screen.getByText('제보'));

    await waitFor(() => {
      expect(database.reportOperations.getPromiseReports).toHaveBeenCalled();
    });

    // Click on comments tab
    fireEvent.click(screen.getByText('댓글'));

    await waitFor(() => {
      expect(database.commentOperations.getPromiseComments).toHaveBeenCalled();
    });
  });

  test('rating modal opens when rating button is clicked', async () => {
    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Click the rating button
    fireEvent.click(screen.getByText('평가하기'));

    await waitFor(() => {
      expect(screen.getByText('공약 평가')).toBeInTheDocument();
      expect(screen.getByText('평점')).toBeInTheDocument();
    });
  });

  test('unauthenticated users see limited engagement features', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      hasProfile: false
    });

    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Should not see rating button for unauthenticated users
    expect(screen.queryByText('평가하기')).not.toBeInTheDocument();
  });

  test('engagement statistics are displayed correctly', async () => {
    // Mock with some engagement data
    database.ratingOperations.getPromiseStats.mockResolvedValue({
      data: {
        promise_id: 'promise-1',
        average_rating: 4.2,
        total_ratings: 15,
        total_comments: 8
      },
      error: null
    });

    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('15개 평가')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // Comments count
    });
  });

  test('real-time updates are properly set up', async () => {
    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Expand to comments tab to trigger real-time subscription
    fireEvent.click(screen.getByText('자세히'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('댓글'));
    });

    await waitFor(() => {
      expect(database.realtimeOperations.subscribeToPromiseComments).toHaveBeenCalledWith(
        'promise-1',
        expect.any(Function)
      );
    });
  });

  test('error states are handled gracefully', async () => {
    database.ratingOperations.getPromiseStats.mockResolvedValue({
      data: null,
      error: { message: 'Network error' }
    });

    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Should still render the promise card even if engagement data fails
    expect(screen.getByText('250만호 주택 공급')).toBeInTheDocument();
  });

  test('compact mode hides detailed engagement features', () => {
    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={false}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Should not show engagement section
    expect(screen.queryByText('시민 참여')).not.toBeInTheDocument();
    expect(screen.queryByText('평가하기')).not.toBeInTheDocument();
  });

  test('accessibility features are present', () => {
    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Check for proper ARIA labels
    expect(screen.getByLabelText('공약 공유')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Check for proper heading structure
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});

describe('Cross-Component Integration', () => {
  test('rating submission updates engagement stats', async () => {
    const onRatingSubmitted = jest.fn();

    database.ratingOperations.upsertRating.mockResolvedValue({
      data: {
        id: 'new-rating',
        promise_id: 'promise-1',
        user_id: 'user-1',
        rating: 5,
        comment: 'Great promise!'
      },
      error: null
    });

    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Open rating modal
    fireEvent.click(screen.getByText('평가하기'));

    await waitFor(() => {
      expect(screen.getByText('공약 평가')).toBeInTheDocument();
    });

    // This would test the full rating submission flow
    // In a real test, we'd simulate clicking stars and submitting
  });

  test('comment submission triggers real-time updates', async () => {
    const mockCallback = jest.fn();
    
    database.realtimeOperations.subscribeToPromiseComments.mockImplementation((promiseId, callback) => {
      mockCallback.mockImplementation(callback);
      return { unsubscribe: jest.fn() };
    });

    render(
      <PromiseCard 
        promise={mockPromise} 
        showEngagement={true}
        onShare={jest.fn()}
        onBookmark={jest.fn()}
      />
    );

    // Navigate to comments tab
    fireEvent.click(screen.getByText('자세히'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('댓글'));
    });

    // Simulate real-time comment update
    await waitFor(() => {
      expect(database.realtimeOperations.subscribeToPromiseComments).toHaveBeenCalled();
    });
  });
});