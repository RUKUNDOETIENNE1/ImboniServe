# V1 Release Execution Order

**Date:** 2026-06-29
**Author:** Enterprise Change Management Engineer
**Status:** EXECUTION SEQUENCE (NOT IMPLEMENTED)

---

## Purpose

This document defines the exact engineering sequence for implementing V1 navigation changes. Each phase must complete successfully before proceeding to the next.

---

## Execution Timeline

| Phase | Name | Duration | Dependencies |
|-------|------|----------|--------------|
| A | Preparation | 30 min | None |
| B | Feature Flag Infrastructure | 30 min | Phase A |
| C | Navigation Schema Extension | 1 hour | Phase B |
| D | Navigation Filter Implementation | 1 hour | Phase C |
| E | Render Logic Update | 1 hour | Phase D |
| F | Testing & Validation | 2 hours | Phase E |
| G | Deployment | 30 min | Phase F |
| H | Post-Deployment Monitoring | 24 hours | Phase G |

**Total Implementation Time:** 6-7 hours
**Total Monitoring Time:** 24 hours

---

## Phase A: Preparation

**Duration:** 30 minutes
**Owner:** Release Engineer

### A.1 Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/v1-navigation-simplification
```

### A.2 Backup Current State

```bash
# Record current commit
git rev-parse HEAD > .v1-rollback-commit

# Copy current navigation file
cp src/components/DashboardLayout.tsx src/components/DashboardLayout.tsx.backup
```

### A.3 Verify Build

```bash
npm run build
npm run test
```

**Exit Criteria:**
- [ ] Feature branch created
- [ ] Backup commit recorded
- [ ] Build passes
- [ ] Tests pass

---

## Phase B: Feature Flag Infrastructure

**Duration:** 30 minutes
**Owner:** Backend Engineer

### B.1 Add New Feature Flags

**File:** `src/lib/services/feature-flag.service.ts`

Add to `FEATURE_FLAGS` constant:

```typescript
// V1 Release Flags
CRM_V1: 'crm_v1',
AI_INSIGHTS_V1: 'ai_insights_v1',
OPTIMIZATION_V1: 'optimization_v1',
```

### B.2 Add Flag Definitions

Add to `INITIAL_FLAGS` array:

```typescript
{
  key: FEATURE_FLAGS.CRM_V1,
  name: 'Customer CRM',
  description: 'Customer relationship management with RFM segmentation',
  enabled: false,
  autoEnableThreshold: null,
  planGated: false,
  minimumPlan: null,
},
{
  key: FEATURE_FLAGS.AI_INSIGHTS_V1,
  name: 'AI Insights',
  description: 'AI-powered business insights and recommendations',
  enabled: false,
  autoEnableThreshold: null,
  planGated: false,
  minimumPlan: null,
},
{
  key: FEATURE_FLAGS.OPTIMIZATION_V1,
  name: 'Optimization Hub',
  description: 'AI-powered optimization recommendations',
  enabled: false,
  autoEnableThreshold: null,
  planGated: false,
  minimumPlan: null,
},
```

### B.3 Seed Flags

```bash
npx prisma db seed
# Or run seed script manually
```

### B.4 Verify Flags

```bash
# Check flags exist in database
npx prisma studio
# Navigate to FeatureFlag table
# Verify crm_v1, ai_insights_v1, optimization_v1 exist
```

**Exit Criteria:**
- [ ] New flags added to service
- [ ] Flags seeded to database
- [ ] Flags visible in Prisma Studio
- [ ] TypeScript compiles

---

## Phase C: Navigation Schema Extension

**Duration:** 1 hour
**Owner:** Frontend Engineer

### C.1 Define TypeScript Types

**File:** `src/components/DashboardLayout.tsx`

Add after imports:

```typescript
// V1 Navigation Types
interface V1NavigationItem {
  name: string
  href?: string
  icon?: any
  i18nKey?: string
  section?: boolean
  rolesAllowed?: string[]
  adminOnly?: boolean
  // V1 Extensions
  v1Visible?: boolean
  v1Section?: V1SectionKey
  v1Order?: number
  v1AdminOnly?: boolean
  v1DeveloperOnly?: boolean
  featureFlag?: string
}

type V1SectionKey = 
  | 'OPERATIONS'
  | 'MENU_INVENTORY'
  | 'QR_DIGITAL'
  | 'REPORTS'
  | 'TEAM'
  | 'FINANCIAL'
  | 'SETTINGS'
