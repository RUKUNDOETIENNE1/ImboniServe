# IAS ENGINEERING PLAYBOOK
## HOW TO START EVERY IMBONI PROJECT

**Version:** 1.0  
**Date:** 2026-07-06  
**Purpose:** Define how every future Imboni project should begin  
**Status:** ✅ **RATIFIED**

---

## EXECUTIVE SUMMARY

This playbook explains how to start any Imboni product using the Imboni Architecture Standard (IAS).

**Audience:**
- Engineering teams starting new Imboni products
- Product managers planning new platforms
- Technical leads architecting new systems

**Scope:**
- AgriPal (Agricultural Management)
- HerdTrack (Livestock Management)
- Imboni Travel (Travel & Hospitality)
- All future Imboni platforms

**Principle:**
Every Imboni product begins with IAS adoption, not code implementation.

---

## PHASE 0: IAS ADOPTION

### Step 0.1: Read IAS Constitution

**Action:**
Read and understand `IAS_V1_CONSTITUTION.md`

**Focus Areas:**
- Core Principles (Article I)
- Engineering Philosophy (Article II)
- Commercial Truth (Article III)
- Governance (Article IV)
- Certification (Article V)

**Outcome:**
Team understands IAS principles before writing code.

**Time:** 2-4 hours

---

### Step 0.2: Adopt IAS Principles

**Action:**
Commit to following IAS principles for this product.

**Commitments:**
1. ✅ IAS measures reality—not assumptions
2. ✅ Business capability before technical implementation
3. ✅ Commercial Truth enforced centrally
4. ✅ Governance is part of the product
5. ✅ Architecture precedes implementation

**Outcome:**
Team commits to IAS discipline.

**Time:** 1 hour (team meeting)

---

### Step 0.3: Review Reference Implementation

**Action:**
Study ImboniServe Milestone 2 as reference implementation.

**Documents to Review:**
- `MILESTONE_2_FINAL_CERTIFICATION.md`
- `MILESTONE_2_EXECUTIVE_RETROSPECTIVE.md`
- `COMMERCIAL_COVERAGE_MATRIX.md`
- `COMMERCIAL_CAPABILITY_MATRIX.md`
- `DOMAIN_CERTIFICATION_REPORT.md`

**Focus:**
- How IAS was applied
- What worked well
- What lessons were learned
- What patterns emerged

**Outcome:**
Team understands IAS in practice.

**Time:** 4-8 hours

---

## PHASE 1: DISCOVERY

### Step 1.1: Define Product Vision

**Action:**
Document what the product does and who it serves.

**Questions:**
- What problem does this product solve?
- Who are the customers?
- What is the core value proposition?
- What makes this an Imboni product?

**Deliverable:**
`PRODUCT_VISION.md`

**Example (AgriPal):**
```markdown
# AgriPal Product Vision

**Problem:** Farmers lack systematic tools for crop management, 
inventory tracking, and agricultural operations.

**Solution:** AgriPal provides systematic agricultural management 
with crop planning, inventory tracking, and harvest optimization.

**Customers:** Small to medium-sized farms

**Value:** Systematic agricultural operations, data-driven decisions, 
operational efficiency

**Imboni Fit:** Applies IAS principles to agricultural domain
```

**Time:** 1-2 days

---

### Step 1.2: Identify Business Domains

**Action:**
Identify all business domains for this product.

**Process:**
1. List all major business functions
2. Group related functions into domains
3. Define domain boundaries
4. Validate with stakeholders

**Deliverable:**
`BUSINESS_DOMAINS.md`

**Example (AgriPal):**
```markdown
# AgriPal Business Domains

1. **Crop Planning** - Plan crops, rotations, seasons
2. **Field Management** - Manage fields, zones, soil
3. **Planting Operations** - Track planting, seeds, schedules
4. **Crop Monitoring** - Monitor growth, health, issues
5. **Irrigation Management** - Manage water, schedules, systems
6. **Pest & Disease Control** - Track pests, diseases, treatments
7. **Harvest Operations** - Plan and track harvests
8. **Inventory Management** - Track seeds, fertilizers, equipment
9. **Equipment Management** - Manage tractors, tools, maintenance
10. **Labor Management** - Track workers, schedules, tasks
11. **Financial Management** - Track costs, revenue, profitability
12. **Reporting & Analytics** - Analyze farm performance

Total: 12 domains
```

