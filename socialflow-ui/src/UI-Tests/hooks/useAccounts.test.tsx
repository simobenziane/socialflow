import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAccounts, useSyncAccounts } from '@/hooks/useAccounts';
import { QueryWrapper } from '../test-utils';
import { mockAccountsResponse } from '../mocks/handlers';

describe('useAccounts', () => {
  it('should fetch all accounts successfully', async () => {
    const { result } = renderHook(() => useAccounts(), {
      wrapper: QueryWrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAccountsResponse);
    expect(result.current.data?.data?.accounts).toHaveLength(3);
    expect(result.current.data?.data?.profiles).toHaveLength(1);
  });

  it('should return accounts with correct platform types', async () => {
    const { result } = renderHook(() => useAccounts(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const accounts = result.current.data?.data?.accounts;
    expect(accounts?.[0].platform).toBe('instagram');
    expect(accounts?.[1].platform).toBe('tiktok');
  });

  it('should return accounts with health status', async () => {
    const { result } = renderHook(() => useAccounts(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const accounts = result.current.data?.data?.accounts;
    expect(accounts?.[0].health).toBe('healthy');
    expect(accounts?.[1].health).toBe('warning');
  });
});

describe('useSyncAccounts', () => {
  it('should trigger sync successfully', async () => {
    const { result } = renderHook(() => useSyncAccounts(), {
      wrapper: QueryWrapper,
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.workflow).toBe('W0-Sync');
  });
});
