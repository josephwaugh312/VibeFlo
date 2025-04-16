import React from 'react';
import { render } from '@testing-library/react';
import { 
  MockAuthProvider, 
  MockStatsProvider, 
  MockMusicPlayerProvider,
  useMockAuth,
  useMockStats,
  useMockMusicPlayer
} from './contexts';

describe('Mock Contexts', () => {
  test('MockAuthProvider should render without crashing', () => {
    render(
      <MockAuthProvider>
        <div>Test Child</div>
      </MockAuthProvider>
    );
  });

  test('MockStatsProvider should render without crashing', () => {
    render(
      <MockStatsProvider>
        <div>Test Child</div>
      </MockStatsProvider>
    );
  });
  
  test('MockMusicPlayerProvider should render without crashing', () => {
    render(
      <MockMusicPlayerProvider>
        <div>Test Child</div>
      </MockMusicPlayerProvider>
    );
  });

  test('Mock context hooks exist', () => {
    expect(useMockAuth).toBeDefined();
    expect(useMockStats).toBeDefined();
    expect(useMockMusicPlayer).toBeDefined();
  });
}); 