# SocialFlow: Complete Technical Architecture

**Version:** 1.0  
**Last Updated:** December 2024  
**Optimization Goal:** Long-term maintainability  
**Frontend Framework:** Flutter (Dart)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack Overview](#2-technology-stack-overview)
3. [Frontend Architecture (Flutter)](#3-frontend-architecture-flutter)
4. [Backend Architecture](#4-backend-architecture)
5. [Database & Multi-Tenancy](#5-database--multi-tenancy)
6. [Workflow Orchestration (Temporal)](#6-workflow-orchestration-temporal)
7. [Event Architecture](#7-event-architecture)
8. [AI Gateway](#8-ai-gateway)
9. [Media Pipeline](#9-media-pipeline)
10. [Publishing System](#10-publishing-system)
11. [Search & Analytics](#11-search--analytics)
12. [Authentication & Authorization](#12-authentication--authorization)
13. [Infrastructure & Deployment](#13-infrastructure--deployment)
14. [Observability](#14-observability)
15. [Security](#15-security)
16. [API Design](#16-api-design)
17. [Offline & Sync](#17-offline--sync)
18. [Module Boundaries](#18-module-boundaries)
19. [Development Workflow](#19-development-workflow)
20. [Phased Roadmap](#20-phased-roadmap)

---

## 1. Executive Summary

SocialFlow is a B2B SaaS platform for AI-assisted social media content management. Users upload media, receive AI-generated captions, approve content through a review workflow, and publish to social platforms.

### Core Product Flow

```
Media Upload → AI Caption Generation → Human Review → Approval → Scheduled Publishing
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Flutter | Single codebase for iOS, Android, Web, Windows, macOS, Linux |
| Backend | Node.js + Fastify | Team expertise, TypeScript end-to-end with shared types |
| API | tRPC | End-to-end type safety, no code generation |
| Database | PostgreSQL | Reliability, RLS for multi-tenancy, pgvector for search |
| Multi-tenancy | Schema-per-tenant | Clean isolation, enterprise-ready, easier BYOS migration |
| Workflows | Temporal | Durable execution, versioning, built-in observability |
| Events | Transactional Outbox | Guaranteed delivery, no lost events |
| AI Gateway | LiteLLM + Custom Wrapper | 100+ providers, BYOK support, rate limiting |
| Object Storage | Cloudflare R2 | S3-compatible, zero egress fees |
| Observability | OpenTelemetry | Vendor-neutral, distributed tracing from day one |

---

## 2. Technology Stack Overview

### Frontend (Flutter)

```
Flutter 3.24+ (Dart 3.5+)
├── State Management: Riverpod 2.x
├── Routing: go_router
├── API Client: dio + retrofit (generated from OpenAPI)
├── Local Database: drift (SQLite wrapper)
├── Secure Storage: flutter_secure_storage
├── Offline Sync: Custom sync engine on drift
├── UI Components: Material 3 + Custom Design System
├── Code Generation: freezed, json_serializable, build_runner
└── Testing: flutter_test, mocktail, integration_test
```

### Backend (Node.js)

```
Node.js 22 LTS
├── Framework: Fastify 5.x
├── API Layer: tRPC 11.x
├── Validation: Zod
├── ORM: Drizzle ORM
├── Database: PostgreSQL 16
├── Cache: Redis 7 (Upstash)
├── Job Queue: Temporal (primary), BullMQ (simple jobs)
├── Event Bus: pg-transactional-outbox
├── AI Gateway: LiteLLM (self-hosted)
├── Object Storage: Cloudflare R2 (S3 SDK)
└── Testing: Vitest, Supertest, Testcontainers
```

### Infrastructure

```
Cloud Provider: AWS (primary) or GCP
├── Compute: ECS Fargate (containers) or Cloud Run
├── Database: RDS PostgreSQL or Neon
├── Cache: ElastiCache Redis or Upstash
├── Storage: Cloudflare R2
├── CDN: Cloudflare
├── Secrets: AWS Secrets Manager + KMS
├── Workflows: Temporal Cloud
├── Auth: Clerk (OIDC/SAML/SCIM ready)
├── Monitoring: Axiom or Datadog
├── Error Tracking: Sentry
└── CI/CD: GitHub Actions
```

### Development Tools

```
Monorepo: Turborepo + pnpm
├── /apps
│   ├── /flutter          # Flutter app (all platforms)
│   ├── /api              # Fastify + tRPC backend
│   └── /temporal-worker  # Temporal worker processes
├── /packages
│   ├── /shared-types     # Shared TypeScript types
│   ├── /db               # Drizzle schema + migrations
│   ├── /events           # Event definitions
│   └── /ai-gateway       # AI abstraction layer
└── /infrastructure       # Terraform/Pulumi IaC
```

---

## 3. Frontend Architecture (Flutter)

### 3.1 Why Flutter

| Advantage | Description |
|-----------|-------------|
| **True single codebase** | One Dart codebase compiles to iOS, Android, Web, Windows, macOS, Linux |
| **Native performance** | AOT compiled to native ARM/x64, 60fps UI |
| **Self-contained** | Less reliance on third-party packages than React Native |
| **Offline-first patterns** | Excellent local database support (drift/Hive/Isar) |
| **Desktop maturity** | Flutter desktop is production-ready (unlike RN Windows/macOS) |
| **Security** | Compiled Dart is harder to reverse-engineer than JavaScript |

### 3.2 Project Structure

```
flutter/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── main_development.dart        # Dev environment entry
│   ├── main_staging.dart            # Staging environment entry
│   ├── main_production.dart         # Production environment entry
│   │
│   ├── app/
│   │   ├── app.dart                 # MaterialApp configuration
│   │   ├── router.dart              # go_router configuration
│   │   └── theme.dart               # Material 3 theme
│   │
│   ├── core/
│   │   ├── config/                  # Environment config
│   │   ├── constants/               # App constants
│   │   ├── errors/                  # Error types and handling
│   │   ├── extensions/              # Dart extensions
│   │   ├── network/                 # Dio client, interceptors
│   │   ├── storage/                 # Secure storage wrapper
│   │   └── utils/                   # Utility functions
│   │
│   ├── data/
│   │   ├── datasources/
│   │   │   ├── local/               # Drift DAOs
│   │   │   └── remote/              # API clients (retrofit)
│   │   ├── models/                  # Data models (freezed)
│   │   ├── repositories/            # Repository implementations
│   │   └── sync/                    # Offline sync engine
│   │
│   ├── domain/
│   │   ├── entities/                # Business entities
│   │   ├── repositories/            # Repository interfaces
│   │   └── usecases/                # Business logic
│   │
│   ├── presentation/
│   │   ├── common/                  # Shared widgets
│   │   ├── features/
│   │   │   ├── auth/                # Login, signup, etc.
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── media/               # Media library
│   │   │   ├── captions/            # AI caption generation
│   │   │   ├── review/              # Approval workflow
│   │   │   ├── publishing/          # Schedule & publish
│   │   │   ├── settings/            # User & org settings
│   │   │   └── analytics/           # Usage analytics
│   │   └── providers/               # Riverpod providers
│   │
│   └── l10n/                        # Localization
│
├── test/                            # Unit & widget tests
├── integration_test/                # Integration tests
├── android/                         # Android-specific config
├── ios/                             # iOS-specific config
├── web/                             # Web-specific config
├── windows/                         # Windows-specific config
├── macos/                           # macOS-specific config
├── linux/                           # Linux-specific config
└── pubspec.yaml                     # Dependencies
```

### 3.3 State Management (Riverpod)

```dart
// lib/presentation/providers/media_provider.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/media_item.dart';
import '../../domain/repositories/media_repository.dart';

part 'media_provider.g.dart';

@riverpod
class MediaList extends _$MediaList {
  @override
  Future<List<MediaItem>> build() async {
    final repository = ref.watch(mediaRepositoryProvider);
    return repository.getMediaItems();
  }

  Future<void> uploadMedia(File file) async {
    state = const AsyncLoading();
    final repository = ref.read(mediaRepositoryProvider);
    
    try {
      await repository.uploadMedia(file);
      ref.invalidateSelf(); // Refresh list
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> deleteMedia(String mediaId) async {
    final repository = ref.read(mediaRepositoryProvider);
    await repository.deleteMedia(mediaId);
    ref.invalidateSelf();
  }
}

@riverpod
MediaRepository mediaRepository(MediaRepositoryRef ref) {
  final localDataSource = ref.watch(mediaLocalDataSourceProvider);
  final remoteDataSource = ref.watch(mediaRemoteDataSourceProvider);
  final syncEngine = ref.watch(syncEngineProvider);
  
  return MediaRepositoryImpl(
    localDataSource: localDataSource,
    remoteDataSource: remoteDataSource,
    syncEngine: syncEngine,
  );
}
```

### 3.4 Local Database (Drift)

```dart
// lib/data/datasources/local/database.dart

import 'package:drift/drift.dart';

part 'database.g.dart';

class MediaItems extends Table {
  TextColumn get id => text()();
  TextColumn get tenantId => text()();
  TextColumn get filename => text()();
  TextColumn get mimeType => text()();
  IntColumn get size => integer()();
  TextColumn get localPath => text().nullable()();
  TextColumn get remoteUrl => text().nullable()();
  TextColumn get thumbnailUrl => text().nullable()();
  TextColumn get caption => text().nullable()();
  TextColumn get status => text()(); // pending, processing, ready, error
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get syncedAt => dateTime().nullable()();
  BoolColumn get isDirty => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

class PublishingJobs extends Table {
  TextColumn get id => text()();
  TextColumn get mediaId => text().references(MediaItems, #id)();
  TextColumn get caption => text()();
  DateTimeColumn get scheduledAt => dateTime()();
  TextColumn get status => text()(); // pending, scheduled, published, failed
  TextColumn get platformIds => text()(); // JSON array of platform IDs
  TextColumn get receiptData => text().nullable()(); // JSON response from Late/platforms
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get syncedAt => dateTime().nullable()();
  BoolColumn get isDirty => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

class SyncQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get entityType => text()(); // media, publishing_job, etc.
  TextColumn get entityId => text()();
  TextColumn get operation => text()(); // create, update, delete
  TextColumn get payload => text()(); // JSON payload
  DateTimeColumn get createdAt => dateTime()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get lastRetryAt => dateTime().nullable()();
}

@DriftDatabase(tables: [MediaItems, PublishingJobs, SyncQueue])
class AppDatabase extends _$AppDatabase {
  AppDatabase(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (Migrator m) => m.createAll(),
    onUpgrade: (Migrator m, int from, int to) async {
      // Handle migrations
    },
  );
}
```

### 3.5 API Client (Retrofit + Dio)

```dart
// lib/data/datasources/remote/api_client.dart

import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

part 'api_client.g.dart';

@RestApi()
abstract class ApiClient {
  factory ApiClient(Dio dio, {String baseUrl}) = _ApiClient;

  // Media endpoints
  @GET('/media')
  Future<List<MediaItemDto>> getMediaItems();

  @POST('/media/upload')
  @MultiPart()
  Future<MediaItemDto> uploadMedia(@Part(name: 'file') File file);

  @DELETE('/media/{id}')
  Future<void> deleteMedia(@Path('id') String id);

  // AI endpoints
  @POST('/ai/generate-caption')
  Future<CaptionResponseDto> generateCaption(@Body() GenerateCaptionRequest request);

  // Publishing endpoints
  @POST('/publishing/schedule')
  Future<PublishingJobDto> schedulePost(@Body() SchedulePostRequest request);

  @GET('/publishing/jobs')
  Future<List<PublishingJobDto>> getPublishingJobs();

  // Sync endpoint
  @POST('/sync/push')
  Future<SyncResponse> pushChanges(@Body() SyncPushRequest request);

  @GET('/sync/pull')
  Future<SyncPullResponse> pullChanges(@Query('since') DateTime? since);
}

// Dio configuration with interceptors
Dio createDio(String baseUrl, AuthTokenProvider tokenProvider) {
  final dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  ));

  dio.interceptors.addAll([
    AuthInterceptor(tokenProvider),
    TenantInterceptor(),
    LoggingInterceptor(),
    RetryInterceptor(dio),
  ]);

  return dio;
}
```

### 3.6 Platform-Specific Features

```dart
// lib/core/platform/platform_service.dart

import 'dart:io';
import 'package:flutter/foundation.dart';

abstract class PlatformService {
  Future<void> initializeLocalLLM();
  Future<String?> generateCaptionLocally(String imagePath);
  bool get supportsLocalLLM;
  bool get supportsBackgroundSync;
}

class DesktopPlatformService implements PlatformService {
  OllamaClient? _ollamaClient;

  @override
  bool get supportsLocalLLM => true;

  @override
  bool get supportsBackgroundSync => true;

  @override
  Future<void> initializeLocalLLM() async {
    // Check if Ollama is running on localhost
    try {
      _ollamaClient = OllamaClient(baseUrl: 'http://127.0.0.1:11434');
      await _ollamaClient!.ping();
    } catch (e) {
      _ollamaClient = null;
      // Ollama not available, will use cloud
    }
  }

  @override
  Future<String?> generateCaptionLocally(String imagePath) async {
    if (_ollamaClient == null) return null;
    
    final imageBytes = await File(imagePath).readAsBytes();
    final response = await _ollamaClient!.generateVision(
      model: 'llava',
      prompt: 'Describe this image for a social media post.',
      images: [base64Encode(imageBytes)],
    );
    
    return response.response;
  }
}

class MobilePlatformService implements PlatformService {
  @override
  bool get supportsLocalLLM => false; // Mobile uses cloud AI

  @override
  bool get supportsBackgroundSync => true;

  @override
  Future<void> initializeLocalLLM() async {
    // No-op on mobile
  }

  @override
  Future<String?> generateCaptionLocally(String imagePath) async {
    return null; // Always use cloud on mobile
  }
}

class WebPlatformService implements PlatformService {
  @override
  bool get supportsLocalLLM => false;

  @override
  bool get supportsBackgroundSync => false; // Limited on web

  @override
  Future<void> initializeLocalLLM() async {}

  @override
  Future<String?> generateCaptionLocally(String imagePath) async => null;
}

// Factory
PlatformService createPlatformService() {
  if (kIsWeb) return WebPlatformService();
  if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
    return DesktopPlatformService();
  }
  return MobilePlatformService();
}
```

### 3.7 Dependencies (pubspec.yaml)

```yaml
name: socialflow
description: AI-powered social media management
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.5.0 <4.0.0'
  flutter: '>=3.24.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.5.0
  riverpod_annotation: ^2.3.0

  # Routing
  go_router: ^14.0.0

  # Networking
  dio: ^5.4.0
  retrofit: ^4.1.0

  # Local Database
  drift: ^2.18.0
  sqlite3_flutter_libs: ^0.5.0

  # Secure Storage
  flutter_secure_storage: ^9.0.0

  # Code Generation
  freezed_annotation: ^2.4.0
  json_annotation: ^4.9.0

  # UI
  flutter_svg: ^2.0.0
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  
  # File Handling
  file_picker: ^8.0.0
  image_picker: ^1.0.0
  path_provider: ^2.1.0
  
  # Utilities
  intl: ^0.19.0
  uuid: ^4.3.0
  logger: ^2.2.0
  connectivity_plus: ^6.0.0

  # Platform-specific
  url_launcher: ^6.2.0
  share_plus: ^9.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  
  # Code Generation
  build_runner: ^2.4.0
  riverpod_generator: ^2.4.0
  freezed: ^2.5.0
  json_serializable: ^6.8.0
  retrofit_generator: ^8.1.0
  drift_dev: ^2.18.0

  # Testing
  mocktail: ^1.0.0
  bloc_test: ^9.1.0

flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/icons/
    
  fonts:
    - family: Inter
      fonts:
        - asset: assets/fonts/Inter-Regular.ttf
        - asset: assets/fonts/Inter-Medium.ttf
          weight: 500
        - asset: assets/fonts/Inter-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Inter-Bold.ttf
          weight: 700
```

---

## 4. Backend Architecture

### 4.1 Modular Monolith Structure

```
apps/api/
├── src/
│   ├── index.ts                     # Entry point
│   ├── server.ts                    # Fastify server setup
│   ├── trpc.ts                      # tRPC router setup
│   │
│   ├── modules/
│   │   ├── identity/
│   │   │   ├── identity.router.ts   # tRPC router
│   │   │   ├── identity.service.ts  # Business logic
│   │   │   ├── identity.schema.ts   # Zod schemas
│   │   │   └── identity.types.ts    # TypeScript types
│   │   │
│   │   ├── entitlements/
│   │   │   ├── entitlements.router.ts
│   │   │   ├── entitlements.service.ts
│   │   │   ├── plans.config.ts      # Plan definitions
│   │   │   └── quota.service.ts     # Quota tracking
│   │   │
│   │   ├── media/
│   │   │   ├── media.router.ts
│   │   │   ├── media.service.ts
│   │   │   ├── upload.service.ts    # Resumable uploads
│   │   │   ├── processing.service.ts # Image/video processing
│   │   │   └── storage.service.ts   # R2/S3 abstraction
│   │   │
│   │   ├── ai/
│   │   │   ├── ai.router.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── gateway.service.ts   # LiteLLM wrapper
│   │   │   ├── keys.service.ts      # BYOK management
│   │   │   └── usage.service.ts     # Token tracking
│   │   │
│   │   ├── publishing/
│   │   │   ├── publishing.router.ts
│   │   │   ├── publishing.service.ts
│   │   │   ├── adapters/
│   │   │   │   ├── adapter.interface.ts
│   │   │   │   ├── late.adapter.ts
│   │   │   │   └── direct.adapter.ts
│   │   │   └── receipts.service.ts
│   │   │
│   │   ├── search/
│   │   │   ├── search.router.ts
│   │   │   ├── search.service.ts
│   │   │   ├── embedding.service.ts
│   │   │   └── vector.service.ts    # pgvector queries
│   │   │
│   │   └── sync/
│   │       ├── sync.router.ts
│   │       ├── sync.service.ts
│   │       └── conflict.service.ts  # Conflict resolution
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT validation
│   │   ├── tenant.middleware.ts     # Tenant context
│   │   ├── rateLimit.middleware.ts  # Rate limiting
│   │   └── tracing.middleware.ts    # OpenTelemetry
│   │
│   ├── events/
│   │   ├── eventBus.ts              # Event publisher
│   │   ├── handlers/                # Event handlers
│   │   └── outbox.ts                # Transactional outbox
│   │
│   ├── lib/
│   │   ├── db.ts                    # Database connection
│   │   ├── redis.ts                 # Redis client
│   │   ├── temporal.ts              # Temporal client
│   │   ├── storage.ts               # R2/S3 client
│   │   └── logger.ts                # Structured logging
│   │
│   └── utils/
│       ├── crypto.ts                # Encryption utilities
│       ├── validation.ts            # Common validators
│       └── errors.ts                # Error types
│
├── package.json
├── tsconfig.json
└── Dockerfile
```

### 4.2 Fastify Server Setup

```typescript
// apps/api/src/server.ts

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './trpc';
import { createContext } from './context';
import { setupOpenTelemetry } from './lib/telemetry';
import { connectDatabase } from './lib/db';
import { connectRedis } from './lib/redis';

// Initialize OpenTelemetry BEFORE importing other modules
setupOpenTelemetry();

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
  });

  // Security
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.headers['x-tenant-id'] as string || req.ip,
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // tRPC
  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
      onError: ({ error, path }) => {
        fastify.log.error({ error, path }, 'tRPC error');
      },
    },
  });

  // Connect to databases
  await connectDatabase();
  await connectRedis();

  return fastify;
}

// apps/api/src/index.ts
import { buildServer } from './server';

async function main() {
  const server = await buildServer();
  
  try {
    await server.listen({ 
      port: Number(process.env.PORT) || 4000,
      host: '0.0.0.0',
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
```

### 4.3 tRPC Router Setup

```typescript
// apps/api/src/trpc.ts

import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Authenticated procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Tenant-scoped procedure
export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No tenant context' });
  }
  
  // Set schema for this request
  await ctx.db.execute(`SET search_path TO tenant_${ctx.tenant.slug}, shared, public`);
  
  return next({ ctx: { ...ctx, tenant: ctx.tenant } });
});

// Admin procedure
export const adminProcedure = tenantProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next();
});

// Main router
import { identityRouter } from './modules/identity/identity.router';
import { mediaRouter } from './modules/media/media.router';
import { aiRouter } from './modules/ai/ai.router';
import { publishingRouter } from './modules/publishing/publishing.router';
import { searchRouter } from './modules/search/search.router';
import { syncRouter } from './modules/sync/sync.router';
import { entitlementsRouter } from './modules/entitlements/entitlements.router';

export const appRouter = router({
  identity: identityRouter,
  media: mediaRouter,
  ai: aiRouter,
  publishing: publishingRouter,
  search: searchRouter,
  sync: syncRouter,
  entitlements: entitlementsRouter,
});

export type AppRouter = typeof appRouter;
```

---

## 5. Database & Multi-Tenancy

### 5.1 Schema-Per-Tenant Strategy

Each tenant gets their own PostgreSQL schema. This provides:
- **Clean isolation** — No accidental cross-tenant queries
- **Easier enterprise migration** — Move tenant to dedicated DB by exporting schema
- **Simpler mental model** — No `tenant_id` on every table
- **Per-tenant backups** — Backup individual tenant schemas

```sql
-- Database structure
socialflow_db/
├── public/                    -- Shared infrastructure
│   ├── tenants
│   ├── users
│   ├── tenant_users
│   ├── migrations
│   └── outbox
├── shared/                    -- Shared reference data
│   ├── platforms
│   ├── ai_models
│   └── plan_definitions
├── tenant_acme/              -- Tenant: Acme Corp
│   ├── media_items
│   ├── publishing_jobs
│   ├── ai_conversations
│   └── analytics_events
└── tenant_contoso/           -- Tenant: Contoso
    ├── media_items
    ├── publishing_jobs
    └── ...
```

### 5.2 Drizzle Schema (Shared Tables)

```typescript
// packages/db/src/schema/public.ts

import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'suspended', 'deleted']);
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'editor', 'viewer']);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: tenantStatusEnum('status').default('active').notNull(),
  planId: text('plan_id').notNull().default('free'),
  settings: text('settings').$type<TenantSettings>(), // JSONB
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  clerkId: text('clerk_id').notNull().unique(), // External auth ID
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tenantUsers = pgTable('tenant_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: userRoleEnum('role').default('editor').notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Transactional outbox
export const outbox = pgTable('outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: text('payload').notNull(), // JSON
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});
```

### 5.3 Drizzle Schema (Tenant Tables)

```typescript
// packages/db/src/schema/tenant.ts

import { pgTable, uuid, text, timestamp, integer, boolean, vector } from 'drizzle-orm/pg-core';

export const mediaStatusEnum = pgEnum('media_status', [
  'uploading', 'processing', 'ready', 'error'
]);

export const mediaItems = pgTable('media_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'), // For video, in seconds
  
  // Storage
  storagePath: text('storage_path').notNull(),
  thumbnailPath: text('thumbnail_path'),
  
  // AI-generated
  caption: text('caption'),
  description: text('description'), // Detailed AI description
  embedding: vector('embedding', { dimensions: 1536 }), // For semantic search
  
  // Metadata
  exifData: text('exif_data'), // JSON, stripped of sensitive info
  contentHash: text('content_hash').notNull(), // SHA-256 for dedup
  
  status: mediaStatusEnum('status').default('uploading').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const publishingJobStatusEnum = pgEnum('publishing_job_status', [
  'draft', 'pending_review', 'approved', 'scheduled', 'publishing', 'published', 'failed'
]);

export const publishingJobs = pgTable('publishing_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').references(() => mediaItems.id),
  
  caption: text('caption').notNull(),
  hashtags: text('hashtags'), // JSON array
  
  // Scheduling
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  
  // Destinations
  destinations: text('destinations').notNull(), // JSON array of platform IDs
  
  // Status & workflow
  status: publishingJobStatusEnum('status').default('draft').notNull(),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  
  // Receipt from publishing
  receipt: text('receipt'), // JSON with platform responses
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  
  // Idempotency
  idempotencyKey: text('idempotency_key').notNull().unique(),
  
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: text('platform').notNull(), // instagram, twitter, linkedin, etc.
  platformAccountId: text('platform_account_id').notNull(),
  accountName: text('account_name').notNull(),
  
  // OAuth tokens (encrypted)
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  
  // Late integration (if using Late)
  lateAccountId: text('late_account_id'),
  
  isActive: boolean('is_active').default(true).notNull(),
  connectedBy: uuid('connected_by').notNull(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
});

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').references(() => mediaItems.id),
  
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  
  // Conversation history for multi-turn
  messages: text('messages').notNull(), // JSON array
  
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: text('event_type').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  userId: uuid('user_id'),
  metadata: text('metadata'), // JSON
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 5.4 Tenant Provisioning

```typescript
// apps/api/src/modules/identity/tenant.service.ts

import { db } from '../../lib/db';
import { tenants, tenantUsers } from '@socialflow/db/schema';
import { runMigrations } from '../../lib/migrations';

export async function createTenant(input: CreateTenantInput, creatorUserId: string) {
  const slug = generateSlug(input.name);
  
  return await db.transaction(async (trx) => {
    // 1. Create tenant record
    const [tenant] = await trx.insert(tenants).values({
      name: input.name,
      slug,
      planId: input.planId || 'free',
    }).returning();

    // 2. Create tenant schema
    await trx.execute(`CREATE SCHEMA tenant_${slug}`);

    // 3. Run migrations in tenant schema
    await trx.execute(`SET search_path TO tenant_${slug}`);
    await runMigrations(trx, 'tenant');

    // 4. Create indexes
    await trx.execute(`
      CREATE INDEX idx_media_items_created_at ON tenant_${slug}.media_items(created_at DESC);
      CREATE INDEX idx_media_items_status ON tenant_${slug}.media_items(status);
      CREATE INDEX idx_publishing_jobs_scheduled ON tenant_${slug}.publishing_jobs(scheduled_at) 
        WHERE status = 'scheduled';
    `);

    // 5. Add creator as owner
    await trx.insert(tenantUsers).values({
      tenantId: tenant.id,
      userId: creatorUserId,
      role: 'owner',
    });

    // 6. Emit event for downstream processing
    await publishEvent(trx, {
      aggregateType: 'tenant',
      aggregateId: tenant.id,
      eventType: 'tenant.created',
      payload: { tenantId: tenant.id, slug, creatorUserId },
    });

    return tenant;
  });
}

export async function deleteTenant(tenantId: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });
  
  if (!tenant) throw new Error('Tenant not found');

  await db.transaction(async (trx) => {
    // 1. Mark tenant as deleted
    await trx.update(tenants)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    // 2. Drop schema (or rename for retention period)
    await trx.execute(`ALTER SCHEMA tenant_${tenant.slug} RENAME TO deleted_${tenant.slug}_${Date.now()}`);

    // 3. Emit event
    await publishEvent(trx, {
      aggregateType: 'tenant',
      aggregateId: tenant.id,
      eventType: 'tenant.deleted',
      payload: { tenantId: tenant.id },
    });
  });
}
```

### 5.5 Connection Pooling (PgBouncer)

```yaml
# docker-compose.yml (development)
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgres://user:pass@postgres:5432/socialflow
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
    ports:
      - "6432:6432"
```

```typescript
// Connection with schema switching
// apps/api/src/lib/db.ts

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

export const db = drizzle(pool);

// Middleware to set tenant schema
export async function withTenantSchema<T>(
  tenantSlug: string,
  callback: (db: typeof db) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query(`SET search_path TO tenant_${tenantSlug}, shared, public`);
    const scopedDb = drizzle(client);
    return await callback(scopedDb);
  } finally {
    await client.query('RESET search_path');
    client.release();
  }
}
```

---

## 6. Workflow Orchestration (Temporal)

### 6.1 Why Temporal

| Feature | Benefit for SocialFlow |
|---------|----------------------|
| **Durable execution** | Workflows survive crashes, deployments, restarts |
| **Workflow versioning** | Deploy new workflow versions without breaking in-flight executions |
| **Built-in retries** | Automatic retry with backoff for transient failures |
| **Signals & queries** | Human approval workflow (signal to approve/reject) |
| **Timers** | Scheduled publishing at exact times |
| **Visibility** | Full execution history for debugging |

### 6.2 Temporal Setup

```typescript
// apps/temporal-worker/src/worker.ts

import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: 'socialflow',
    taskQueue: 'socialflow-main',
    workflowsPath: require.resolve('./workflows'),
    activities,
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 10,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 6.3 Media Ingestion Workflow

```typescript
// apps/temporal-worker/src/workflows/mediaIngestion.ts

import { 
  proxyActivities, 
  defineSignal, 
  defineQuery,
  setHandler, 
  condition,
  sleep,
  workflowInfo,
} from '@temporalio/workflow';
import type * as activities from '../activities';

const { 
  extractMetadata,
  generateDerivatives,
  generateEmbedding,
  generateAICaption,
  storeMedia,
  notifyUser,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
  },
});

// Signals for human interaction
export const approvalSignal = defineSignal<[ApprovalInput]>('approval');
export const editCaptionSignal = defineSignal<[string]>('editCaption');

// Queries for status
export const statusQuery = defineQuery<WorkflowStatus>('status');

interface MediaIngestionInput {
  tenantId: string;
  mediaId: string;
  uploadPath: string;
  userId: string;
  options?: {
    skipAICaption?: boolean;
    customPrompt?: string;
  };
}

interface ApprovalInput {
  approved: boolean;
  reviewerId: string;
  editedCaption?: string;
}

export async function mediaIngestionWorkflow(input: MediaIngestionInput): Promise<MediaIngestionResult> {
  let status: WorkflowStatus = { stage: 'processing', progress: 0 };
  let currentCaption: string | null = null;
  let approvalResult: ApprovalInput | null = null;

  // Set up query handler
  setHandler(statusQuery, () => status);

  // Set up signal handlers
  setHandler(approvalSignal, (result) => {
    approvalResult = result;
  });
  
  setHandler(editCaptionSignal, (newCaption) => {
    currentCaption = newCaption;
  });

  try {
    // Step 1: Extract metadata
    status = { stage: 'extracting_metadata', progress: 10 };
    const metadata = await extractMetadata(input.uploadPath);

    // Step 2: Generate derivatives (thumbnails, web sizes) — parallel with step 3
    status = { stage: 'generating_derivatives', progress: 20 };
    const derivativesPromise = generateDerivatives(input.uploadPath, metadata);

    // Step 3: Generate embedding for search
    status = { stage: 'generating_embedding', progress: 30 };
    const embeddingPromise = generateEmbedding(input.uploadPath, metadata);

    const [derivatives, embedding] = await Promise.all([
      derivativesPromise,
      embeddingPromise,
    ]);

    // Step 4: Store media with all metadata
    status = { stage: 'storing', progress: 50 };
    await storeMedia({
      tenantId: input.tenantId,
      mediaId: input.mediaId,
      metadata,
      derivatives,
      embedding,
    });

    // Step 5: Generate AI caption (if not skipped)
    if (!input.options?.skipAICaption) {
      status = { stage: 'generating_caption', progress: 60 };
      currentCaption = await generateAICaption({
        tenantId: input.tenantId,
        mediaId: input.mediaId,
        imagePath: derivatives.webOptimized,
        customPrompt: input.options?.customPrompt,
      });
    }

    // Step 6: Wait for human approval
    status = { stage: 'pending_review', progress: 70, caption: currentCaption };
    await notifyUser(input.userId, {
      type: 'caption_ready',
      mediaId: input.mediaId,
      caption: currentCaption,
    });

    // Wait up to 7 days for approval
    const approved = await condition(
      () => approvalResult !== null,
      '7 days'
    );

    if (!approved || !approvalResult?.approved) {
      status = { stage: 'rejected', progress: 100 };
      return {
        mediaId: input.mediaId,
        status: 'rejected',
        reason: approvalResult ? 'User rejected' : 'Approval timeout',
      };
    }

    // Step 7: Finalize with approved caption
    const finalCaption = approvalResult.editedCaption || currentCaption;
    status = { stage: 'approved', progress: 100, caption: finalCaption };

    return {
      mediaId: input.mediaId,
      status: 'approved',
      caption: finalCaption,
      derivatives,
      metadata,
    };

  } catch (error) {
    status = { stage: 'error', progress: 0, error: String(error) };
    throw error;
  }
}
```

### 6.4 Publishing Workflow

```typescript
// apps/temporal-worker/src/workflows/publishing.ts

import { 
  proxyActivities, 
  sleep,
  continueAsNew,
  workflowInfo,
} from '@temporalio/workflow';
import type * as activities from '../activities';

const { 
  publishToLate,
  publishDirect,
  storeReceipt,
  notifyPublished,
  notifyFailed,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 5,
    initialInterval: '10 seconds',
    backoffCoefficient: 2,
    maximumInterval: '5 minutes',
    nonRetryableErrorTypes: ['InvalidCredentials', 'ContentViolation'],
  },
});

interface PublishingInput {
  tenantId: string;
  jobId: string;
  mediaId: string;
  caption: string;
  destinations: Destination[];
  scheduledAt: Date;
  adapter: 'late' | 'direct';
  idempotencyKey: string;
}

export async function publishingWorkflow(input: PublishingInput): Promise<PublishingResult> {
  const now = new Date();
  const scheduledTime = new Date(input.scheduledAt);
  
  // Wait until scheduled time
  if (scheduledTime > now) {
    const waitMs = scheduledTime.getTime() - now.getTime();
    await sleep(waitMs);
  }

  const results: DestinationResult[] = [];

  // Publish to each destination
  for (const destination of input.destinations) {
    try {
      const result = input.adapter === 'late'
        ? await publishToLate({
            tenantId: input.tenantId,
            mediaId: input.mediaId,
            caption: input.caption,
            destination,
            idempotencyKey: `${input.idempotencyKey}-${destination.id}`,
          })
        : await publishDirect({
            tenantId: input.tenantId,
            mediaId: input.mediaId,
            caption: input.caption,
            destination,
            idempotencyKey: `${input.idempotencyKey}-${destination.id}`,
          });

      results.push({
        destinationId: destination.id,
        platform: destination.platform,
        status: 'published',
        postId: result.postId,
        postUrl: result.postUrl,
      });

      // Store receipt immediately
      await storeReceipt({
        tenantId: input.tenantId,
        jobId: input.jobId,
        destinationId: destination.id,
        receipt: result,
      });

    } catch (error) {
      results.push({
        destinationId: destination.id,
        platform: destination.platform,
        status: 'failed',
        error: String(error),
      });
    }
  }

  // Determine overall status
  const allSucceeded = results.every(r => r.status === 'published');
  const allFailed = results.every(r => r.status === 'failed');
  const status = allSucceeded ? 'published' : allFailed ? 'failed' : 'partial';

  // Notify user
  if (status === 'published') {
    await notifyPublished(input.tenantId, input.jobId, results);
  } else {
    await notifyFailed(input.tenantId, input.jobId, results);
  }

  return {
    jobId: input.jobId,
    status,
    results,
  };
}
```

### 6.5 Activities

```typescript
// apps/temporal-worker/src/activities/media.ts

import { Context } from '@temporalio/activity';
import sharp from 'sharp';
import { db, withTenantSchema } from '../lib/db';
import { storage } from '../lib/storage';
import { aiGateway } from '../lib/ai';

export async function extractMetadata(uploadPath: string): Promise<MediaMetadata> {
  const metadata = await sharp(uploadPath).metadata();
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: metadata.size || 0,
    hasAlpha: metadata.hasAlpha || false,
  };
}

export async function generateDerivatives(
  uploadPath: string, 
  metadata: MediaMetadata
): Promise<Derivatives> {
  const ctx = Context.current();
  
  // Generate thumbnail
  ctx.heartbeat('generating thumbnail');
  const thumbnail = await sharp(uploadPath)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Generate web-optimized version
  ctx.heartbeat('generating web version');
  const webOptimized = await sharp(uploadPath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Upload to storage
  const thumbnailPath = `derivatives/${ctx.info.workflowExecution.workflowId}/thumb.jpg`;
  const webPath = `derivatives/${ctx.info.workflowExecution.workflowId}/web.jpg`;

  await Promise.all([
    storage.upload(thumbnailPath, thumbnail),
    storage.upload(webPath, webOptimized),
  ]);

  return {
    thumbnail: thumbnailPath,
    webOptimized: webPath,
  };
}

export async function generateAICaption(input: {
  tenantId: string;
  mediaId: string;
  imagePath: string;
  customPrompt?: string;
}): Promise<string> {
  const imageUrl = await storage.getSignedUrl(input.imagePath);
  
  const response = await aiGateway.generateCaption({
    tenantId: input.tenantId,
    imageUrl,
    prompt: input.customPrompt || 'Write an engaging social media caption for this image.',
  });

  return response.caption;
}

export async function generateEmbedding(
  uploadPath: string,
  metadata: MediaMetadata
): Promise<number[]> {
  const imageBuffer = await sharp(uploadPath)
    .resize(512, 512, { fit: 'cover' })
    .jpeg()
    .toBuffer();

  const response = await aiGateway.generateEmbedding({
    image: imageBuffer.toString('base64'),
    model: 'clip-vit-base-patch32',
  });

  return response.embedding;
}
```

---

## 7. Event Architecture

### 7.1 Transactional Outbox Pattern

Every event is written to the outbox table within the same database transaction as the business data change. A separate process reads from the outbox and publishes to subscribers.

```typescript
// packages/events/src/outbox.ts

import { db } from '@socialflow/db';
import { outbox } from '@socialflow/db/schema';

export interface DomainEvent {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
}

export async function publishEvent(
  trx: typeof db, // Pass transaction
  event: DomainEvent
): Promise<void> {
  await trx.insert(outbox).values({
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    eventType: event.eventType,
    payload: JSON.stringify(event.payload),
  });
}

// Usage in service
export async function approveMediaCaption(
  tenantSlug: string,
  mediaId: string,
  caption: string,
  reviewerId: string
) {
  return await withTenantSchema(tenantSlug, async (db) => {
    return await db.transaction(async (trx) => {
      // Update media
      await trx.update(mediaItems)
        .set({ 
          caption, 
          status: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(mediaItems.id, mediaId));

      // Publish event (same transaction!)
      await publishEvent(trx, {
        aggregateType: 'media',
        aggregateId: mediaId,
        eventType: 'media.approved',
        payload: { mediaId, caption, reviewerId, tenantSlug },
      });

      return { success: true };
    });
  });
}
```

### 7.2 Outbox Processor

```typescript
// apps/api/src/events/outboxProcessor.ts

import { db } from '../lib/db';
import { outbox } from '@socialflow/db/schema';
import { eq, isNull, asc } from 'drizzle-orm';
import { eventHandlers } from './handlers';

export async function processOutbox() {
  while (true) {
    try {
      // Get unprocessed events
      const events = await db
        .select()
        .from(outbox)
        .where(isNull(outbox.processedAt))
        .orderBy(asc(outbox.createdAt))
        .limit(100);

      for (const event of events) {
        try {
          // Find and execute handlers
          const handlers = eventHandlers[event.eventType] || [];
          
          for (const handler of handlers) {
            await handler(JSON.parse(event.payload));
          }

          // Mark as processed
          await db
            .update(outbox)
            .set({ processedAt: new Date() })
            .where(eq(outbox.id, event.id));

        } catch (error) {
          console.error(`Failed to process event ${event.id}:`, error);
          // Events stay unprocessed for retry
        }
      }

      // Wait before next poll
      await sleep(1000);
      
    } catch (error) {
      console.error('Outbox processor error:', error);
      await sleep(5000);
    }
  }
}

// Event handlers
// apps/api/src/events/handlers/index.ts

export const eventHandlers: Record<string, EventHandler[]> = {
  'media.uploaded': [
    startMediaIngestionWorkflow,
    logAnalyticsEvent,
  ],
  'media.approved': [
    updateSearchIndex,
    logAnalyticsEvent,
  ],
  'publishing.completed': [
    sendPushNotification,
    logAnalyticsEvent,
  ],
  'tenant.created': [
    provisionStorageBucket,
    sendWelcomeEmail,
  ],
};
```

### 7.3 Event Types

```typescript
// packages/events/src/types.ts

export type DomainEvents = {
  // Media events
  'media.uploaded': { tenantId: string; mediaId: string; userId: string };
  'media.processed': { tenantId: string; mediaId: string; derivatives: Derivatives };
  'media.approved': { tenantId: string; mediaId: string; caption: string; reviewerId: string };
  'media.deleted': { tenantId: string; mediaId: string; deletedBy: string };

  // Publishing events
  'publishing.scheduled': { tenantId: string; jobId: string; scheduledAt: Date };
  'publishing.completed': { tenantId: string; jobId: string; results: DestinationResult[] };
  'publishing.failed': { tenantId: string; jobId: string; error: string };

  // AI events
  'ai.caption.generated': { tenantId: string; mediaId: string; tokens: number };
  'ai.budget.exceeded': { tenantId: string; limit: number; current: number };

  // Tenant events
  'tenant.created': { tenantId: string; slug: string; creatorId: string };
  'tenant.plan.changed': { tenantId: string; oldPlan: string; newPlan: string };
  'tenant.deleted': { tenantId: string };

  // User events
  'user.invited': { tenantId: string; email: string; invitedBy: string };
  'user.joined': { tenantId: string; userId: string };
};
```

---

## 8. AI Gateway

### 8.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Gateway Module                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Rate Limiter│  │ Key Manager  │  │ Usage Tracker    │   │
│  │ (per tenant)│  │ (KMS encrypt)│  │ (tokens/costs)   │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                │                    │             │
│         └────────────────┼────────────────────┘             │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │  LiteLLM    │                           │
│                   │   Proxy     │                           │
│                   └──────┬──────┘                           │
│                          │                                  │
│    ┌─────────────────────┼─────────────────────┐           │
│    │                     │                     │           │
│  ┌─▼───┐  ┌─────▼─────┐  ┌──▼──┐  ┌─────▼────┐            │
│  │OpenAI│  │Anthropic  │  │Ollama│  │ Other   │            │
│  └──────┘  └───────────┘  └─────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Implementation

```typescript
// packages/ai-gateway/src/gateway.ts

import { LiteLLM } from 'litellm';
import { KeyManager } from './keyManager';
import { RateLimiter } from './rateLimiter';
import { UsageTracker } from './usageTracker';

export class AIGateway {
  private litellm: LiteLLM;
  private keyManager: KeyManager;
  private rateLimiter: RateLimiter;
  private usageTracker: UsageTracker;

  constructor(config: AIGatewayConfig) {
    this.litellm = new LiteLLM({ baseUrl: config.litellmUrl });
    this.keyManager = new KeyManager(config.kmsKeyId);
    this.rateLimiter = new RateLimiter(config.redis);
    this.usageTracker = new UsageTracker(config.db);
  }

  async generateCaption(input: GenerateCaptionInput): Promise<CaptionResponse> {
    const { tenantId, imageUrl, prompt } = input;

    // 1. Check rate limit
    await this.rateLimiter.checkLimit(tenantId, 'caption');

    // 2. Get API key (tenant's BYOK or default)
    const apiKey = await this.keyManager.getKeyForTenant(tenantId);

    // 3. Check budget
    const budget = await this.usageTracker.getRemainingBudget(tenantId);
    if (budget <= 0) {
      throw new BudgetExceededError(tenantId);
    }

    // 4. Make request via LiteLLM
    const startTime = Date.now();
    
    const response = await this.litellm.completion({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 500,
      api_key: apiKey,
    });

    const latency = Date.now() - startTime;

    // 5. Track usage
    await this.usageTracker.recordUsage({
      tenantId,
      model: 'gpt-4-vision-preview',
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      latencyMs: latency,
    });

    // 6. Check if approaching budget limit
    const remainingBudget = await this.usageTracker.getRemainingBudget(tenantId);
    if (remainingBudget < budget * 0.1) {
      // Emit warning event
      await publishEvent({
        aggregateType: 'ai',
        aggregateId: tenantId,
        eventType: 'ai.budget.warning',
        payload: { tenantId, remaining: remainingBudget },
      });
    }

    return {
      caption: response.choices[0].message.content,
      tokensUsed: response.usage.total_tokens,
    };
  }

  async generateEmbedding(input: EmbeddingInput): Promise<EmbeddingResponse> {
    const { tenantId, text, image } = input;

    await this.rateLimiter.checkLimit(tenantId, 'embedding');

    const response = await this.litellm.embedding({
      model: 'text-embedding-3-small',
      input: text || image,
    });

    await this.usageTracker.recordUsage({
      tenantId,
      model: 'text-embedding-3-small',
      promptTokens: response.usage.prompt_tokens,
      completionTokens: 0,
      totalTokens: response.usage.total_tokens,
      latencyMs: 0,
    });

    return {
      embedding: response.data[0].embedding,
    };
  }

  // Local Ollama for desktop
  async generateCaptionLocal(input: LocalCaptionInput): Promise<CaptionResponse> {
    // Validate this is truly local (prevent SSRF)
    const allowedHosts = ['127.0.0.1', 'localhost'];
    const url = new URL(input.ollamaUrl);
    
    if (!allowedHosts.includes(url.hostname)) {
      throw new SecurityError('Only localhost Ollama is allowed');
    }

    const response = await fetch(`${input.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        prompt: input.prompt,
        images: [input.imageBase64],
        stream: false,
      }),
    });

    const data = await response.json();
    
    return {
      caption: data.response,
      tokensUsed: 0, // Local, no billing
    };
  }
}
```

### 8.3 Key Management (BYOK)

```typescript
// packages/ai-gateway/src/keyManager.ts

import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';
import { db } from '@socialflow/db';
import { tenantAiKeys } from '@socialflow/db/schema';

export class KeyManager {
  private kms: KMSClient;
  private kmsKeyId: string;
  private keyCache: Map<string, { key: string; expiresAt: number }>;

  constructor(kmsKeyId: string) {
    this.kms = new KMSClient({});
    this.kmsKeyId = kmsKeyId;
    this.keyCache = new Map();
  }

  async storeKeyForTenant(tenantId: string, apiKey: string): Promise<void> {
    // Encrypt the API key with KMS
    const command = new EncryptCommand({
      KeyId: this.kmsKeyId,
      Plaintext: Buffer.from(apiKey),
    });

    const response = await this.kms.send(command);
    const encryptedKey = Buffer.from(response.CiphertextBlob!).toString('base64');

    // Store encrypted key
    await db.insert(tenantAiKeys).values({
      tenantId,
      provider: 'openai',
      encryptedKey,
    }).onConflictDoUpdate({
      target: [tenantAiKeys.tenantId, tenantAiKeys.provider],
      set: { encryptedKey, updatedAt: new Date() },
    });

    // Invalidate cache
    this.keyCache.delete(tenantId);
  }

  async getKeyForTenant(tenantId: string): Promise<string> {
    // Check cache
    const cached = this.keyCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.key;
    }

    // Get encrypted key from DB
    const record = await db.query.tenantAiKeys.findFirst({
      where: eq(tenantAiKeys.tenantId, tenantId),
    });

    if (!record) {
      // Use default platform key
      return process.env.OPENAI_API_KEY!;
    }

    // Decrypt with KMS
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(record.encryptedKey, 'base64'),
    });

    const response = await this.kms.send(command);
    const apiKey = Buffer.from(response.Plaintext!).toString();

    // Cache for 5 minutes
    this.keyCache.set(tenantId, {
      key: apiKey,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return apiKey;
  }

  async deleteKeyForTenant(tenantId: string): Promise<void> {
    await db.delete(tenantAiKeys).where(eq(tenantAiKeys.tenantId, tenantId));
    this.keyCache.delete(tenantId);
  }
}
```

### 8.4 Rate Limiting

```typescript
// packages/ai-gateway/src/rateLimiter.ts

import { Redis } from 'ioredis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  caption: { windowMs: 60_000, maxRequests: 20 }, // 20/min
  embedding: { windowMs: 60_000, maxRequests: 100 }, // 100/min
};

export class RateLimiter {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async checkLimit(tenantId: string, operation: string): Promise<void> {
    const config = DEFAULT_LIMITS[operation];
    if (!config) return;

    const key = `ratelimit:${tenantId}:${operation}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use sliding window with sorted set
    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries
    pipeline.zcard(key);
    
    // Add new entry
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const count = results![1][1] as number;

    if (count >= config.maxRequests) {
      throw new RateLimitExceededError(tenantId, operation, config.maxRequests);
    }
  }
}
```

---

## 9. Media Pipeline

### 9.1 Upload Flow

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌──────────┐
│ Flutter │ ──── │   API   │ ──── │   R2    │ ──── │ Temporal │
│  App    │      │ Server  │      │ Storage │      │ Workflow │
└─────────┘      └─────────┘      └─────────┘      └──────────┘
     │                │                │                 │
     │ 1. Request     │                │                 │
     │    upload URL  │                │                 │
     │ ──────────────>│                │                 │
     │                │                │                 │
     │ 2. Signed URL  │                │                 │
     │ <──────────────│                │                 │
     │                │                │                 │
     │ 3. Upload directly to R2       │                 │
     │ ───────────────────────────────>│                 │
     │                │                │                 │
     │ 4. Confirm     │                │                 │
     │    upload      │                │                 │
     │ ──────────────>│                │                 │
     │                │ 5. Start workflow               │
     │                │ ────────────────────────────────>│
     │                │                │                 │
     │ 6. Success     │                │                 │
     │ <──────────────│                │                 │
```

### 9.2 Upload Service

```typescript
// apps/api/src/modules/media/upload.service.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

export class UploadService {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.R2_BUCKET!;
  }

  async createUploadUrl(input: CreateUploadInput): Promise<UploadUrlResponse> {
    const { tenantSlug, filename, mimeType, size } = input;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(mimeType)) {
      throw new ValidationError(`File type ${mimeType} not allowed`);
    }

    // Validate size (100MB max)
    if (size > 100 * 1024 * 1024) {
      throw new ValidationError('File too large (max 100MB)');
    }

    const mediaId = uuid();
    const extension = filename.split('.').pop();
    const storagePath = `tenants/${tenantSlug}/media/${mediaId}/original.${extension}`;

    // Create presigned URL for direct upload
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
      ContentType: mimeType,
      ContentLength: size,
    });

    const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    return {
      mediaId,
      uploadUrl: signedUrl,
      storagePath,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  async confirmUpload(input: ConfirmUploadInput): Promise<MediaItem> {
    const { tenantSlug, mediaId, storagePath, filename, mimeType, size, userId } = input;

    // Verify file exists in storage
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });
      await this.s3.send(command);
    } catch (error) {
      throw new NotFoundError('Upload not found in storage');
    }

    // Create media record
    return await withTenantSchema(tenantSlug, async (db) => {
      return await db.transaction(async (trx) => {
        const [media] = await trx.insert(mediaItems).values({
          id: mediaId,
          filename: `${mediaId}.${filename.split('.').pop()}`,
          originalFilename: filename,
          mimeType,
          size,
          storagePath,
          status: 'processing',
          createdBy: userId,
        }).returning();

        // Emit event to start processing workflow
        await publishEvent(trx, {
          aggregateType: 'media',
          aggregateId: mediaId,
          eventType: 'media.uploaded',
          payload: {
            tenantSlug,
            mediaId,
            storagePath,
            userId,
          },
        });

        return media;
      });
    });
  }

  async getDownloadUrl(storagePath: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    });

    return await getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }
}
```

### 9.3 Processing Service

```typescript
// apps/api/src/modules/media/processing.service.ts

import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { storage } from '../../lib/storage';

export class ProcessingService {
  
  async processImage(input: ProcessImageInput): Promise<ProcessedImage> {
    const { storagePath, tenantSlug, mediaId } = input;

    // Download original
    const originalBuffer = await storage.download(storagePath);
    const image = sharp(originalBuffer);
    const metadata = await image.metadata();

    // Strip EXIF (keep orientation)
    const strippedImage = image.rotate(); // Auto-rotate based on EXIF then strip

    // Generate derivatives
    const derivatives = await Promise.all([
      // Thumbnail (300x300, cover)
      strippedImage
        .clone()
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer()
        .then(buffer => this.uploadDerivative(tenantSlug, mediaId, 'thumb', buffer)),

      // Small (600px width)
      strippedImage
        .clone()
        .resize(600, null, { withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
        .then(buffer => this.uploadDerivative(tenantSlug, mediaId, 'small', buffer)),

      // Medium (1200px width)
      strippedImage
        .clone()
        .resize(1200, null, { withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
        .then(buffer => this.uploadDerivative(tenantSlug, mediaId, 'medium', buffer)),

      // Large (2400px width, for retina)
      strippedImage
        .clone()
        .resize(2400, null, { withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer()
        .then(buffer => this.uploadDerivative(tenantSlug, mediaId, 'large', buffer)),
    ]);

    // Compute content hash for deduplication
    const hash = await this.computeHash(originalBuffer);

    return {
      width: metadata.width!,
      height: metadata.height!,
      format: metadata.format!,
      contentHash: hash,
      derivatives: {
        thumbnail: derivatives[0],
        small: derivatives[1],
        medium: derivatives[2],
        large: derivatives[3],
      },
    };
  }

  async processVideo(input: ProcessVideoInput): Promise<ProcessedVideo> {
    const { storagePath, tenantSlug, mediaId } = input;

    // Download to temp file
    const tempPath = `/tmp/${mediaId}`;
    await storage.downloadToFile(storagePath, tempPath);

    // Get video metadata
    const metadata = await this.getVideoMetadata(tempPath);

    // Generate thumbnail from first frame
    const thumbnailPath = `/tmp/${mediaId}_thumb.jpg`;
    await this.extractFrame(tempPath, thumbnailPath, 0);
    const thumbnailBuffer = await fs.readFile(thumbnailPath);
    const thumbnailUrl = await this.uploadDerivative(tenantSlug, mediaId, 'thumb', thumbnailBuffer);

    // Generate preview GIF (first 3 seconds)
    const previewPath = `/tmp/${mediaId}_preview.gif`;
    await this.generatePreviewGif(tempPath, previewPath);
    const previewBuffer = await fs.readFile(previewPath);
    const previewUrl = await this.uploadDerivative(tenantSlug, mediaId, 'preview', previewBuffer);

    // Cleanup temp files
    await Promise.all([
      fs.unlink(tempPath),
      fs.unlink(thumbnailPath),
      fs.unlink(previewPath),
    ]);

    return {
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      contentHash: await this.computeHash(await storage.download(storagePath)),
      derivatives: {
        thumbnail: thumbnailUrl,
        preview: previewUrl,
      },
    };
  }

  private async uploadDerivative(
    tenantSlug: string,
    mediaId: string,
    variant: string,
    buffer: Buffer
  ): Promise<string> {
    const path = `tenants/${tenantSlug}/media/${mediaId}/${variant}.jpg`;
    await storage.upload(path, buffer);
    return path;
  }

  private async computeHash(buffer: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
```

---

## 10. Publishing System

### 10.1 Adapter Pattern

```typescript
// apps/api/src/modules/publishing/adapters/adapter.interface.ts

export interface PublishingAdapter {
  name: string;
  supportedPlatforms: string[];

  publish(input: PublishInput): Promise<PublishResult>;
  getPostStatus(postId: string): Promise<PostStatus>;
  deletePost(postId: string): Promise<void>;
}

export interface PublishInput {
  mediaUrl: string;
  caption: string;
  hashtags?: string[];
  destination: Destination;
  scheduledAt?: Date;
  idempotencyKey: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}
```

### 10.2 Late Adapter

```typescript
// apps/api/src/modules/publishing/adapters/late.adapter.ts

import { PublishingAdapter, PublishInput, PublishResult } from './adapter.interface';

export class LateAdapter implements PublishingAdapter {
  name = 'late';
  supportedPlatforms = ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok'];

  private apiKey: string;
  private baseUrl = 'https://api.getlate.dev/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const { mediaUrl, caption, hashtags, destination, scheduledAt, idempotencyKey } = input;

    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          media_url: mediaUrl,
          caption: hashtags ? `${caption}\n\n${hashtags.join(' ')}` : caption,
          account_id: destination.platformAccountId,
          scheduled_at: scheduledAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Late API error',
        };
      }

      const data = await response.json();

      return {
        success: true,
        postId: data.id,
        postUrl: data.post_url,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  async getPostStatus(postId: string): Promise<PostStatus> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    const data = await response.json();

    return {
      status: data.status, // 'scheduled', 'published', 'failed'
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      error: data.error_message,
    };
  }

  async deletePost(postId: string): Promise<void> {
    await fetch(`${this.baseUrl}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
  }
}
```

### 10.3 Direct Adapter (Future)

```typescript
// apps/api/src/modules/publishing/adapters/direct.adapter.ts

import { PublishingAdapter, PublishInput, PublishResult } from './adapter.interface';

export class DirectAdapter implements PublishingAdapter {
  name = 'direct';
  supportedPlatforms = ['instagram', 'twitter'];

  private platformClients: Map<string, PlatformClient>;

  constructor() {
    this.platformClients = new Map();
    // Initialize platform-specific clients
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const client = this.platformClients.get(input.destination.platform);
    
    if (!client) {
      return {
        success: false,
        error: `Platform ${input.destination.platform} not supported for direct publishing`,
      };
    }

    return await client.publish(input);
  }

  async getPostStatus(postId: string): Promise<PostStatus> {
    // Implementation depends on platform
    throw new Error('Not implemented');
  }

  async deletePost(postId: string): Promise<void> {
    // Implementation depends on platform
    throw new Error('Not implemented');
  }
}
```

### 10.4 Publishing Service

```typescript
// apps/api/src/modules/publishing/publishing.service.ts

import { temporalClient } from '../../lib/temporal';
import { publishingWorkflow } from '@socialflow/temporal-worker/workflows';

export class PublishingService {
  private adapters: Map<string, PublishingAdapter>;

  constructor() {
    this.adapters = new Map();
    this.adapters.set('late', new LateAdapter(process.env.LATE_API_KEY!));
    // Add direct adapter when ready
    // this.adapters.set('direct', new DirectAdapter());
  }

  async schedulePost(input: SchedulePostInput): Promise<PublishingJob> {
    const { tenantSlug, mediaId, caption, destinations, scheduledAt, userId } = input;

    return await withTenantSchema(tenantSlug, async (db) => {
      return await db.transaction(async (trx) => {
        // Generate idempotency key
        const idempotencyKey = `${tenantSlug}-${mediaId}-${scheduledAt.getTime()}`;

        // Create job record
        const [job] = await trx.insert(publishingJobs).values({
          mediaId,
          caption,
          destinations: JSON.stringify(destinations),
          scheduledAt,
          status: 'scheduled',
          idempotencyKey,
          createdBy: userId,
        }).returning();

        // Start Temporal workflow
        await temporalClient.workflow.start(publishingWorkflow, {
          workflowId: `publish-${job.id}`,
          taskQueue: 'socialflow-main',
          args: [{
            tenantId: tenantSlug,
            jobId: job.id,
            mediaId,
            caption,
            destinations,
            scheduledAt,
            adapter: this.getPreferredAdapter(destinations),
            idempotencyKey,
          }],
        });

        // Emit event
        await publishEvent(trx, {
          aggregateType: 'publishing',
          aggregateId: job.id,
          eventType: 'publishing.scheduled',
          payload: { tenantSlug, jobId: job.id, scheduledAt },
        });

        return job;
      });
    });
  }

  private getPreferredAdapter(destinations: Destination[]): 'late' | 'direct' {
    // Use feature flag or config to determine adapter
    // For now, always use Late
    return 'late';
  }
}
```

---

## 11. Search & Analytics

### 11.1 Vector Search with pgvector

```typescript
// apps/api/src/modules/search/vector.service.ts

import { db } from '../../lib/db';
import { sql } from 'drizzle-orm';

export class VectorService {
  
  async semanticSearch(input: SemanticSearchInput): Promise<SearchResult[]> {
    const { tenantSlug, queryEmbedding, limit = 20, threshold = 0.7 } = input;

    return await withTenantSchema(tenantSlug, async (db) => {
      // Use pgvector cosine distance operator <=>
      const results = await db.execute(sql`
        SELECT 
          id,
          filename,
          caption,
          thumbnail_path,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM media_items
        WHERE 
          status = 'ready'
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      `);

      return results.rows as SearchResult[];
    });
  }

  async hybridSearch(input: HybridSearchInput): Promise<SearchResult[]> {
    const { tenantSlug, query, queryEmbedding, limit = 20 } = input;

    return await withTenantSchema(tenantSlug, async (db) => {
      // Combine full-text and vector search with RRF (Reciprocal Rank Fusion)
      const results = await db.execute(sql`
        WITH text_search AS (
          SELECT 
            id,
            ts_rank(to_tsvector('english', coalesce(caption, '') || ' ' || coalesce(description, '')), 
                    plainto_tsquery('english', ${query})) as text_score,
            ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', coalesce(caption, '') || ' ' || coalesce(description, '')), 
                    plainto_tsquery('english', ${query})) DESC) as text_rank
          FROM media_items
          WHERE 
            status = 'ready'
            AND to_tsvector('english', coalesce(caption, '') || ' ' || coalesce(description, '')) 
                @@ plainto_tsquery('english', ${query})
        ),
        vector_search AS (
          SELECT 
            id,
            1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as vector_score,
            ROW_NUMBER() OVER (ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as vector_rank
          FROM media_items
          WHERE 
            status = 'ready'
            AND embedding IS NOT NULL
        )
        SELECT 
          m.id,
          m.filename,
          m.caption,
          m.thumbnail_path,
          COALESCE(1.0 / (60 + ts.text_rank), 0) + COALESCE(1.0 / (60 + vs.vector_rank), 0) as rrf_score
        FROM media_items m
        LEFT JOIN text_search ts ON m.id = ts.id
        LEFT JOIN vector_search vs ON m.id = vs.id
        WHERE ts.id IS NOT NULL OR vs.id IS NOT NULL
        ORDER BY rrf_score DESC
        LIMIT ${limit}
      `);

      return results.rows as SearchResult[];
    });
  }
}
```

### 11.2 Analytics Events

```typescript
// apps/api/src/modules/search/analytics.service.ts

export class AnalyticsService {
  
  async trackEvent(input: TrackEventInput): Promise<void> {
    const { tenantSlug, eventType, entityType, entityId, userId, metadata } = input;

    await withTenantSchema(tenantSlug, async (db) => {
      await db.insert(analyticsEvents).values({
        eventType,
        entityType,
        entityId,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    });
  }

  async getMediaAnalytics(tenantSlug: string, mediaId: string): Promise<MediaAnalytics> {
    return await withTenantSchema(tenantSlug, async (db) => {
      const stats = await db.execute(sql`
        SELECT 
          event_type,
          COUNT(*) as count
        FROM analytics_events
        WHERE entity_type = 'media' AND entity_id = ${mediaId}
        GROUP BY event_type
      `);

      const publishing = await db.query.publishingJobs.findMany({
        where: eq(publishingJobs.mediaId, mediaId),
      });

      return {
        views: stats.rows.find(r => r.event_type === 'media.viewed')?.count || 0,
        downloads: stats.rows.find(r => r.event_type === 'media.downloaded')?.count || 0,
        timesPublished: publishing.filter(j => j.status === 'published').length,
        platforms: [...new Set(publishing.flatMap(j => JSON.parse(j.destinations).map(d => d.platform)))],
      };
    });
  }

  async getUsageReport(tenantSlug: string, period: 'day' | 'week' | 'month'): Promise<UsageReport> {
    const startDate = this.getStartDate(period);

    return await withTenantSchema(tenantSlug, async (db) => {
      const [mediaStats, publishingStats, aiStats] = await Promise.all([
        // Media uploads
        db.execute(sql`
          SELECT COUNT(*) as count
          FROM media_items
          WHERE created_at >= ${startDate}
        `),
        
        // Posts published
        db.execute(sql`
          SELECT COUNT(*) as count
          FROM publishing_jobs
          WHERE status = 'published' AND published_at >= ${startDate}
        `),
        
        // AI tokens used
        db.execute(sql`
          SELECT SUM(total_tokens) as total_tokens
          FROM ai_conversations
          WHERE created_at >= ${startDate}
        `),
      ]);

      return {
        period,
        mediaUploaded: mediaStats.rows[0].count,
        postsPublished: publishingStats.rows[0].count,
        aiTokensUsed: aiStats.rows[0].total_tokens || 0,
      };
    });
  }
}
```

---

## 12. Authentication & Authorization

### 12.1 Clerk Integration

```typescript
// apps/api/src/middleware/auth.middleware.ts

import { clerkClient } from '@clerk/clerk-sdk-node';
import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../lib/db';
import { users, tenantUsers, tenants } from '@socialflow/db/schema';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    // Verify JWT with Clerk
    const payload = await clerkClient.verifyToken(token);
    
    // Get or create user
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, payload.sub),
    });

    if (!user) {
      // First login - create user record
      const clerkUser = await clerkClient.users.getUser(payload.sub);
      
      [user] = await db.insert(users).values({
        clerkId: payload.sub,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
        avatarUrl: clerkUser.imageUrl,
      }).returning();
    }

    // Get tenant from header or default
    const tenantId = request.headers['x-tenant-id'] as string;
    let tenant = null;
    let userRole = null;

    if (tenantId) {
      // Verify user has access to this tenant
      const membership = await db.query.tenantUsers.findFirst({
        where: and(
          eq(tenantUsers.userId, user.id),
          eq(tenantUsers.tenantId, tenantId),
        ),
        with: { tenant: true },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Access denied to tenant' });
      }

      tenant = membership.tenant;
      userRole = membership.role;
    }

    // Attach to request
    request.user = user;
    request.tenant = tenant;
    request.userRole = userRole;

  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
```

### 12.2 RBAC

```typescript
// apps/api/src/lib/rbac.ts

type Permission = 
  | 'media:read' | 'media:write' | 'media:delete'
  | 'publishing:read' | 'publishing:write' | 'publishing:delete'
  | 'ai:use'
  | 'team:read' | 'team:invite' | 'team:manage'
  | 'billing:read' | 'billing:manage'
  | 'settings:read' | 'settings:manage';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    'media:read', 'media:write', 'media:delete',
    'publishing:read', 'publishing:write', 'publishing:delete',
    'ai:use',
    'team:read', 'team:invite', 'team:manage',
    'billing:read', 'billing:manage',
    'settings:read', 'settings:manage',
  ],
  admin: [
    'media:read', 'media:write', 'media:delete',
    'publishing:read', 'publishing:write', 'publishing:delete',
    'ai:use',
    'team:read', 'team:invite',
    'settings:read', 'settings:manage',
  ],
  editor: [
    'media:read', 'media:write',
    'publishing:read', 'publishing:write',
    'ai:use',
    'team:read',
  ],
  viewer: [
    'media:read',
    'publishing:read',
    'team:read',
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function requirePermission(permission: Permission) {
  return async ({ ctx, next }) => {
    if (!ctx.userRole || !hasPermission(ctx.userRole, permission)) {
      throw new TRPCError({ 
        code: 'FORBIDDEN', 
        message: `Missing permission: ${permission}` 
      });
    }
    return next();
  };
}

// Usage in router
export const mediaRouter = router({
  list: tenantProcedure
    .use(requirePermission('media:read'))
    .query(async ({ ctx }) => {
      // ...
    }),

  delete: tenantProcedure
    .use(requirePermission('media:delete'))
    .input(z.object({ mediaId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // ...
    }),
});
```

---

## 13. Infrastructure & Deployment

### 13.1 Docker Configuration

```dockerfile
# apps/api/Dockerfile
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @socialflow/api build
RUN pnpm --filter @socialflow/api deploy --prod /prod/api

FROM base AS runtime
WORKDIR /app
COPY --from=build /prod/api .

# Install sharp dependencies for image processing
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

```dockerfile
# apps/temporal-worker/Dockerfile
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/temporal-worker/package.json ./apps/temporal-worker/
COPY packages/ ./packages/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @socialflow/temporal-worker build
RUN pnpm --filter @socialflow/temporal-worker deploy --prod /prod/worker

FROM base AS runtime
WORKDIR /app
COPY --from=build /prod/worker .

# Install ffmpeg for video processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
CMD ["node", "dist/worker.js"]
```

### 13.2 Terraform (AWS)

```hcl
# infrastructure/main.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "socialflow-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "socialflow-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}

# RDS PostgreSQL
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "socialflow-db"

  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = "db.t4g.medium"

  allocated_storage     = 100
  max_allocated_storage = 500

  db_name  = "socialflow"
  username = "socialflow"
  port     = 5432

  vpc_security_group_ids = [module.security_group_rds.security_group_id]
  subnet_ids             = module.vpc.private_subnets

  backup_retention_period = 7
  deletion_protection     = true
  storage_encrypted       = true

  parameters = [
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements,pgaudit"
    }
  ]
}

# ElastiCache Redis
module "elasticache" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  cluster_id           = "socialflow-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"

  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [module.security_group_redis.security_group_id]
}

# ECS Cluster
module "ecs" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "~> 5.0"

  cluster_name = "socialflow"

  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = 100
      }
    }
  }
}

# ECS Service - API
resource "aws_ecs_service" "api" {
  name            = "socialflow-api"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [module.security_group_api.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 4000
  }
}

# ECS Service - Temporal Worker
resource "aws_ecs_service" "temporal_worker" {
  name            = "socialflow-temporal-worker"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.temporal_worker.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [module.security_group_worker.security_group_id]
    assign_public_ip = false
  }
}

# Application Load Balancer
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name               = "socialflow-alb"
  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  security_groups    = [module.security_group_alb.security_group_id]

  listeners = {
    https = {
      port            = 443
      protocol        = "HTTPS"
      certificate_arn = var.certificate_arn
      
      forward = {
        target_group_key = "api"
      }
    }
  }

  target_groups = {
    api = {
      name             = "socialflow-api"
      backend_protocol = "HTTP"
      backend_port     = 4000
      target_type      = "ip"
      
      health_check = {
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 3
      }
    }
  }
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "SocialFlow encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

# Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "socialflow/app-secrets"
  kms_key_id  = aws_kms_key.main.id
}
```

### 13.3 GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY_API: socialflow-api
  ECR_REPOSITORY_WORKER: socialflow-temporal-worker
  ECS_CLUSTER: socialflow
  ECS_SERVICE_API: socialflow-api
  ECS_SERVICE_WORKER: socialflow-temporal-worker

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - uses: aws-actions/amazon-ecr-login@v2
        id: login-ecr

      - name: Build and push API image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_API:$IMAGE_TAG -f apps/api/Dockerfile .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_API:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE_API \
            --force-new-deployment

  deploy-worker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - uses: aws-actions/amazon-ecr-login@v2
        id: login-ecr

      - name: Build and push Worker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_WORKER:$IMAGE_TAG -f apps/temporal-worker/Dockerfile .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_WORKER:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE_WORKER \
            --force-new-deployment

  deploy-flutter-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'
          
      - name: Build Flutter Web
        working-directory: apps/flutter
        run: |
          flutter pub get
          flutter build web --release
          
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: socialflow-web
          directory: apps/flutter/build/web
```

---

## 14. Observability

### 14.1 OpenTelemetry Setup

```typescript
// apps/api/src/lib/telemetry.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

export function setupOpenTelemetry() {
  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'socialflow-api',
      [ATTR_SERVICE_VERSION]: process.env.VERSION || '1.0.0',
      [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
      headers: {
        'Authorization': `Bearer ${process.env.OTEL_API_KEY}`,
      },
    }),
    
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/metrics',
        headers: {
          'Authorization': `Bearer ${process.env.OTEL_API_KEY}`,
        },
      }),
      exportIntervalMillis: 60000,
    }),
    
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-pg': {
          enhancedDatabaseReporting: true,
        },
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (req) => req.url === '/health',
        },
      }),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown().then(() => process.exit(0));
  });
}
```

### 14.2 Custom Metrics

```typescript
// apps/api/src/lib/metrics.ts

