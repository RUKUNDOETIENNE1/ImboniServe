# IMBONI ARCHITECTURE STANDARD (IAS) v1.0
## CONSTITUTION

```yaml
id: IAS-V1
title: Imboni Architecture Standard Constitution
type: architecture
version: 1.0
status: active
owner: Engineering Lead
created: 2026-07-06
updated: 2026-07-30
review_frequency: annual
depends_on: [IECON-001]
implements: []
related_documents: [ARCH_INVARIANTS, IAS_GOV_MODEL, IAS_AMENDMENTS]
supersedes: []
tags: [architecture, ias, constitution]
```

**Ratified:** 2026-07-06  
**Authority:** Imboni Integrated Systems  
**Scope:** All Imboni Products and Platforms  

---

## PREAMBLE

The Imboni Architecture Standard (IAS) is the permanent engineering constitution for all Imboni products and platforms.

**Purpose:**
- Establish permanent engineering principles
- Define systematic product development
- Enable constitutional governance
- Ensure architectural consistency
- Compound engineering discipline

**Applicability:**
- ImboniServe (Restaurant Management)
- AgriPal (Agricultural Management)
- HerdTrack (Livestock Management)
- Imboni Travel (Travel & Hospitality)
- All future Imboni platforms

**Foundation:**
IAS emerged from Milestone 2 of ImboniServe, where systematic commercial enforcement revealed permanent engineering patterns that transcend any single product.

---

## ARTICLE I: CORE PRINCIPLES

### Section 1.1: IAS Measures Reality—Not Assumptions

**Principle:**
Engineering decisions must be based on verified production reality, not estimates, assumptions, or inherited beliefs.

**Requirements:**
1. **Scope Verification:** All production scope must be verified before claiming completion
2. **Continuous Validation:** Scope must be validated at every phase
3. **Correction Acceptance:** Scope corrections are improvements, not failures
4. **Truth Over Optimism:** Governance requires truth, not wishful thinking

**Application:**
- Verify endpoint counts before implementation
- Measure actual capabilities, not planned features
- Validate production reality continuously
- Accept corrections as discipline

**Rationale:**
Milestone 2 began with an estimate of 103 endpoints, discovered 105, and verified 98. The correction (-7 endpoints) improved accuracy and prevented false completion claims.

---

### Section 1.2: Business Capability Before Technical Implementation

**Principle:**
Work must be organized by business capability, not technical layer.

**Requirements:**
1. **Business-First Organization:** Structure work around business domains
2. **Capability Measurement:** Measure customer capabilities, not API counts
3. **Domain Certification:** Certify domains, not endpoints
4. **Value Validation:** Certification validates customer value, not just code

**Application:**
- Identify business domains (Orders, Inventory, Payments)
- Map capabilities to domains
- Organize work by domain
- Certify business value

**Rationale:**
Technical layers (API routes, middleware, database) are implementation details. Business domains (Orders, Kitchen, Inventory) are the unit of customer value.

---

### Section 1.3: Commercial Truth Enforced Centrally

**Principle:**
All commercial decisions must flow through a centralized policy layer.

**Requirements:**
1. **Centralized Enforcement:** No hardcoded commercial logic in endpoints
2. **Policy Layer:** All commercial rules defined in one place
3. **Constitutional Authority:** Commercial decisions reference constitution
4. **Consistent Patterns:** Reusable enforcement patterns

**Application:**
- Define commercial features in constitution
- Implement centralized middleware
- Reference policy layer from endpoints
- Maintain single source of truth

**Rationale:**
Hardcoded plan checks create drift. Centralized enforcement enables systematic commercial operations and prevents revenue leakage.

---

### Section 1.4: Governance is Part of the Product

**Principle:**
Governance documentation is a deliverable, not overhead.

**Requirements:**
1. **Documentation as Product:** Governance docs are product artifacts
2. **Consistency Required:** All governance docs must be internally consistent
3. **Single Source of Truth:** One authoritative baseline across repository
4. **Synchronization Mandatory:** Governance must be synchronized continuously

**Application:**
- Design governance framework upfront
- Build documentation incrementally
- Maintain consistency continuously
- Synchronize at every phase

