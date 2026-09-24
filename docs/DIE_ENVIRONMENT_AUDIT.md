# DIE Environment Audit — Blocks 1-4B

**Generated**: 2026-06-16  
**Scope**: Document Intelligence Engine (DIE) environment variables  
**Status**: Ready for Railway deployment (after fixes applied)

---

## Required Environment Variables

| Variable | Required | Used By | Local Status | Railway Requirement | Failure Mode if Missing |
|----------|----------|---------|--------------|---------------------|------------------------|
| `DATABASE_URL` | **YES** | All DIE components | ✅ Set | **Required** | App crash on startup |
| `DIRECT_URL` | **YES** | Prisma migrations | ✅ Set | **Required** | Migration failures |
| `REDIS_URL` | **YES** | Both workers, all queues | ✅ Set | **Required** | Worker crash, queue failure |
| `NEXTAUTH_SECRET` | **YES** | Auth/session validation | ✅ Set | **Required** | Auth failures |
| `NEXTAUTH_URL` | **YES** | Auth callbacks | ✅ Set | **Required** | OAuth redirect failures |
| `SUPABASE_STORAGE_URL` | **YES** | File uploads | ⚠️ Not set | **Required** | Upload failures |
| `SUPABASE_STORAGE_KEY` | **YES** | File uploads | ⚠️ Not set | **Required** | Upload failures |
| `IMBONI_QR_SECRET` | **YES** | QR code validation | ✅ Set | **Required** | QR validation failures |

## DIE-Specific Variables

| Variable | Required | Used By | Default | Description |
|----------|----------|---------|---------|-------------|
| `OPENAI_API_KEY` | Conditional* | Provider chain | — | OpenAI Vision fallback |
| `AZURE_DI_ENDPOINT` | Conditional* | Azure provider | — | Azure Document Intelligence endpoint |
| `AZURE_DI_KEY` | Conditional* | Azure provider | — | Azure Document Intelligence key |
| `DIE_PROVIDER_TIMEOUT_MS` | No | Provider chain | 30000 | Provider request timeout |
| `DIE_MAX_DOC_MB` | No | Upload API | 25 | Max upload size in MB |
| `OPENAI_MODEL_PRIMARY` | No | OpenAI provider | gpt-4o-mini | Primary model for extraction |
| `OPENAI_MODEL_FALLBACK` | No | OpenAI provider | gpt-4-turbo | Fallback model |

\* At least one of (`OPENAI_API_KEY`) OR (`AZURE_DI_ENDPOINT` + `AZURE_DI_KEY`) is required for DIE to function.

## Railway Deployment Checklist

### Pre-Deployment

- [ ] `REDIS_URL` configured (Upstash recommended)
- [ ] `DATABASE_URL` and `DIRECT_URL` configured (Supabase or Railway Postgres)
- [ ] `SUPABASE_STORAGE_URL` and `SUPABASE_STORAGE_KEY` configured
- [ ] `NEXTAUTH_SECRET` and `NEXTAUTH_URL` configured
- [ ] At least one OCR provider configured (Azure DI or OpenAI)

### Worker Service Configuration

Use `Dockerfile.worker` for the worker service:

```dockerfile
# Railway Dashboard → Services → New Service → GitHub Repo
# Build context: ./Dockerfile.worker
```

**Important**: The unified worker (`worker-start.ts`) runs both extraction and intelligence workers in a single process. This ensures documents never get stuck at `EXTRACTED` status.

### Health Check Endpoint

```bash
GET /api/admin/queue/health
# Returns: { status: 'healthy' | 'unhealthy' }
```

### Metrics Endpoint

```bash
GET /api/admin/queue/metrics
# Returns: { processed: number, failed: number, active: number }
```

## Environment Variable Setup Script

For local development, ensure these are in `.env.local`:

```bash
# Required
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
REDIS_URL="rediss://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
SUPABASE_STORAGE_URL="https://your-project.supabase.co"
SUPABASE_STORAGE_KEY="your-service-role-key"
IMBONI_QR_SECRET="your-qr-secret"

# DIE Provider (pick at least one)
AZURE_DI_ENDPOINT="https://<region>.cognitiveservices.azure.com/"
AZURE_DI_KEY="your-azure-key"
# OR
OPENAI_API_KEY="sk-..."

# Optional tuning
DIE_PROVIDER_TIMEOUT_MS="30000"
DIE_MAX_DOC_MB="10"
```

## Troubleshooting

### Worker not processing jobs

1. Check Redis connection: `npm run die:worker` should log "Redis connected"
2. Check queue health: `GET /api/admin/queue/health`
3. Check for failed jobs in DLQ: Review `die_extract_dlq` and `die_intelligence_dlq` queues

### Documents stuck at EXTRACTED

**Before the fix**: Intelligence worker was not started.  
**After the fix**: Unified worker (`worker-start.ts`) ensures both workers run together.

If still stuck:
1. Check worker logs for errors
2. Verify `die_intelligence` queue has jobs: Redis `LLEN bull:die_intelligence:wait`
3. Check `ScannedDocument` status directly in database

### Provider failures

If both Azure and OpenAI fail:
1. Check `AZURE_DI_ENDPOINT` and `AZURE_DI_KEY` are correct
2. Check `OPENAI_API_KEY` is valid and has credit
3. Review `DocumentProcessingLog` entries for error messages
4. Check `ExtractionPayload` table for raw provider responses

## Security Notes

- Never commit `.env` or `.env.local` to git
- Use Railway/Railway Dashboard or Vercel Environment UI for production secrets
- `SUPABASE_STORAGE_KEY` must be the **Service Role Key**, not the anon key
- `AZURE_DI_KEY` should be rotated periodically using Azure Key 1/2 rotation
