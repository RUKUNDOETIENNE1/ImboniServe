@echo off
setlocal ENABLEDELAYEDEXPANSION
pushd "%~dp0.."

echo ========================================
echo Imboni Serve - Autopilot Checklist Runner
echo ========================================
echo.

:: Resolve Base URL
set BASE=%1
if "%BASE%"=="" set BASE=%APP_URL%
if "%BASE%"=="" set BASE=http://localhost:3000
echo Using BASE URL: %BASE%

:: Optional Business ID for detail page testing (Sales Pipeline)
set BIZ_ID=%2
if "%BIZ_ID%"=="" if defined BUSINESS_ID set BIZ_ID=%BUSINESS_ID%
if not "%BIZ_ID%"=="" echo Using BUSINESS ID: %BIZ_ID%

:: Optional test credentials (informational only)
if not defined TEST_EMAIL set TEST_EMAIL=admin@imboni.resto
if not defined TEST_PASSWORD set TEST_PASSWORD=Admin123!
echo Test account (example): %TEST_EMAIL%  (override with env TEST_EMAIL / TEST_PASSWORD)

echo.
echo ================= CHECK: PLATFORM HEALTH =====================
echo - [1] Visit %BASE%/api/health           (EXPECT: 200 JSON {status:"ok"})
echo - [2] Visit %BASE%/api/health/ready     (EXPECT: 200 JSON {ready:true})
start "" %BASE%/api/health
start "" %BASE%/api/health/ready
where curl >NUL 2>&1
if %errorlevel% EQU 0 (
  echo Curl quick probe for /api/health ...
  curl -s -o NUL -w "HTTP %%{http_code}" %BASE%/api/health
  echo.
) else (
  echo Curl not available, skipping probe.
)
pause

echo.
echo ================== CHECK: AUTH / LOGIN =======================
echo Steps:
echo - [1] Open %BASE%/login  (EXPECT: login form renders)
echo - [2] Log in as ADMIN     (EXPECT: redirect to dashboard)
start "" %BASE%/login
pause

echo.
echo ============== CHECK: ADMIN FEATURE FLAGS ====================
echo Steps:
echo - [1] Open %BASE%/dashboard/admin/feature-flags
echo       (EXPECT: Flags list loads; autopilot statuses visible)
start "" %BASE%/dashboard/admin/feature-flags
pause

echo.
echo ============= CHECK: SALES PIPELINE - LIST UI ================
echo Steps:
echo - [1] Open %BASE%/admin/sales-pipeline
echo       (EXPECT: table renders, filters available, alerts banner if due)
echo - [2] Use filters: Lead, Demo Done, Trial Active, Trial Ending Soon, Converted, Lost
echo       (EXPECT: table rows filter accordingly)
echo - [3] Use search box for business/owner/phone
echo       (EXPECT: matching rows only)
start "" %BASE%/admin/sales-pipeline
pause

echo.
echo ========= CHECK: SALES PIPELINE - DETAIL UI (TABS) ==========
if "%BIZ_ID%"=="" (
  echo Skipping detail checks (no BUSINESS_ID provided). Re-run:
  echo   scripts\autopilot-checklist.bat %BASE% YOUR_BUSINESS_ID
) else (
  echo Target business: %BIZ_ID%
  echo - [1] Open %BASE%/admin/sales-pipeline/%BIZ_ID%
  echo       (EXPECT: Tabs: Overview, Trial, Activity Log, Performance, Notes)
  echo - [2] Trial tab: set Trial Start to today; leave End empty
  echo       (EXPECT: Days Left auto-computes from +14d)
  echo - [3] Set Status to "Trial Active" (EXPECT: persists after refresh)
  echo - [4] Set Next Action + Date today; tick Completed (EXPECT: persists)
  echo - [5] Check follow-ups Day 2/5/10/13 (EXPECT: saved)
  echo - [6] Activity Log quick actions (Call, Demo, Follow-up)
  echo       (EXPECT: New entries appear, newest first)
  echo - [7] Performance tab shows Today / This Week orders & revenue (if any)
  start "" %BASE%/admin/sales-pipeline/%BIZ_ID%
)
pause

echo.
echo ====== CHECK: PERSISTED "TRIAL ENDING SOON" (SCHEDULER) ======
echo Steps:
echo - [1] Ensure Status = "Trial Active"; set Trial End within 3 days
echo     OR set Start = today-11d with End empty (system computes +14d)
echo - [2] Wait ~1 minute after app start (scheduler runs on startup and hourly)
echo - [3] Re-open list/detail (EXPECT: Status becomes "Trial Ending Soon")
pause

echo.
echo ============== CHECK: DAILY REPORTS / NOTIFICATIONS ==========
echo Steps:
echo - [1] Open %BASE%/dashboard/notifications  (EXPECT: timezone/time pickers)
echo - [2] Click "Send-now" (EXPECT: success toast and sent confirmation)
start "" %BASE%/dashboard/notifications
pause

