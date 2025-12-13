import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountCard } from '@/components/AccountCard';
import type { LateAccount } from '@/api/types';

const mockHealthyAccount: LateAccount = {
  id: 'acc_123',
  platform: 'instagram',
  username: 'test_user',
  display_name: 'Test User',
  profile_picture: 'https://example.com/pic.jpg',
  is_active: true,
  token_expires_at: '2024-12-31T00:00:00Z',
  permissions: ['publish_content'],
  late_profile_id: 'prof_1',
  late_profile_name: 'Default Profile',
  health: 'healthy',
  days_until_expiry: 150,
};

const mockWarningAccount: LateAccount = {
  ...mockHealthyAccount,
  id: 'acc_456',
  health: 'warning',
  days_until_expiry: 30,
};

const mockExpiredAccount: LateAccount = {
  ...mockHealthyAccount,
  id: 'acc_789',
  health: 'expired',
  days_until_expiry: -5,
};

const mockTikTokAccount: LateAccount = {
  ...mockHealthyAccount,
  id: 'acc_tt1',
  platform: 'tiktok',
  username: 'tiktok_user',
};

describe('AccountCard', () => {
  describe('Basic Rendering', () => {
    it('should render account username', () => {
      render(<AccountCard account={mockHealthyAccount} />);
      expect(screen.getByText('test_user')).toBeInTheDocument();
    });

    it('should render display name and profile', () => {
      render(<AccountCard account={mockHealthyAccount} />);
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
      expect(screen.getByText(/Default Profile/)).toBeInTheDocument();
    });

    it('should render avatar with fallback', () => {
      render(<AccountCard account={mockHealthyAccount} />);
      // Avatar fallback should be first letter uppercase
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('Platform Display', () => {
    it('should show Instagram emoji for Instagram accounts', () => {
      render(<AccountCard account={mockHealthyAccount} />);
      expect(screen.getByText('📷')).toBeInTheDocument();
    });

    it('should show TikTok emoji for TikTok accounts', () => {
      render(<AccountCard account={mockTikTokAccount} />);
      expect(screen.getByText('🎵')).toBeInTheDocument();
    });
  });

  describe('Health Status', () => {
    it('should show Healthy badge for healthy accounts', () => {
      render(<AccountCard account={mockHealthyAccount} />);
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('should show Warning badge for warning accounts', () => {
      render(<AccountCard account={mockWarningAccount} />);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should show Expired badge for expired accounts', () => {
      render(<AccountCard account={mockExpiredAccount} />);
      // Both badge and expiry text show "Expired"
      const expiredElements = screen.getAllByText('Expired');
      expect(expiredElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Expiry Display', () => {
    it('should show days until expiry for healthy accounts', () => {
      render(<AccountCard account={mockHealthyAccount} />);
      expect(screen.getByText('150 days until expiry')).toBeInTheDocument();
    });

    it('should show days until expiry for warning accounts', () => {
      render(<AccountCard account={mockWarningAccount} />);
      expect(screen.getByText('30 days until expiry')).toBeInTheDocument();
    });

    it('should show "Expired" for expired accounts', () => {
      render(<AccountCard account={mockExpiredAccount} />);
      // The badge shows "Expired" and expiry text also shows "Expired"
      const expiredTexts = screen.getAllByText('Expired');
      expect(expiredTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('should show "Expires today!" for accounts expiring today', () => {
      const expiringTodayAccount = { ...mockHealthyAccount, days_until_expiry: 0 };
      render(<AccountCard account={expiringTodayAccount} />);
      expect(screen.getByText('Expires today!')).toBeInTheDocument();
    });
  });

  describe('Client Linking', () => {
    it('should show linked client name when provided', () => {
      render(<AccountCard account={mockHealthyAccount} linkedClient="Berlin Doner" />);
      expect(screen.getByText('Linked to:')).toBeInTheDocument();
      expect(screen.getByText('Berlin Doner')).toBeInTheDocument();
    });

    it('should show "Not linked" when no client is linked', () => {
      render(<AccountCard account={mockHealthyAccount} />);
      expect(screen.getByText('Not linked to any client')).toBeInTheDocument();
    });
  });

  describe('Card Structure', () => {
    it('should render as a Card component', () => {
      render(<AccountCard account={mockHealthyAccount} />);
      const card = document.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });
});
