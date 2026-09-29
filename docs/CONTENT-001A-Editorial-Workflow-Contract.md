# CONTENT-001A — Editorial Workflow Contract

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Editorial Lifecycle State Machine  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define the authoritative editorial content lifecycle — every valid state transition, who can perform it, what side effects it triggers, and what transitions are invalid.

## 2. Content Statuses

| Status | Description | Public Access |
|--------|-------------|---------------|
| DRAFT | Being written by editor | No (404) |
| REVIEW | Submitted for review | No (404) |
| APPROVED | Approved by reviewer, ready to schedule/publish | No (404) |
| SCHEDULED | Scheduled for future publication | No (404) |
| PUBLISHED | Live on public website | Yes |
| UPDATED | Published article being edited (original still public) | No (new edits not public) |
| ARCHIVED | Removed from public website | No (410 Gone) |
| REJECTED | Rejected during review | No (404) |

## 3. State Transition Diagram

```
                    ┌──────────┐
                    │  DRAFT   │◄──────────────────────────┐
                    └────┬─────┘                           │
                         │ submit for review                │ revise
                         ▼                                  │
                    ┌──────────┐                     ┌─────┴──────┐
                    │  REVIEW  │────────────────────▶│  REJECTED  │
                    └────┬─────┘   reject            └────────────┘
                         │ approve
                         ▼
                    ┌──────────┐
                    │ APPROVED │
                    └────┬─────┘
                    schedule │ publish
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │ SCHEDULED│      │PUBLISHED │
              └────┬─────┘      └────┬──────┘
              publish │              │ edit
              ┌───────┘              ▼
              │                 ┌──────────┐
              └────────────────▶│ PUBLISHED│
                                └────┬──────┘
                                archive │
                                     ▼
                               ┌──────────┐
                               │ ARCHIVED │
                               └────┬─────┘
                               revive │
                                     ▼
                               ┌──────────┐
                               │  DRAFT   │
                               └──────────┘
```

## 4. Transition Matrix

| From | To | Required Role | Side Effects | Notes |
|------|----|--------------|--------------|-------|
| DRAFT | REVIEW | EDITOR+ | Set reviewerId = null | Author submits own work |
| DRAFT | ARCHIVED | ADMIN | Set archivedAt | Cancel draft |
| REVIEW | APPROVED | REVIEWER+ | Set reviewerId = actor | Reviewer approves |
| REVIEW | REJECTED | REVIEWER+ | Set reviewerId = actor, note required | Reviewer rejects with reason |
| REVIEW | DRAFT | REVIEWER+ | Request changes back to author | Reviewer sends back |
| APPROVED | SCHEDULED | PUBLISHER+ | Set scheduledAt (required) | Schedule for future publish |
| APPROVED | PUBLISHED | PUBLISHER+ | Set publishedAt = now, publisherId = actor | Immediate publish |
| SCHEDULED | PUBLISHED | PUBLISHER+ (or cron) | Set publishedAt = now, publisherId = actor | Cron auto-publishes at scheduledAt |
| SCHEDULED | APPROVED | PUBLISHER+ | Clear scheduledAt | Unschedule |
| PUBLISHED | UPDATED | EDITOR+ (if author) or REVIEWER+ | Keep original publishedAt | Article enters edit mode |
| UPDATED | PUBLISHED | PUBLISHER+ | Set publishedAt = now (new publish time) | Republish with edits |
| PUBLISHED | ARCHIVED | ADMIN | Set archivedAt | Remove from public |
| ARCHIVED | DRAFT | ADMIN | Clear archivedAt, publishedAt | Revive archived article |
| REJECTED | DRAFT | EDITOR+ | Clear reviewerId | Author revises |

## 5. Invalid Transitions

| Attempted Transition | Error |
|----------------------|-------|
| DRAFT → PUBLISHED | 400: Must go through REVIEW → APPROVED first |
| DRAFT → SCHEDULED | 400: Must go through REVIEW → APPROVED first |
| REVIEW → PUBLISHED | 400: Must be APPROVED first |
| REVIEW → SCHEDULED | 400: Must be APPROVED first |
| REJECTED → REVIEW | 400: Must revise to DRAFT first |
| REJECTED → PUBLISHED | 400: Must revise to DRAFT first |
| ARCHIVED → PUBLISHED | 400: Must revive to DRAFT first |
| PUBLISHED → DRAFT | 400: Use UPDATED for editing published content |
| PUBLISHED → REVIEW | 400: Use UPDATED, then submit for review |
| SCHEDULED → DRAFT | 400: Must unschedule to APPROVED first |
| Any → (same status) | 400: Already in that status |