**IAS Principle:** Business capability before technical implementation

**Time:** 2-3 days

---

### Step 1.3: Map Customer Capabilities

**Action:**
For each domain, identify customer-facing capabilities.

**Process:**
1. For each domain, list what customers can do
2. Define capability clearly
3. Identify value to customer
4. Group related capabilities

**Deliverable:**
`CUSTOMER_CAPABILITIES.md`

**Example (AgriPal - Crop Planning Domain):**
```markdown
# AgriPal Customer Capabilities

## Domain: Crop Planning

1. **Create Crop Plan**
   - Customer can create seasonal crop plans
   - Value: Systematic planning, resource allocation

2. **Define Crop Rotation**
   - Customer can plan multi-season rotations
   - Value: Soil health, yield optimization

3. **Schedule Planting**
   - Customer can schedule planting dates
   - Value: Optimal timing, weather alignment

4. **Track Crop Varieties**
   - Customer can manage different varieties
   - Value: Variety performance comparison

Total: 4 capabilities in Crop Planning domain
```

**IAS Principle:** Measure customer capabilities, not API counts

**Time:** 3-5 days

---

## PHASE 2: SCOPE VERIFICATION

### Step 2.1: Estimate Initial Scope

**Action:**
Estimate total domains, capabilities, and endpoints.

**Process:**
1. Count business domains
2. Count customer capabilities
3. Estimate API endpoints needed
4. Document assumptions

**Deliverable:**
`INITIAL_SCOPE_ESTIMATE.md`

**Example (AgriPal):**
```markdown
# AgriPal Initial Scope Estimate

**Business Domains:** 12 (estimated)
**Customer Capabilities:** 45 (estimated)
**API Endpoints:** 80 (estimated)

**Assumptions:**
- Each domain has 3-5 capabilities
- Each capability needs 1-2 endpoints
- Some shared endpoints across domains

**Status:** ESTIMATE (not verified)
```

**IAS Principle:** Document estimates clearly

**Time:** 1 day

---

### Step 2.2: Verify Production Scope

**Action:**
Verify actual scope through systematic audit.

**Process:**
1. For each domain, list actual capabilities
2. For each capability, list required endpoints
3. Verify with stakeholders
4. Correct estimates

**Deliverable:**
`VERIFIED_SCOPE.md`

**Example (AgriPal):**
```markdown
# AgriPal Verified Scope

**Business Domains:** 12 (verified)
**Customer Capabilities:** 42 (verified, was 45)
**API Endpoints:** 73 (verified, was 80)

**Corrections:**
- Removed 3 duplicate capabilities
- Consolidated 7 endpoints
- Verified all domains

**Status:** VERIFIED (production scope)
```

**IAS Principle:** IAS measures reality—not assumptions

**Time:** 2-3 days

---

### Step 2.3: Establish Production Baseline

**Action:**
Document authoritative production baseline.

**Process:**
1. Finalize domain count
2. Finalize capability count
3. Finalize endpoint count
4. Lock baseline

**Deliverable:**
`PRODUCTION_BASELINE.md`

**Example (AgriPal):**
```markdown
# AgriPal Production Baseline

**Authority:** IAS Verified Scope
**Date:** 2026-07-15
**Status:** LOCKED

**Authoritative Scope:**
- Business Domains: 12
- Customer Capabilities: 42
- Category A Endpoints: 73

**This is the production baseline for AgriPal v1.0**
```

**IAS Principle:** Single source of truth

**Time:** 1 day

---

## PHASE 3: BUSINESS SYSTEMS

### Step 3.1: Group Domains into Systems

**Action:**
Group related domains into business systems.

**Process:**
1. Identify related domains
2. Define system boundaries
3. Name systems clearly
4. Validate groupings

**Deliverable:**
`BUSINESS_SYSTEMS.md`

**Example (AgriPal):**
```markdown
# AgriPal Business Systems

## System 1: Crop Operations
- Crop Planning
- Planting Operations
- Crop Monitoring
- Harvest Operations

## System 2: Resource Management
- Field Management
- Irrigation Management
- Inventory Management
- Equipment Management

## System 3: Farm Protection
- Pest & Disease Control
- Labor Management

## System 4: Business Intelligence
- Financial Management
- Reporting & Analytics

Total: 4 business systems, 12 domains
```

