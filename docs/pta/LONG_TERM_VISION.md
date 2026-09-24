# Long-Term Vision & Future Releases

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Sprint:** Marketing Alignment Sprint (MAS)  

---

## Purpose

Every feature deferred from Version 1.0 is documented here. No feature is abandoned. Each has a home, a reason for deferral, and a path to return.

---

## Deferred Features

### 1. Site Builder

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | UI shell with template selection, color/font customization, section toggles. No publishing pipeline. |
| **Why Deferred** | Requires hosting infrastructure, domain management, rendering engine, and SEO optimization — all multi-week engineering efforts. Restaurants don't need a website builder on day one; the Discovery page provides online presence. |
| **Recommended Future Milestone** | Version 2.0 — After V1 stabilizes and customer feedback indicates website builder is a top-3 requested feature. |
| **Dependencies** | Domain management system, hosting infrastructure, template rendering engine, menu synchronization, mobile-responsive design system. |
| **Strategic Value** | MEDIUM — Reduces dependency on third-party website builders. Increases platform stickiness. Potential upsell to Business/Premium plans. |
| **Re-entry Criteria** | 1. At least 20 paying customers request website builder. 2. Hosting infrastructure budget approved. 3. Domain registration API integration identified. |
| **Files** | `src/pages/dashboard/site-builder.tsx`, `src/pages/api/site-builder/` |

---

### 2. Hotel Mode

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Page at `/dashboard/hotel` with room management interface. Feature-flagged `hotel_mode`. Not operationally verified. |
| **Why Deferred** | Hotel operations require fundamentally different workflows (room service, front desk, housekeeping, check-in/check-out). First customers are restaurants, not hotels. |
| **Recommended Future Milestone** | Version 2.5 — When hotel customers express interest and product team can dedicate resources to hotel-specific workflows. |
| **Dependencies** | Reservation system enhancement, room management, service area management, front desk operations, housekeeping tracking. |
| **Strategic Value** | HIGH — Opens a new market segment. Hotels have higher willingness to pay and longer contracts. |
| **Re-entry Criteria** | 1. At least 5 hotel businesses request hotel features. 2. Product team completes hotel workflow research. 3. Reservation system enhanced for multi-day stays. |
| **Files** | `src/pages/dashboard/hotel.tsx` |

---

### 3. AI Menu Builder (Photo-to-Menu)

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Page at `/dashboard/menu-builder` with upload flow and extraction API. Feature-flagged `ai_menu_builder`. Requires OpenAI. Extraction quality not verified across diverse menu formats. |
| **Why Deferred** | Extraction quality is inconsistent across handwritten, photographed, and PDF menus. No menu structure inference (categories, modifiers). Manual menu entry works for V1 onboarding. |
| **Recommended Future Milestone** | Version 1.5 — After onboarding flow stabilizes and OpenAI vision model quality improves. Can be offered as a manual onboarding service in V1. |
| **Dependencies** | OpenAI GPT-4 Vision API, menu structure inference engine, candidate review workflow, AI credit system. |
| **Strategic Value** | MEDIUM — Accelerates onboarding. Reduces time-to-first-order. Differentiator vs. competitors. |
| **Re-entry Criteria** | 1. Extraction accuracy > 85% across 50+ diverse menu samples. 2. AI credit pricing finalized. 3. Candidate review workflow complete. |
| **Files** | `src/pages/dashboard/menu-builder.tsx`, `src/pages/api/menu-builder/extract.ts` |

---

### 4. WhatsApp Campaigns (Marketing Automation)

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Page at `/dashboard/campaigns` with campaign creation, scheduling, segment targeting. API exists. No automation. No WhatsApp Business API template approval flow. |
| **Why Deferred** | Requires CRM to be production-ready first (segment synchronization). WhatsApp Business API requires Meta template approval process. No automation engine for triggered campaigns. |
| **Recommended Future Milestone** | Version 2.0 — After CRM is production-ready and WhatsApp Business API templates are approved. |
| **Dependencies** | CRM (RFM segmentation), WhatsApp Business API template approval, automation engine, A/B testing for campaigns. |
| **Strategic Value** | HIGH — Marketing automation is a key retention tool. Restaurants that actively market through the platform are less likely to churn. |
| **Re-entry Criteria** | 1. CRM is production-ready and in V1 sidebar. 2. WhatsApp Business API templates approved by Meta. 3. Automation engine designed and implemented. 4. At least 10 customers request campaign features. |
| **Files** | `src/pages/dashboard/campaigns.tsx`, `src/pages/api/campaigns/` |

