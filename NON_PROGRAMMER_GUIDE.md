# 📘 NON-PROGRAMMER GUIDE — IMBONI SERVE
## Business Signup & Approval Workflow

**Last Updated**: April 26, 2026  
**Version**: 2.0 (Post-Security Hardening)

---

## 🎯 OVERVIEW

Imboni Serve now includes a **smart approval system** to prevent fraudulent signups while keeping the experience smooth for legitimate businesses.

**Key Changes**:
- ✅ Low-risk businesses: **Instant approval** (no delay)
- 🟡 Medium-risk businesses: **Manual review** (within 24 hours)
- 🔴 High-risk businesses: **Automatic rejection** or manual review
- 🎁 14-day trial starts **on approval**, not signup

---

## FOR BUSINESS OWNERS (Signing Up)

### Step 1: Create Your Account

1. **Visit**: https://imboni.serve/signup
2. **Fill in your details**:
   - Your full name
   - Email address
   - Phone number (must be unique)
   - Password (minimum 8 characters)
   - Business name
   - City/Location (use autocomplete for best results)
   - Business type (Restaurant, Hotel, Café, Bar, or Supplier)

3. **Click**: "Start Your 14-Day Free Trial"

### Step 2: Account Review

**What happens next?**

#### 🟢 **LOW RISK** (Most businesses)
- ✅ **Instant approval!**
- You'll see: "Account created! Your 14-day trial has started."
- Login immediately and start using all features
- No waiting required

#### 🟡 **MEDIUM RISK** (Needs review)
- ⏳ You'll see: "Account created! We're reviewing your application."
- Check your email within **24 hours**
- Our team will review and approve/reject
- Common reasons for review:
  - Similar business name in same area
  - Phone number previously used
  - Location near existing business

#### 🔴 **HIGH RISK** (Suspicious)
- ❌ You'll see: "Unable to create account. Please contact support."
- Common reasons:
  - Duplicate account detected
  - Disposable email address used
  - Too many signups from same network
- **If this is an error**: Contact support@imboni.serve with:
  - Your business name
  - Phone number
  - Business license (if available)

### Step 3: Approval Notification

**If your account needs review**, you'll receive an email:

#### ✅ **APPROVED**
- Subject: "Welcome to Imboni Serve - Your Trial Has Started!"
- Your 14-day trial begins **now** (from approval date)
- Login and explore all features
- No credit card required

#### ❌ **REJECTED**
- Subject: "Imboni Serve - Application Update"
- Reason for rejection explained
- **If you believe this is an error**:
  - Reply to the email with clarification
  - Provide business license or proof of ownership
  - Our team will re-review within 48 hours

#### 📋 **MORE INFO NEEDED**
- Subject: "Imboni Serve - Additional Information Required"
- We need clarification (e.g., business license, proof of address)
- Reply with requested documents
- Review continues after submission

### Step 4: Using Your Trial

**Once approved**:
- ✅ 14 days of full access
- ✅ All features unlocked (based on your plan)
- ✅ No credit card required
- ✅ Cancel anytime (no questions asked)

**Trial countdown**:
- Starts on **approval date** (not signup date)
- You'll receive reminders at Day 7, Day 12, and Day 14
- Upgrade anytime to continue after trial

---

## FOR ADMINS (Reviewing Signups)

### Accessing the Approval Dashboard

1. **Login** as admin
2. **Navigate**: Admin → Business Approvals
3. **Dashboard shows**:
   - Pending businesses (sorted by risk level)
   - Risk indicators (🟢 LOW, 🟡 MEDIUM, 🔴 HIGH)
   - Duplicate warnings
   - Business details

### Understanding Risk Levels

#### 🟢 **LOW RISK** (0-29 points)
- **Auto-approved** by system
- No duplicates detected
- Valid business details
- Clean IP/device history
- **Action**: Review if you want, but usually safe

#### 🟡 **MEDIUM RISK** (30-69 points)
- **Requires manual review**
- Possible duplicates detected
- Suspicious patterns (but not definitive)
- **Action**: Review carefully before approving