**IAS Principle:** Business-first architecture

**Time:** 1-2 days

---

### Step 3.2: Define System Architecture

**Action:**
Document how systems interact.

**Process:**
1. Define system responsibilities
2. Identify system dependencies
3. Document integration points
4. Validate architecture

**Deliverable:**
`SYSTEM_ARCHITECTURE.md`

**Time:** 2-3 days

---

## PHASE 4: CAPABILITY MAPPING

### Step 4.1: Create Capability Matrix

**Action:**
Build comprehensive capability matrix.

**Process:**
1. List all customer capabilities
2. Map to business domains
3. Define value proposition
4. Document in matrix

**Deliverable:**
`CAPABILITY_MATRIX.md`

**Structure:**
```markdown
# AgriPal Capability Matrix

## Domain: Crop Planning

| Capability | Description | Value | Endpoints |
|------------|-------------|-------|-----------|
| Create Crop Plan | Plan seasonal crops | Systematic planning | 2 |
| Define Rotation | Multi-season planning | Soil health | 1 |
| Schedule Planting | Optimal timing | Weather alignment | 1 |

Total: 3 capabilities, 4 endpoints
```

**IAS Principle:** Customer view of product

**Time:** 3-5 days

---

### Step 4.2: Map to Plan Tiers

**Action:**
Decide which capabilities belong to which plan tiers.

**Process:**
1. Define plan tiers (e.g., BASIC, PROFESSIONAL, ENTERPRISE)
2. Map capabilities to tiers
3. Validate pricing strategy
4. Document in Commercial Constitution

**Deliverable:**
`COMMERCIAL_CONSTITUTION.md`

**Example (AgriPal):**
```markdown
# AgriPal Commercial Constitution

## Plan Tiers

### BASIC Plan
- Create Crop Plan
- Track Planting
- Basic Monitoring
- Basic Reports

### PROFESSIONAL Plan
- Everything in BASIC
- Crop Rotation Planning
- Irrigation Management
- Pest & Disease Tracking
- Advanced Analytics

### ENTERPRISE Plan
- Everything in PROFESSIONAL
- Multi-Farm Management
- Equipment Tracking
- Labor Management
- Financial Management
```

**IAS Principle:** Constitutional authority for commercial decisions

**Time:** 2-3 days

---

## PHASE 5: GOVERNANCE DESIGN

### Step 5.1: Design Governance Framework

**Action:**
Design governance framework before implementation.

**Components:**
1. **Coverage Matrix:** Engineering view
2. **Capability Matrix:** Customer view
3. **Domain Certification:** Certification process
4. **Completion Gates:** Milestone validation

**Deliverable:**
`GOVERNANCE_FRAMEWORK.md`

**IAS Principle:** Governance is part of the product

**Time:** 2-3 days

---

### Step 5.2: Define Completion Gates

**Action:**
Define what "done" means for this product.

**Standard Gates (from IAS):**
1. Business System Architecture
2. Domain Certification
3. Capability Coverage
4. Endpoint Protection
5. Commercial Truth
6. Constitutional Compliance
7. Build Verification
8. Regression Testing
9. Governance Synchronization

**Deliverable:**
`COMPLETION_GATES.md`

**Customization:**
Add product-specific gates if needed, but keep IAS standard gates.

**Time:** 1 day

---

### Step 5.3: Plan Documentation Structure

**Action:**
Plan all governance documentation upfront.

**Required Documents:**
- Coverage Matrix
- Capability Matrix
- Domain Certification Report
- Business System Certifications
- Milestone Status Report
- Completion Gates
- Governance Integrity Report

**Deliverable:**
`DOCUMENTATION_PLAN.md`

**Time:** 1 day

---

## PHASE 6: COMMERCIAL ARCHITECTURE

### Step 6.1: Design Enforcement Pattern

**Action:**
Design centralized commercial enforcement.

**Pattern (from IAS):**
```typescript
// 1. Define features in constitution
const FEATURES = {
  'feature-name': { tier: 'PROFESSIONAL', ... }
}

// 2. Centralized middleware
export const requiresFeature = (featureName) => (handler) => {
  return async (req, res) => {
    if (!hasFeature(req.user, featureName)) {
      return res.status(403).json({ error: 'Upgrade required' })
    }
    return handler(req, res)
  }
}

// 3. Apply to endpoints
export default requiresFeature('feature-name')(handler)
```

