import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5678/webhook';

// Mock data
export const mockHealthResponse = {
  status: 'ok',
  service: 'socialflow-api',
  version: '1.0.0',
  timestamp: '2024-01-15T10:00:00Z',
  endpoints: ['/health', '/clients', '/late/accounts', '/batches', '/settings'],
};

export const mockClientsResponse = {
  success: true,
  message: 'Found 2 clients',
  data: [
    {
      slug: 'berlin-doner',
      name: 'Berlin Doner',
      type: 'restaurant',
      language: 'de',
      timezone: 'Europe/Berlin',
      is_active: true,
      accounts: {
        instagram: { late_account_id: 'acc_123', username: 'berlin_doner' },
        tiktok: { late_account_id: 'acc_456', username: 'berlindoner' },
      },
      schedule: { feed_time: '12:00', story_time: '18:00' },
    },
    {
      slug: 'cafe-milan',
      name: 'Cafe Milan',
      type: 'cafe',
      language: 'it',
      timezone: 'Europe/Rome',
      is_active: true,
      accounts: {
        instagram: { late_account_id: 'acc_789', username: 'cafe_milan' },
      },
    },
  ],
};

export const mockClientResponse = {
  success: true,
  message: 'Client found',
  data: mockClientsResponse.data[0],
};

export const mockAccountsResponse = {
  success: true,
  message: 'Cached accounts loaded',
  data: {
    accounts: [
      {
        id: 'acc_123',
        platform: 'instagram' as const,
        username: 'berlin_doner',
        display_name: 'Berlin Doner',
        profile_picture: 'https://example.com/pic.jpg',
        is_active: true,
        token_expires_at: '2024-06-15T00:00:00Z',
        permissions: ['publish_content', 'read_insights'],
        late_profile_id: 'prof_1',
        late_profile_name: 'Default Profile',
        health: 'healthy' as const,
        days_until_expiry: 150,
      },
      {
        id: 'acc_456',
        platform: 'tiktok' as const,
        username: 'berlindoner',
        display_name: 'Berlin Doner TikTok',
        is_active: true,
        token_expires_at: '2024-03-01T00:00:00Z',
        permissions: ['publish_content'],
        late_profile_id: 'prof_1',
        late_profile_name: 'Default Profile',
        health: 'warning' as const,
        days_until_expiry: 45,
      },
      {
        id: 'acc_789',
        platform: 'instagram' as const,
        username: 'cafe_milan',
        display_name: 'Cafe Milan',
        is_active: true,
        token_expires_at: '2024-04-15T00:00:00Z',
        permissions: ['publish_content'],
        late_profile_id: 'prof_1',
        late_profile_name: 'Default Profile',
        health: 'healthy' as const,
        days_until_expiry: 90,
      },
    ],
    profiles: [
      {
        id: 'prof_1',
        name: 'Default Profile',
        description: 'Main profile',
        color: '#3b82f6',
        is_default: true,
      },
    ],
    synced_at: '2024-01-15T09:00:00Z',
  },
};

export const mockBatchesResponse = {
  success: true,
  message: 'Found 2 batches',
  data: {
    batches: [
      {
        name: 'december',
        slug: 'december',
        client: 'berlin-doner',
        has_ready: true,
        has_config: true,
        status: 'reviewing' as const,
        photo_count: 8,
        video_count: 2,
        ingested: true,
        item_count: 10,
        needs_ai: 0,
        needs_review: 3,
        approved: 5,
        scheduled: 2,
        source: 'database' as const,
      },
      {
        name: 'january',
        slug: 'january',
        client: 'berlin-doner',
        has_ready: false,
        has_config: true,
        status: 'draft' as const,
        photo_count: 5,
        video_count: 1,
        ingested: false,
        item_count: 0,
        needs_ai: 0,
        needs_review: 0,
        approved: 0,
        scheduled: 0,
        source: 'filesystem' as const,
      },
    ],
    client: 'berlin-doner',
  },
};