#### 🔴 **HIGH RISK** (70+ points)
- **Likely fraud**
- Multiple duplicate indicators
- Disposable email or suspicious patterns
- **Action**: Usually reject unless verified

### Review Process

#### 1. **Click on Business Name**
View full details:
- Business name, location, phone
- Owner name and email
- Risk score breakdown
- Duplicate warnings (if any)
- Device/IP information

#### 2. **Check for Duplicates**

**System shows matched businesses**:
- ⚠️ **Same business name + city**: Likely duplicate
- ⚠️ **Same phone number**: Likely same owner
- ⚠️ **Same location (within 100m)**: Suspicious
- ⚠️ **Same device**: Multiple signups from one device

**Legitimate reasons for "duplicates"**:
- ✅ Chain restaurant (multiple branches)
- ✅ New branch of existing business
- ✅ Owner opening second restaurant
- ✅ Typo in previous signup (corrected now)

**Fraudulent patterns**:
- ❌ Exact same business, different email
- ❌ Same location, slightly different name
- ❌ Many signups from same IP in short time

#### 3. **Make a Decision**

**Option A: ✅ APPROVE**
- Click "Approve Business"
- Trial starts immediately (14 days from now)
- User receives approval email
- **When to approve**:
  - Low risk, no issues
  - Legitimate multi-branch business
  - Verified as real business

**Option B: ❌ REJECT**
- Click "Reject Business"
- Enter reason (e.g., "Duplicate account detected")
- User receives rejection email with reason
- **When to reject**:
  - Clear duplicate/fraud
  - Disposable email
  - Suspicious patterns confirmed

**Option C: 📋 REQUEST MORE INFO**
- Click "Request Information"
- Enter what you need (e.g., "Please provide business license")
- User receives email requesting documents
- Review continues after they respond
- **When to request info**:
  - Unsure if legitimate
  - Need proof of ownership
  - Clarification needed

### Bulk Actions

**For multiple businesses**:
1. Select checkboxes next to businesses
2. Choose action: Approve All / Reject All
3. Confirm action
4. **Use carefully** - only for obvious cases

### Best Practices

#### Daily Routine
- [ ] Check pending queue every morning
- [ ] Prioritize HIGH risk (review first)
- [ ] Approve obvious LOW risk quickly
- [ ] Investigate MEDIUM risk carefully

#### Red Flags to Watch
- 🚩 Multiple signups from same IP in one day
- 🚩 Disposable email domains (tempmail.com, etc.)
- 🚩 Exact duplicate business name + location
- 🚩 Phone number used for multiple businesses
- 🚩 Suspicious business names ("Test Restaurant", "ABC123")

