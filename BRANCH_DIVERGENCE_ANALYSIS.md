# Branch Divergence Analysis — Release Gate 2

## Executive Summary
- `release/v1.0.0-rc1` diverged from `main` after merge-base `2c7cebb` and now carries 81 unique commits, 1,378 files, and ~346k insertions that never reached `main`.
- Those commits include critical commercial feature gating, security hardening, build fixes, infrastructure configuration, database recovery scripts, and extensive launch documentation. Only five recent commits live exclusively on `main`.
- Missing the RC1 commits leaves `main` without commercial enforcement, cron scheduling, auth fixes, localized assets, governance artefacts, and operational runbooks, representing a **high reconciliation risk** if ignored.
- Recommended reconciliation strategy: **create a new integration branch from `release/v1.0.0-rc1` and merge `main` into it** (Option C). This preserves the certified RC1 baseline while layering the new HIE/IKB work on top.
- Reconciliation is **SAFE TO RECONCILE** provided we execute the prescribed plan, anticipate high-conflict areas (auth, Next config, Service Replay assets, Prisma schema), and run the outlined end-to-end validation suite.

## Phase 1 — Branch Statistics
- **Branches observed:** `main`, `release/v1.0.0-rc1`, `review/pre-reality-gap`, `cascade/resume-workflow-prisma-migration-2cdcae`, plus matching remote branches.
- **Merge-base:** `2c7cebb` (`chore(die/block4g): operational verification and hardening`).
- **Unique commits on `main`:** 5 (`c628491`, `464b92c`, `53093a6`, `60b4121`, `9d13859`).
- **Unique commits on `release/v1.0.0-rc1`:** 81 (listed below).
- **Change volume (`release/v1.0.0-rc1` → `main`):** 1,378 files touched, 346,086 insertions, 87,622 deletions.
- **Key change types:** Feature gating across 60+ API endpoints, localized assets (≈6k lines), large governance JSON (`webhook-governance.json`), cron configuration (`vercel.json`), auth fixes, Service Replay removals, extensive documentation.