```

### C.2 Define Section Configuration

Add after types:

```typescript
const V1_SECTIONS: Record<V1SectionKey, { name: string; order: number }> = {
  OPERATIONS: { name: 'Operations', order: 1 },
  MENU_INVENTORY: { name: 'Menu & Inventory', order: 2 },
  QR_DIGITAL: { name: 'QR & Digital', order: 3 },
  REPORTS: { name: 'Reports', order: 4 },
  TEAM: { name: 'Team', order: 5 },
  FINANCIAL: { name: 'Financial', order: 6 },
  SETTINGS: { name: 'Settings', order: 7 },
}
```

### C.3 Update Navigation Array

Update each navigation item with V1 properties as specified in `NAVIGATION_EXECUTION_PLAN.md`.

**Exit Criteria:**
- [ ] Types defined
- [ ] Sections defined
- [ ] All navigation items have V1 properties
- [ ] TypeScript compiles

---

## Phase D: Navigation Filter Implementation

**Duration:** 1 hour
**Owner:** Frontend Engineer

### D.1 Add Filter Function

**File:** `src/components/DashboardLayout.tsx`

Add after navigation array:

```typescript
function getV1Navigation(
  items: V1NavigationItem[],
  isAdmin: boolean,
  isDeveloper: boolean,
  enabledFlags: string[]
): V1NavigationItem[] {
  return items
    .filter(item => {
      // Skip section headers
      if (item.section) return false
      
      // V1 Visible items always show
      if (item.v1Visible) return true
      
      // Admin-only items show for admins
      if (item.v1AdminOnly && isAdmin) return true
      
      // Developer-only items show in dev mode
      if (item.v1DeveloperOnly && isDeveloper) return true
      
      // Feature-flagged items show if flag is enabled
      if (item.featureFlag && enabledFlags.includes(item.featureFlag)) {
        return true
      }
      
      // Everything else is hidden
      return false
    })
    .sort((a, b) => {
      const sectionA = V1_SECTIONS[a.v1Section as V1SectionKey]?.order || 99
      const sectionB = V1_SECTIONS[b.v1Section as V1SectionKey]?.order || 99
      
      if (sectionA !== sectionB) return sectionA - sectionB
      
      return (a.v1Order || 99) - (b.v1Order || 99)
    })
}
```

### D.2 Add Grouping Function

```typescript
function groupBySection(
  items: V1NavigationItem[]
): Record<string, V1NavigationItem[]> {
  const groups: Record<string, V1NavigationItem[]> = {}
  
  items.forEach(item => {
    const section = item.v1Section || 'OTHER'
    if (!groups[section]) groups[section] = []
    groups[section].push(item)
  })
  
  return groups
}
```

### D.3 Add Hook Import

```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlag'
```

**Exit Criteria:**
- [ ] Filter function implemented
- [ ] Grouping function implemented
- [ ] Hook imported
- [ ] TypeScript compiles

---

## Phase E: Render Logic Update

**Duration:** 1 hour
**Owner:** Frontend Engineer

### E.1 Add State Variables

Inside component, add:

```typescript
const enabledFlags = useFeatureFlags()
const isDeveloper = process.env.NODE_ENV === 'development'
```

### E.2 Compute Filtered Navigation

```typescript
const v1Nav = getV1Navigation(navigation, isAdmin, isDeveloper, enabledFlags)
const groupedNav = groupBySection(v1Nav)
```

### E.3 Update Desktop Sidebar Render

Replace flat navigation render with sectioned render:

```tsx
<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
  {Object.entries(V1_SECTIONS).map(([sectionKey, sectionConfig]) => {
    const sectionItems = groupedNav[sectionKey]
    if (!sectionItems || sectionItems.length === 0) return null
    
    return (
      <div key={sectionKey} className="mb-6">
        {sidebarOpen && (
          <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {sectionConfig.name}
          </h3>
        )}
        {sectionItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.href!)
          const classes = [
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
            active
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
          ].join(' ')
          
          return (
            <Link key={item.href} href={item.href!} className={classes}>
              {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
              {sidebarOpen && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </div>
    )
  })}
</nav>
```

### E.4 Update Mobile Menu Render

Apply same sectioned render to mobile menu.

### E.5 Verify Collapsed State

Ensure collapsed sidebar shows icons only, no section headers.

**Exit Criteria:**
- [ ] Desktop sidebar renders with sections
- [ ] Mobile menu renders with sections
- [ ] Collapsed sidebar works correctly
- [ ] No console errors
- [ ] TypeScript compiles

---

## Phase F: Testing & Validation

**Duration:** 2 hours
**Owner:** QA Engineer

### F.1 Build Verification

```bash
npm run build
```

### F.2 Unit Tests

```bash
npm run test
```

### F.3 Manual Testing

Execute `RELEASE_VALIDATION_CHECKLIST.md`:

- [ ] Restaurant Owner sees 22 items
- [ ] Admin sees additional items
- [ ] Feature flags work correctly
- [ ] Deep links work
- [ ] Mobile navigation works
- [ ] Demo flow works

### F.4 Rollback Test

```bash
# Simulate rollback
git checkout src/components/DashboardLayout.tsx.backup
npm run build
# Verify original navigation restored
git checkout src/components/DashboardLayout.tsx
```

**Exit Criteria:**
- [ ] Build passes
- [ ] All tests pass
- [ ] Manual testing complete
- [ ] Rollback tested

---

## Phase G: Deployment

**Duration:** 30 minutes
**Owner:** Release Engineer

### G.1 Create Pull Request

```bash
git add .
git commit -m "feat(nav): implement V1 navigation simplification

- Reduce navigation from 54 to 22 items
- Add 7 logical sections
- Add feature flag support for advanced features
- Preserve all routes and APIs

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>"

git push origin feature/v1-navigation-simplification
```

### G.2 Code Review

- [ ] 2 approvals required
- [ ] All CI checks pass
- [ ] No merge conflicts

### G.3 Merge to Main

```bash
git checkout main
git pull origin main
git merge feature/v1-navigation-simplification
git push origin main
```

### G.4 Deploy to Production

```bash
# Deploy via CI/CD pipeline
# Or manual deployment
npm run deploy:production
```

### G.5 Verify Production

- [ ] Production build successful
- [ ] Navigation changes visible
- [ ] No errors in logs

**Exit Criteria:**
- [ ] PR merged
- [ ] Production deployed
- [ ] Smoke tests pass

---

## Phase H: Post-Deployment Monitoring

**Duration:** 24 hours
**Owner:** Support Team

### H.1 Monitor Metrics

| Metric | Threshold | Action if Exceeded |
|--------|-----------|-------------------|
| Error rate | > 1% | Investigate |
| Support tickets (nav-related) | > 5 | Investigate |
| Support tickets (nav-related) | > 10 | Rollback |
| Page load time | > 3s | Investigate |

### H.2 Monitor Support Channels

- [ ] Check support inbox hourly for first 4 hours
- [ ] Check support inbox every 4 hours for next 20 hours
- [ ] Document any navigation-related issues

### H.3 Rollback Decision

If rollback is needed:

```bash
# Immediate rollback
git revert HEAD
git push origin main
npm run deploy:production
```

**Exit Criteria:**
- [ ] 24 hours elapsed
- [ ] No rollback required
- [ ] Support ticket volume normal
- [ ] Error rate normal

---

## Rollback Procedures

### Immediate Rollback (< 1 minute)

In `DashboardLayout.tsx`, change:

```typescript
const v1Nav = getV1Navigation(navigation, isAdmin, isDeveloper, enabledFlags)
```

To:

```typescript
const v1Nav = navigation.filter(item => !item.section)
```

### Full Rollback (< 5 minutes)

```bash
git revert HEAD
git push origin main
npm run deploy:production
```

### Database Rollback (if needed)

```sql
-- Remove new feature flags
DELETE FROM "FeatureFlag" WHERE key IN ('crm_v1', 'ai_insights_v1', 'optimization_v1');
```

---

## Communication Plan

### Pre-Deployment

- [ ] Notify support team of upcoming changes
- [ ] Notify customer success team
- [ ] Prepare FAQ document

### Post-Deployment

- [ ] Send internal announcement
- [ ] Update documentation
- [ ] Monitor feedback channels

### If Rollback Occurs

- [ ] Notify all stakeholders immediately
- [ ] Document reason for rollback
- [ ] Schedule post-mortem

---

## Sign-Off

### Phase Completion Sign-Off

| Phase | Completed By | Date | Signature |
|-------|--------------|------|-----------|
| A - Preparation | | | |
| B - Feature Flags | | | |
| C - Schema Extension | | | |
| D - Filter Implementation | | | |
| E - Render Logic | | | |
| F - Testing | | | |
| G - Deployment | | | |
| H - Monitoring | | | |

### Final Release Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Release Engineer | | | |
| QA Lead | | | |
| Engineering Lead | | | |
| Product Owner | | | |

---

**HARD STOP: This is the execution sequence. No code changes have been made. Implementation begins only after this plan is approved.**