export const mockBatchStatusResponse = {
  success: true,
  data: {
    client: 'berlin-doner',
    batch: 'december',
    counts: {
      total: 10,
      pending: 0,
      needs_ai: 0,
      needs_review: 3,
      approved: 5,
      scheduled: 2,
      failed: 0,
    },
  },
};

export const mockSettingsResponse = {
  success: true,
  data: {
    cloudflare_tunnel_url: 'https://abc-xyz.trycloudflare.com',
    paths: { docker_base: '/data/clients/' },
    ollama: { model: 'llava:7b', timeout_ms: 120000 },
  },
};

export const mockWorkflowResponse = {
  success: true,
  workflow: 'W1-Ingest',
  client: 'berlin-doner',
  batch: 'december',
  action: 'ingest',
  summary: { total: 10, processed: 10, ready_for_ai: 8, blocked: 2 },
};

// Stats response (v11)
export const mockStatsResponse = {
  success: true,
  data: {
    clients: 2,
    batches: 5,
    content_items: {
      total: 25,
      pending: 2,
      needs_ai: 3,
      needs_review: 8,
      approved: 7,
      scheduled: 4,
      failed: 1,
    },
    accounts: 3,
  },
};

// Content items mock data (v11)
export const mockContentItems = [
  {
    id: 1,
    content_id: 'berlin-doner_december_001',
    client_slug: 'berlin-doner',
    batch_name: 'december',
    media_type: 'photo' as const,
    file: 'photo_001.jpg',
    file_name: 'photo_001.jpg',
    media_url: 'https://example.com/photo_001.jpg',
    preview_url: 'https://example.com/photo_001_thumb.jpg',
    date: '2025-12-10',
    slot: 'feed' as const,
    schedule_at: '2025-12-10T20:00:00Z',
    platforms: 'instagram,tiktok',
    caption_ig: 'Delicious döner fresh from the grill!',
    caption_tt: 'You won\'t believe what we built!',
    hashtags_final: '#berlindoner #foodie',
    status: 'NEEDS_REVIEW' as const,
  },
  {
    id: 2,
    content_id: 'berlin-doner_december_002',
    client_slug: 'berlin-doner',
    batch_name: 'december',
    media_type: 'photo' as const,
    file: 'photo_002.jpg',
    file_name: 'photo_002.jpg',
    media_url: 'https://example.com/photo_002.jpg',
    preview_url: 'https://example.com/photo_002_thumb.jpg',
    date: '2025-12-11',
    slot: 'feed' as const,
    schedule_at: '2025-12-11T20:00:00Z',
    platforms: 'instagram',
    caption_ig: 'Quality you can trust.',
    caption_tt: '',
    hashtags_final: '#quality #trusted',
    status: 'NEEDS_REVIEW' as const,
  },
  {
    id: 3,
    content_id: 'berlin-doner_december_003',
    client_slug: 'berlin-doner',
    batch_name: 'december',
    media_type: 'video' as const,
    file: 'video_001.mp4',
    file_name: 'video_001.mp4',
    media_url: 'https://example.com/video_001.mp4',
    preview_url: 'https://example.com/video_001_thumb.jpg',
    date: '2025-12-12',
    slot: 'story' as const,
    schedule_at: '2025-12-12T18:30:00Z',
    platforms: 'instagram,tiktok',
    caption_ig: 'Behind the scenes of our process!',
    caption_tt: 'POV: Making magic happen',
    hashtags_final: '#bts #behindthescenes',
    status: 'APPROVED' as const,
  },
  {
    id: 4,
    content_id: 'berlin-doner_december_004',
    client_slug: 'berlin-doner',
    batch_name: 'december',
    media_type: 'photo' as const,
    file: 'photo_003.jpg',
    file_name: 'photo_003.jpg',
    media_url: 'https://example.com/photo_003.jpg',
    preview_url: 'https://example.com/photo_003_thumb.jpg',
    date: '2025-12-13',
    slot: 'feed' as const,
    schedule_at: '2025-12-13T20:00:00Z',
    platforms: 'instagram,tiktok',
    caption_ig: 'Weekend special!',
    caption_tt: 'Treat yourself!',
    hashtags_final: '#weekend #special',
    status: 'SCHEDULED' as const,
    late_post_id: 'late_post_123',
  },
];