**Rationale:**
Governance without consistency is noise. Documentation enables future work. Governance scales with product complexity.

---

### Section 1.5: Architecture Precedes Implementation

**Principle:**
Architectural patterns must be established before implementation begins.

**Requirements:**
1. **Design First:** Architecture before code
2. **Pattern Reuse:** Reusable patterns over one-offs
3. **Standards Early:** Establish standards before scaling
4. **Framework Over Features:** Build frameworks, not just features

**Application:**
- Design protection models first
- Establish middleware patterns
- Define certification process
- Build reusable standards

**Rationale:**
Retrofitting architecture is expensive. Standards enable velocity. Frameworks compound over time.

---

## ARTICLE II: ENGINEERING PHILOSOPHY

### Section 2.1: Permanent Over Temporary

**Philosophy:**
Build permanent engineering capabilities, not temporary features.

**Characteristics of Permanent Assets:**
- **Reusable:** Patterns work across products
- **Documented:** Governance enables future work
- **Traceable:** Constitutional authority established
- **Scalable:** Compounds over time

**Examples:**
- ✅ Centralized middleware pattern (permanent)
- ❌ Hardcoded plan check in one endpoint (temporary)
- ✅ Domain certification process (permanent)
- ❌ Ad-hoc endpoint protection (temporary)

---

### Section 2.2: Framework Over Implementation

**Philosophy:**
Extract reusable frameworks from implementation work.

**Process:**
1. Implement systematically
2. Discover patterns
3. Extract frameworks
4. Document standards
5. Apply to future work

**Examples:**
- Commercial Enforcement Architecture (framework)
- Domain Certification Process (framework)
- Governance Synchronization (framework)
- Completion Gates (framework)

---

### Section 2.3: Quality Through Discipline

**Philosophy:**
Quality emerges from disciplined engineering, not heroic effort.

**Disciplines:**
- Scope verification before claiming completion
- Governance synchronization continuously
- Constitutional compliance always
- Repository integrity maintained

**Anti-Patterns:**
- ❌ Claiming completion without verification
- ❌ Conflicting metrics across documents
- ❌ Hardcoded business logic
- ❌ Ad-hoc governance

---

## ARTICLE III: COMMERCIAL TRUTH

### Section 3.1: Definition

**Commercial Truth:**
The verified, authoritative state of all commercial features, capabilities, and enforcement across a platform.

**Components:**
1. **Commercial Constitution:** Defines all features and tiers
2. **Enforcement Architecture:** Centralized protection patterns
3. **Coverage Verification:** Measured reality of protection
4. **Governance Integrity:** Consistent documentation

---

### Section 3.2: Constitutional Authority

**Requirement:**
Every commercial decision must have constitutional authority.

**Process:**
1. Define feature in Commercial Constitution
2. Map feature to plan tier
3. Implement centralized enforcement
4. Reference constitution from code
5. Maintain traceability

**Benefits:**
- Prevents ad-hoc decisions
- Enables systematic changes
- Provides audit trail
- Scales with complexity

---

### Section 3.3: Centralized Enforcement

**Pattern:**
```
Constitution → Policy Layer → Middleware → Endpoints
```

**Requirements:**
- No hardcoded plan checks
- All enforcement through middleware
- Consistent error handling
- Single source of truth

**Example (Product-Independent):**
```typescript
// Define in constitution
const FEATURES = {
  'feature-name': { tier: 'PROFESSIONAL', ... }
}

// Centralized middleware
export const requiresFeature = (featureName) => (handler) => {
  return async (req, res) => {
    if (!hasFeature(req.user, featureName)) {
      return res.status(403).json({ error: 'Upgrade required' })
    }
    return handler(req, res)
  }
}

// Apply to endpoint
export default requiresFeature('feature-name')(handler)
```

---

## ARTICLE IV: GOVERNANCE

### Section 4.1: Governance Framework

**Components:**
1. **Coverage Matrix:** Engineering view of protection
2. **Capability Matrix:** Customer view of features
3. **Domain Certification:** Business domain validation
4. **System Certification:** Business system validation
5. **Completion Gates:** Milestone validation
6. **Integrity Verification:** Repository consistency

