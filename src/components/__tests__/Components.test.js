import React from 'react';
import { render } from '@testing-library/react';
import NotificationSystem from '../NotificationSystem';

// Simple smoke tests to ensure components can be imported and rendered
describe('Component Smoke Tests', () => {
  test('NotificationSystem renders without crashing', () => {
    render(<NotificationSystem />);
  });
});