#### When in Doubt
- ✅ Request more information (don't auto-reject)
- ✅ Ask for business license or proof
- ✅ Check Google Maps for business location
- ✅ Call phone number to verify
- ❌ Don't approve suspicious without verification

---

## TRIAL START TIMING

### OLD SYSTEM (Before April 2026)
```
User Signs Up → Trial Starts Immediately → 14 Days Begin
```
**Problem**: Fraudsters got instant 14-day access

### NEW SYSTEM (After April 2026)
```
User Signs Up → Review (if needed) → Approval → Trial Starts → 14 Days Begin
```
**Benefit**: Trial only starts after verification

### Example Timeline

**Scenario 1: Low Risk (Auto-Approved)**
- **Monday 9:00 AM**: User signs up
- **Monday 9:00 AM**: Auto-approved (instant)
- **Monday 9:00 AM**: Trial starts
- **Monday (2 weeks later)**: Trial ends

**Scenario 2: Medium Risk (Manual Review)**
- **Monday 9:00 AM**: User signs up
- **Monday 9:00 AM**: Status = PENDING
- **Tuesday 10:00 AM**: Admin approves (26 hours later)
- **Tuesday 10:00 AM**: Trial starts (14 days from now)
- **Tuesday (2 weeks later)**: Trial ends

**Key Point**: Trial is always 14 full days, regardless of review time.

---

## DUPLICATE HANDLING

### What the System Checks

1. **Email Address**: Must be unique (database enforced)
2. **Phone Number**: Must be unique (database enforced)
3. **Business Name + City**: Flags exact matches
4. **Location Coordinates**: Flags if within 100 meters
5. **Device Fingerprint**: Flags if same device used multiple times
6. **IP Address**: Flags if too many signups from same network

### Common Scenarios

#### ✅ **LEGITIMATE DUPLICATES** (Approve)
- **Chain Restaurant**: "Bourbon Coffee" in Kigali + "Bourbon Coffee" in Musanze
  - Action: Approve both (different locations)
- **Multi-Branch**: Same owner, multiple restaurants
  - Action: Approve (verify ownership)
- **Typo Correction**: User made mistake in first signup
  - Action: Approve new, deactivate old

#### ❌ **FRAUDULENT DUPLICATES** (Reject)
- **Same Business, Different Email**: "Café Neo" at same address, different owner
  - Action: Reject (likely fraud)
- **Rapid Signups**: 5 signups from same IP in 1 hour
  - Action: Reject all except first
- **Pattern Abuse**: "Restaurant A", "Restaurant B", "Restaurant C" from same device
  - Action: Reject (clear pattern)

### How to Verify Legitimacy

1. **Google the business**: Does it exist? Is the address correct?
2. **Check social media**: Facebook, Instagram for the business
3. **Call the phone number**: Verify it's a real business
4. **Request documents**: Business license, tax ID, proof of address
5. **Ask for clarification**: Email the owner for explanation

---

## SECURITY BEST PRACTICES

### For Admins

#### Daily Tasks
- ✅ Review pending signups every morning
- ✅ Reject obvious fraud immediately
- ✅ Request info when unsure (don't auto-approve)
- ✅ Monitor duplicate patterns
- ✅ Report persistent abusers to tech team

#### Weekly Tasks
- ✅ Review approval/rejection stats
- ✅ Check for new fraud patterns
- ✅ Update disposable email list (if needed)
- ✅ Share insights with team

#### Never Do
- ❌ Auto-approve HIGH risk without verification
- ❌ Share approval dashboard access with non-admins
- ❌ Ignore duplicate warnings
- ❌ Approve without checking details

### For System Administrators

#### Environment Security
- ✅ Keep `NEXTAUTH_SECRET` secure (never commit to Git)
- ✅ Rotate secrets every 90 days
- ✅ Enable CAPTCHA for production
- ✅ Monitor trial eligibility logs
- ✅ Review fraud detection stats weekly

#### Database Maintenance
- ✅ Backup database daily
- ✅ Monitor approval queue size
- ✅ Archive old rejected businesses (after 90 days)
- ✅ Update disposable email domain list

---

## TROUBLESHOOTING

### "Why was I rejected?"

**Common reasons**:
1. **Duplicate account**: Email or phone already used
2. **Disposable email**: Using temporary email service
3. **Suspicious patterns**: Multiple signups from same device/IP
4. **Invalid business details**: Incomplete or fake information

**What to do**:
- Check email for specific reason
- Contact support@imboni.serve
- Provide proof of business (license, registration)
- Use real email address (not tempmail)

### "My legitimate business was flagged"

**This can happen if**:
- You're opening a second branch (same phone number)
- Your business is near another restaurant
- You previously signed up and forgot

**What to do**:
1. Reply to the "More Info Needed" email
2. Explain your situation
3. Provide business license or proof of ownership
4. Our team will re-review within 48 hours

### "Trial hasn't started yet"

**Check your approval status**:
1. Login to your account
2. If you see "Pending Approval" message:
   - Your account is under review
   - Check email for updates
   - Usually resolved within 24 hours
3. If approved, trial should start immediately

**Still stuck?**
- Email: support@imboni.serve
- WhatsApp: +250735214496
- Include: Your business name and phone number

---

## CONTACT & SUPPORT

**For Business Owners**:
- Email: support@imboni.serve
- WhatsApp: +250735214496
- Hours: Monday-Friday, 8 AM - 6 PM (Rwanda Time)

**For Admins**:
- Internal Slack: #business-approvals
- Escalation: admin@imboni.serve
- Emergency: +250788917126

---

**End of Non-Programmer Guide**