---

### 5. Menu A/B Testing

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Page at `/dashboard/ab-testing` with test creation UI, variant configuration, metrics display. No backend. No traffic splitting. No API. |
| **Why Deferred** | UI-only shell. Requires traffic splitting engine, variant serving in QR ordering flow, statistical significance calculation, and metrics collection — all from scratch. |
| **Recommended Future Milestone** | Version 2.5 — After platform has enough transaction volume for statistically meaningful A/B tests. |
| **Dependencies** | Traffic splitting engine, variant serving in QR ordering, metrics collection, statistical analysis library, minimum 100 daily orders per restaurant for significance. |
| **Strategic Value** | LOW for V1 — A/B testing is an optimization tool for mature businesses with high order volume. Not a day-one need. |
| **Re-entry Criteria** | 1. Platform processes 1,000+ daily orders total. 2. Traffic splitting engine designed. 3. Statistical significance methodology validated. |
| **Files** | `src/pages/dashboard/ab-testing.tsx` |

---

### 6. Voice Ordering (WhatsApp AI)

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Webhook at `/api/webhooks/twilio/voice-order.ts` with GPT-4 integration for natural language order extraction. Requires Twilio + OpenAI + customer registration. No conversation state management. |
| **Why Deferred** | Requires conversation engine, state management, multi-turn ordering flow, menu browsing via WhatsApp, payment integration within WhatsApp. QR ordering covers the primary use case. |
| **Recommended Future Milestone** | Version 2.0 — After WhatsApp Staff Ordering is production-ready and conversation engine is built. |
| **Dependencies** | Conversation state management, multi-turn flow, menu browsing via WhatsApp, payment integration, customer onboarding for WhatsApp ordering. |
| **Strategic Value** | MEDIUM — Voice ordering is a differentiator in markets where typing is a barrier. But QR ordering is simpler and more reliable for V1. |
| **Re-entry Criteria** | 1. WhatsApp Staff Ordering is production-ready. 2. Conversation engine designed. 3. Customer onboarding flow for WhatsApp ordering complete. 4. OpenAI cost per conversation justified by order value. |
| **Files** | `src/pages/api/webhooks/twilio/voice-order.ts` |

---

### 7. CRM (RFM Segmentation) — Deferred to Early Access

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Page at `/dashboard/crm` with RFM segmentation. API at `/api/crm/customers`. Feature-flagged `crm_v1`. Not in V1 sidebar. No automated segment actions. |
| **Why Deferred** | No automated segment-based actions (send WhatsApp to At-Risk customers). No export. No campaign creation integration. Not in V1 sidebar. |
| **Recommended Future Milestone** | Version 1.5 — As Early Access for customers who request it. Full production with WhatsApp Campaigns in Version 2.0. |
| **Dependencies** | WhatsApp Campaigns (for segment actions), export functionality, sidebar integration. |
| **Strategic Value** | HIGH — Customer retention is critical for long-term success. RFM segmentation enables targeted retention actions. |
| **Re-entry Criteria** | 1. Segment-based WhatsApp campaigns ready. 2. Export functionality complete. 3. At least 5 customers request CRM features. |
| **Files** | `src/pages/dashboard/crm.tsx`, `src/pages/api/crm/` |

---

### 8. Loyalty & Rewards — Deferred to Early Access

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Page at `/dashboard/loyalty` with balance lookup, manual credit/debit. Feature-flagged `loyalty_system`. Not in V1 sidebar. |
| **Why Deferred** | No automatic points accrual on orders. No tier system. No redemption flow. No customer-facing display. |
| **Recommended Future Milestone** | Version 1.5 — As Early Access. Full production in Version 2.0 with automatic accrual and redemption. |
| **Dependencies** | Automatic points accrual in order flow, tier system, redemption flow, customer-facing loyalty display on QR menu. |
| **Strategic Value** | HIGH — Customer retention tool. Restaurants that offer loyalty programs see higher repeat rates. |
| **Re-entry Criteria** | 1. Automatic accrual implemented. 2. Tier system designed. 3. Redemption flow complete. 4. Customer-facing display on QR menu. |
| **Files** | `src/pages/dashboard/loyalty.tsx`, `src/pages/api/loyalty/` |

