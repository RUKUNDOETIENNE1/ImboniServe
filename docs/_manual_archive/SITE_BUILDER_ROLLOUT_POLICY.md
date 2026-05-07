# Site Builder Phased Autopilot Rollout Policy
**Date:** March 15, 2026  
**Status:** Active  
**Owner:** Platform Team

---

## Overview

The Site Builder feature enables businesses to create professional mini-sites with AI-assisted content generation and optional custom domains. This document defines the phased rollout strategy with automatic feature unlock based on adoption metrics.

---

## Feature Flags

### Phase 1 (Active Now)
- `site_builder_templates_v1` - 12–20 curated templates
- `site_builder_ai_copy_v1` - AI menu/service/promo text generation
- `site_builder_custom_domain_v1` - Manual domain connect (CNAME + verification)
- `site_builder_badge_enforcement` - Non-removable "Powered by Imboni Serve" badge

**Status:** Enabled for all businesses  
**Manual Override:** Admin can disable per business if needed

### Phase 2 (Autopilot Release)
- `site_builder_templates_expanded_v2` - 50–60 total templates
- `site_builder_ai_theme_tuning_v2` - AI color/font suggestions
- `site_builder_domain_automation_v2` - DNS assistant (pre-checks, not full automation)

**Autopilot Trigger Conditions (checked weekly via cron):**
- Published mini-sites ≥ 30 businesses
- Combined last-14-days unique visits ≥ 1,000
- AI copy success rate ≥ 98% (no errors/timeouts)
- Manual override allowed

**Ramp Schedule:**
- Week 1: Enable for 25% of eligible businesses
- Week 2: Enable for 50% of eligible businesses
- Week 3: Enable for 100% of eligible businesses

### Phase 3 (Autopilot Release)
- `site_builder_templates_100_plus` - 100+ templates
- `site_builder_domain_automation_full` - Automatic domain provisioning

**Autopilot Trigger Conditions (checked weekly via cron):**
- Published mini-sites ≥ 100 businesses
- Custom domains connected ≥ 25
- Weekly unique visits ≥ 10,000
- Domain verification success rate ≥ 95%
- Manual override allowed

**Ramp Schedule:**
- Week 1: Enable for 25% of eligible businesses
- Week 2: Enable for 50% of eligible businesses
- Week 3: Enable for 100% of eligible businesses

---

## Metrics Tracking

### Adoption Metrics
- `site_builder_started` - Business opened site builder
- `template_selected` - Template chosen
- `ai_copy_generate` - AI copy generation requested
- `ai_copy_success` - AI copy generation succeeded
- `ai_copy_error` - AI copy generation failed
- `site_published` - Mini-site published
- `site_unpublished` - Mini-site unpublished
- `domain_connect_attempt` - Custom domain connection started
- `domain_verified` - Custom domain verified successfully
- `domain_verification_failed` - Custom domain verification failed

### Health Metrics
- AI copy success rate: `ai_copy_success / (ai_copy_success + ai_copy_error)`
- Domain verification success rate: `domain_verified / (domain_verified + domain_verification_failed)`
- Site publish rate: `site_published / site_builder_started`
- Unique visits (tracked via BusinessProfile.viewCount)

---

## Guardrails

### Kill Switch
- **Flag:** `site_builder_kill_switch`
- **Effect:** Immediately disables all site builder features across all phases
- **Trigger:** Manual admin action only
- **Use Cases:**
  - Critical bug discovered
  - Security vulnerability
  - Performance degradation
  - Legal/compliance issue

### Rate Limits
- **AI Copy Generation:** 50 requests per business per day
- **Cost Cap:** $5 USD per business per month for AI operations
- **Domain Verification:** 10 attempts per domain per day

### Safety Checks
- All templates enforce "Powered by Imboni Serve" badge (server-side validation)
- Custom domain verification requires CNAME record match
- AI-generated content is sanitized and validated before storage
- Template rendering is sandboxed (no arbitrary code execution)

---

## Rollback Procedure

### Immediate Rollback (Kill Switch)
1. Admin sets `site_builder_kill_switch = true`
2. All site builder UI hidden from dashboard
3. Public mini-sites continue to render (read-only)
4. No new sites can be published
5. AI copy generation disabled

### Phased Rollback
1. Admin disables specific phase flag (e.g., `site_builder_templates_expanded_v2 = false`)
2. Businesses on that phase revert to previous phase features
3. Existing published sites remain live
4. No data loss

### Full Rollback
1. Disable all phase flags
2. Keep `site_builder_badge_enforcement = true` (always on)
3. Existing published sites remain live with badge
4. Site builder UI hidden

---

## Manual Override

### Enable Phase Early
- Admin can manually enable any phase flag for specific businesses
- Use case: Beta testers, strategic partners, high-value clients
- Procedure: Update `BusinessFeatureOverride` table

### Disable Phase for Business
- Admin can manually disable any phase flag for specific businesses
- Use case: Bug affecting specific business, abuse prevention
- Procedure: Update `BusinessFeatureOverride` table

---

## Monitoring & Alerts

### Daily Checks
- AI copy error rate > 5%: Alert platform team
- Domain verification failure rate > 10%: Alert platform team
- Site builder crash rate > 1%: Alert platform team

### Weekly Checks
- Review autopilot trigger conditions
- Check if Phase 2/3 should be enabled
- Review cost per business (AI operations)
- Review template usage distribution

### Monthly Checks
- Review template catalog performance
- Identify underperforming templates (< 1% usage)
- Gather feedback from businesses using custom domains
- Review "Powered by Imboni Serve" badge click-through rate

---

## Success Criteria