import { metrics, Counter, Histogram, UpDownCounter } from '@opentelemetry/api';

const meter = metrics.getMeter('socialflow-api');

// Counters
export const mediaUploadsCounter = meter.createCounter('media.uploads.total', {
  description: 'Total number of media uploads',
});

export const publishingJobsCounter = meter.createCounter('publishing.jobs.total', {
  description: 'Total number of publishing jobs',
});

export const aiRequestsCounter = meter.createCounter('ai.requests.total', {
  description: 'Total number of AI requests',
});

// Histograms
export const requestDurationHistogram = meter.createHistogram('http.request.duration', {
  description: 'HTTP request duration in milliseconds',
  unit: 'ms',
});

export const aiTokensHistogram = meter.createHistogram('ai.tokens.used', {
  description: 'AI tokens used per request',
});

// Gauges
export const activeWorkflowsGauge = meter.createUpDownCounter('temporal.workflows.active', {
  description: 'Number of active Temporal workflows',
});

// Usage
export function recordMediaUpload(tenantId: string, mimeType: string) {
  mediaUploadsCounter.add(1, {
    tenant_id: tenantId,
    mime_type: mimeType,
  });
}

export function recordAIRequest(tenantId: string, model: string, tokens: number, latencyMs: number) {
  aiRequestsCounter.add(1, {
    tenant_id: tenantId,
    model,
  });
  
  aiTokensHistogram.record(tokens, {
    tenant_id: tenantId,
    model,
  });
}
```

### 14.3 Structured Logging

```typescript
// apps/api/src/lib/logger.ts

