# DIE Block 4G Queue Audit

## Queue Topology

- `die_extract`
- `die_intelligence`
- dead-letter queues for each stage

## Safety Properties

- BullMQ attempts + exponential backoff
- job deduplication via `jobId`
- Redis TLS enabled
- worker concurrency bounded:
  - extract: 5
  - intelligence: 3

## Evidence

- `queues.ts` defines retries, backoff, and DLQs
- worker startup uses the configured concurrency and limiter values
- preflight performance/security checks passed queue security and throughput config checks
