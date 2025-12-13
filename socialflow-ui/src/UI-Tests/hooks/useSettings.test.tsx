import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { QueryWrapper } from '../test-utils';
import { mockSettingsResponse } from '../mocks/handlers';

describe('useSettings', () => {
  it('should fetch settings successfully', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: QueryWrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSettingsResponse);
    expect(result.current.data?.data.cloudflare_tunnel_url).toBeDefined();
  });

  it('should return ollama settings', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data.ollama.model).toBe('llava:7b');
    expect(result.current.data?.data.ollama.timeout_ms).toBe(120000);
  });
});

describe('useUpdateSettings', () => {
  it('should update settings successfully', async () => {
    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: QueryWrapper,
    });

    result.current.mutate({
      cloudflare_tunnel_url: 'https://new-tunnel.trycloudflare.com',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.message).toBe('Settings updated');
  });

  it('should handle partial updates', async () => {
    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: QueryWrapper,
    });

    result.current.mutate({
      ollama: { model: 'llava:13b', timeout_ms: 180000 },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
  });
});