import pino from 'pino';
import { trace, context } from '@opentelemetry/api';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  mixin() {
    // Add trace context to every log
    const span = trace.getSpan(context.active());
    if (span) {
      const spanContext = span.spanContext();
      return {
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
      };
    }
    return {};
  },
});

// Child logger with tenant context
export function createTenantLogger(tenantId: string, userId?: string) {
  return logger.child({
    tenant_id: tenantId,
    user_id: userId,
  });
}
```

---

## 15. Security

### 15.1 Security Checklist

| Category | Measure | Implementation |
|----------|---------|----------------|
| **Authentication** | JWT validation | Clerk SDK |
| **Authorization** | RBAC | Custom middleware |
| **Data Isolation** | Schema-per-tenant | PostgreSQL schemas |
| **Encryption at Rest** | Database | RDS encryption |
| **Encryption at Rest** | Object storage | R2 default encryption |
| **Encryption at Rest** | Secrets | KMS envelope encryption |
| **Encryption in Transit** | HTTPS | ALB + ACM certificate |
| **API Security** | Rate limiting | Fastify plugin |
| **API Security** | Input validation | Zod schemas |
| **API Security** | CORS | Strict origin whitelist |
| **Secrets Management** | API keys | AWS Secrets Manager |
| **Audit Logging** | All mutations | Database + OpenTelemetry |
| **Vulnerability Scanning** | Dependencies | Dependabot + npm audit |
| **Penetration Testing** | Annual | Third-party vendor |

### 15.2 Security Headers

```typescript
// apps/api/src/server.ts