## Phase 2 — Commit Classification (with Phase 4 risk levels)
| Hash | Date | Summary | Categories | Risk | Key Impact Notes |
|------|------|---------|------------|------|------------------|
| 72731a5 | 2026-07-11 | trigger: force Vercel deployment for auth fix | Deployment, CI/CD | Informational | Empty commit used to trigger Vercel build. |
| 3d2787a | 2026-07-11 | fix(auth): NEXTAUTH_URL, Sentry CSP, diagnostics | Authentication, Security, UI | High | Adjusts login flow, adds diagnostics, updates `next.config.js`. |
| 3a0e827 | 2026-07-08 | fix(dev): swap `db push` for `migrate deploy` | Scripts, Database, Dev Workflow | Low | Prevents destructive schema push in dev startup script. |
| 781aa15 | 2026-07-08 | docs(rc1): production deployment blocker cleared | Documentation, Operational Doc | Informational | Adds deployment clearance report. |
| 00cfa6e | 2026-07-08 | docs(rc1): update certification - blockers resolved | Documentation, Governance | Informational | Updates certification dossier. |
| a953cd7 | 2026-07-08 | fix(supabase): migration recovery scripts | Database, Deployment, Scripts | High | Adds SQL repair scripts for production Supabase. |
| 66adc59 | 2026-07-08 | docs(supabase): migration recovery guide | Documentation, Operational Doc | Informational | Provides recovery runbook. |
| 34f21b9 | 2026-07-08 | docs(rc1): engineering closure sprint complete | Documentation, Governance | Informational | Marks branch frozen. |
| 896270a | 2026-07-08 | fix(build): resolve Next.js standalone OOM | Build, Infrastructure | Medium | Enables standalone output, unblocks builds. |
| 1b4644b | 2026-07-08 | docs(rc1): release verification reports | Documentation, Governance | Informational | Adds verification packets. |
| 08f3be5 | 2026-07-07 | Rewrite founder handoff runbook | Operational Doc | Informational | Updates founder operational guide. |
| efa2430 | 2026-07-07 | LAUNCH READINESS: All blockers resolved | Operational Doc, Governance | Informational | Summarises launch readiness. |
| bd40329 | 2026-07-07 | Configure Vercel cron jobs | Infrastructure, Deployment, Configuration | High | Adds 9 cron schedules in `vercel.json` critical for production jobs. |
| 88715a0 | 2026-07-06 | OPERATION FIRST CUSTOMER handbook | Operational Doc | Informational | Pilot operations handbook. |
| c02a1a5 | 2026-07-06 | FOUNDER LAUNCH OPERATIONS audit | Operational Doc | Informational | Founder checklist. |
| 0fd76bc | 2026-07-06 | STRATEGIC BACKLOG of deferred work | Documentation, Governance | Informational | Lists deferred initiatives. |
| 09e3e91 | 2026-07-06 | Milestone 2.6 IAS Red Team review | Governance, Documentation | Informational | Governance assurance. |
| 14436e1 | 2026-07-06 | IAS v1.0 ratification | Governance | Informational | Ratifies architecture standard. |
| 09d21ae | 2026-07-06 | Fix build: Prisma schema, locales, exports | Database, Localization, UI, Testing | High | Restores schema, locale JSON, homepage imports, fixes tests. |
| f8a108d | 2026-07-05 | Milestone 2 executive retrospective | Governance, Documentation | Informational | Milestone summary. |
| bbc5127 | 2026-07-05 | Milestone 2 final certification | Governance, Documentation | Informational | Certification report. |
| 39f2112 | 2026-07-05 | Governance integrity report | Governance | Informational | Governance audit. |
| 0f23df1 | 2026-07-05 | Governance sync: certifications updated | Governance, Documentation | Informational | Updates certification docs. |
| c9b1c7d | 2026-07-05 | Remove obsolete RESTAURANT_OPERATING file | Cleanup, Documentation | Low | Deletes stale doc. |
| 3d72401 | 2026-07-05 | Governance sync: core docs | Governance, Documentation | Informational | Documentation alignment. |
| a087316 | 2026-07-05 | Update commercial coverage matrix | Governance, Documentation | Informational | Coverage tracking. |
| d35d30b | 2026-07-05 | Phase 2 scope validation | Governance, Documentation | Informational | Scope validation record. |
| 4b395cf | 2026-07-05 | Phase 1 stabilization (dashboard fix) | UI, Testing, Documentation | Medium | Restores dashboard build & test assets. |
| d100896 | 2026-07-05 | Protect analytics & business settings endpoints | API, Authorization, Security | High | Adds auth guards to 12 endpoints. |
| 09cd41b | 2026-07-05 | Correct commercial enforcement for AI credits | API, Authorization, Commerce | High | Fixes feature check for AI credits purchase. |
| d4282dc | 2026-07-05 | CRM domain certification | API, Authorization, Governance | High | Adds `requiresFeature('hasCRM')` on CRM endpoints. |
| e57cfd7 | 2026-07-05 | Marketing domain certification | API, Authorization, Governance | High | Enforces marketing feature flags. |
| 0be6292 | 2026-07-05 | Add-ons domain certification | API, Authorization, Governance | High | Protects add-ons endpoints. |
| 9945697 | 2026-07-05 | Billing domain certification | API, Authorization, Governance | High | Enforces billing feature gating. |
| a28c578 | 2026-07-05 | Remaining scope audit | Governance, Documentation | Informational | Audit report. |
| c78aeed | 2026-07-05 | Business system architecture status | Governance, Documentation | Informational | Architecture status report. |
| 942cf37 | 2026-07-05 | Supplier marketplace domain certified | API, Authorization, Governance | High | Feature gate supplier APIs. |
| d07ddcf | 2026-07-05 | Add milestone completion framework | Governance | Informational | Process governance. |
| 8059f14 | 2026-07-05 | Business Administration system certification | API, Authorization, Governance | High | Gate admin endpoints. |
| 99ae260 | 2026-07-05 | Administration domain certified | API, Authorization, Governance | High | Enforces admin feature flags. |
| db4db64 | 2026-07-05 | Business settings domain certified | API, Authorization, Governance | High | Feature gate settings APIs. |
| 0ab7df4 | 2026-07-05 | Staff & Roles domain certified | API, Authorization, Governance | High | Protects staff endpoints. |
| 29a529f | 2026-07-05 | Formalize Imboni Architecture Standard | Governance, Documentation | Informational | Establishes IAS. |
| 17b43f1 | 2026-07-05 | Customer Growth system certification | API, Authorization, Governance | High | Enforces marketing growth endpoints. |
| 1751b6c | 2026-07-05 | Partner Program domain certified | API, Authorization, Governance | High | Feature gate partner APIs. |
| 663dc0b | 2026-07-05 | Business Discovery domain certified | API, Authorization, Governance | High | Gate discovery endpoints. |
| fb303cf | 2026-07-05 | Enhance certification framework | Governance | Informational | Process update. |
| 0db4047 | 2026-07-05 | Business Intelligence system certification | API, Authorization, Governance | High | Feature gate BI endpoints. |
| cadc608 | 2026-07-05 | AI Features domain certified | API, Authorization, Governance | High | Enforces AI feature flags. |
| bfdbfa9 | 2026-07-05 | Reports & Analytics domain certified | API, Authorization, Governance | High | Gates analytics APIs. |
| cd6cbd4 | 2026-07-05 | Add certification requirements | Governance | Informational | Governance baseline. |
| 225adb7 | 2026-07-05 | Restaurant Operations system certification | API, Authorization, Governance | High | Enforces operations feature gating. |
| 0f07664 | 2026-07-05 | Payments domain certified | API, Authorization, Governance | High | Feature gate payment APIs. |
| f3a6f78 | 2026-07-05 | QR Ordering domain certified | API, Authorization, Governance | High | Gates QR endpoints. |
| 0932384 | 2026-07-05 | Inventory Operations system certification | API, Authorization, Governance | High | Enforces inventory feature gating. |
| 092a9b0 | 2026-07-05 | Supplier marketplace domain certified (part 2) | API, Authorization, Governance | High | Additional supplier enforcement. |
| ca9d946 | 2026-07-05 | Procurement domain certified | API, Authorization, Governance | High | Gates procurement APIs. |
| 444bac0 | 2026-07-05 | Inventory domain certified | API, Authorization, Governance | High | Feature gate inventory APIs. |
| 8caf569 | 2026-07-05 | Menu management domain certified | API, Authorization, Governance | High | Gates menu APIs. |
| 4857b47 | 2026-07-05 | Tables domain certified | API, Authorization, Governance | High | Enforces table feature flags. |
| 03eb1d1 | 2026-07-04 | Kitchen operations certified | API, Authorization, Governance | High | Gates kitchen APIs. |
| c222516 | 2026-07-04 | Orders domain certified | API, Authorization, Governance | High | Enforces order access. |
| e3a2394 | 2026-07-04 | Reservations domain certified | API, Authorization, Governance | High | Gates reservation APIs. |
| a94283d | 2026-07-04 | Governance refinement | Governance | Informational | Documentation update. |
| 220929b | 2026-07-03 | Systematic rollout initiated | Governance, Documentation | Informational | Coverage rollout doc. |
| bde3421 | 2026-07-03 | Commercial enforcement architecture | API, Authorization, Governance, Documentation | High | Introduces enforcement architecture artefacts. |
| 1c4815c | 2026-07-03 | Commercial Truth roadmap | Governance, Documentation | Informational | Roadmap doc. |
| d59a769 | 2026-07-03 | Commercial foundation alignment | Governance, Documentation | Informational | Pricing & entitlements doc. |
| 6d3dc76 | 2026-06-30 | feat(homepage): final polish for RC1 | UI, Pages, Localization | Medium | Homepage polish, content updates. |
| 789f0c3 | 2026-06-30 | docs(homepage): Founder acceptance review | Documentation | Informational | Acceptance summary. |
| 9b5710a | 2026-06-30 | docs(homepage): implementation summary | Documentation | Informational | Implementation recap. |
| 2238ebf | 2026-06-30 | feat(homepage): Founder Constitution | UI, Pages, Content | Medium | Adds constitutional content to homepage. |
| 727fe02 | 2026-06-30 | docs(homepage): founder handoff summary | Documentation | Informational | Handoff doc. |
| 5069e8e | 2026-06-30 | docs(homepage): decision queue | Documentation | Informational | Decision queue doc. |
| 698208c | 2026-06-30 | fix(homepage): remove dashboard links | UI, Pages | Medium | Removes production-only links. |
| f0fe2a0 | 2026-06-30 | docs(homepage): certification deliverables | Documentation | Informational | Certification doc. |
| 33e2ec7 | 2026-06-30 | test(stabilization): fix TS alias test | Testing | Low | Fixes test import path. |
| 54036b9 | 2026-06-29 | docs(rc1): final engineering closure | Documentation | Informational | Closure reports. |
| 1ccb262 | 2026-06-29 | Remove orphaned migration | Database | Medium | Deletes unused Prisma migration. |
| e75b60f | 2026-06-29 | chore(rc1): finalize repository for release | API, Authorization, UI, Tests, Governance, Assets, Configuration | Critical | Huge content drop: dashboards, APIs, tests, cron docs, webhook governance JSON. |
| 16ea08d | 2026-06-29 | feat(rc1): complete engineering gates 2.5–7 | UI, Components, Documentation, Testing | Medium | Replaces alert() usage, adds 9 audit reports. |