## 6. Role Definitions

| Role | Can Create | Can Edit | Can Submit for Review | Can Review | Can Approve | Can Schedule | Can Publish | Can Archive | Can Delete |
|------|-----------|-----------|----------------------|-----------|------------|-------------|------------|------------|-----------|
| EDITOR | ✅ | ✅ (own + others if ADMIN) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| REVIEWER | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUBLISHER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (DRAFT/REJECTED only) |

**Note**: ADMIN in `roles` (UserRole enum) grants all editorial permissions implicitly. No `editorialRoles` needed for ADMIN users.

## 7. Scheduled Publication

### 7.1 Mechanism

- When article transitions to SCHEDULED, `scheduledAt` is set to the target publish time
- A cron job (or Next.js API route called by external scheduler) checks for SCHEDULED articles where `scheduledAt <= now()`
- For each due article, transition to PUBLISHED automatically
- The cron job acts as the "actor" (actorId = "system" or a designated system user)

### 7.2 Implementation

```
GET /api/cron/publish-scheduled
```

- Protected by a secret token (e.g., `CRON_SECRET` env var)
- Query: `SELECT * FROM EditorialArticle WHERE status = 'SCHEDULED' AND scheduledAt <= NOW()`
- For each: transition to PUBLISHED, set publishedAt = now()
- Called every 5 minutes by external scheduler (Vercel Cron, etc.)

## 8. Audit Requirements

Every transition creates a `ContentTransition` record:

| Field | Value |
|-------|-------|
| articleId | The article being transitioned |
| fromStatus | Previous status |
| toStatus | New status |
| actorId | User ID of the person performing the transition |
| note | Optional reason (required for REJECTED) |
| createdAt | Timestamp |

**ContentTransition records are immutable.** They cannot be edited or deleted (except via cascade when an article is hard-deleted, which only applies to DRAFT/REJECTED articles).

## 9. Rollback Expectations

| Scenario | Rollback Mechanism |
|----------|-------------------|
| Published article has errors | Transition to UPDATED, fix, republish |
| Scheduled article should not be published | Unschedule (SCHEDULED → APPROVED) |
| Published article should be removed | Archive (PUBLISHED → ARCHIVED) |
| Rejected article should be reconsidered | Revise (REJECTED → DRAFT), resubmit |
| Archived article should be restored | Revive (ARCHIVED → DRAFT), re-edit, republish |

**No direct status rollback.** All changes go through the state machine. There is no "revert to previous status" button — each transition is explicit and audited.

## 10. Edit Restrictions by Status

| Status | Can Edit Body? | Can Edit SEO? | Can Edit Topic/Tags? | Can Edit Product Links? |
|--------|---------------|---------------|---------------------|------------------------|
| DRAFT | ✅ | ✅ | ✅ | ✅ |
| REVIEW | ❌ (locked) | ❌ | ❌ | ❌ |
| APPROVED | ❌ (locked) | ✅ (SEO tweaks) | ❌ | ❌ |
| SCHEDULED | ❌ (locked) | ✅ (SEO tweaks) | ❌ | ❌ |
| PUBLISHED | ❌ (must transition to UPDATED) | ❌ (must transition to UPDATED) | ❌ | ❌ |
| UPDATED | ✅ | ✅ | ✅ | ✅ |
| ARCHIVED | ❌ (must revive to DRAFT) | ❌ | ❌ | ❌ |
| REJECTED | ❌ (must revise to DRAFT) | ❌ | ❌ | ❌ |

**Rationale**: Content in REVIEW, APPROVED, or SCHEDULED is locked to prevent changes after review. If changes are needed, the article must go back to DRAFT (from REVIEW) or be transitioned to UPDATED (from PUBLISHED).

---

*End of Editorial Workflow Contract*
