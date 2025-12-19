# SocialFlow Architecture: From n8n MVP to Enterprise-Ready B2B SaaS

**Bottom line:** For a 3-person React/TypeScript team with a 3-month runway, the optimal architecture is a **web-first React SPA wrapped with Tauri (desktop) and Capacitor (mobile)**, backed by a **modular monolith using Fastify + tRPC**, with **PostgreSQL + RLS for multi-tenancy**, **LiteLLM for AI gateway**, and **Cloudflare R2 + pgvector for media and search**. This stack maximizes team skills, minimizes operational overhead, and provides a clean migration path to enterprise scale.

---

## 1. Recommended default architecture

The architecture below prioritizes **velocity with a clean path to scale**—choosing managed services and proven patterns that a small team can operate while remaining SOC 2-ready from day one.

### Frontend: Web-first + native wrappers

Build a single **React + TypeScript + Vite** codebase deployed three ways: as a PWA for web, wrapped with **Tauri 2.0** for desktop (Windows/macOS), and wrapped with **Capacitor 6.x** for mobile (iOS/Android). This achieves **85-95% code reuse** across all platforms while leveraging your team's existing React expertise.

Tauri's Rust backend provides native filesystem access for local Ollama integration and encrypted SQLite for desktop offline mode. Capacitor's SQLite plugin handles mobile offline caching for library and drafts. The web PWA uses service workers via Workbox for online-first operation with graceful offline degradation.

### Backend: Modular monolith with tRPC

Deploy a **single Fastify + tRPC server** organized as a modular monolith with strict module boundaries. Each domain (Identity, Media, Publishing, AI, Search) lives in its own directory with explicit exports—no direct imports between modules. Communication happens via in-memory events initially, migrating to Redis pub/sub when needed.

tRPC provides end-to-end type safety between your React frontend and Node backend without code generation—ideal for a team where 2 of 3 developers work across the full stack. The monolith ships as a single container to **AWS ECS/Fargate** or **Railway**, eliminating Kubernetes complexity for your DevOps-constrained team.

### Data layer: PostgreSQL with Row Level Security

A single **PostgreSQL 16** instance (AWS RDS or Neon) handles all data with **Row Level Security (RLS)** for tenant isolation. Set tenant context via `current_setting('app.current_tenant')` at request start, enforced by RLS policies on every tenant table. This provides SOC 2-compliant isolation without the operational burden of schema-per-tenant.

**pgvector** lives in the same database for semantic search, supporting up to 10-50M vectors before requiring a dedicated vector store. **pgAudit** captures all data access for compliance logging, shipped to S3 with immutable bucket policies.

### Infrastructure services

| Concern | Service | Rationale |
|---------|---------|-----------|
| **Auth/SSO** | Clerk or Auth0 | OIDC/SAML/SCIM built-in, swappable via standards |
| **Object storage** | Cloudflare R2 | Zero egress fees, S3-compatible, BYOS-ready |
| **CDN** | Cloudflare | Bundled with R2, global edge |
| **Job orchestration** | Trigger.dev or BullMQ | TypeScript-first, managed or self-hosted |
| **AI Gateway** | LiteLLM (self-hosted) | 100+ providers, BYOK, full data control |
| **Email** | Resend or Postmark | Transactional + marketing, swappable |
| **Observability** | Datadog or Axiom | Logs, metrics, traces in one platform |
| **Secrets** | AWS Secrets Manager | Envelope encryption for tenant API keys |

### Key architectural decisions

**Why Tauri over Electron:** Tauri produces 600KB-3MB binaries versus Electron's 150MB+, uses system WebView for automatic security patches, and provides Rust-native Ollama integration without JavaScript bridging overhead.

**Why RLS over schema-per-tenant:** Your 3-month timeline cannot absorb migration complexity across hundreds of schemas. RLS provides compliant isolation in a single schema, with a documented migration path to schema isolation for enterprise customers requiring it later.

**Why tRPC over GraphQL:** tRPC's type inference eliminates schema drift without code generation. For an internal API consumed only by your own clients, tRPC's simplicity beats GraphQL's flexibility.

---

## 2. Multi-platform decision matrix