await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.cloudflare.com"],
      connectSrc: ["'self'", process.env.API_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});
```

### 15.3 Input Validation

```typescript
// apps/api/src/modules/media/media.schema.ts

import { z } from 'zod';

export const uploadMediaSchema = z.object({
  filename: z.string()
    .min(1)
    .max(255)
    .regex(/^[\w\-. ]+$/, 'Invalid filename characters'),
  mimeType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
  ]),
  size: z.number()
    .int()
    .positive()
    .max(100 * 1024 * 1024, 'File too large (max 100MB)'),
});

export const generateCaptionSchema = z.object({
  mediaId: z.string().uuid(),
  customPrompt: z.string()
    .max(1000)
    .optional()
    .transform(val => val ? sanitizePrompt(val) : undefined),
});

function sanitizePrompt(prompt: string): string {
  // Remove potential prompt injection attempts
  return prompt
    .replace(/\bignore\b.*\binstructions?\b/gi, '')
    .replace(/\bsystem\b.*\bprompt\b/gi, '')
    .trim();
}
```

---

## 16. API Design

### 16.1 tRPC Router Structure

```typescript
// apps/api/src/trpc.ts

export const appRouter = router({
  // Identity & Auth
  identity: router({
    me: protectedProcedure.query(/* ... */),
    updateProfile: protectedProcedure.input(updateProfileSchema).mutation(/* ... */),
  }),

  // Tenant Management
  tenant: router({
    list: protectedProcedure.query(/* ... */),
    create: protectedProcedure.input(createTenantSchema).mutation(/* ... */),
    update: adminProcedure.input(updateTenantSchema).mutation(/* ... */),
    invite: adminProcedure.input(inviteUserSchema).mutation(/* ... */),
  }),

  // Media
  media: router({
    list: tenantProcedure.input(listMediaSchema).query(/* ... */),
    get: tenantProcedure.input(z.object({ id: z.string().uuid() })).query(/* ... */),
    createUploadUrl: tenantProcedure.input(uploadMediaSchema).mutation(/* ... */),
    confirmUpload: tenantProcedure.input(confirmUploadSchema).mutation(/* ... */),
    delete: tenantProcedure.input(z.object({ id: z.string().uuid() })).mutation(/* ... */),
  }),

  // AI
  ai: router({
    generateCaption: tenantProcedure.input(generateCaptionSchema).mutation(/* ... */),
    regenerateCaption: tenantProcedure.input(regenerateCaptionSchema).mutation(/* ... */),
    getUsage: tenantProcedure.query(/* ... */),
    setApiKey: adminProcedure.input(setApiKeySchema).mutation(/* ... */),
  }),

  // Publishing
  publishing: router({
    schedule: tenantProcedure.input(schedulePostSchema).mutation(/* ... */),
    list: tenantProcedure.input(listJobsSchema).query(/* ... */),
    get: tenantProcedure.input(z.object({ id: z.string().uuid() })).query(/* ... */),
    cancel: tenantProcedure.input(z.object({ id: z.string().uuid() })).mutation(/* ... */),
    approve: tenantProcedure.input(approveSchema).mutation(/* ... */),
    reject: tenantProcedure.input(rejectSchema).mutation(/* ... */),
  }),

  // Social Accounts
  socialAccounts: router({
    list: tenantProcedure.query(/* ... */),
    connect: tenantProcedure.input(connectAccountSchema).mutation(/* ... */),
    disconnect: tenantProcedure.input(z.object({ id: z.string().uuid() })).mutation(/* ... */),
  }),

  // Search
  search: router({
    media: tenantProcedure.input(searchMediaSchema).query(/* ... */),
    semantic: tenantProcedure.input(semanticSearchSchema).query(/* ... */),
  }),

  // Sync (for offline)
  sync: router({
    push: tenantProcedure.input(syncPushSchema).mutation(/* ... */),
    pull: tenantProcedure.input(syncPullSchema).query(/* ... */),
  }),

  // Analytics
  analytics: router({
    usage: tenantProcedure.input(usageReportSchema).query(/* ... */),
    mediaStats: tenantProcedure.input(z.object({ mediaId: z.string().uuid() })).query(/* ... */),
  }),
});
```

### 16.2 REST Endpoints (for non-tRPC clients)

```typescript
// apps/api/src/routes/rest.ts