## Phase 3 — Functional Impact by Category
- **API / Authorization (32 commits):** Introduces or tightens `requiresFeature`, subscription checks, and business scoping on 60+ endpoints. **Runtime behaviour:** Yes. **Business logic:** Yes (commercial gating). **APIs:** Signature/path unchanged but authorization semantics enforced. **Database/schema:** No. **Routing:** No. **Auth:** Strengthened. **Intelligence / Replay / AI Copilot:** Indirect (feature access gating). **Documentation-only:** No.
- **Authentication / Security (1 commit `3d2787a`):** Updates NextAuth flow, CSP, diagnostics. **Runtime:** Yes. **Business logic:** Session handling improved. **APIs:** Login adjustments. **Security:** Enhanced. **Docs:** No.
- **Database (3 commits – `a953cd7`, `09d21ae`, `1ccb262`):** Provide recovery scripts, fix schema, remove orphan migration. **Runtime:** Not by default, but migrations influence schema state. **Database schema:** Yes (corrections/recovery). **Risk:** High if omitted.
- **Infrastructure / Deployment / Build (3 commits – `bd40329`, `896270a`, `3a0e827`):** Cron configuration, Next.js build mode, start script. **Runtime:** Cron + build. **Deployment:** Yes.
- **UI / Pages / Components (6 commits – `6d3dc76`, `2238ebf`, `698208c`, `16ea08d`, `4b395cf`, `09d21ae` homepage portion):** Front-end polish, alert replacements, page fixes. **Runtime/UI:** Yes. **Business logic:** Minimal except gating via docs. **Routing:** No (existing pages updated).
- **Operational & Governance Documentation (≈40 commits):** No runtime impact; essential for audit trail and runbooks.
- **Testing (2 commits – `33e2ec7`, `09d21ae` test recovery):** Test-only fixes. **Runtime:** No.
- **Large Consolidation (`e75b60f`):** Multi-domain: adds/updates APIs, dashboards, tests, webhook governance. **Runtime:** Yes across many systems (Service Replay removal, new dashboards). **Business logic:** Yes. **Auth:** Reinforced. **Routing:** Adds pages. **Intelligence/Replays:** Service Replay pages removed from RC1 to align with architecture.

