# FOUNDER-GPV-001 — Environment Prerequisites

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-ENV-PREREQ |
| Date | 2026-08-14 |
| Source | `.env` file inspection, `.env.example`, route analysis |

## Overview

This document lists everything the founder must prepare before the guided verification session. Each item is classified by readiness status.

## Environment Classification

**CURRENT STATUS: LOCAL ONLY**

The application is currently running on `http://localhost:3000`. There is no remote URL. This means:
- The founder can test from a desktop browser on the same machine
- Phone QR testing requires the phone to access localhost (via local network IP or USB tunneling)
- InTouch webhook callbacks require a tunnel (ngrok) to reach localhost
- The founder CANNOT test from a phone on a different network without a remote URL

## Prerequisites Matrix

| # | Item | Status | Classification | Notes |
|---|---|---|---|---|
| 1 | Application environment (localhost:3000) | ✅ READY | READY | Next.js dev server |
| 2 | PostgreSQL database | ✅ READY | READY | Supabase configured |
| 3 | Test owner account | ⚠️ NEEDED | FOUNDER-ACTION | Must signup via `/signup` |
| 4 | Test business | ⚠️ NEEDED | FOUNDER-ACTION | Created during signup |
| 5 | SMTP (email OTP) | ✅ CONFIGURED | READY | Gmail SMTP configured |
| 6 | Twilio (WhatsApp/SMS OTP) | ✅ CONFIGURED | READY | Twilio account configured |
| 7 | Pusher (real-time) | ✅ CONFIGURED | READY | Pusher app configured |
| 8 | `PAYMENTS_PROVIDER` | ❌ WRONG VALUE | FOUNDER-ACTION | Set to "irembo", should be "intouch" |
| 9 | `INTOUCH_WEBHOOK_USERNAME` | ❌ MISSING | FOUNDER-ACTION | Required for webhook Basic Auth |
| 10 | `INTOUCH_WEBHOOK_PASSWORD` | ❌ MISSING | FOUNDER-ACTION | Required for webhook Basic Auth |
| 11 | `INTOUCH_CALLBACK_URL` | ❌ MISSING | FOUNDER-ACTION | Required for InTouch to send callbacks |
| 12 | Webhook tunnel (ngrok) | ❌ REQUIRED | ENVIRONMENT-BLOCKED | Required for localhost webhook testing |
| 13 | InTouch sandbox account | ✅ CONFIGURED | READY | Username "testa", account "123456" |
| 14 | Test payment credentials | ⚠️ NEEDED | FOUNDER-ACTION | Mobile Money phone with test balance |
| 15 | QR-capable phone | ⚠️ NEEDED | FOUNDER-ACTION | Smartphone with camera |
| 16 | Test menu data | ⚠️ NEEDED | FOUNDER-ACTION | Must create menu items during setup |
| 17 | `IMBONI_QR_SECRET` | ✅ CONFIGURED | READY | HMAC secret for QR signing |
| 18 | `NEXTAUTH_URL` | ✅ CONFIGURED | READY | Set to localhost:3000 |
| 19 | `NEXTAUTH_SECRET` | ⚠️ VERIFY | FOUNDER-ACTION | Must be set (check .env) |
| 20 | `ALLOW_LEGACY_CREDENTIALS` | ✅ SET | READY | Set to "true" (dev only) |
| 21 | OpenAI API key | ⚠️ VERIFY | UNKNOWN | Needed for AI features (menu builder, insights) |
| 22 | Supabase storage | ⚠️ VERIFY | UNKNOWN | Needed for image uploads |
| 23 | Remote URL for phone testing | ❌ NOT AVAILABLE | ENVIRONMENT-BLOCKED | No remote deployment |

## FOUNDER-ACTION-REQUIRED Items

These items MUST be resolved before the guided session can proceed:

### 1. Set PAYMENTS_PROVIDER to "intouch"

**Current**: `PAYMENTS_PROVIDER="irembo"` in `.env`
**Required**: `PAYMENTS_PROVIDER="intouch"`
**Impact**: Without this, payment routing may use the wrong provider

### 2. Set INTOUCH_WEBHOOK_USERNAME