// For clients that can't use tRPC (webhooks, third-party integrations)

fastify.post('/webhooks/late', async (request, reply) => {
  // Handle Late.com webhooks
  const signature = request.headers['x-late-signature'];
  if (!verifyLateSignature(signature, request.body)) {
    return reply.status(401).send({ error: 'Invalid signature' });
  }
  
  const event = request.body as LateWebhookEvent;
  await handleLateWebhook(event);
  
  return { received: true };
});

fastify.post('/webhooks/clerk', async (request, reply) => {
  // Handle Clerk webhooks (user created, updated, etc.)
  const event = await verifyClerkWebhook(request);
  await handleClerkWebhook(event);
  
  return { received: true };
});

fastify.post('/webhooks/stripe', async (request, reply) => {
  // Handle Stripe webhooks
  const event = await verifyStripeWebhook(request);
  await handleStripeWebhook(event);
  
  return { received: true };
});
```

---

## 17. Offline & Sync

### 17.1 Sync Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Offline Sync Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Local Changes                      Server                  │
│   ┌─────────┐                       ┌─────────┐             │
│   │ Drift   │  ───── Push ─────────> │  API    │             │
│   │ SQLite  │                       │         │             │
│   │         │ <───── Pull ───────── │         │             │
│   └─────────┘                       └─────────┘             │
│       │                                  │                   │
│       │ isDirty flag                     │ updatedAt         │
│       │ syncQueue table                  │ tombstones        │
│       │                                  │                   │
│   Conflict Resolution: Server Wins (with user notification) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 17.2 Flutter Sync Engine

```dart
// lib/data/sync/sync_engine.dart

