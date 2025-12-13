import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClients, useClient, useCreateClient } from '@/hooks/useClients';
import { QueryWrapper } from '../test-utils';
import { mockClientsResponse, mockClientResponse } from '../mocks/handlers';

describe('useClients', () => {
  it('should fetch all clients successfully', async () => {
    const { result } = renderHook(() => useClients(), {
      wrapper: QueryWrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClientsResponse);
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data[0].slug).toBe('berlin-doner');
  });
});

describe('useClient', () => {
  it('should fetch a single client by slug', async () => {
    const { result } = renderHook(() => useClient('berlin-doner'), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClientResponse);
    expect(result.current.data?.data.name).toBe('Berlin Doner');
  });

  it('should not fetch when slug is empty', async () => {
    const { result } = renderHook(() => useClient(''), {
      wrapper: QueryWrapper,
    });

    // Should not fetch when slug is empty (enabled: !!slug)
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

describe('useCreateClient', () => {
  it('should create a new client', async () => {
    const { result } = renderHook(() => useCreateClient(), {
      wrapper: QueryWrapper,
    });

    const input = {
      name: 'Test Client',
      slug: 'test-client',
      type: 'restaurant',
      language: 'en',
      timezone: 'UTC',
    };

    result.current.mutate(input);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
  });
});
