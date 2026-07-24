# Contributing to Hospitality Intelligence Platform

Thank you for your interest in contributing to the Hospitality Intelligence Platform!

This document provides guidelines for contributing to the platform and developing new intelligence modules.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Intelligence Module Development](#intelligence-module-development)
4. [Certification Workflow](#certification-workflow)
5. [Architecture Expectations](#architecture-expectations)
6. [Testing Expectations](#testing-expectations)
7. [ADR Process](#adr-process)
8. [Regression Requirements](#regression-requirements)
9. [Definition of Done](#definition-of-done)
10. [Code Review](#code-review)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- TypeScript knowledge
- Familiarity with Next.js
- Understanding of Prisma ORM

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up database: `npx prisma migrate dev`
4. Review platform documentation:
   - [Platform Baseline](docs/PLATFORM_BASELINE_v1.0.0.md)
   - [Architecture Specification](docs/HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md)
   - [ADRs](docs/adr/)

---

## Development Workflow

### For Platform Changes

Platform changes require careful consideration and approval.

**Process:**

1. **Identify Need**
   - Significant architecture decision required
   - Impacts multiple modules or platform
   - Requires documentation for future reference

2. **Create ADR**
   - Use template in `docs/adr/README.md`
   - Document context, decision, consequences, alternatives, rationale
   - Assign next ADR number

3. **Review**
   - Share with platform team
   - Gather feedback
   - Address concerns

4. **Approve**
   - Obtain approval from platform architecture team
   - Mark as "Accepted"
   - Commit to repository

5. **Implement**
   - Implement the decision
   - Reference ADR in code/docs
   - Run regression tests (100% pass required)

6. **Validate**
   - All certified modules must pass validation
   - Zero behavioral regressions
   - Update documentation

**Note:** Platform changes are rare. Most work is module development.

---

### For Intelligence Module Development

Intelligence modules extend the platform without modifying it.

**Process:**

1. **Review Roadmap**
   - Check [ROADMAP.md](ROADMAP.md) for planned modules
   - Ensure module is next in sequence
   - Confirm no platform changes required

2. **Follow Engineering Lifecycle**
   - Stage 1: Architecture
   - Stage 2: Implementation
   - Stage 3: Runtime Validation
   - Stage 4: Production Certification
   - Stage 5: Platform Integration
   - Stage 6: Release

3. **Use Platform Components**
   - Extend BaseIntelligenceService
   - Extend BaseDashboardBuilder
   - Use createIntelligenceEndpoint()
   - Use createIntelligenceValidator()

4. **Pass Certification**
   - 100% runtime validation success
   - Zero production-blocking defects
   - All 9 certification criteria met

---

## Intelligence Module Development

### Mandatory 6-Stage Lifecycle

All intelligence modules MUST complete these stages in order:

#### Stage 1: Architecture

**Objective:** Define the intelligence module.

**Activities:**
- Define module purpose
- Identify data sources
- Design report structure
- Plan dashboard sections
- Document expected insights

**Deliverables:**
- Architecture document
- Type definitions
- Interface contracts

**Completion Criteria:**
- Architecture reviewed and approved
- Types defined
- Contracts documented

**Gate:** Architecture approval required before implementation

---

#### Stage 2: Implementation

**Objective:** Build the module using the platform.

**Activities:**
- Create aggregator (module-specific logic)
- Extend BaseIntelligenceService
- Extend BaseDashboardBuilder
- Create API endpoint using factory
- Create validation script using framework

**Deliverables:**
- Service implementation
- Dashboard builder implementation
- API endpoint
- Validation script

**Completion Criteria:**
- Code compiles without errors
- TypeScript type checking passes
- All platform contracts satisfied

**Gate:** Successful compilation required before validation

---

#### Stage 3: Runtime Validation

**Objective:** Prove the module works with actual operational data.

**Activities:**
- Run validation script
- Generate intelligence reports
- Build dashboards
- Test export functionality
- Verify persistence
- Test historical reports

**Deliverables:**
- Validation results
- Runtime evidence
- Test reports

**Completion Criteria:**
- All validation tests pass (100%)
- Reports generate successfully
- Dashboards render without errors
- Export works
- No runtime exceptions

**Gate:** 100% validation success required before certification

---

#### Stage 4: Production Certification

**Objective:** Certify the module is production-ready.

**Activities:**
- Review validation results
- Verify completion gate criteria
- Document any cosmetic enhancements (non-blocking)
- Create certification report

**Deliverables:**
- Certification report
- Completion gate results
- Known issues (if any)

**Completion Criteria:**
- All 9 completion gate criteria met
- Zero production-blocking defects
- Certification report approved

**Gate:** Certification approval required before platform integration

---

#### Stage 5: Platform Integration

**Objective:** Integrate the certified module into the platform.

**Activities:**
- Update platform documentation
- Add module to supported modules list
- Update version compatibility
- Document platform reuse metrics

**Deliverables:**
- Updated platform documentation
- Integration metrics
- Reuse analysis

**Completion Criteria:**
- Module listed in platform documentation
- Metrics documented
- Integration complete

**Gate:** Integration complete before release

---

#### Stage 6: Release

**Objective:** Deploy the certified module to production.

**Activities:**
- Deploy to production environment
- Monitor initial usage
- Verify production behavior
- Document production metrics

**Deliverables:**
- Production deployment
- Monitoring dashboards
- Production metrics

**Completion Criteria:**
- Module deployed successfully
- Production behavior matches validation
- No production incidents

**Module is now production-certified and released.**

---

## Certification Workflow

### Production Certification Standard

Modules are certified for production if and only if all 9 criteria are met:

#### 1. ✅ Runtime Execution

**Requirement:** The module must execute successfully with actual operational data.

**Validation:**
- Service creates without errors
- Report generation succeeds
- No runtime exceptions
- Handles empty data gracefully

---

#### 2. ✅ Dashboard Rendering

**Requirement:** The dashboard must render without errors.

**Validation:**
- Dashboard builds successfully
- All sections present
- No null reference errors
- Defensive handling verified

---

#### 3. ✅ API Validation

**Requirement:** API endpoints must function correctly.

**Validation:**
- Authentication works
- Request validation works
- Response formatting correct
- Error handling works

---

#### 4. ✅ Persistence

**Requirement:** Reports must persist to database correctly.

**Validation:**
- Reports save to IntelligenceReport table
- Report retrieval works
- Data integrity maintained

---

#### 5. ✅ Export

**Requirement:** Reports must export successfully.

**Validation:**
- JSON serialization works
- Export size reasonable
- Data completeness verified

---

#### 6. ✅ Historical Reporting

**Requirement:** Historical reports must work for any date range.

**Validation:**
- Custom date ranges work
- Predefined periods work
- Time range logic correct

---

#### 7. ✅ Duplicate Prevention

**Requirement:** Duplicate reports must not be generated.

**Validation:**
- Caching works correctly
- Duplicate detection works
- Cache invalidation works

---

#### 8. ✅ Regression Testing

**Requirement:** No behavioral regressions from previous versions.

**Validation:**
- All previous tests still pass
- Behavior identical to previous version
- No unexpected changes

---

#### 9. ✅ Zero Production-Blocking Defects

**Requirement:** No defects that prevent production use.

**Validation:**
- All critical paths work
- Error handling complete
- Edge cases handled

---

**Certification Declaration:**

```
🟢 [MODULE NAME] — PRODUCTION CERTIFIED
```

---

## Architecture Expectations

### Module Contract

Every intelligence module MUST:

1. **Extend BaseIntelligenceService**
   ```typescript
   class ModuleService extends BaseIntelligenceService<
     ModuleRequest,
     ModuleReport,
     ModuleResponse
   > {
     protected getEventTypes(): string[] { /* ... */ }
     protected async buildReport(request, events, timeRange): Promise<ModuleReport> { /* ... */ }
     protected createSuccessResponse(report, diagnostics): ModuleResponse { /* ... */ }
     protected createErrorResponse(error, diagnostics): ModuleResponse { /* ... */ }
   }
   ```

2. **Extend BaseDashboardBuilder**
   ```typescript
   class ModuleDashboardBuilder extends BaseDashboardBuilder<
     ModuleReport,
     ModuleDashboard
   > {
     build(report: ModuleReport): ModuleDashboard { /* ... */ }
     // Use inherited utilities: formatDuration, calculateGrade, etc.
   }
   ```

3. **Use API Endpoint Factory**
   ```typescript
   export default createIntelligenceEndpoint<ModuleRequest, ModuleResponse>(
     'Module Name',
     createModuleService
   )
   ```

4. **Use Validation Framework**
   ```typescript
   const validator = createIntelligenceValidator(
     'Module Name',
     createModuleService,
     createModuleDashboardBuilder
   )
   ```

### Module Prohibitions

Intelligence modules MUST NOT:

1. **Reimplement Platform Services**
   - ❌ Do not create custom event retrieval
   - ❌ Do not create custom time range logic
   - ❌ Do not create custom authentication
   - ❌ Do not create custom caching
   - ✅ Use platform services

2. **Modify Platform Infrastructure**
   - ❌ Do not modify BaseIntelligenceService
   - ❌ Do not modify BaseDashboardBuilder
   - ❌ Do not modify API Endpoint Factory
   - ❌ Do not modify Heart Pulse
   - ✅ Extend, don't modify

3. **Skip Lifecycle Stages**
   - ❌ Do not skip runtime validation
   - ❌ Do not skip production certification
   - ❌ Do not deploy without certification
   - ✅ Follow mandatory lifecycle

4. **Create Parallel Systems**
   - ❌ Do not create alternative event systems
   - ❌ Do not create alternative caching
   - ❌ Do not create alternative authentication
   - ✅ Integrate with platform

---

## Testing Expectations

### Runtime Validation

**Mandatory for all modules.**

**Framework:**
```typescript
const validator = createIntelligenceValidator(
  'Module Name',
  createModuleService,
  createModuleDashboardBuilder
)

const results = await validator.validate()
await validator.cleanup()
```

**Success Criteria:**
- 100% test pass rate
- Zero runtime exceptions
- Graceful empty data handling

---

### Regression Testing

**Mandatory for all platform changes.**

**Process:**
1. Run validation for all certified modules
2. Compare behavior before/after
3. Document any differences
4. Fix regressions (or reject change)
5. Rerun tests until 100% pass

**Acceptance Criteria:**
- 100% test pass rate
- Zero behavioral regressions
- Identical output for identical input

---

## ADR Process

### When to Create an ADR

Create an ADR for:
- Platform architecture changes
- New shared abstractions
- Breaking changes
- Governance changes
- Certification standard changes

### ADR Template

See `docs/adr/README.md` for the complete template.

**Key Sections:**
- Context
- Decision
- Consequences
- Alternatives Considered
- Rationale

### ADR Workflow

1. Draft ADR using template
2. Assign next ADR number
3. Submit for review
4. Address feedback
5. Obtain approval
6. Mark as "Accepted"
7. Implement decision
8. Reference ADR in code/docs

---

## Regression Requirements

### Behavioral Equivalence

All platform refactoring MUST preserve 100% behavioral equivalence.

**Requirements:**
- Generated reports must be identical
- Dashboard structure must be identical
- API responses must be identical
- Export format must be identical
- Database persistence must be identical

**Validation:**
- Automated regression tests
- Before/after comparison
- 100% pass rate required

**Any behavioral change is considered a regression.**

---

## Definition of Done

### For Intelligence Modules

A module is "done" when:

✅ All 6 lifecycle stages completed  
✅ All 9 certification criteria met  
✅ 100% runtime validation success  
✅ Zero production-blocking defects  
✅ Certification report approved  
✅ Platform documentation updated  
✅ Production deployment successful  

---

### For Platform Changes

A platform change is "done" when:

✅ ADR created and approved  
✅ Implementation complete  
✅ All certified modules pass regression tests  
✅ Zero behavioral regressions  
✅ Documentation updated  
✅ Version number updated (if applicable)  

---

## Code Review

### Review Checklist

**For Intelligence Modules:**
- [ ] Extends BaseIntelligenceService
- [ ] Extends BaseDashboardBuilder
- [ ] Uses createIntelligenceEndpoint()
- [ ] Uses createIntelligenceValidator()
- [ ] Follows platform patterns
- [ ] No platform modifications
- [ ] Runtime validation passes
- [ ] Certification criteria met

**For Platform Changes:**
- [ ] ADR created and approved
- [ ] Regression tests pass (100%)
- [ ] Zero behavioral regressions
- [ ] Documentation updated
- [ ] Version policy followed

---

## Questions?

For questions about contributing:

1. Review [Platform Baseline](docs/PLATFORM_BASELINE_v1.0.0.md)
2. Review [Architecture Specification](docs/HOSPITALITY_INTELLIGENCE_PLATFORM_V1_ARCHITECTURE.md)
3. Review [ADRs](docs/adr/)
4. Contact Platform Architecture Team

---

## Code of Conduct

- Be respectful and professional
- Focus on technical merit
- Provide constructive feedback
- Follow established patterns
- Maintain quality standards
- Document decisions
- Test thoroughly

---

**Last Updated:** 2026-07-22  
**Version:** 1.0  
**Status:** 🟢 Active