import 'package:drift/drift.dart';
import '../datasources/local/database.dart';
import '../datasources/remote/api_client.dart';

class SyncEngine {
  final AppDatabase _db;
  final ApiClient _api;
  final ConnectivityService _connectivity;
  
  Timer? _syncTimer;
  bool _isSyncing = false;

  SyncEngine(this._db, this._api, this._connectivity);

  void startPeriodicSync() {
    _syncTimer = Timer.periodic(
      const Duration(minutes: 5),
      (_) => sync(),
    );
    
    // Also sync on connectivity change
    _connectivity.onConnectivityChanged.listen((connected) {
      if (connected) sync();
    });
  }

  Future<SyncResult> sync() async {
    if (_isSyncing) return SyncResult.alreadyInProgress;
    if (!await _connectivity.isConnected) return SyncResult.offline;

    _isSyncing = true;
    
    try {
      // 1. Push local changes
      final pushResult = await _pushChanges();
      
      // 2. Pull remote changes
      final pullResult = await _pullChanges();
      
      return SyncResult.success(
        pushed: pushResult.count,
        pulled: pullResult.count,
        conflicts: pullResult.conflicts,
      );
    } catch (e) {
      return SyncResult.error(e.toString());
    } finally {
      _isSyncing = false;
    }
  }

