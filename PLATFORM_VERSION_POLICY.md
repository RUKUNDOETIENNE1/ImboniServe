# Hospitality Intelligence Platform - Version Policy

**Current Version:** 1.0.0  
**Policy Version:** 1.0  
**Effective Date:** 2026-07-22

---

## Semantic Versioning

The Hospitality Intelligence Platform follows [Semantic Versioning 2.0.0](https://semver.org/).

**Version Format:** MAJOR.MINOR.PATCH

**Example:** 1.2.3
- **MAJOR** = 1 (breaking changes)
- **MINOR** = 2 (new features, backward compatible)
- **PATCH** = 3 (bug fixes, no breaking changes)

---

## Version Types

### Patch Releases (1.0.x)

**Purpose:** Bug fixes, documentation updates, non-breaking changes

**Examples:**
- Fix bug in `formatDuration` method
- Update documentation
- Improve error messages
- Performance optimizations (no API changes)
- Security fixes (no API changes)

**Impact:** No module changes required

**Frequency:** As needed

**Approval:** Platform team approval

**Testing:** Regression tests for affected components

**Release Process:**
1. Fix bug or update documentation
2. Run regression tests
3. Update CHANGELOG.md
4. Increment patch version (1.0.0 → 1.0.1)
5. Tag release
6. Deploy

---

### Minor Releases (1.x.0)

**Purpose:** New features, backward-compatible enhancements

**Examples:**
- Add new utility methods to BaseDashboardBuilder
- Add new validation checks to framework
- Add new helper functions
- Extend API factory capabilities
- Add optional parameters to existing methods

**Impact:** Optional adoption by modules

**Frequency:** Quarterly

**Approval:** Platform architecture team approval

**Testing:** Full regression suite (all certified modules)

**Release Process:**
1. Implement new features
2. Update documentation
3. Run full regression suite (100% pass required)
4. Update CHANGELOG.md
5. Increment minor version (1.0.0 → 1.1.0)
6. Tag release
7. Communicate to module teams
8. Deploy

---

### Major Releases (x.0.0)

**Purpose:** Breaking changes, architecture changes

**Examples:**
- Change BaseIntelligenceService interface
- Modify platform contracts
- Remove deprecated features
- Restructure architecture
- Change required parameters
- Rename methods or properties

**Impact:** Module migration required

**Frequency:** Annually (or as needed)

**Approval:** Platform architecture team approval + ADR

**Testing:** Full regression suite + migration validation

**Release Process:**
1. Create ADR documenting breaking changes
2. Implement changes
3. Create migration guide
4. Update all certified modules
5. Run full regression suite (100% pass required)
6. Update CHANGELOG.md
7. Increment major version (1.0.0 → 2.0.0)
8. Tag release
9. Communicate to all teams
10. Provide migration support period
11. Deploy

---

## Architecture Compatibility

### Platform v1.0.0 Compatibility

**Supports:**
- Service Intelligence™ v2.0
- Kitchen Intelligence™ v2.0
- Menu Intelligence™ v1.0 (future)
- Restaurant Memory™ v1.0 (future)
- Restaurant Knowledge™ v1.0 (future)
- AI Copilot™ v1.0 (future)
- Multi-Restaurant Intelligence™ v1.0 (future)

**Does NOT Support:**
- Service Intelligence™ v1.0 (pre-platform)
- Kitchen Intelligence™ v1.0 (pre-platform)

**Backward Compatibility:**
- v1.0 modules (pre-platform) remain functional
- v2.0 modules use platform
- Both versions coexist
- Migration optional

---

### Platform v1.x.0 Compatibility

**Guarantee:** All v1.x.0 releases are backward compatible with v1.0.0

**Modules built on v1.0.0 will work on v1.x.0 without changes.**

**New features in v1.x.0 are optional.**

---

### Platform v2.0.0 Compatibility

**Breaking Changes:** Modules built on v1.x.0 may require migration

**Migration Required:** Yes

**Migration Guide:** Provided with v2.0.0 release

**Support Period:** v1.x.0 supported for 6 months after v2.0.0 release

---

## Deprecation Policy

### Deprecation Process

When a feature is deprecated:

1. **Announcement**
   - Deprecation warning in code (TypeScript `@deprecated` tag)
   - Documentation update
   - CHANGELOG entry
   - Communication to teams

2. **Support Period**
   - Feature remains functional for at least 1 major version
   - Example: Deprecated in v1.5.0, removed in v2.0.0

3. **Migration Guide**
   - Provide replacement feature
   - Document migration steps
   - Provide code examples

4. **Removal**
   - Remove in next major version
   - Update CHANGELOG
   - Communicate removal

### Deprecation Example

**v1.5.0 (Minor Release):**
```typescript
/**
 * @deprecated Use newMethod() instead. Will be removed in v2.0.0.
 */
function oldMethod() { /* ... */ }

function newMethod() { /* ... */ }
```

**v2.0.0 (Major Release):**
```typescript
// oldMethod() removed
function newMethod() { /* ... */ }
```

---

## Platform Support Policy

### Long-Term Support (LTS)

**LTS Versions:** Major versions receive LTS

**Support Duration:**
- **Active Support:** 12 months (bug fixes, security updates)
- **Maintenance Support:** 6 months (security updates only)
- **End of Life:** After 18 months

**Example:**
- v1.0.0 released: 2026-07-22
- Active support until: 2027-07-22
- Maintenance support until: 2028-01-22
- End of life: 2028-01-22

---

### Support Levels

#### Active Support

**Duration:** 12 months from release

**Includes:**
- Bug fixes (patch releases)
- Security updates (patch releases)
- New features (minor releases)
- Documentation updates
- Community support

---

#### Maintenance Support

**Duration:** 6 months after active support

**Includes:**
- Security updates only (patch releases)
- Critical bug fixes only (patch releases)
- No new features
- Limited community support

---

#### End of Life (EOL)

**After:** 18 months from release

**Status:**
- No updates
- No support
- Upgrade recommended

---

## Version Compatibility Matrix

| Platform Version | Status | Release Date | Active Support Until | Maintenance Until | EOL |
|-----------------|--------|--------------|---------------------|------------------|-----|
| v1.0.0 | 🟢 Active | 2026-07-22 | 2027-07-22 | 2028-01-22 | 2028-01-22 |
| v1.1.0 | ⚪ Planned | Q4 2026 | Q4 2027 | Q2 2028 | Q2 2028 |
| v2.0.0 | ⚪ Planned | Q1 2027 | Q1 2028 | Q3 2028 | Q3 2028 |

---

## Module Version Policy

### Module Versioning

Intelligence modules follow their own versioning:

**Format:** MAJOR.MINOR.PATCH

**Example:** Service Intelligence™ v2.1.3

**Independence:** Module versions are independent of platform versions

**Compatibility:** Modules specify compatible platform versions

---

### Module-Platform Compatibility

**Modules specify:**
```json
{
  "name": "service-intelligence",
  "version": "2.1.3",
  "platformVersion": "^1.0.0"
}
```

**Meaning:** Service Intelligence v2.1.3 is compatible with Platform v1.x.x

---

## Version Upgrade Path

### Patch Upgrade (1.0.0 → 1.0.1)

**Steps:**
1. Update platform package
2. Run regression tests
3. Deploy

**Effort:** Minimal (< 1 hour)

**Risk:** Very Low

---

### Minor Upgrade (1.0.0 → 1.1.0)

**Steps:**
1. Review release notes
2. Update platform package
3. Optionally adopt new features
4. Run regression tests
5. Deploy

**Effort:** Low (1-2 hours)

**Risk:** Low

---

### Major Upgrade (1.0.0 → 2.0.0)

**Steps:**
1. Review migration guide
2. Review breaking changes
3. Update platform package
4. Migrate modules (follow guide)
5. Run full regression suite
6. Fix any issues
7. Deploy

**Effort:** Medium-High (4-8 hours per module)

**Risk:** Medium

---

## Version Announcement

### Release Announcement

All releases are announced via:
- CHANGELOG.md update
- GitHub release notes
- Team communication
- Documentation updates

### Breaking Change Announcement

Major releases with breaking changes include:
- ADR documenting changes
- Migration guide
- Code examples
- Support period announcement
- EOL dates for previous versions

---

## Version Numbering Rules

### Incrementing Rules

**Increment MAJOR when:**
- Breaking changes to platform APIs
- Incompatible architecture changes
- Removal of deprecated features
- Changes requiring module migration

**Increment MINOR when:**
- New features added (backward compatible)
- New utility methods added
- Optional parameters added
- Non-breaking enhancements

**Increment PATCH when:**
- Bug fixes
- Documentation updates
- Performance improvements (no API changes)
- Security fixes (no API changes)

---

### Pre-release Versions

**Format:** 1.0.0-alpha.1, 1.0.0-beta.2, 1.0.0-rc.1

**Usage:**
- **alpha:** Early development, unstable
- **beta:** Feature complete, testing
- **rc:** Release candidate, final testing

**Support:** No support for pre-release versions

---

## Version Documentation

### Required Documentation

Each release must include:

1. **CHANGELOG.md entry**
   - Version number
   - Release date
   - Changes (Added, Changed, Deprecated, Removed, Fixed, Security)

2. **Release Notes**
   - Summary of changes
   - Breaking changes (if major)
   - Migration guide (if major)
   - Known issues

3. **Updated Documentation**
   - Architecture specification (if changed)
   - ADRs (if applicable)
   - API documentation (if changed)

---

## Version Policy Changes

This version policy may be updated in future platform versions.

**Change Process:**
1. Create ADR proposing change
2. Review and approve
3. Update this document
4. Communicate changes
5. Increment policy version

**Current Policy Version:** 1.0

---

## Questions?

For questions about versioning:

1. Review this policy
2. Review [CHANGELOG.md](CHANGELOG.md)
3. Review [Platform Baseline](docs/PLATFORM_BASELINE_v1.0.0.md)
4. Contact Platform Architecture Team

---

**Policy Version:** 1.0  
**Last Updated:** 2026-07-22  
**Next Review:** Q4 2026 (after 5 modules certified)  
**Status:** 🟢 Active
