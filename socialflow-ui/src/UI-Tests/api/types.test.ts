import { describe, it, expect } from 'vitest';
import type {
  Client,
  ClientsResponse,
  CreateClientInput,
  LateAccount,
  AccountsResponse,
  Batch,
  BatchesResponse,
  BatchStatusCounts,
  ContentItem,
  ContentStatus,
  Settings,
  WorkflowResponse,
  HealthResponse,
  Platform,
  HealthStatus,
  MediaType,
  SlotType,
} from '@/api/types';

describe('API Types', () => {
  describe('Client Types', () => {
    it('should accept valid Client object', () => {
      const client: Client = {
        slug: 'test-client',
        name: 'Test Client',
        type: 'restaurant',
        language: 'en',
        timezone: 'UTC',
        is_active: true,
        accounts: {
          instagram: { late_account_id: 'acc_123', username: 'test' },
        },
        schedule: { feed_time: '12:00', story_time: '18:00' },
      };

      expect(client.slug).toBe('test-client');
      expect(client.accounts.instagram?.username).toBe('test');
    });

    it('should accept Client without optional fields', () => {
      const client: Client = {
        slug: 'minimal-client',
        name: 'Minimal',
        type: 'other',
        language: 'en',
        timezone: 'UTC',
        is_active: false,
        accounts: {},
      };

      expect(client.schedule).toBeUndefined();
      expect(client.accounts.instagram).toBeUndefined();
    });

    it('should accept valid CreateClientInput', () => {
      const input: CreateClientInput = {
        name: 'New Client',
        slug: 'new-client',
        type: 'cafe',
        language: 'de',
        timezone: 'Europe/Berlin',
        instagram_account_id: 'acc_123',
        feed_time: '10:00',
      };

      expect(input.name).toBe('New Client');
      expect(input.tiktok_account_id).toBeUndefined();
    });
  });

  describe('Late Account Types', () => {
    it('should accept valid Platform values', () => {
      const platforms: Platform[] = ['instagram', 'tiktok'];
      expect(platforms).toContain('instagram');
      expect(platforms).toContain('tiktok');
    });

    it('should accept valid HealthStatus values', () => {
      const statuses: HealthStatus[] = ['healthy', 'warning', 'expired'];
      expect(statuses).toHaveLength(3);
    });

    it('should accept valid LateAccount object', () => {
      const account: LateAccount = {
        id: 'acc_123',
        platform: 'instagram',
        username: 'testuser',
        display_name: 'Test User',
        profile_picture: 'https://example.com/pic.jpg',
        is_active: true,
        token_expires_at: '2024-12-31T00:00:00Z',
        permissions: ['publish_content'],
        late_profile_id: 'prof_1',
        late_profile_name: 'Default',
        health: 'healthy',
        days_until_expiry: 365,
      };

      expect(account.platform).toBe('instagram');
      expect(account.health).toBe('healthy');
    });
  });

  describe('Batch Types', () => {
    it('should accept valid Batch object', () => {
      const batch: Batch = {
        name: 'december',
        client: 'test-client',
        has_ready: true,
        has_config: true,
        status: 'reviewing',
      };

      expect(batch.status).toBe('reviewing');
    });

    it('should accept valid BatchStatusCounts', () => {
      const counts: BatchStatusCounts = {
        total: 10,
        pending: 1,
        needs_ai: 2,
        needs_review: 3,
        approved: 2,
        scheduled: 1,
        failed: 1,
      };

      const sum = counts.pending + counts.needs_ai + counts.needs_review +
                  counts.approved + counts.scheduled + counts.failed;
      expect(sum).toBe(counts.total);
    });
  });

  describe('Content Types', () => {
    it('should accept valid ContentStatus values', () => {
      const statuses: ContentStatus[] = [
        'PENDING', 'NEEDS_AI', 'NEEDS_REVIEW',
        'APPROVED', 'SCHEDULED', 'BLOCKED', 'FAILED'
      ];
      expect(statuses).toHaveLength(7);
    });

    it('should accept valid MediaType values', () => {
      const types: MediaType[] = ['photo', 'video'];
      expect(types).toHaveLength(2);
    });

    it('should accept valid SlotType values', () => {
      const slots: SlotType[] = ['feed', 'story'];
      expect(slots).toHaveLength(2);
    });

    it('should accept valid ContentItem object', () => {
      const item: ContentItem = {
        content_id: 'content_123',
        client_slug: 'test-client',
        batch_name: 'december',
        media_type: 'photo',
        file: 'photo1.jpg',
        media_url: 'https://example.com/photo1.jpg',
        preview_url: 'https://example.com/thumb/photo1.jpg',
        date: '2024-01-15',
        slot: 'feed',
        schedule_at: '2024-01-15T12:00:00Z',
        platforms: 'instagram,tiktok',
        caption_ig: 'Instagram caption',
        caption_tt: 'TikTok caption',
        hashtags_final: '#food #restaurant',
        status: 'APPROVED',
      };

      expect(item.media_type).toBe('photo');
      expect(item.slot).toBe('feed');
      expect(item.status).toBe('APPROVED');
    });

    it('should accept ContentItem with optional error fields', () => {
      const failedItem: ContentItem = {
        content_id: 'content_456',
        client_slug: 'test-client',
        batch_name: 'december',
        media_type: 'video',
        file: 'video1.mp4',
        media_url: 'https://example.com/video1.mp4',
        preview_url: 'https://example.com/thumb/video1.jpg',
        date: '2024-01-16',
        slot: 'feed',
        schedule_at: '2024-01-16T12:00:00Z',
        platforms: 'tiktok',
        caption_ig: '',
        caption_tt: 'TikTok caption',
        hashtags_final: '',
        status: 'FAILED',
        error_message: 'Video too long',
        late_post_id: 'post_789',
      };

      expect(failedItem.status).toBe('FAILED');
      expect(failedItem.error_message).toBe('Video too long');
    });
  });

  describe('Settings Types', () => {
    it('should accept valid Settings object', () => {
      const settings: Settings = {
        cloudflare_tunnel_url: 'https://abc.trycloudflare.com',
        paths: { docker_base: '/data/clients/' },
        ollama: { model: 'llava:7b', timeout_ms: 120000 },
      };

      expect(settings.ollama.model).toBe('llava:7b');
      expect(settings.paths.docker_base).toBe('/data/clients/');
    });
  });

  describe('Workflow Response Types', () => {
    it('should accept valid WorkflowResponse', () => {
      const response: WorkflowResponse = {
        success: true,
        workflow: 'W1-Ingest',
        client: 'test-client',
        batch: 'december',
        action: 'ingest',
        summary: {
          total: 10,
          processed: 8,
          ready_for_ai: 6,
          blocked: 2,
        },
      };

      expect(response.success).toBe(true);
      expect(response.summary?.total).toBe(10);
    });

    it('should accept failed WorkflowResponse', () => {
      const response: WorkflowResponse = {
        success: false,
        workflow: 'W2-Captions',
        error: 'Ollama not available',
        message: 'Could not connect to AI service',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('Health Response Types', () => {
    it('should accept valid HealthResponse', () => {
      const health: HealthResponse = {
        status: 'ok',
        service: 'socialflow-api',
        version: '1.0.0',
        timestamp: '2024-01-15T10:00:00Z',
        endpoints: ['/health', '/clients'],
      };

      expect(health.status).toBe('ok');
      expect(health.endpoints).toContain('/health');
    });
  });
});