  Future<PushResult> _pushChanges() async {
    // Get all items in sync queue
    final queue = await _db.select(_db.syncQueue).get();
    
    if (queue.isEmpty) return PushResult(count: 0);

    final payload = SyncPushRequest(
      changes: queue.map((item) => SyncChange(
        entityType: item.entityType,
        entityId: item.entityId,
        operation: item.operation,
        payload: jsonDecode(item.payload),
        timestamp: item.createdAt,
      )).toList(),
    );

    final response = await _api.pushChanges(payload);

    // Remove successfully synced items
    for (final success in response.succeeded) {
      await (_db.delete(_db.syncQueue)
        ..where((t) => t.entityId.equals(success.entityId)))
        .go();
    }

    // Handle conflicts
    for (final conflict in response.conflicts) {
      await _handleConflict(conflict);
    }

    return PushResult(
      count: response.succeeded.length,
      conflicts: response.conflicts.length,
    );
  }

  Future<PullResult> _pullChanges() async {
    // Get last sync timestamp
    final lastSync = await _getLastSyncTime();
    
    final response = await _api.pullChanges(lastSync);

    int count = 0;
    final conflicts = <SyncConflict>[];

    await _db.transaction(() async {
      for (final change in response.changes) {
        final hasLocalChange = await _hasUnpushedChange(
          change.entityType,
          change.entityId,
        );

        if (hasLocalChange) {
          // Conflict: local change exists
          conflicts.add(SyncConflict(
            entityType: change.entityType,
            entityId: change.entityId,
            serverVersion: change,
          ));
          // Server wins - apply server version
        }

        await _applyRemoteChange(change);
        count++;
      }

      // Update last sync time
      await _setLastSyncTime(response.serverTime);
    });

    return PullResult(count: count, conflicts: conflicts);
  }

  Future<void> _applyRemoteChange(SyncChange change) async {
    switch (change.entityType) {
      case 'media':
        await _applyMediaChange(change);
        break;
      case 'publishing_job':
        await _applyPublishingJobChange(change);
        break;
    }
  }

  Future<void> _applyMediaChange(SyncChange change) async {
    final media = MediaItemCompanion.fromJson(change.payload);
    
    switch (change.operation) {
      case 'create':
      case 'update':
        await _db.into(_db.mediaItems).insertOnConflictUpdate(media);
        break;
      case 'delete':
        await (_db.delete(_db.mediaItems)
          ..where((t) => t.id.equals(change.entityId)))
          .go();
        break;
    }
  }

  // Queue local change for sync
  Future<void> queueChange({
    required String entityType,
    required String entityId,
    required String operation,
    required Map<String, dynamic> payload,
  }) async {
    await _db.into(_db.syncQueue).insert(SyncQueueCompanion.insert(
      entityType: entityType,
      entityId: entityId,
      operation: operation,
      payload: jsonEncode(payload),
      createdAt: DateTime.now(),
    ));
    
    // Mark entity as dirty
    await _markDirty(entityType, entityId);
  }
}
```

### 17.3 Backend Sync Endpoints

```typescript
// apps/api/src/modules/sync/sync.service.ts

export class SyncService {
  