## Phase 4 — Risk Assessment Summary
- **Critical:** `e75b60f` (massive baseline), absence would leave `main` without certified dashboards, gating, webhook governance; also deletes Service Replay legacy pages, so reintroduction conflicts anticipated.
- **High:** All domain certification commits, `3d2787a`, `a953cd7`, `09d21ae`, `bd40329`, `d100896`, `09cd41b`. Missing them breaks commercial enforcement, authentication resilience, cron execution, and supabase recovery capability.
- **Medium:** `896270a`, `4b395cf`, `16ea08d`, `6d3dc76`, `2238ebf`, `698208c`, `1ccb262`. Impactful but contained.
- **Low:** `3a0e827`, `33e2ec7`, `c9b1c7d`. 
- **Informational:** Remaining documentation/governance commits – while not affecting runtime, they are mandatory for compliance artefacts.

## Phase 5 — File Analysis
| Group | Files | Primary Purpose | Release Impact |
|-------|-------|-----------------|----------------|
| Documentation | 518 | Certification reports, launch runbooks, governance records, RC1 artefacts | Compliance evidence; critical for audited release trail though no runtime effect. |
| Source code (`src/…`) | 596 | API handlers, dashboards, components, auth services | Direct runtime behaviour: commercial gating, UI polish, Service Replay removal. |
| Database (`prisma/…`, SQL) | 7 | Migration cleanup, recovery scripts, schema fix | Ensures schema parity and recovery instructions. |
| Tests (`tests/…`) | 8 | Service tests, stabilization fixes | Guard against regressions; missing tests reduce coverage. |
| Scripts (`scripts/…`) | 27 | Supabase recovery, cron diagnostics, perf/security preflight | Operational tooling. |
| Configuration (`tsconfig*`, `package*.json`, etc.) | 6 | Build/test configuration alignment | Keeps tooling consistent with RC1 baseline. |
| Infrastructure (`vercel.json`, `webhook-governance.json`) | 2 | Deployment schedules, webhook governance matrix | Required for production automation and audit. |
| Assets | 5 | Media/content for dashboards or docs | UI completeness. |
| Other | 209 | JSON data, backups, backup copies | Mixed support files, mostly governance data. |