---

### 9. Supplier Marketplace

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Store page at `/store` with product browsing, search, cart, AI recommendations, supplier map. Supplier pages with orders, deliveries, payments. No supplier self-service onboarding. |
| **Why Deferred** | Requires supplier self-service onboarding, automated verification, integrated payment processing, delivery tracking, and inventory sync. Multi-week project. |
| **Recommended Future Milestone** | Version 2.0 — As Early Access with manually onboarded suppliers. Full self-service in Version 2.5. |
| **Dependencies** | Supplier onboarding flow, verification system, payment escrow, delivery tracking, inventory sync from marketplace purchases. |
| **Strategic Value** | HIGH — Procurement is a daily restaurant need. Marketplace creates network effects and increases platform stickiness. |
| **Re-entry Criteria** | 1. At least 10 suppliers manually onboarded. 2. Payment processing for marketplace orders complete. 3. Delivery tracking system designed. 4. Inventory sync from purchases verified. |
| **Files** | `src/pages/store/index.tsx`, `src/pages/api/marketplace/` |

---

### 10. AI Insights Dashboard — Deferred to Early Access

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Page at `/dashboard/ai` with reorder suggestions, cost anomaly alerts, insight reports. Feature-flagged `ai_insights_v1`. Requires OpenAI API credits. |
| **Why Deferred** | Insight report generation requires OpenAI API (cost per report). No automated scheduling. No report delivery. Not in V1 sidebar. |
| **Recommended Future Milestone** | Version 1.5 — As Early Access for Premium customers who purchase AI credits. Full production in Version 2.0. |
| **Dependencies** | AI credit pricing, automated report scheduling, report delivery (email/WhatsApp), sidebar integration. |
| **Strategic Value** | MEDIUM — AI insights are a differentiator but require AI credits and OpenAI configuration. |
| **Re-entry Criteria** | 1. AI credit pricing finalized. 2. Automated scheduling complete. 3. Report delivery implemented. 4. At least 5 Premium customers request AI insights. |
| **Files** | `src/pages/dashboard/ai.tsx`, `src/pages/api/ai/` |

---

### 11. WhatsApp Staff Ordering — Deferred to Setup Service

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | `WhatsAppOrderService` fully implemented with message parsing, menu matching, order creation. Webhook at `/api/webhooks/twilio/whatsapp`. Requires Twilio configuration. |
| **Why Deferred** | No self-service setup wizard. No Twilio configuration UI. No staff phone registration UI. Most restaurants won't configure Twilio on day one. |
| **Recommended Future Milestone** | Version 1.5 — As a setup service offered by the Imboni team. Self-service configuration in Version 2.0. |
| **Dependencies** | Twilio configuration UI, staff phone registration, setup wizard, documentation. |
| **Strategic Value** | MEDIUM — WhatsApp ordering is valuable for restaurants with waiters but QR ordering covers the primary use case. |
| **Re-entry Criteria** | 1. Twilio configuration UI in dashboard settings. 2. Staff phone registration complete. 3. Setup wizard with step-by-step guide. 4. Documentation for restaurant owners. |
| **Files** | `src/lib/services/whatsapp-order.service.ts`, `src/pages/api/webhooks/twilio/whatsapp.ts` |

---

### 12. Card / POS Terminal Payments

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Not implemented. Listed on homepage payment methods. |
| **Why Deferred** | Requires POS hardware integration, card processor partnership, and PCI compliance. Mobile Money covers the primary payment need in Rwanda. |
| **Recommended Future Milestone** | Version 2.5 — When card payment demand justifies hardware investment and processor partnership. |
| **Dependencies** | POS hardware partnership, card processor integration (Visa/Mastercard), PCI compliance certification. |
| **Strategic Value** | MEDIUM — Card payments are important for tourist-facing restaurants but Mobile Money dominates in Rwanda. |
| **Re-entry Criteria** | 1. At least 10 customers request card payments. 2. Card processor partnership established. 3. PCI compliance budget approved. |
| **Files** | None — not implemented |

---