**Deliverable:**
`COMMERCIAL_ENFORCEMENT_ARCHITECTURE.md`

**IAS Principle:** Commercial Truth enforced centrally

**Time:** 2-3 days

---

### Step 6.2: Implement Policy Layer

**Action:**
Build centralized policy layer.

**Components:**
1. Feature definitions
2. Plan tier mappings
3. Enforcement middleware
4. Error handling

**Deliverable:**
Working policy layer (code)

**Time:** 3-5 days

---

## PHASE 7: DOMAIN IMPLEMENTATION

### Step 7.1: Prioritize Domains

**Action:**
Decide implementation order.

**Criteria:**
- Business criticality
- Customer value
- Dependencies
- Risk

**Deliverable:**
`IMPLEMENTATION_SEQUENCE.md`

**Example (AgriPal):**
```markdown
# AgriPal Implementation Sequence

## Phase 1: Core Operations (Critical)
1. Crop Planning
2. Planting Operations
3. Crop Monitoring

## Phase 2: Resource Management (High)
4. Field Management
5. Irrigation Management
6. Inventory Management

## Phase 3: Protection & Intelligence (Standard)
7. Pest & Disease Control
8. Reporting & Analytics
9. Financial Management

## Phase 4: Advanced Operations (Supporting)
10. Equipment Management
11. Labor Management
12. Harvest Operations
```

**IAS Principle:** Business-first organization

**Time:** 1-2 days

---

### Step 7.2: Implement Domain-by-Domain

**Action:**
Implement one complete domain at a time.

**Process (per domain):**
1. Implement all domain endpoints
2. Apply commercial enforcement
3. Test functionality
4. Verify coverage
5. Test regression
6. Certify domain
7. Update governance docs

**IAS Principle:** Domain certification

**Time:** Variable per domain

---

### Step 7.3: Certify Each Domain

**Action:**
Certify domain before moving to next.

**Certification Criteria (from IAS):**
- ✅ 100% of domain endpoints protected
- ✅ 100% of customer capabilities governed
- ✅ Regression testing passed
- ✅ Commercial Truth maintained
- ✅ Constitutional compliance verified
- ✅ Build verification passed

**Deliverable:**
Domain certification document

**Time:** 1 day per domain

---

## PHASE 8: GOVERNANCE SYNCHRONIZATION

### Step 8.1: Build Governance Docs Incrementally

**Action:**
Update governance docs after each domain.

**Process:**
1. Certify domain
2. Update Coverage Matrix
3. Update Capability Matrix
4. Update Domain Certification Report
5. Update Milestone Status
6. Verify consistency

**IAS Principle:** Governance is part of the product

**Time:** Ongoing

---

### Step 8.2: Maintain Repository Integrity

**Action:**
Verify consistency continuously.

**Checks:**
- No conflicting metrics
- Single source of truth
- All docs synchronized
- No outdated baselines

**Frequency:**
- After each domain
- After each milestone
- Before production deployment

**Time:** 1 hour per check

---

## PHASE 9: MILESTONE COMPLETION

### Step 9.1: Verify All Completion Gates

**Action:**
Verify all 9 IAS completion gates.

**Gates:**
1. ✅ Business System Architecture
2. ✅ Domain Certification
3. ✅ Capability Coverage
4. ✅ Endpoint Protection
5. ✅ Commercial Truth
6. ✅ Constitutional Compliance
7. ✅ Build Verification
8. ✅ Regression Testing
9. ✅ Governance Synchronization

**Deliverable:**
`MILESTONE_COMPLETION_GATES.md`

**Time:** 2-3 days

---

### Step 9.2: Generate Governance Integrity Report

**Action:**
Verify repository-wide consistency.

**Process:**
1. Audit all governance docs
2. Verify consistent metrics
3. Check for conflicts
4. Generate integrity report

**Deliverable:**
`GOVERNANCE_INTEGRITY_REPORT.md`

**Time:** 1-2 days

---

### Step 9.3: Generate Final Certification

**Action:**
Generate milestone final certification.