  async pushChanges(tenantSlug: string, input: SyncPushInput): Promise<SyncPushResponse> {
    const succeeded: SyncSuccess[] = [];
    const conflicts: SyncConflict[] = [];
    const failed: SyncFailure[] = [];

    await withTenantSchema(tenantSlug, async (db) => {
      for (const change of input.changes) {
        try {
          // Check for conflicts (server has newer version)
          const serverVersion = await this.getServerVersion(db, change.entityType, change.entityId);
          
          if (serverVersion && serverVersion.updatedAt > change.timestamp) {
            conflicts.push({
              entityType: change.entityType,
              entityId: change.entityId,
              clientVersion: change,
              serverVersion,
            });
            continue;
          }

          // Apply change
          await this.applyChange(db, change);
          
          succeeded.push({
            entityType: change.entityType,
            entityId: change.entityId,
          });

        } catch (error) {
          failed.push({
            entityType: change.entityType,
            entityId: change.entityId,
            error: String(error),
          });
        }
      }
    });

    return { succeeded, conflicts, failed };
  }

  async pullChanges(tenantSlug: string, since?: Date): Promise<SyncPullResponse> {
    const changes: SyncChange[] = [];
    const serverTime = new Date();

    await withTenantSchema(tenantSlug, async (db) => {
      // Get updated media items
      const mediaItems = await db.query.mediaItems.findMany({
        where: since ? gt(mediaItems.updatedAt, since) : undefined,
      });

      for (const item of mediaItems) {
        changes.push({
          entityType: 'media',
          entityId: item.id,
          operation: 'update',
          payload: item,
          timestamp: item.updatedAt,
        });
      }

      // Get updated publishing jobs
      const jobs = await db.query.publishingJobs.findMany({
        where: since ? gt(publishingJobs.updatedAt, since) : undefined,
      });

      for (const job of jobs) {
        changes.push({
          entityType: 'publishing_job',
          entityId: job.id,
          operation: 'update',
          payload: job,
          timestamp: job.updatedAt,
        });
      }

      // Get deleted items (tombstones)
      // Would need a separate tombstones table to track deletes
    });

    return { changes, serverTime };
  }
}
```

---

## 18. Module Boundaries

### 18.1 Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    Module Dependencies                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                      ┌──────────┐                           │
│                      │ Identity │                           │
│                      └────┬─────┘                           │
│                           │                                  │
│              ┌────────────┼────────────┐                    │
│              │            │            │                    │
│        ┌─────▼────┐ ┌─────▼────┐ ┌─────▼────┐              │
│        │Entitle-  │ │  Media   │ │Publishing│              │
│        │ments     │ │          │ │          │              │
│        └────┬─────┘ └────┬─────┘ └────┬─────┘              │
│             │            │            │                     │
│             │      ┌─────▼────┐       │                     │
│             │      │    AI    │◄──────┘                     │
│             │      │ Gateway  │                             │
│             │      └────┬─────┘                             │
│             │           │                                   │
│        ┌────▼───────────▼────┐                             │
│        │       Search        │                             │
│        └─────────────────────┘                             │
│                                                             │
│  Arrows indicate "depends on" / "calls"                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 18.2 Module Contracts

```typescript
// packages/contracts/src/media.contract.ts

export interface MediaModuleContract {
  // Commands
  createUploadUrl(input: CreateUploadUrlInput): Promise<UploadUrlResponse>;
  confirmUpload(input: ConfirmUploadInput): Promise<MediaItem>;
  deleteMedia(input: DeleteMediaInput): Promise<void>;
  updateCaption(input: UpdateCaptionInput): Promise<MediaItem>;

  // Queries
  getMediaItem(id: string): Promise<MediaItem | null>;
  listMediaItems(input: ListMediaInput): Promise<PaginatedResult<MediaItem>>;
  getDownloadUrl(storagePath: string): Promise<string>;

  // Events Published
  events: {
    'media.uploaded': { tenantId: string; mediaId: string; userId: string };
    'media.processed': { tenantId: string; mediaId: string; derivatives: Derivatives };
    'media.approved': { tenantId: string; mediaId: string; caption: string };
    'media.deleted': { tenantId: string; mediaId: string };
  };
}

// packages/contracts/src/ai.contract.ts

export interface AIModuleContract {
  // Commands
  generateCaption(input: GenerateCaptionInput): Promise<CaptionResponse>;
  generateEmbedding(input: EmbeddingInput): Promise<EmbeddingResponse>;
  setTenantApiKey(tenantId: string, apiKey: string): Promise<void>;
  deleteTenantApiKey(tenantId: string): Promise<void>;

  // Queries
  getUsage(tenantId: string, period: Period): Promise<UsageReport>;
  getRemainingBudget(tenantId: string): Promise<number>;

  // Events Published
  events: {
    'ai.caption.generated': { tenantId: string; mediaId: string; tokens: number };
    'ai.budget.warning': { tenantId: string; remaining: number };
    'ai.budget.exceeded': { tenantId: string };
  };
}

// packages/contracts/src/publishing.contract.ts

export interface PublishingModuleContract {
  // Commands
  schedulePost(input: SchedulePostInput): Promise<PublishingJob>;
  cancelJob(jobId: string): Promise<void>;
  approveJob(jobId: string, reviewerId: string): Promise<PublishingJob>;
  rejectJob(jobId: string, reviewerId: string, reason?: string): Promise<PublishingJob>;

  // Queries
  getJob(jobId: string): Promise<PublishingJob | null>;
  listJobs(input: ListJobsInput): Promise<PaginatedResult<PublishingJob>>;
  getJobStatus(jobId: string): Promise<JobStatus>;

  // Events Published
  events: {
    'publishing.scheduled': { tenantId: string; jobId: string; scheduledAt: Date };
    'publishing.started': { tenantId: string; jobId: string };
    'publishing.completed': { tenantId: string; jobId: string; results: DestinationResult[] };
    'publishing.failed': { tenantId: string; jobId: string; error: string };
  };
}
```

---

## 19. Development Workflow

### 19.1 Local Development Setup

```bash
# Clone and install
git clone https://github.com/yourorg/socialflow.git
cd socialflow
pnpm install

# Start infrastructure
docker-compose up -d postgres redis temporal

# Run migrations
pnpm db:migrate

# Start development servers
pnpm dev
# This starts:
# - API server on http://localhost:4000
# - Temporal worker
# - Flutter web on http://localhost:3000

# In another terminal, run Flutter mobile
cd apps/flutter
flutter run
```

### 19.2 Docker Compose (Development)

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: socialflow
      POSTGRES_PASSWORD: localdev
      POSTGRES_DB: socialflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  temporal:
    image: temporalio/auto-setup:latest
    environment:
      - DB=postgres12
      - DB_PORT=5432
      - POSTGRES_USER=socialflow
      - POSTGRES_PWD=localdev
      - POSTGRES_SEEDS=postgres
    ports:
      - "7233:7233"
    depends_on:
      - postgres

  temporal-ui:
    image: temporalio/ui:latest
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
    ports:
      - "8080:8080"
    depends_on:
      - temporal

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    environment:
      LITELLM_MASTER_KEY: sk-local-dev-key
    ports:
      - "4001:4000"
    volumes:
      - ./config/litellm.yaml:/app/config.yaml

volumes:
  postgres_data:
  minio_data:
```

### 19.3 Environment Variables

```bash
# .env.development

# Database
DATABASE_URL=postgresql://socialflow:localdev@localhost:5432/socialflow

# Redis
REDIS_URL=redis://localhost:6379

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=socialflow

# Storage (MinIO locally, R2 in production)
R2_ENDPOINT=http://localhost:9000
R2_ACCESS_KEY_ID=minioadmin
R2_SECRET_ACCESS_KEY=minioadmin
R2_BUCKET=socialflow-dev

# AI Gateway
LITELLM_URL=http://localhost:4001
OPENAI_API_KEY=sk-xxx # For development

# Auth (Clerk)
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
LOG_LEVEL=debug

# API
PORT=4000
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

---

## 20. Phased Roadmap

### Phase 1: Foundation (Months 1-3)

**Month 1: Core Infrastructure**
- [ ] Monorepo setup (Turborepo + pnpm)
- [ ] PostgreSQL with schema-per-tenant
- [ ] Fastify + tRPC API scaffold
- [ ] Clerk authentication integration
- [ ] Basic Flutter app structure
- [ ] Local development environment (Docker Compose)

**Month 2: Media & Storage**
- [ ] R2 integration with presigned uploads
- [ ] Media processing pipeline (Sharp, FFmpeg)
- [ ] Temporal workflows for processing
- [ ] Transactional outbox for events
- [ ] Flutter media upload UI
- [ ] Drift local database setup

**Month 3: AI & Caption Generation**
- [ ] LiteLLM integration
- [ ] AI Gateway with rate limiting
- [ ] BYOK key management (KMS)
- [ ] Caption generation workflow
- [ ] Human approval workflow (Temporal signals)
- [ ] Flutter caption review UI

### Phase 2: Publishing & Sync (Months 4-6)

**Month 4: Publishing System**
- [ ] Late API adapter
- [ ] Publishing workflow with scheduling
- [ ] Social account connection (OAuth)
- [ ] Idempotency and retry logic
- [ ] Receipt storage and status tracking
- [ ] Flutter publishing UI

**Month 5: Search & Analytics**
- [ ] pgvector for semantic search
- [ ] Embedding generation pipeline
- [ ] Hybrid search (text + vector)
- [ ] Analytics event tracking
- [ ] Usage reporting
- [ ] Flutter search UI

**Month 6: Offline & Sync**
- [ ] Sync engine (push/pull)
- [ ] Conflict resolution
- [ ] Offline queue in Flutter
- [ ] Background sync
- [ ] Desktop local Ollama integration
- [ ] Flutter offline indicators

### Phase 3: Production & Scale (Months 7-9)

**Month 7: Production Hardening**
- [ ] OpenTelemetry instrumentation
- [ ] Structured logging (Axiom/Datadog)
- [ ] Error tracking (Sentry)
- [ ] Security audit
- [ ] Performance testing
- [ ] CI/CD pipelines

**Month 8: Platform Releases**
- [ ] Flutter Web deployment (Cloudflare Pages)
- [ ] iOS App Store submission
- [ ] Android Play Store submission
- [ ] Windows/macOS desktop builds
- [ ] Auto-update mechanism

**Month 9: Billing & Teams**
- [ ] Stripe integration
- [ ] Plan enforcement (Entitlements module)
- [ ] Team invitations
- [ ] RBAC refinement
- [ ] Admin dashboard
- [ ] Usage-based billing

### Phase 4: Enterprise (Months 10-12)

**Month 10: Enterprise Features**
- [ ] SSO (SAML/OIDC via Clerk)
- [ ] SCIM provisioning
- [ ] Audit log UI
- [ ] Data export/import
- [ ] Custom branding (white-label)

**Month 11: Direct Publishing**
- [ ] Instagram Graph API adapter
- [ ] Twitter API adapter
- [ ] LinkedIn API adapter
- [ ] Feature flag for adapter switching
- [ ] Late deprecation path

**Month 12: Scale & Compliance**
- [ ] SOC 2 Type I preparation
- [ ] Multi-region deployment
- [ ] BYOS (customer storage buckets)
- [ ] Dedicated database option
- [ ] Performance optimization
- [ ] Documentation completion

---

## Appendix A: Key Documentation Links

### Flutter
- [Flutter Documentation](https://docs.flutter.dev/)
- [Riverpod Documentation](https://riverpod.dev/)
- [Drift Documentation](https://drift.simonbinder.eu/)
- [go_router Documentation](https://pub.dev/packages/go_router)

### Backend
- [Fastify Documentation](https://fastify.dev/docs/latest/)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Temporal TypeScript SDK](https://docs.temporal.io/develop/typescript)

### Infrastructure
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)

### AI
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Ollama Documentation](https://ollama.ai/)

### Auth
- [Clerk Documentation](https://clerk.com/docs)

### Observability
- [OpenTelemetry JS Documentation](https://opentelemetry.io/docs/languages/js/)

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **BYOK** | Bring Your Own Key - customers provide their own API keys |
| **BYOS** | Bring Your Own Storage - customers use their own S3 buckets |
| **RLS** | Row Level Security - PostgreSQL feature for row-based access control |
| **tRPC** | TypeScript RPC - end-to-end type-safe API framework |
| **Temporal** | Workflow orchestration platform for durable execution |
| **pgvector** | PostgreSQL extension for vector similarity search |
| **Transactional Outbox** | Pattern ensuring database changes and events are atomic |
| **LiteLLM** | Open-source LLM gateway supporting 100+ providers |
| **Drift** | Type-safe SQLite wrapper for Flutter |
| **Riverpod** | State management solution for Flutter |
