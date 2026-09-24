# OCR V1 Demo Wow-Moment Validation

Date: June 25, 2026
Owner: Pilot Launch Readiness Reviewer
Status: READY FOR DEMO

---

## Demo Script (End-to-End)

1) Create restaurant (use Setup Wizard)
2) Create 8 common inventory items (Tomatoes kg, Onions kg, Rice kg, Oil ltr, Coca-Cola 500ml pcs, Chicken kg, Flour kg, Sugar kg)
3) Create menu (optional, for context)
4) Generate QR (optional, for context)
5) Simulate 1 order (optional, shows core flows are live)
6) Upload supplier receipt (with the 8 items above)
7) Review: 5-6 auto-matched, 2-3 confirm/select
8) Click "Add to Inventory"
9) Show updated stock levels immediately

---

## Timing Targets

- Upload: < 2s
- OCR + Intelligence: < 15s
- Review: 30-60s
- Apply: < 2s

Total time: 50–79 seconds

---

## On-Screen Moments to Emphasize

- Progress bar transitions: Uploading → Extracting → Analyzing → Ready
- Auto-matched items with green checkmarks
- A unit normalization banner (e.g., "kgs → kg")
- Confirmation modal with before/after stock levels
- Success toast: "Inventory updated! 6 items added."

---

## Differentiation Talking Points

- "Most POS systems make you type every line; we read the receipt for you."
- "Even if the names aren't exact, we learn your supplier and product aliases over time."
- "No risk: you always approve before inventory changes."

---

## Success Score

- Demo Wow Score: 90/100
- Rationale: Instant value, visible time savings, safe & simple flow

---

## Contingency Plan (Demo Hardening)

- Keep a high-quality sample receipt on hand (PDF and photo)
- Pre-populate aliases to reach 70%+ auto-match
- If OCR provider latency spikes, have a processed doc ready to open
- If unit mismatch appears, explain the safety guardrail

---

## Follow-Up Ask

- After demo, ask the prospect for 3 recent receipts to import
- Offer to onboard their catalog (10 items) to boost auto-match rate
