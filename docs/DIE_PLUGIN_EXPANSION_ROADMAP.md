# DIE Plugin Expansion Roadmap v1.0

## Strategy
Incremental, low-risk conversion of core business domains into DIE plugins using the conversion framework. Each domain goes through a repeatable pipeline with validation and rollback at each stage.

## Migration Pipeline (Per Domain)
1. Define Domain Contract
   - Specify domain events (types, payloads)
   - Confirm business isolation handling
2. Implement Domain Adapter
   - Extend BaseDomainPluginAdapter
   - Map events → { governance, marketplace, intelligence, feed }
   - Provide minimal manifest metadata
3. Shadow Event Taps (Read-Only)
   - Add non-invasive event emission in existing service layer (behind flag)
   - Dual-write pattern: original logic unaffected
4. Safe Registration (Staged)
   - Register plugin in marketplace (hidden/enterprise visibility)
   - Do NOT surface UI changes yet
   - Confirm presence in Control Plane summaries via background jobs
5. Observability Wiring
   - Forward adapter signals to Unified Observability feed (read-only)
6. Intelligence Participation
   - Validate metrics in Marketplace Intelligence (adoption, usage, stability)
7. Validation & Go/No-Go
   - Execute validation checklist for the domain
   - Rollback instantly by disabling feature flag

## Validation Strategy (Per Domain)
- TypeScript: PASS
- Prisma: PASS (no schema changes)
- Existing DIE Validation Suites: PASS (unchanged)
- Domain-Specific Checks (additive scripts):
  - Adapter manifest integrity
  - Governance event mapping logic sanity
  - Marketplace metrics consistency under sample events
  - Observability feed shape validation

## Rollback Strategy (Per Domain)
- Feature flag disables event taps and plugin registration
- Original business logic path remains authoritative
- No schema/data migrations; no cleanup required
- Remove adapter registration without code path impact

## Sequencing (Recommended)
1. Reservations (pilot)
2. Inventory
3. Loyalty
4. Delivery
5. KDS
6. Event Management
7. Hotel Room Service (extension)

## Milestones
- M1: Framework + Reservations pilot (reference only, no runtime binding)
- M2: Reservations live (with flags, read-only observability)
- M3: Inventory + Loyalty adapters ready
- M4: Delivery + KDS adapters ready
- M5: Event Management + Room Service adapters ready
- M6: All domains surfaced in Unified Intelligence & Observability

