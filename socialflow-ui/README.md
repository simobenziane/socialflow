# SocialFlow UI

React frontend for the SocialFlow content automation system.

## Tech Stack

- **React 18** + TypeScript
- **Vite** - Build tool & dev server
- **TanStack Query** - Server state management
- **shadcn/ui** - Component library (Radix UI + Tailwind CSS)
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icons

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Run tests
npm run test:run
```

## Architecture

### Headless Design

The UI is completely decoupled from the backend:

- **API Client** (`src/api/client.ts`) - Axios-based REST client
- **Type Definitions** (`src/api/types.ts`) - Shared TypeScript interfaces
- **React Query Hooks** (`src/hooks/`) - Server state management
- **No backend coupling** - Can point to any compatible API

### Cloudflare Test Connection

The UI tests Cloudflare tunnel connectivity **directly from the browser**, not through the backend. This avoids n8n sandbox restrictions and demonstrates the headless architecture.

```typescript
// Frontend fetches directly from Cloudflare tunnel
const response = await fetch(`${cfUrl}/_config/settings.json`);
```

## Project Structure

```
src/
├── api/
│   ├── client.ts          # Axios instance + API functions
│   └── types.ts           # TypeScript interfaces
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── shared/            # Reusable components (PageHeader, etc.)
│   ├── ContentPreviewCard.tsx
│   └── StatusCard.tsx
├── hooks/
│   ├── index.ts           # Query hooks (useClients, useBatches, etc.)
│   └── use-toast.ts       # Toast notifications
├── pages/
│   ├── Dashboard.tsx      # Home page with stats
│   ├── Clients.tsx        # Client list
│   ├── ClientDetail.tsx   # Single client view
│   ├── BatchDetail.tsx    # Batch workflow actions
│   ├── ApprovalBoard.tsx  # Content review/approval
│   ├── Accounts.tsx       # Late.com accounts
│   ├── Settings.tsx       # Configuration
│   └── Archive.tsx        # Archived clients
├── lib/
│   └── utils.ts           # Utility functions (cn, etc.)
└── App.tsx                # Router + QueryClient setup
```

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Stats overview, quick actions |
| `/clients` | Clients | Client list + create dialog |
| `/clients/:slug` | ClientDetail | Client info, batch list |
| `/batches/:client/:batch` | BatchDetail | Workflow buttons, content list |
| `/batches/:client/:batch/approve` | ApprovalBoard | Review/approve/reject content |
| `/accounts` | Accounts | Late.com accounts, sync button |
| `/settings` | Settings | Cloudflare URL, AI model, test connection |
| `/archive` | Archive | View/restore archived clients |

## API Integration

### Environment Variables

```env
VITE_API_BASE=http://localhost:5678/webhook
```

### API Client Usage

```typescript
import { getClients, createClient } from '@/api/client';

// Direct API calls
const clients = await getClients();
const newClient = await createClient({ name: 'Test', slug: 'test' });
```

### React Query Hooks

```typescript
import { useClients, useCreateClient } from '@/hooks';

// In components
const { data, isLoading, error } = useClients();
const createMutation = useCreateClient();

// Mutations auto-invalidate relevant queries
createMutation.mutate({ name: 'Test', slug: 'test' });
```

## Key Features

### Settings Page
- Edit Cloudflare tunnel URL
- Select AI model (llava:7b or qwen3-vl:4b)
- Configure Ollama timeout
- **Test Connection** - Verifies tunnel directly from browser
- Auto-test after save

### Batch Detail
- Run workflow buttons (Ingest, Generate, Schedule)
- Progress bar and status counts
- Content items list with thumbnails
- Link to Approval Board

### Approval Board
- Grid view of content items
- Approve/Reject buttons
- Edit captions inline
- Filter by status (Review, Approved, Scheduled)

### Dashboard
- Client count, batch count, item stats
- Quick action buttons
- Status breakdown chart

## Component Library

Using shadcn/ui components. To add more:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

Available components in `src/components/ui/`:
- Button, Card, Input, Label
- Select, Tabs, Badge, Progress
- Dialog, Toast, Skeleton
- And more...

## Testing

```bash
# Run all tests
npm run test:run

# Watch mode
npm run test

# With coverage
npm run test:run -- --coverage
```

## Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

Output is in `dist/` folder.

## Backend Requirements

The UI expects these endpoints:

- `GET /api?route=/health` - Health check
- `GET /api?route=/clients` - List clients
- `GET /api?route=/stats` - Dashboard stats
- `POST /w1-ingest` - Trigger ingest workflow
- `POST /w2-captions` - Trigger caption generation
- `POST /w3-schedule` - Trigger scheduling

See `../files/docs/API_REFERENCE.md` for full API documentation.

---

**Version:** 1.0.0
**Last Updated:** 2025-12-06