export const mockContentItemsResponse = {
  success: true,
  data: {
    items: mockContentItems,
    pagination: {
      total: 4,
      limit: 50,
      offset: 0,
      has_more: false,
    },
  },
};

export const mockContentItemResponse = {
  success: true,
  data: mockContentItems[0],
};

export const mockItemActionResponse = {
  success: true,
  message: 'Item approved successfully',
  data: { ...mockContentItems[0], status: 'APPROVED' as const },
  timestamp: '2025-12-05T10:00:00Z',
};

export const mockBulkApproveResponse = {
  success: true,
  message: 'Items approved successfully',
  data: {
    approved: 2,
    total: 2,
  },
};

// ============================================
// ERROR MOCK RESPONSES FOR TESTING
// ============================================

export const mockErrorResponses = {
  notFound: {
    success: false,
    error: 'Resource not found',
  },
  serverError: {
    success: false,
    error: 'Internal server error',
  },
  unauthorized: {
    success: false,
    error: 'Unauthorized access',
  },
  badRequest: {
    success: false,
    error: 'Invalid request parameters',
  },
};

// Empty data responses for edge case testing
export const mockEmptyResponses = {
  clients: {
    success: true,
    message: 'Found 0 clients',
    data: [],
  },
  batches: {
    success: true,
    message: 'Found 0 batches',
    data: { batches: [], client: 'berlin-doner' },
  },
  batchStatus: {
    success: true,
    data: {
      client: 'berlin-doner',
      batch: 'empty-batch',
      counts: {
        total: 0,
        pending: 0,
        needs_ai: 0,
        needs_review: 0,
        approved: 0,
        scheduled: 0,
        failed: 0,
      },
    },
  },
  accounts: {
    success: true,
    message: 'No accounts cached',
    data: {
      accounts: [],
      profiles: [],
      synced_at: null,
    },
  },
};

// Jobs/Execution tracking mock
export const mockJobsResponse = {
  success: true,
  data: {
    current: { client: 'berlin-doner', batch: 'december' },
    executions: {
      W0: {
        last_run: '2024-12-05T10:00:00Z',
        status: 'success' as const,
        duration_ms: 2500,
        summary: { accounts_synced: 4 },
      },
      W1: {
        last_run: '2024-12-05T09:30:00Z',
        status: 'success' as const,
        client: 'berlin-doner',
        batch: 'december',
        duration_ms: 15000,
        summary: { total: 10, processed: 10, ready_for_ai: 8, blocked: 2 },
      },
      W2: {
        last_run: '2024-12-05T09:45:00Z',
        status: 'partial' as const,
        client: 'berlin-doner',
        batch: 'december',
        duration_ms: 120000,
        summary: { processed: 7, failed: 1 },
        errors: [{ content_id: 'berlin-doner_december_005', code: 'OLLAMA_ERROR', message: 'Vision model timeout' }],
      },
      W3: null,
    },
  },
};

// Settings edge cases
export const mockSettingsEdgeCases = {
  // Settings with empty values
  emptySettings: {
    success: true,
    data: {
      cloudflare_tunnel_url: '',
      paths: { docker_base: '' },
      ollama: { model: '', timeout_ms: 0 },
    },
  },
  // Settings with null nested objects
  nullNestedSettings: {
    success: true,
    data: {
      cloudflare_tunnel_url: 'https://test.trycloudflare.com',
      paths: null,
      ollama: null,
    },
  },
  // Settings update success
  updateSuccess: {
    success: true,
    message: 'Settings updated successfully',
  },
  // Settings update failure
  updateFailure: {
    success: false,
    message: 'Failed to update settings',
  },
};