| Criterion | Web + Tauri + Capacitor | React Native/Expo | Flutter | .NET MAUI |
|-----------|-------------------------|-------------------|---------|-----------|
| **Team ramp-up time** | 1-2 weeks | 2-3 weeks | 4-6 weeks | 6-8 weeks |
| **Code reuse across platforms** | 85-95% | 60-80% | 70-90% | 80-90% |
| **Desktop offline + local Ollama** | ⭐⭐⭐⭐⭐ Native Rust | ⚠️ Experimental | ⭐⭐⭐ Plugin needed | ⭐⭐⭐⭐ Native .NET |
| **Mobile offline (drafts/cache)** | ⭐⭐⭐⭐ SQLite plugin | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Hive/Isar | ⭐⭐⭐⭐ EF Core |
| **Security model** | Strong (capability-based) | Good | Good | Strong |
| **App store risk** | Medium (add native features) | Low | Low | Low |
| **3-month feasibility** | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐ Medium | ⭐⭐ Low | ⭐ Very low |
| **Long-term maintainability** | Good (Tauri 2.0 stable) | Excellent (Meta backing) | Good (Google backing) | Good (Microsoft) |

**Recommendation: Web + Tauri + Capacitor.** This approach maximizes your React/TypeScript investment, meets all offline requirements, and is the only option achievable in 3 months by your team composition. Tauri's Rust backend has proven Ollama integration via ElectricSQL's RAG demo, and Capacitor's SQLite plugin handles mobile offline adequately.

**Key risk mitigation:** Apple may reject pure web wrappers under Guideline 4.2. Add native differentiators (push notifications via `@capacitor/push-notifications`, biometric unlock via `@capacitor/biometric-auth`, haptic feedback) to ensure approval.

---

## 3. Service and module boundaries

Structure the backend as **6 bounded modules** within a single deployable monolith, each exposing a clean interface via tRPC routers:

### Identity module
Handles authentication, authorization, and tenant management. Integrates with Clerk/Auth0 via OIDC. Owns the `tenants`, `users`, `sessions`, and `api_keys` tables. Sets tenant context for RLS on every request. Enforces RBAC policies.

### Entitlements module
Manages subscription tiers, feature flags, and usage quotas. Checks entitlements before expensive operations. Exposes `checkFeature(tenantId, feature)` and `checkQuota(tenantId, resource)` APIs. Integrates with Stripe for billing. Owns the `subscriptions`, `quotas`, and `usage_events` tables.

### Media module
Handles uploads (Uppy + tus), storage abstraction (R2/S3/BYOS), and derivatives generation (Sharp for images, FFmpeg for video). Owns the `media_items`, `media_derivatives`, and `upload_sessions` tables. Queues processing jobs to Trigger.dev/BullMQ. Strips EXIF metadata and computes content hashes.

### AI Gateway module
Routes LLM requests through LiteLLM proxy. Manages tenant API keys (encrypted with AWS KMS envelope encryption), enforces per-tenant rate limits and budgets, tracks token usage for billing. Handles Ollama localhost routing for desktop with SSRF protection. Owns the `llm_keys`, `llm_usage`, and `llm_budgets` tables.

### Publishing module
Abstracts social media publishing via the Provider interface pattern. Manages OAuth tokens with rotation, schedules posts via job queue, handles retries with exponential backoff, stores receipts. Initially wraps "Late" API, migrates to direct platform adapters via feature flags. Owns the `social_accounts`, `publishing_jobs`, and `publish_receipts` tables.

### Search and Analytics module
Manages embedding generation pipeline, hybrid search (pgvector + full-text), and event analytics. Owns the `embeddings` and `analytics_events` tables. Exposes semantic search via tRPC. Ships events to ClickHouse or BigQuery for product analytics.

### Module communication pattern

```
Request → Identity (set tenant context) → Router → Module Handler
                                                        ↓
                                              EventBus.emit('media.uploaded', {...})
                                                        ↓
                                              Other modules subscribe and react
```

Events are in-memory initially (`EventEmitter`), then Redis pub/sub, then PostgreSQL transactional outbox when you need guaranteed delivery. This progression matches your growth without premature complexity.

---

## 4. Phased roadmap

### Phase 1: MVP (Weeks 1-12)

**Weeks 1-4: Foundation**
- Monorepo setup (Turborepo + pnpm)
- Fastify + tRPC server scaffold with module structure
- PostgreSQL with RLS policies for core tables
- Clerk integration for auth (OIDC/SAML ready)
- React SPA with Vite, basic dashboard shell

**Weeks 5-8: Core features**
- Media upload with Uppy → R2 (skip tus initially, use S3 multipart)
- Image processing with Sharp (thumbnails, platform variants)
- Publishing module wrapping Late API
- Basic entitlements (free tier limits)
- Desktop build with Tauri (web content wrapped)

**Weeks 9-12: Polish and launch**
- Mobile build with Capacitor
- Offline mode: desktop SQLite for library, mobile cached drafts
- Stripe billing integration
- pgAudit + basic audit log UI
- Error tracking (Sentry), basic observability (Axiom)
- Security review, pen test prep
- **Ship to first paying customers**