**Current**: MISSING from `.env`
**Required**: A username for webhook Basic Auth (provided by InTouch or self-defined)
**Impact**: Without this, webhook returns 503 — payment callbacks fail

### 3. Set INTOUCH_WEBHOOK_PASSWORD

**Current**: MISSING from `.env`
**Required**: A password for webhook Basic Auth (provided by InTouch or self-defined)
**Impact**: Without this, webhook returns 503 — payment callbacks fail

### 4. Set INTOUCH_CALLBACK_URL

**Current**: MISSING from `.env`
**Required**: Public URL that InTouch can reach (e.g., `https://<ngrok-url>/api/webhooks/intouch`)
**Impact**: Without this, InTouch doesn't know where to send payment callbacks

### 5. Set up ngrok tunnel (or similar)

**Current**: Not set up
**Required**: A tunnel from a public URL to localhost:3000
**Command**: `ngrok http 3000`
**Impact**: Without this, InTouch cannot reach the webhook on localhost

### 6. Prepare test payment credentials

**Current**: Not prepared
**Required**: A Mobile Money phone number (MTN or Airtel) with test balance in InTouch sandbox
**Impact**: Without this, payment cannot be tested end-to-end

### 7. Create test owner account

**Current**: Not created
**Required**: Signup a new business owner via `/signup`
**Impact**: Without this, no business exists to test with

## ENVIRONMENT-BLOCKED Items

These items are blocked by the current environment and cannot be resolved by configuration alone:

### 1. Remote URL for phone testing

**Status**: Not available
**Impact**: The founder cannot test QR scanning from a phone on a different network
**Workaround**: Use phone on same local network (access via local IP, e.g., `http://192.168.x.x:3000`)
**Alternative**: Deploy to a remote server (NOT authorized in this phase)

### 2. Webhook tunnel for localhost

**Status**: Requires ngrok or similar
**Impact**: InTouch cannot send payment callbacks to localhost
**Workaround**: Set up ngrok tunnel — this IS resolvable but requires the founder to install and configure ngrok

## READY Items (Already Configured)

| Item | Configuration |
|---|---|
| Database | Supabase PostgreSQL |
| SMTP | Gmail (steve.aimviews@gmail.com) |
| Twilio | Account SID and auth token configured |
| Pusher | App ID, key, secret, cluster configured |
| InTouch API | Sandbox account (testa) configured |
| QR HMAC secret | Configured |
| NextAuth | URL and (presumably) secret configured |
| Legacy credentials | Enabled for dev (ALLOW_LEGACY_CREDENTIALS=true) |

## Pre-Session Checklist

Before starting the guided verification session, the founder must:

- [ ] Set `PAYMENTS_PROVIDER="intouch"` in `.env`
- [ ] Set `INTOUCH_WEBHOOK_USERNAME` in `.env`
- [ ] Set `INTOUCH_WEBHOOK_PASSWORD` in `.env`
- [ ] Set `INTOUCH_CALLBACK_URL` in `.env` (ngrok URL + `/api/webhooks/intouch`)
- [ ] Install and start ngrok: `ngrok http 3000`
- [ ] Verify ngrok URL is accessible
- [ ] Prepare a Mobile Money phone with test balance
- [ ] Prepare a smartphone with QR scanning capability
- [ ] Ensure application is running: `npm run dev`
- [ ] Verify localhost:3000 loads in browser
- [ ] Prepare test business data (name, phone, email for signup)

## Session Restart Points

If a session is interrupted, the founder can resume from:

| Session | Restart Point | How to Check |
|---|---|---|
| A (Owner Setup) | Login → check setup wizard status | `/setup` shows progress |
| B (Team) | Login → check staff list | `/dashboard/staff` shows created staff |
| C (Menu/Tables/QR) | Login → check menu and tables | `/dashboard/menu` and `/dashboard/tables` |
| D (Guest Dining) | Scan QR → check if session exists | `/order` page loads |
| E (Kitchen) | Login → check kitchen display | `/dashboard/kitchen` shows orders |
| F (Payment) | Login → check transactions | `/dashboard/transactions` shows payments |
| G (Close Day) | Login → check close-day | `/dashboard/close-day` shows Z-Report |
| H (Executive) | Login → check CEO dashboard | `/dashboard/ceo` shows metrics |