---

### Section 4.2: Documentation Standards

**Requirements:**
1. **Consistency:** All docs report same baseline
2. **Traceability:** Capability → Constitution → Implementation
3. **Synchronization:** Updated continuously
4. **Verification:** Audited for conflicts

**Prohibited:**
- Conflicting metrics across documents
- Outdated baselines
- Ambiguous completion claims
- Unsynchronized governance

---

### Section 4.3: Single Source of Truth

**Principle:**
One authoritative baseline must exist across entire repository.

**Implementation:**
1. Define production baseline
2. Verify through audit
3. Synchronize all governance docs
4. Maintain consistency continuously

**Validation:**
- No conflicting endpoint counts
- No conflicting capability counts
- No conflicting completion percentages
- Repository-wide consistency verified

---

## ARTICLE V: CERTIFICATION

### Section 5.1: Domain Certification

**Process:**
1. Identify business domain
2. Map capabilities to domain
3. Implement protection
4. Verify coverage
5. Test regression
6. Certify domain

**Criteria:**
- ✅ 100% of domain endpoints protected
- ✅ 100% of customer capabilities governed
- ✅ Regression testing passed
- ✅ Commercial Truth maintained
- ✅ Constitutional compliance verified
- ✅ Build verification passed

---

### Section 5.2: Business System Certification

**Process:**
1. Group related domains into systems
2. Certify each domain independently
3. Verify system-level integration
4. Document system architecture
5. Certify complete system

**Benefits:**
- Enables parallel work
- Validates integration
- Provides system-level view
- Compounds domain certifications

---

### Section 5.3: Milestone Completion Gates

**Standard Gates:**
1. **Business System Architecture:** All systems identified and certified
2. **Domain Certification:** All domains certified
3. **Capability Coverage:** All capabilities governed
4. **Endpoint Protection:** All endpoints protected
5. **Commercial Truth:** Zero violations
6. **Constitutional Compliance:** Zero drift
7. **Build Verification:** Zero errors
8. **Regression Testing:** Zero issues
9. **Governance Synchronization:** All docs consistent

**Requirement:**
All gates must pass before milestone completion.

---

## ARTICLE VI: BUSINESS-FIRST ARCHITECTURE

### Section 6.1: Domain-First Design

**Principle:**
Organize all work by business domain, not technical layer.

**Process:**
1. Identify business domains
2. Map capabilities to domains
3. Define domain boundaries
4. Certify domains independently
5. Integrate at system level

**Benefits:**
- Stakeholders understand domains
- Certification validates value
- Enables parallel work
- Scales with complexity

---

### Section 6.2: Capability Mapping

**Process:**
1. Identify customer capabilities
2. Map capabilities to domains
3. Define plan tier requirements
4. Document in Capability Matrix
5. Implement protection
6. Verify coverage

**Dual View:**
- **Engineering View:** Endpoints, middleware, protection
- **Customer View:** Capabilities, features, value

---

## ARTICLE VII: CONSTITUTIONAL TRACEABILITY

### Section 7.1: Traceability Chain

**Required Chain:**
```
Business Strategy
    ↓
Commercial Constitution
    ↓
Capability Definition
    ↓
Domain Mapping
    ↓
Endpoint Protection
    ↓
Implementation
```

**Validation:**
Every protected endpoint must trace back to constitutional authority.

---

### Section 7.2: Amendment Process

**Process:**
1. Identify need for change
2. Propose constitutional amendment
3. Document business rationale
4. Update constitution
5. Update governance docs
6. Implement changes
7. Verify consistency

**Requirements:**
- All changes documented
- Constitutional authority maintained
- Governance synchronized
- Traceability preserved

---

## ARTICLE VIII: REPOSITORY INTEGRITY

### Section 8.1: Consistency Requirements

**Mandatory:**
1. **Single Baseline:** One authoritative production scope
2. **Synchronized Docs:** All governance docs consistent
3. **No Conflicts:** Zero conflicting metrics
4. **Verified Truth:** Production reality measured

---

### Section 8.2: Integrity Verification