**Content:**
- Executive summary
- Production metrics
- Quality gates
- Architectural deliverables
- Lessons learned
- Strategic value

**Deliverable:**
`MILESTONE_FINAL_CERTIFICATION.md`

**Time:** 1-2 days

---

### Step 9.4: Generate Executive Retrospective

**Action:**
Reflect on what was built and learned.

**Four Questions:**
1. What did we build?
2. What did we learn?
3. What permanent standards now exist?
4. How should the next milestone change?

**Deliverable:**
`MILESTONE_EXECUTIVE_RETROSPECTIVE.md`

**Time:** 1 day

---

## PHASE 10: PRODUCTION READINESS

### Step 10.1: Final Verification

**Action:**
Verify platform is production-ready.

**Checks:**
- ✅ Build: SUCCESS
- ✅ All tests passing
- ✅ Zero Commercial Truth violations
- ✅ Zero constitutional drift
- ✅ Governance synchronized
- ✅ Documentation complete

**Time:** 1-2 days

---

### Step 10.2: Production Deployment

**Action:**
Deploy to production.

**Process:**
1. Final build verification
2. Database migrations
3. Production deployment
4. Smoke testing
5. Monitoring setup

**Time:** 1-2 days

---

## TIMELINE ESTIMATE

### Typical Timeline (New Product)

**Phase 0: IAS Adoption** - 1 week
**Phase 1: Discovery** - 2 weeks
**Phase 2: Scope Verification** - 1 week
**Phase 3: Business Systems** - 1 week
**Phase 4: Capability Mapping** - 2 weeks
**Phase 5: Governance Design** - 1 week
**Phase 6: Commercial Architecture** - 1 week
**Phase 7: Domain Implementation** - 8-12 weeks (depends on domain count)
**Phase 8: Governance Synchronization** - Ongoing
**Phase 9: Milestone Completion** - 1 week
**Phase 10: Production Readiness** - 1 week

**Total:** ~4-5 months for first milestone

**Note:** Timeline assumes IAS adoption. Without IAS, add 2-3 months for discovering patterns.

---

## SUCCESS CRITERIA

### Product Launch Checklist

- [ ] IAS Constitution adopted
- [ ] Business domains identified
- [ ] Customer capabilities mapped
- [ ] Production scope verified
- [ ] Business systems defined
- [ ] Governance framework designed
- [ ] Commercial architecture implemented
- [ ] All domains certified
- [ ] All completion gates passed
- [ ] Governance synchronized
- [ ] Repository integrity verified
- [ ] Final certification generated
- [ ] Executive retrospective complete
- [ ] Production deployment successful

**If all checked:** ✅ IAS-Certified Product Launch

---

## ANTI-PATTERNS

### What NOT to Do

❌ **Skip IAS Adoption**
- Don't start coding before understanding IAS
- Don't assume you can figure it out later

❌ **Ignore Scope Verification**
- Don't trust initial estimates
- Don't skip production verification
- Don't claim completion without verification

❌ **Bypass Governance**
- Don't treat governance as overhead
- Don't skip documentation
- Don't allow conflicting metrics

❌ **Hardcode Business Logic**
- Don't hardcode plan checks
- Don't bypass policy layer
- Don't create ad-hoc enforcement

❌ **Skip Domain Certification**
- Don't move to next domain without certifying current
- Don't batch certifications
- Don't skip regression testing

---

## CONCLUSION

**This playbook defines how every Imboni product should begin.**

**Key Principles:**
1. Adopt IAS before writing code
2. Verify scope before claiming completion
3. Design governance upfront
4. Implement domain-by-domain
5. Certify continuously
6. Synchronize governance
7. Verify integrity
8. Generate retrospective

**Expected Outcome:**
- IAS-certified product
- Systematic development
- Constitutional governance
- Production-ready platform
- Reusable patterns
- Permanent standards

**Next Steps:**
- Read IAS Constitution
- Study ImboniServe reference implementation
- Apply this playbook to your product
- Follow IAS principles

---

**Document Status:** ✅ **RATIFIED**  
**Version:** 1.0  
**Date:** 2026-07-06  
**Authority:** Imboni Integrated Systems  

---

**Generated with [Devin](https://devin.ai)**  
**Co-Authored-By:** Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