**MVP tech stack:**
- Frontend: React 19 + TypeScript + Vite + TanStack Query
- Backend: Node.js 22 + Fastify + tRPC
- Database: PostgreSQL 16 (Neon or RDS) + RLS
- Storage: Cloudflare R2
- Auth: Clerk
- Jobs: BullMQ + Redis (Upstash)
- Hosting: Vercel (web), Railway (API), Cloudflare (CDN)

### Phase 2: v1.0 (Months 4-6)

**Features:**
- AI Gateway with LiteLLM (tenant BYOK)
- Semantic search with pgvector
- Video processing pipeline (FFmpeg → HLS)
- Desktop Ollama integration with Tauri isolation
- Team/workspace support
- Webhook integrations
- Enhanced analytics dashboard

**Infrastructure:**
- Migrate to ECS/Fargate or dedicated Railway for better scaling
- Add Trigger.dev for complex media + AI workflows
- Implement transactional outbox for reliable events
- SOC 2 Type I audit preparation

### Phase 3: v2.0 (Months 7-12)

**Features:**
- "SocialFlow Direct" publishing (replace Late adapter)
- Advanced AI features (content generation, auto-scheduling)
- Mobile offline expansion (full library sync)
- Enterprise SSO (SAML/SCIM via Clerk Enterprise)
- Admin portal for customer self-service

**Infrastructure:**
- BYOS implementation (customer S3/R2 buckets)
- Schema-per-tenant option for enterprise
- Multi-region deployment for latency/compliance
- Dedicated vector DB if pgvector hits limits
- SOC 2 Type II certification
- Single-tenant deployment option for largest customers

---

## 5. Top 10 security risks and mitigations

### 1. Cross-tenant data leakage via RLS bypass
**Risk:** Missing tenant context in queries exposes other tenants' data.
**Mitigation:** Set tenant context in middleware before any database access. Integration tests with multi-tenant fixtures asserting isolation. Code review checklist item for all new queries. Never use superuser role in application.

### 2. Tenant API key theft from database
**Risk:** Attacker with database read access obtains plaintext LLM/social API keys.
**Mitigation:** AWS KMS envelope encryption—keys stored encrypted, decrypted only in-memory during request. Key access logged via CloudTrail. Rotate data encryption keys quarterly.

### 3. Desktop Ollama SSRF attacks
**Risk:** Malicious prompt or frontend code tricks desktop app into making requests to internal network endpoints via Ollama integration.
**Mitigation:** Tauri isolation pattern with sandboxed IPC. Allowlist only `127.0.0.1:11434`. Validate all Ollama endpoint URLs server-side before request. CSP restricts network origins.

### 4. WebView code injection (mobile/desktop)
**Risk:** XSS in React app escalates to native API access in Tauri/Capacitor.
**Mitigation:** Tauri capability permissions limit native API exposure per window. Strict CSP headers. No `eval()` or inline scripts. Input sanitization with DOMPurify. Regular dependency audits with `npm audit`.

### 5. OAuth token theft and replay
**Risk:** Stolen refresh tokens allow persistent account takeover.
**Mitigation:** Rotate refresh tokens on every use (single-use tokens). Detect and revoke on reuse. Bind tokens to device fingerprint. Short access token lifetime (15 minutes). Audit log all token operations.

### 6. Publishing job manipulation
**Risk:** User modifies job payload to post to unauthorized social accounts.
**Mitigation:** Server-side validation that user owns all target social accounts. Job payloads signed with HMAC. Idempotency keys prevent duplicate submissions. Rate limit job creation per user.

### 7. Media upload abuse (storage exhaustion, malware)
**Risk:** Malicious uploads exhaust storage quota or deliver malware to other users.
**Mitigation:** Per-tenant storage quotas enforced at upload time. File type validation via magic bytes (not just extension). Virus scanning via ClamAV or Cloudflare's built-in scanning. Content hash deduplication.

### 8. Audit log tampering
**Risk:** Attacker modifies audit logs to hide malicious activity, breaking SOC 2 compliance.
**Mitigation:** Append-only table with `REVOKE UPDATE, DELETE`. Ship logs to immutable S3 bucket with object lock. Cryptographic integrity via log signing. Separate audit storage from application database.

### 9. Rate limit bypass via distributed requests
**Risk:** Attacker uses multiple IPs to bypass per-IP rate limits, exhausting resources.
**Mitigation:** Rate limit by authenticated tenant ID (not IP) for logged-in users. Sliding window algorithm in Redis. Per-tenant concurrent request limits. Circuit breaker for downstream services.

