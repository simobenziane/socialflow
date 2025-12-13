import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useBatches,
  useBatchStatus,
  useIngest,
  useGenerate,
  useSchedule,
} from '@/hooks/useBatches';
import { QueryWrapper } from '../test-utils';
import { mockBatchesResponse, mockBatchStatusResponse } from '../mocks/handlers';

describe('useBatches', () => {
  it('should fetch batches for a client', async () => {
    const { result } = renderHook(() => useBatches('berlin-doner'), {
      wrapper: QueryWrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBatchesResponse);
    expect(result.current.data?.data?.batches).toHaveLength(2);
    expect(result.current.data?.data?.batches[0].name).toBe('december');
  });

  it('should not fetch when client is empty', async () => {
    const { result } = renderHook(() => useBatches(''), {
      wrapper: QueryWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should return batches with correct status', async () => {
    const { result } = renderHook(() => useBatches('berlin-doner'), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data?.batches[0].status).toBe('reviewing');
    expect(result.current.data?.data?.batches[1].status).toBe('draft');
  });
});

describe('useBatchStatus', () => {
  it('should fetch batch status', async () => {
    const { result } = renderHook(
      () => useBatchStatus('berlin-doner', 'december'),
      { wrapper: QueryWrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBatchStatusResponse);
    expect(result.current.data?.data?.counts.total).toBe(10);
  });

  it('should not fetch when client or batch is empty', async () => {
    const { result } = renderHook(
      () => useBatchStatus('', 'december'),
      { wrapper: QueryWrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should return correct status counts', async () => {
    const { result } = renderHook(
      () => useBatchStatus('berlin-doner', 'december'),
      { wrapper: QueryWrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const counts = result.current.data?.data?.counts;
    expect(counts?.needs_review).toBe(3);
    expect(counts?.approved).toBe(5);
    expect(counts?.scheduled).toBe(2);
  });
});

describe('useIngest', () => {
  it('should trigger ingest workflow', async () => {
    const { result } = renderHook(() => useIngest(), {
      wrapper: QueryWrapper,
    });

    result.current.mutate({ client: 'berlin-doner', batch: 'december' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.workflow).toBe('W1-Ingest');
  });
});

describe('useGenerate', () => {
  it('should trigger generate workflow', async () => {
    const { result } = renderHook(() => useGenerate(), {
      wrapper: QueryWrapper,
    });

    result.current.mutate({ client: 'berlin-doner', batch: 'december' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.workflow).toBe('W2-Captions');
  });
});

describe('useSchedule', () => {
  it('should trigger schedule workflow', async () => {
    const { result } = renderHook(() => useSchedule(), {
      wrapper: QueryWrapper,
    });

    result.current.mutate({ client: 'berlin-doner', batch: 'december' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.workflow).toBe('W3-Schedule');
  });
});