// Edge case data for testing
export const mockEdgeCaseData = {
  // Client with minimal data
  clientMinimal: {
    success: true,
    client: {
      slug: 'minimal-client',
      name: '',
      type: '',
      language: '',
      timezone: '',
      is_active: false,
      accounts: {},
    },
  },
  // Batch status with all zeros
  batchStatusAllZeros: {
    success: true,
    data: {
      client: 'berlin-doner',
      batch: 'empty',
      counts: {
        total: 0,
        pending: 0,
        needs_ai: 0,
        needs_review: 0,
        approved: 0,
        scheduled: 0,
        failed: 0,
      },
    },
  },
  // Batch status with very large numbers
  batchStatusLargeNumbers: {
    success: true,
    data: {
      client: 'berlin-doner',
      batch: 'large',
      counts: {
        total: 999999,
        pending: 100000,
        needs_ai: 200000,
        needs_review: 300000,
        approved: 250000,
        scheduled: 149999,
        failed: 0,
      },
    },
  },
  // Client with very long name
  clientLongName: {
    success: true,
    client: {
      slug: 'long-name-client',
      name: 'This is an extremely long client name that should test text truncation and overflow handling in the UI components to ensure they handle edge cases properly',
      type: 'business',
      language: 'en',
      timezone: 'America/New_York',
      is_active: true,
      accounts: {
        instagram: { late_account_id: 'acc_999', username: 'very_long_username_that_exceeds_normal_limits' },
      },
    },
  },
  // Client with special characters
  clientSpecialChars: {
    success: true,
    client: {
      slug: 'special-chars',
      name: 'Café & Grill <test> "quotes"',
      type: 'restaurant',
      language: 'fr',
      timezone: 'Europe/Paris',
      is_active: true,
      accounts: {},
    },
  },
};

// ============================================
// HANDLERS
// ============================================