## Phase 6 — Recommended Reconciliation Strategy
**Option C: Create a dedicated integration branch from `release/v1.0.0-rc1`, then merge `main` into it.**
- Keeps the certified RC1 baseline intact (preserving governance artefacts and commercial enforcement).
- Allows careful integration of the five `main` commits (HIE/IKB enhancements, Prisma sync, Service Replay feature, OTP alignment, auth fix variant).
- Supports staged conflict resolution and validation without disturbing the frozen branch history.
- After successful integration and validation, promote the new branch as the staging/UAT source and optionally retire `release/v1.0.0-rc1` post-production.

## Phase 7 — Conflict Prediction
| Area | Expected Conflict Level | Rationale |
|------|------------------------|-----------|
| **Merge conflicts** | **High** | `next.config.js`, auth service files, Service Replay directories, Prisma schema all changed on both sides (different implementations). |
| **Database** | **Medium** | `prisma/schema.prisma` edits on `main` (Prisma sync) plus recovery scripts on release branch. Schema structure may collide with new models. |
| **Prisma migrations** | **Medium** | Orphaned migration removal (`1ccb262`) vs new migrations on `main` requires careful ordering. |
| **API handlers** | **High** | Many RC1 commits enforce `requiresFeature` while `main` may have diverged; same files likely touched by Service Replay refactor or integration helper removal. |
| **Authentication** | **High** | `3d2787a` and `c628491` both touch auth. Need to reconcile differences carefully. |
| **Routing/Page files** | **Medium** | Release branch removed/modified Service Replay and dashboards; `main` reintroduces new App Router files in `src/app/...` (from HIE work). Need to ensure coexistence. |
| **Dependencies/configuration** | **Low** | Minimal package changes, but `tsconfig` edits in RC1 vs `main` likely align. |

## Phase 8 — Validation Plan
Execute after conflicts resolved on the integration branch:
1. **Install & Build**: `npm install`, `npm run build` (verify 347+ pages, standalone output). 
2. **Database**:
   - Apply Prisma migrations (`prisma migrate deploy`).
   - Run recovery scripts in staging clone (validate `cleanup-and-apply.sql`).
   - Regenerate Prisma client.
3. **Automated Tests**:
   - `npm test -- --selectProjects unit,integration`.
   - Targeted suites for Service Replay, intelligence services, authorization tests.
4. **Service Replay Verification**:
   - Ensure new Service Replay™ implementation from `main` coexists with RC1 removals; re-run replay API tests.
5. **Intelligence Stack**:
   - Validate HIE/IKB integrations (Daily Briefings, Kitchen, Menu, Multi-location, AI Copilot™).
6. **Feature Gating Audit**:
   - Execute commercial enforcement smoke tests (ensuring `requiresFeature` intact).
7. **Cron & Infrastructure**:
   - Validate `vercel.json` cron definitions, confirm env parity.
8. **Performance**:
   - Measure key response times (HIE analysis, IKB queries, API endpoints) against RC1 benchmarks.
9. **Security**:
   - Run authentication flow, verify CSP, session handling, business context resolution.
10. **Accessibility & UI**:
    - Spot-check major dashboards/homepage for regressions introduced by merge.
11. **End-to-End Workflow**:
    - Execute hospitality workflow: Heart Pulse™ → Service Replay™ → HIE → IKB → Six intelligence consumers → AI Copilot™.

## Executive Recommendation
- **Decision:** **OPTION 1 — SAFE TO RECONCILE** with the prescribed integration strategy.
- **Rationale:** All high-risk functionality (feature gating, auth hardening, cron schedules, schema fixes) resides on `release/v1.0.0-rc1`. The five `main` commits extend platform intelligence and must be layered on top without discarding RC1 work. An integration branch protects the frozen RC1 history while enabling careful conflict resolution and validation.
- **Prerequisites before reconciliation:**
  1. Allocate engineering bandwidth for conflict resolution in high-risk files (`next.config.js`, `src/pages/api/**`, `prisma/schema.prisma`, Service Replay directories).
  2. Prepare the validation plan, including database clone for recovery script dry run.
  3. Ensure governance stakeholders agree that RC1 artefacts remain authoritative baseline.

---

**Next Actions (analysis only):**
1. Create `release/v1.0.0-rc1-hie-integration` (or similar) from `release/v1.0.0-rc1`.
2. Merge `main` into the new branch locally, resolving predicted conflicts.
3. Execute validation plan end-to-end.
4. Present reconciliation results for approval before resuming UAT/staging.
