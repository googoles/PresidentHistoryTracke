import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RatingCard from '../RatingCard';
import { useAuth } from '../../../hooks/useAuth';
import * as database from '../../../utils/database';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../utils/database');

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  full_name: 'Test User'
};

const mockRatings = [
  {
    id: 'rating-1',
    promise_id: 'promise-1',
    user_id: 'user-2',
    rating: 5,
    comment: 'Excellent promise implementation',
    helpful_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      id: 'user-2',
      username: 'reviewer',
      full_name: 'Promise Reviewer',
      avatar_url: null
    }
  },
  {
    id: 'rating-2',
    promise_id: 'promise-1',
    user_id: 'user-3',
    rating: 4,
    comment: 'Good progress so far',
    helpful_count: 1,
    created_at: '2024-01-02T00:00:00Z',
    profile: {
      id: 'user-3',
      username: 'citizen',
      full_name: 'Concerned Citizen',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  }
];

const mockStats = {
  promise_id: 'promise-1',
  average_rating: 4.5,
  total_ratings: 10,
  total_comments: 8
};

describe('RatingCard', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    });

    database.ratingOperations.getPromiseRatings.mockResolvedValue({
      data: mockRatings,
      error: null
    });

    database.ratingOperations.getUserRating.mockResolvedValue({
      data: null,
      error: null
    });

    database.ratingOperations.getPromiseStats.mockResolvedValue({
      data: mockStats,
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders rating summary correctly', async () => {
    render(<RatingCard promiseId="promise-1" />);

    await waitFor(() => {
      expect(screen.getByText('시민 평가')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('(10개의 평가)')).toBeInTheDocument();
    });
  });

  test('displays ratings list', async () => {
    render(<RatingCard promiseId="promise-1" />);

    await waitFor(() => {
      expect(screen.getByText('Excellent promise implementation')).toBeInTheDocument();
      expect(screen.getByText('Good progress so far')).toBeInTheDocument();
      expect(screen.getByText('Promise Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Concerned Citizen')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    render(<RatingCard promiseId="promise-1" />);
    
    expect(screen.getByTestId('loading-spinner') || screen.getByText(/로딩/)).toBeInTheDocument();
  });

  test('handles error state', async () => {
    database.ratingOperations.getPromiseRatings.mockResolvedValue({
      data: null,
      error: { message: 'Failed to load ratings' }
    });

    render(<RatingCard promiseId="promise-1" />);

    await waitFor(() => {
      expect(screen.getByText('평가를 불러오는 중 오류가 발생했습니다')).toBeInTheDocument();
    });
  });

  test('shows empty state when no ratings', async () => {
    database.ratingOperations.getPromiseRatings.mockResolvedValue({
      data: [],
      error: null
    });

    database.ratingOperations.getPromiseStats.mockResolvedValue({
      data: { ...mockStats, total_ratings: 0, average_rating: 0 },
      error: null
    });

    render(<RatingCard promiseId="promise-1" />);

    await waitFor(() => {
      expect(screen.getByText('아직 평가가 없습니다')).toBeInTheDocument();
    });
  });

  test('displays user rating separately', async () => {
    const userRating = {
      id: 'user-rating',
      promise_id: 'promise-1',
      user_id: 'user-1',
      rating: 3,
      comment: 'My evaluation',
      created_at: '2024-01-03T00:00:00Z'
    };

    database.ratingOperations.getUserRating.mockResolvedValue({
      data: userRating,
      error: null
    });

    render(<RatingCard promiseId="promise-1" />);

    await waitFor(() => {
      expect(screen.getByText('내 평가:')).toBeInTheDocument();
      expect(screen.getByText('"My evaluation"')).toBeInTheDocument();
    });
  });

  test('handles unauthenticated user', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(<RatingCard promiseId="promise-1" />);

    // Should still load and display ratings but not show user-specific content
    expect(database.ratingOperations.getUserRating).not.toHaveBeenCalled();
  });

  test('compact mode renders correctly', async () => {
    render(<RatingCard promiseId="promise-1" compact={true} />);

    await waitFor(() => {
      expect(screen.getByText('시민 평가')).toBeInTheDocument();
    });

    // In compact mode, should limit the number of displayed ratings
    expect(database.ratingOperations.getPromiseRatings).toHaveBeenCalledWith(
      'promise-1',
      expect.objectContaining({ limit: 3 })
    );
  });

  test('loads more ratings when requested', async () => {
    render(<RatingCard promiseId="promise-1" compact={false} />);

    await waitFor(() => {
      expect(screen.getByText('시민 평가')).toBeInTheDocument();
    });

    const loadMoreButton = screen.queryByText('더 보기');
    if (loadMoreButton) {
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(database.ratingOperations.getPromiseRatings).toHaveBeenCalledWith(
          'promise-1',
          expect.objectContaining({ page: 2 })
        );
      });
    }
  });
});

describe('RatingCard Integration', () => {
  test('integrates with database operations correctly', async () => {
    render(<RatingCard promiseId="promise-1" />);

    await waitFor(() => {
      // Verify all necessary database calls are made
      expect(database.ratingOperations.getPromiseRatings).toHaveBeenCalledWith(
        'promise-1',
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: 'helpful_count',
          sortOrder: 'desc'
        })
      );

      expect(database.ratingOperations.getUserRating).toHaveBeenCalledWith(
        'promise-1',
        'user-1'
      );

      expect(database.ratingOperations.getPromiseStats).toHaveBeenCalledWith('promise-1');
    });
  });
});