export const handlers = [
  // Health endpoint
  http.get(`${API_BASE}/api`, ({ request }) => {
    const url = new URL(request.url);
    const route = url.searchParams.get('route');

    // Handle content items route pattern: /items/:client/:batch
    if (route?.startsWith('/items/')) {
      const match = route.match(/^\/items\/([^/]+)\/([^/?]+)/);
      if (match) {
        return HttpResponse.json(mockContentItemsResponse);
      }
    }

    // Handle single item route pattern: /item/:id
    if (route?.match(/^\/item\/\d+$/)) {
      return HttpResponse.json(mockContentItemResponse);
    }

    // Handle client-specific routes: /clients/:slug
    if (route?.match(/^\/clients\/[^/]+$/) && route !== '/clients') {
      const slug = route.replace('/clients/', '');
      if (slug === 'invalid-client' || slug === 'nonexistent-client' || slug === 'test-client') {
        return HttpResponse.json(mockErrorResponses.notFound, { status: 404 });
      }
      if (slug === 'server-error') {
        return HttpResponse.json(mockErrorResponses.serverError, { status: 500 });
      }
      if (slug === 'minimal-client') {
        return HttpResponse.json(mockEdgeCaseData.clientMinimal);
      }
      if (slug === 'long-name-client') {
        return HttpResponse.json(mockEdgeCaseData.clientLongName);
      }
      if (slug === 'special-chars') {
        return HttpResponse.json(mockEdgeCaseData.clientSpecialChars);
      }
      return HttpResponse.json(mockClientResponse);
    }

    // Handle batches route: /clients/:slug/batches
    if (route?.match(/^\/clients\/[^/]+\/batches$/)) {
      return HttpResponse.json(mockBatchesResponse);
    }

    // Handle batch status route: /batches/:client/:batch/status
    if (route?.match(/^\/batches\/[^/]+\/[^/]+\/status$/)) {
      if (route.includes('invalid-batch') || route.includes('test-batch')) {
        return HttpResponse.json(mockErrorResponses.notFound, { status: 404 });
      }
      if (route.includes('server-error')) {
        return HttpResponse.json(mockErrorResponses.serverError, { status: 500 });
      }
      if (route.includes('empty')) {
        return HttpResponse.json(mockEmptyResponses.batchStatus);
      }
      if (route.includes('all-zeros')) {
        return HttpResponse.json(mockEdgeCaseData.batchStatusAllZeros);
      }
      if (route.includes('large-numbers')) {
        return HttpResponse.json(mockEdgeCaseData.batchStatusLargeNumbers);
      }
      return HttpResponse.json(mockBatchStatusResponse);
    }

    switch (route) {
      case '/health':
        return HttpResponse.json(mockHealthResponse);
      case '/stats':
        return HttpResponse.json(mockStatsResponse);
      case '/clients':
        return HttpResponse.json(mockClientsResponse);
      case '/late/accounts':
        return HttpResponse.json(mockAccountsResponse);
      case '/settings':
        return HttpResponse.json(mockSettingsResponse);
      case '/settings-error':
        return HttpResponse.json(mockErrorResponses.serverError, { status: 500 });
      case '/settings-empty':
        return HttpResponse.json(mockSettingsEdgeCases.emptySettings);
      case '/settings-null':
        return HttpResponse.json(mockSettingsEdgeCases.nullNestedSettings);
      case '/jobs':
        return HttpResponse.json(mockJobsResponse);
      default:
        return HttpResponse.json(mockErrorResponses.notFound, { status: 404 });
    }
  }),

  // POST endpoints
  http.post(`${API_BASE}/api`, ({ request }) => {
    const url = new URL(request.url);
    const route = url.searchParams.get('route');

    // Handle item approve: /item/:id/approve
    if (route?.match(/^\/item\/\d+\/approve$/)) {
      return HttpResponse.json({
        ...mockItemActionResponse,
        message: 'Item approved successfully',
      });
    }

    // Handle item reject: /item/:id/reject
    if (route?.match(/^\/item\/\d+\/reject$/)) {
      return HttpResponse.json({
        ...mockItemActionResponse,
        message: 'Item rejected',
        data: { ...mockContentItems[0], status: 'BLOCKED' as const },
      });
    }

    // Handle item caption update: /item/:id/caption
    if (route?.match(/^\/item\/\d+\/caption$/)) {
      return HttpResponse.json({
        ...mockItemActionResponse,
        message: 'Caption updated successfully',
      });
    }

    // Handle bulk approve
    if (route === '/approve-batch') {
      return HttpResponse.json(mockBulkApproveResponse);
    }

    if (route === '/clients') {
      return HttpResponse.json(mockClientResponse);
    }
    if (route === '/late/sync') {
      return HttpResponse.json({ ...mockWorkflowResponse, workflow: 'W0-Sync' });
    }
    if (route?.includes('/ingest')) {
      return HttpResponse.json(mockWorkflowResponse);
    }
    if (route?.includes('/generate')) {
      return HttpResponse.json({ ...mockWorkflowResponse, workflow: 'W2-Captions' });
    }
    if (route?.includes('/schedule')) {
      return HttpResponse.json({ ...mockWorkflowResponse, workflow: 'W3-Schedule' });
    }

    return HttpResponse.json(mockErrorResponses.notFound, { status: 404 });
  }),

  // PUT endpoints
  http.put(`${API_BASE}/api`, ({ request }) => {
    const url = new URL(request.url);
    const route = url.searchParams.get('route');

    if (route === '/settings-error') {
      return HttpResponse.json(mockSettingsEdgeCases.updateFailure, { status: 500 });
    }

    return HttpResponse.json({ success: true, message: 'Settings updated' });
  }),

  // Direct workflow webhooks
  http.post(`${API_BASE}/w0-sync`, () => {
    return HttpResponse.json({ ...mockWorkflowResponse, workflow: 'W0-Sync' });
  }),
  http.post(`${API_BASE}/w1-ingest`, () => {
    return HttpResponse.json(mockWorkflowResponse);
  }),
  http.post(`${API_BASE}/w2-captions`, () => {
    return HttpResponse.json({ ...mockWorkflowResponse, workflow: 'W2-Captions' });
  }),
  http.post(`${API_BASE}/w3-schedule`, () => {
    return HttpResponse.json({ ...mockWorkflowResponse, workflow: 'W3-Schedule' });
  }),
];