### 10. Privilege escalation via BYOS misconfiguration
**Risk:** Customer-provided S3 credentials have broader permissions than needed, allowing SocialFlow to access unrelated customer data.
**Mitigation:** Document minimum required IAM policy for BYOS buckets. Validate credentials scope on setup. Use STS AssumeRole with session policies limiting access to specific bucket paths. Audit all BYOS operations.

---

## 6. Unknowns and questions to validate

### Product and market validation

1. **Offline requirements clarity:** How much of the library truly needs offline access on mobile? Full sync versus on-demand caching significantly impacts architecture. Run user interviews before building extensive sync infrastructure.

2. **"Late" replacement timeline:** When does the Late contract end? If not imminent, defer direct publishing adapters—they're complex (per-platform OAuth, rate limits, media requirements) and Late already handles them.

3. **Local LLM demand:** What percentage of target customers actually want local Ollama? Desktop local mode adds significant complexity. Validate demand before prioritizing.

### Technical validation needed

4. **Tauri + Capacitor shared codebase:** While both wrap web content, their plugin APIs differ. Build a minimal proof-of-concept with offline storage, push notifications, and file system access on all three platforms before committing.

5. **pgvector at scale:** Test with realistic data volume (1M+ vectors, your actual embedding dimensions) on target RDS instance size. Benchmark query latency and index build time. Determine the threshold where dedicated vector DB becomes necessary.

6. **BullMQ + Bun compatibility:** If considering Bun runtime later, test BullMQ thoroughly. Current compatibility is partial with known issues. May need to stay on Node.js for queue workers.

7. **Capacitor App Store approval:** Build and submit a test app to Apple TestFlight with your planned feature set. Verify it passes Guideline 4.2 review before committing to Capacitor for production.

### Infrastructure and compliance

8. **SOC 2 scope definition:** What's in scope for your first audit? Limiting scope (e.g., excluding mobile apps initially) can accelerate certification. Engage an auditor early for gap assessment.

9. **BYOS credential security:** How do enterprise customers feel about granting cross-account AWS access? Some may prefer customer-managed encryption keys with you having no access. Validate BYOK requirements with target customers.

10. **Data residency requirements:** Do target customers require EU-only data storage? If yes, design for multi-region from the start—retrofitting is expensive. Survey enterprise prospects early.

### Team and operations

11. **DevOps capacity for Tauri:** Tauri requires Rust toolchain for custom commands and code signing setup for macOS/Windows. Assess whether your team can handle this or needs contractor support.

12. **On-call readiness:** Who handles production incidents? A 3-person team shipping to paying customers needs an on-call rotation and incident response process. Define escalation paths before launch.

---

## Key documentation references

**Frontend/Multi-platform:**
- [Tauri 2.0 Security](https://v2.tauri.app/security/) - Capability permissions, isolation patterns
- [Capacitor Documentation](https://capacitorjs.com/docs) - Mobile wrapping, native plugins
- [ElectricSQL Tauri + Ollama Demo](https://electric-sql.com/blog/2024/02/05/local-first-ai-with-tauri-postgres-pgvector-llama) - Local LLM integration proof

**Backend:**
- [tRPC Documentation](https://trpc.io/docs) - Type-safe API setup
- [Fastify Documentation](https://fastify.dev/) - High-performance Node.js framework
- [BullMQ Guide](https://docs.bullmq.io/) - Job queue patterns
- [Trigger.dev Documentation](https://trigger.dev/docs) - Background job orchestration

**Data and Security:**
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) - Row-level security policies
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search
- [pgAudit](https://www.pgaudit.org/) - Compliance audit logging
- [AWS KMS Envelope Encryption](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping) - Key management patterns

**AI and Media:**
- [LiteLLM Documentation](https://docs.litellm.ai/) - AI gateway proxy
- [Uppy + S3](https://uppy.io/docs/aws-s3/) - Resumable uploads
- [Sharp Documentation](https://sharp.pixelplumbing.com/) - Image processing
- [Cloudflare R2](https://developers.cloudflare.com/r2/) - Object storage

**Publishing and Auth:**
- [Clerk Documentation](https://clerk.com/docs) - Auth with SSO/SCIM
- [LaunchDarkly Migration Flags](https://launchdarkly.com/docs/guides/flags/migrations) - Feature flag patterns
- [OAuth Refresh Token Rotation](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/) - Token security

This architecture balances immediate velocity with enterprise readiness, letting your small team ship a competitive product in 3 months while maintaining a clear path to SOC 2 compliance, multi-tenant isolation, and eventual on-premise deployment.