echo.
echo ==================== CHECK: ANALYTICS ========================
echo Steps:
echo - [1] Open %BASE%/dashboard/analytics (EXPECT: charts render; KPIs visible)
echo - [2] API probe %BASE%/api/analytics/dashboard (EXPECT: 200 JSON)
start "" %BASE%/dashboard/analytics
start "" %BASE%/api/analytics/dashboard
pause

echo.
echo ============== CHECK: SMART DINING SLIPS =====================
echo Steps:
echo - [1] Open %BASE%/dashboard/smart-dining-slips (EXPECT: list or empty state)
echo - [2] API: %BASE%/api/smart-dining-slips (EXPECT: 200 JSON)
echo - [3] API: %BASE%/api/smart-dining-slips/template (EXPECT: 200 templates)
start "" %BASE%/dashboard/smart-dining-slips
start "" %BASE%/api/smart-dining-slips
start "" %BASE%/api/smart-dining-slips/template
pause

echo.
echo =================== CHECK: KITCHEN (KDS) =====================
echo Steps:
echo - [1] Open %BASE%/dashboard/kitchen (EXPECT: orders list or empty state)
echo - [2] If orders exist, verify update without refresh (realtime/polling)
start "" %BASE%/dashboard/kitchen
pause

echo.
echo ================== CHECK: DISCOVERY / PROFILE ================
echo Steps:
echo - [1] Open %BASE%/dashboard/profile (EXPECT: discovery profile form)
echo - [2] Open %BASE%/discover        (EXPECT: public index)
start "" %BASE%/dashboard/profile
start "" %BASE%/discover
pause

echo.
echo ================== CHECK: PROMOTIONS ENGINE ==================
echo Steps:
echo - [1] Open %BASE%/dashboard/promotions (EXPECT: CRUD UI)
start "" %BASE%/dashboard/promotions
pause

echo.
echo ==================== CHECK: BRANCHES =========================
echo Steps:
echo - [1] Open %BASE%/dashboard/branches (EXPECT: list/add branch)
start "" %BASE%/dashboard/branches
pause

echo.
echo ===================== CHECK: LOYALTY =========================
echo Steps:
echo - [1] Open %BASE%/dashboard/loyalty (EXPECT: balance/rules UI)
start "" %BASE%/dashboard/loyalty
pause

echo.
echo ================== CHECK: AI MENU BUILDER ====================
echo Steps:
echo - [1] Open %BASE%/dashboard/menu-builder (EXPECT: candidates or empty)
echo       Note: Requires valid OpenAI API key; otherwise expect an informative error.
start "" %BASE%/dashboard/menu-builder
pause

echo.
echo ====================== CHECK: HOTEL MODE ======================
echo Steps:
echo - [1] Open %BASE%/dashboard/hotel (EXPECT: room grid; empty or sample)
start "" %BASE%/dashboard/hotel
pause

echo.
echo =================== CHECK: REFERRALS / CTA ===================
echo Steps:
echo - [1] Open %BASE%/dashboard/referrals (EXPECT: leaderboard/settings)
echo - [2] Open %BASE%/refer             (EXPECT: public referral page)
start "" %BASE%/dashboard/referrals
start "" %BASE%/refer
pause

echo.
echo ================== CHECK: TRANSACTIONS =======================
echo Steps:
echo - [1] Open %BASE%/dashboard/transactions (EXPECT: table; filters)
start "" %BASE%/dashboard/transactions
pause

echo.
echo ================== CHECK: RECONCILIATION =====================
echo Steps:
echo - [1] Open %BASE%/admin/reconciliation (EXPECT: mismatch table; actions)
start "" %BASE%/admin/reconciliation
pause

echo.
echo =================== CHECK: CMS (CONTENT) ====================
echo Steps:
echo - [1] Open %BASE%/dashboard/cms (EXPECT: posts list; create button)
echo - [2] Click New Post (EXPECT: type selector, title/body fields, schedule)
echo - [3] Create a draft post (EXPECT: saved; appears in list)
echo - [4] Submit for review (EXPECT: status changes to PENDING_REVIEW)
echo - [5] As ADMIN, approve post (EXPECT: status APPROVED or PUBLISHED)
echo Note: Requires cms_v1 feature flag enabled
start "" %BASE%/dashboard/cms
pause

echo.
echo =============== CHECK: DISCOVERY FEED (PUBLIC) ===============
echo Steps:
echo - [1] Open %BASE%/discover/feed (EXPECT: vertical feed; filters)
echo - [2] Use filters: All, Nearby, Trending, Featured
echo - [3] Click on a post (EXPECT: business info, WhatsApp CTA, View Menu)
echo - [4] Test engagement: Like, Comment, Share buttons
echo - [5] Click "Order via WhatsApp" (EXPECT: WhatsApp opens with prefilled message)
echo Note: Requires feed_v1 feature flag enabled; posts must be PUBLISHED
start "" %BASE%/discover/feed
pause

echo.
echo ========================= COMPLETE ===========================
echo If all expectations matched, features are healthy.
echo For failures: capture screenshots and API responses; share server logs.
echo.
echo DONE.

exit /b 0
