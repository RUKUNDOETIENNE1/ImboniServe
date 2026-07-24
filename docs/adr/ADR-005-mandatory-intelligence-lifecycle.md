# ADR-005: Mandatory Intelligence Module Lifecycle

**Status:** ✅ Accepted  
**Date:** 2026-07-22  
**Deciders:** Platform Architecture Team  
**Affected Components:** All intelligence modules, certification process

---

## Context

During the development of the first three intelligence modules, we observed different approaches:

**Daily Briefings:**
- Architecture → Implementation → Runtime Issues → Fixes → Validation → Certification
- 6 runtime defects discovered
- Multiple fix iterations required

**Service Intelligence:**
- Architecture → Implementation → Runtime Validation → Certification
- 0 runtime defects
- Single iteration

**Kitchen Intelligence:**
- Architecture → Implementation → Runtime Validation → Certification
- 0 runtime defects
- Single iteration

We needed to decide: Should the engineering lifecycle be flexible, or should it be mandatory and standardized?

---

## Decision

**All intelligence modules MUST follow a mandatory 6-stage lifecycle.**

**Mandatory Lifecycle:**

1. **Architecture** - Define module purpose and design
2. **Implementation** - Build the module using platform
3. **Runtime Validation** - Prove it works with real data
4. **Production Certification** - Certify it's production-ready
5. **Platform Integration** - Integrate into platform documentation
6. **Release** - Deploy to production

**No module may skip any stage. Each stage has defined completion criteria.**

---

## Consequences

### Positive

1. **Quality Consistency**
   - All modules meet same quality bar
   - Predictable quality
   - Objective certification

2. **Defect Prevention**
   - Runtime validation catches defects early
   - Service Intelligence: 0 defects
   - Kitchen Intelligence: 0 defects

3. **Process Clarity**
   - Clear expectations
   - Defined completion criteria
   - No ambiguity

4. **Risk Mitigation**
   - Issues caught before production
   - Cheaper to fix during development
   - Reduced production incidents

### Negative

1. **Process Overhead**
   - Each stage requires time
   - Cannot skip stages
   - May feel bureaucratic

2. **Flexibility Reduced**
   - Cannot fast-track modules
   - Cannot skip validation
   - Rigid process

3. **Time Investment**
   - Runtime validation adds ~1 hour
   - Certification adds ~1 hour
   - Total: ~2 hours overhead

---

## Alternatives Considered

### Alternative 1: Flexible Lifecycle

**Approach:** Modules can skip stages if deemed unnecessary.

**Pros:**
- Faster for simple modules
- Flexible
- Less overhead

**Cons:**
- Inconsistent quality
- Defects escape
- No objective standard

**Rejected because:** Daily Briefings showed that skipping validation leads to 6 defects.

---

### Alternative 2: Compilation-Only Lifecycle

**Approach:** Architecture → Implementation → Compilation → Release

**Pros:**
- Fast
- Simple
- Low overhead

**Cons:**
- No runtime validation
- Defects escape to production
- High risk

**Rejected because:** Compilation doesn't catch runtime defects (6 in Daily Briefings).

---

### Alternative 3: Production-First Lifecycle

**Approach:** Deploy to production, then iterate based on feedback.

**Pros:**
- Fast to market
- Real user feedback
- Authentic validation

**Cons:**
- Customer impact
- Reputation risk
- Expensive to fix

**Rejected because:** Production is not a testing environment.

---

## Rationale

**Evidence-Driven Decision:**

Comparison of approaches:

| Module | Lifecycle | Runtime Defects | Iterations |
|--------|-----------|----------------|------------|
| Daily Briefings | Flexible | 6 | Multiple |
| Service Intelligence | Mandatory | 0 | Single |
| Kitchen Intelligence | Mandatory | 0 | Single |

Mandatory lifecycle with runtime validation prevents defects.

**Quality Standard:**

Production certification must be:
- Objective (defined criteria)
- Measurable (test pass rate)
- Consistent (same for all modules)
- Rigorous (no shortcuts)

Mandatory lifecycle provides this.

**Risk Mitigation:**

Production defects:
- Impact customers
- Damage reputation
- Expensive to fix
- Create technical debt

Lifecycle stages:
- Catch defects early
- Cost ~2 hours per module
- Prevent production incidents
- ROI: High

---

## Implementation

### Stage 1: Architecture

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
- Architecture reviewed
- Types defined
- Contracts documented

**Gate:** Architecture approval required before implementation

---

### Stage 2: Implementation

**Objective:** Build the module using platform.

**Activities:**
- Create aggregator
- Extend BaseIntelligenceService
- Extend BaseDashboardBuilder
- Create API endpoint
- Create validation script

**Deliverables:**
- Service implementation
- Dashboard builder
- API endpoint
- Validation script

**Completion Criteria:**
- Code compiles
- TypeScript passes
- Platform contracts satisfied

**Gate:** Successful compilation required before validation

---

### Stage 3: Runtime Validation

**Objective:** Prove it works with real data.

**Activities:**
- Run validation script
- Generate reports
- Build dashboards
- Test export
- Verify persistence

**Deliverables:**
- Validation results
- Runtime evidence
- Test reports

**Completion Criteria:**
- All tests pass (100%)
- Reports generate
- Dashboards render
- No exceptions

**Gate:** 100% validation success required before certification

---

### Stage 4: Production Certification

**Objective:** Certify production readiness.

**Activities:**
- Review validation results
- Verify completion gate
- Document issues
- Create certification report

**Deliverables:**
- Certification report
- Completion gate results
- Known issues

**Completion Criteria:**
- All gate criteria met
- Zero blocking defects
- Report approved

**Gate:** Certification approval required before integration

---

### Stage 5: Platform Integration

**Objective:** Integrate into platform.

**Activities:**
- Update platform docs
- Add to supported modules
- Update version compatibility
- Document metrics

**Deliverables:**
- Updated documentation
- Integration metrics
- Reuse analysis

**Completion Criteria:**
- Module listed
- Metrics documented
- Integration complete

**Gate:** Integration complete before release

---

### Stage 6: Release

**Objective:** Deploy to production.

**Activities:**
- Deploy to production
- Monitor usage
- Verify behavior
- Document metrics

**Deliverables:**
- Production deployment
- Monitoring dashboards
- Production metrics

**Completion Criteria:**
- Deployed successfully
- Behavior matches validation
- No incidents

**Gate:** Module is production-certified and released

---

## Enforcement

**Mandatory Compliance:**
- All future modules must follow lifecycle
- No exceptions without ADR
- Platform team enforces compliance

**Verification:**
- Each stage has deliverables
- Each stage has completion criteria
- Each stage has gate approval

**Consequences of Non-Compliance:**
- Module not certified
- Module not deployed
- Module not supported

---

## Review

**Next Review:** After Menu Intelligence™ implementation

**Success Criteria:**
- Menu Intelligence follows lifecycle
- Zero defects escape to production
- Process feels natural, not bureaucratic

**Potential Revisions:**
- Refine stage definitions based on experience
- Add or remove stages if justified
- Adjust completion criteria if needed

---

**Status:** ✅ **ACCEPTED AND MANDATORY**  
**Effective Date:** 2026-07-22  
**Mandatory For:** All intelligence modules  
**Exceptions:** None (requires ADR for exception)