### 13. API Access

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Not implemented. Listed in Premium plan features. |
| **Why Deferred** | Requires API key management, rate limiting, documentation, SDK generation, and developer portal. Not a day-one need for restaurant owners. |
| **Recommended Future Milestone** | Version 2.0 — When developer community expresses interest and API documentation is complete. |
| **Dependencies** | API key management, rate limiting, OpenAPI specification, developer documentation, SDK generation. |
| **Strategic Value** | MEDIUM — Enables third-party integrations and developer ecosystem. |
| **Re-entry Criteria** | 1. API specification documented. 2. Rate limiting implemented. 3. At least 3 integration partners identified. |
| **Files** | None — not implemented |

---

### 14. White-Label Options

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Not implemented. Listed in Premium plan features. |
| **Why Deferred** | Requires custom branding system, domain management, theme engine, and per-tenant configuration. Not a day-one need. |
| **Recommended Future Milestone** | Version 3.0 — When enterprise customers request branded deployments. |
| **Dependencies** | Custom branding system, domain management, theme engine, per-tenant configuration. |
| **Strategic Value** | LOW for V1 — White-label is an enterprise feature that can be negotiated as custom contract. |
| **Re-entry Criteria** | 1. At least 3 enterprise customers request white-label. 2. Branding system designed. 3. Per-tenant architecture validated. |
| **Files** | None — not implemented |

---

### 15. SSO (Single Sign-On)

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Not implemented. Listed in Enterprise plan features. |
| **Why Deferred** | Requires SAML/OIDC integration, identity provider configuration, and enterprise IT support. Not a day-one need. |
| **Recommended Future Milestone** | Version 3.0 — When enterprise customers require SSO for staff management. |
| **Dependencies** | SAML/OIDC library, identity provider configuration UI, enterprise IT support process. |
| **Strategic Value** | LOW for V1 — SSO is an enterprise feature. |
| **Re-entry Criteria** | 1. At least 2 enterprise customers require SSO. 2. SAML/OIDC integration library selected. |
| **Files** | None — not implemented |

---

### 16. Reservation Deposits

| Attribute | Value |
|-----------|-------|
| **Current Maturity** | Not implemented. Marketed on homepage as "deposits & confirmations." |
| **Why Deferred** | Requires payment integration at reservation time, deposit forfeiture logic, and refund workflow. Reservations work without deposits for V1. |
| **Recommended Future Milestone** | Version 2.0 — When reservation volume justifies deposit feature. |
| **Dependencies** | Payment integration at reservation time, deposit forfeiture logic, refund workflow. |
| **Strategic Value** | MEDIUM — Reduces no-shows for high-end restaurants. |
| **Re-entry Criteria** | 1. At least 10 customers request deposit feature. 2. Payment integration at reservation time complete. 3. Refund workflow verified. |
| **Files** | None — not implemented |

---

## Version Roadmap Summary

| Version | Features | Target |
|---------|----------|--------|
| **V1.0 (Launch)** | Core operations, menu, inventory, QR, reports, team, payments, referrals, founding program, business invites, discovery | First paying customers |
| **V1.5 (Early Access)** | CRM (Early Access), Loyalty (Early Access), AI Insights (Early Access), AI Menu Builder (Early Access), WhatsApp Staff Ordering (setup service), Promotions (if completed) | 3–6 months post-launch |
| **V2.0 (Growth)** | Site Builder, WhatsApp Campaigns, Voice Ordering, Supplier Marketplace (Early Access), API Access, Reservation Deposits | 6–12 months post-launch |
| **V2.5 (Expansion)** | Hotel Mode, Menu A/B Testing, Card/POS Payments, Supplier Marketplace (full self-service) | 12–18 months post-launch |
| **V3.0 (Enterprise)** | White-Label, SSO, Custom Integrations | 18+ months post-launch |

---

## Principles

1. **Nothing is abandoned** — Every deferred feature has a future version target and re-entry criteria.
2. **Customer-driven prioritization** — Re-entry criteria include customer demand thresholds.
3. **Dependency-aware** — Features are sequenced based on their dependencies (e.g., WhatsApp Campaigns depend on CRM).
4. **Strategic value preserved** — Deferred features retain their strategic importance documentation for future planning.
5. **Transparent** — This document is the single source of truth for what's deferred and why.

---

*Document generated: July 26, 2026*