### Phase 1 Success
- 30+ businesses publish mini-sites
- 1,000+ unique visits in 14 days
- AI copy success rate ≥ 98%
- Zero critical bugs
- Positive feedback from ≥ 80% of users

### Phase 2 Success
- 100+ businesses publish mini-sites
- 25+ custom domains connected
- 10,000+ weekly unique visits
- Domain verification success rate ≥ 95%
- Template expansion drives 20% increase in site creation

### Phase 3 Success
- 250+ businesses publish mini-sites
- 100+ custom domains connected
- 50,000+ weekly unique visits
- Full domain automation success rate ≥ 90%
- Site builder becomes top 3 feature by usage

---

## Template Catalog Strategy

### Phase 1 (12–20 Templates)
**Business Types:**
- Restaurant (3 templates: casual, fine dining, fast food)
- Café (2 templates: modern, cozy)
- Bar/Lounge (2 templates: upscale, sports bar)
- Hotel (2 templates: boutique, resort)
- Spa/Wellness (1 template)
- Event Venue (1 template)
- Food Truck (1 template)
- Bakery (1 template)

**Design Principles:**
- Mobile-first responsive
- Fast loading (< 2s)
- Accessibility (WCAG AA)
- SEO optimized
- QR code placement built-in

### Phase 2 (50–60 Templates)
**Expansion:**
- 3–5 templates per business type
- Industry-specific variations (e.g., sushi restaurant, steakhouse, vegan café)
- Regional themes (African, European, Asian, etc.)
- Seasonal templates (holiday specials)

### Phase 3 (100+ Templates)
**Full Catalog:**
- 8–10 templates per business type
- Advanced customization options
- Template marketplace (community submissions)
- Premium templates (paid tier)

---

## AI Copy Assistant Strategy

### Phase 1 (Basic Generation)
**Capabilities:**
- Menu item descriptions (from name + category)
- Service descriptions (from business type + name)
- Promotional text (from business info + occasion)
- Tagline generation (from business name + type)

**Model:** GPT-4o-mini (cost-effective)  
**Max Tokens:** 300 per request  
**Temperature:** 0.3 (balanced creativity)

### Phase 2 (Theme Tuning)
**Capabilities:**
- Color palette suggestions (from logo/brand colors)
- Font pairing recommendations
- Section layout suggestions
- Content tone adjustment (formal, casual, playful)

**Model:** GPT-4o (higher quality)  
**Max Tokens:** 500 per request  
**Temperature:** 0.5 (more creative)

### Phase 3 (Advanced AI)
**Capabilities:**
- Full brand identity generation
- Multi-language content generation
- SEO optimization suggestions
- A/B testing copy variations

---

## Custom Domain Strategy

### Phase 1 (Manual Connect)
**Process:**
1. Business provides domain name
2. System generates CNAME record instructions
3. Business adds CNAME to DNS
4. System verifies CNAME (polling every 5 minutes for 24 hours)
5. Domain marked as verified
6. SSL certificate provisioned (Let's Encrypt)

**Limitations:**
- Manual DNS configuration required
- 24-hour verification window
- No automatic SSL renewal (manual check)

### Phase 2 (DNS Assistant)
**Process:**
1. Business provides domain name
2. System checks DNS configuration automatically
3. System provides step-by-step instructions with screenshots
4. System detects common DNS provider (GoDaddy, Namecheap, etc.)
5. System pre-checks DNS propagation
6. Faster verification (polling every 1 minute for 1 hour)

**Improvements:**
- Provider-specific instructions
- DNS propagation checker
- Faster verification
- Automatic SSL renewal

### Phase 3 (Full Automation)
**Process:**
1. Business provides domain name + registrar API key (optional)
2. System automatically configures DNS (if API key provided)
3. System provisions SSL certificate automatically
4. System monitors domain health (uptime, SSL expiry)
5. System auto-renews SSL certificates

**Capabilities:**
- One-click domain setup (with API key)
- Automatic DNS configuration
- SSL auto-renewal
- Domain health monitoring
- Automatic failover to subdomain if domain fails

---

## Badge Enforcement

### "Powered by Imboni Serve" Badge
**Requirements:**
- Always visible on all mini-sites
- Cannot be removed or hidden by businesses
- Clickable link to Imboni Serve homepage
- Server-side validation (badge removal = site unpublished)

**Placement:**
- Footer of all templates
- Small, non-intrusive design
- Consistent branding across all templates

**Removal Policy:**
- Badge can only be removed by upgrading to Enterprise plan (future)
- Removal without authorization = immediate site takedown

---

## Cost Management

### AI Operations Budget
- **Phase 1:** $0.10 per business per month (average)
- **Phase 2:** $0.50 per business per month (average)
- **Phase 3:** $1.00 per business per month (average)

**Cost Cap:** $5 per business per month (hard limit)  
**Overage Policy:** Disable AI features for business until next month

### Infrastructure Costs
- **Storage:** $0.01 per GB per month (S3)
- **Bandwidth:** $0.05 per GB (CloudFront)
- **SSL Certificates:** Free (Let's Encrypt)

**Estimated Total:** $0.50 per business per month (Phase 1)

---

## Support & Documentation

### User Documentation
- Site builder quick start guide
- Template selection guide
- AI copy assistant tutorial
- Custom domain setup guide (with screenshots)
- Troubleshooting common issues

### Admin Documentation
- Feature flag management guide
- Autopilot threshold configuration
- Manual override procedures
- Rollback procedures
- Monitoring dashboard guide

---

## Changelog

### March 15, 2026
- Initial rollout policy created
- Phase 1 enabled for all businesses
- Autopilot triggers defined for Phase 2/3
- Kill switch implemented

---

## Approval

**Approved By:** Platform Team  
**Date:** March 15, 2026  
**Next Review:** April 15, 2026