**Process:**
1. Define production baseline
2. Synchronize all governance docs
3. Audit for conflicts
4. Verify consistency
5. Generate Integrity Report
6. Certify repository

**Frequency:**
- After every major milestone
- Before production deployment
- After scope corrections
- Continuously during development

---

## ARTICLE IX: STANDARDS LIFECYCLE

### Section 9.1: Standard Creation

**Process:**
1. Implement systematically
2. Discover patterns
3. Extract standards
4. Document principles
5. Validate across products
6. Ratify as IAS

---

### Section 9.2: Standard Evolution

**Allowed:**
- Refinement based on experience
- Extension for new use cases
- Clarification of ambiguity
- Addition of new principles

**Prohibited:**
- Breaking existing standards
- Contradicting core principles
- Product-specific exceptions
- Retroactive invalidation

---

### Section 9.3: Version Control

**Versioning:**
- **Major:** Breaking changes to core principles
- **Minor:** New principles or significant refinements
- **Patch:** Clarifications and corrections

**Current Version:** 1.0 (Initial Ratification)

---

## ARTICLE X: AMENDMENT PROCESS

### Section 10.1: Proposal

**Requirements:**
1. Identify gap or improvement
2. Document rationale
3. Propose specific changes
4. Validate against existing standards
5. Submit for review

---

### Section 10.2: Review

**Criteria:**
- Consistent with core principles
- Proven through implementation
- Product-independent
- No contradictions
- Measurable improvement

---

### Section 10.3: Ratification

**Process:**
1. Review proposal
2. Validate consistency
3. Update IAS Constitution
4. Document in changelog
5. Increment version
6. Publish update

---

## APPENDIX A: CORE DEFINITIONS

**Business Domain:**
A cohesive area of business functionality (e.g., Orders, Inventory, Payments)

**Business Capability:**
A specific customer-facing feature or function (e.g., Create Order, Track Inventory)

**Commercial Truth:**
The verified, authoritative state of all commercial features and enforcement

**Constitutional Authority:**
The documented business rationale for a commercial decision

**Domain Certification:**
Validation that a business domain meets all IAS requirements

**Governance Integrity:**
Verified consistency across all governance documentation

**Production Baseline:**
The verified, authoritative scope of production capabilities

**Repository Integrity:**
Verified consistency across entire codebase and documentation

---

## APPENDIX B: IAS PRINCIPLES SUMMARY

1. **IAS measures reality—not assumptions**
2. **Business capability before technical implementation**
3. **Commercial Truth enforced centrally**
4. **Governance is part of the product**
5. **Architecture precedes implementation**
6. **Permanent over temporary**
7. **Framework over implementation**
8. **Quality through discipline**
9. **Constitutional traceability required**
10. **Repository integrity maintained**

---

## APPENDIX C: RATIFICATION HISTORY

**Version 1.0:**
- **Date:** 2026-07-06
- **Source:** ImboniServe Milestone 2
- **Scope:** Initial ratification
- **Authority:** Imboni Integrated Systems
- **Status:** ✅ RATIFIED

**Proven Through:**
- 22 Commercial Domains certified
- 58 Commercial Capabilities governed
- 98 Commercial Endpoints protected
- 100% Commercial Coverage achieved
- 9/9 Completion Gates passed
- Zero governance conflicts
- Repository integrity verified

---

## CONCLUSION

The Imboni Architecture Standard (IAS) v1.0 is now the permanent engineering constitution for all Imboni products and platforms.

**Authority:**
This constitution governs all future Imboni engineering work.

**Applicability:**
All Imboni products must adopt IAS before production implementation.

**Permanence:**
IAS outlives any single product. It is the engineering operating system for Imboni Integrated Systems.

**Evolution:**
IAS will evolve through the amendment process, but core principles remain permanent.

---

**Document Status:** ✅ **RATIFIED**  
**Version:** 1.0  
**Date:** 2026-07-06  
**Authority:** Imboni Integrated Systems  
**Scope:** All Imboni Products and Platforms  

---

**Generated with [Devin](https://devin.ai)**  
**Co-Authored-By:** Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
