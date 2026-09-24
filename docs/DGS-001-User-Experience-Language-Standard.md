# DGS-001 User Experience Language Standard

## The Authoritative Guide to User-Facing Text in ImboniServe

---

## 1. Principles

All user-facing text in ImboniServe must be:

| Principle | Definition | Example |
|-----------|-----------|---------|
| **Clear** | No jargon, no ambiguity | "Add Business" (not "Create Entity") |
| **Consistent** | Same terms across all interfaces | "Business" everywhere (not mixed with "Restaurant") |
| **Professional** | Business-appropriate tone | "Business requires attention" (not "Biz needs help") |
| **Hospitality-First** | Multi-vertical, not restaurant-centric | "Hospitality Business" (not "Restaurant") |
| **Action-Oriented** | Tell users what to do next | "Add your first business to get started" |

---

## 2. Entity References in UI

### Primary Entities

| Entity | UI Label | Context | Prohibited Alternatives |
|--------|---------|---------|------------------------|
| Business | "Business" | Internal admin/dashboard | "Restaurant", "Eatery", "Venue" |
| Business | "Hospitality Business" | Public/marketing/onboarding | "Restaurant", "Food Establishment" |
| Branch | "Branch" or "Location" | Business management | "Store", "Shop", "Unit" |
| Outlet | "Outlet" or "Service Point" | Branch configuration | "Counter", "Station" |
| Customer | "Customer" | B2B context (platform customers) | "Client" (except CRM), "Account" |
| Guest | "Guest" | End-consumer in hospitality context | "Diner", "Patron", "Visitor" |
| Partner | "Partner" or "Founder Partner" | Partnership program | "Affiliate" (except affiliate-specific), "Referrer" |

### When "Restaurant" Is Acceptable

"Restaurant" may be used ONLY when:
1. It is a business type option in a dropdown/select: `<option value="RESTAURANT">Restaurant</option>`
2. It is an outlet type: `OutletType.RESTAURANT`
3. It is a specific filter category: `['Restaurant', 'Cafe', 'Bar', 'Hotel']`
4. The business itself is categorized as a restaurant and the text is dynamically generated from business type

**Never** use "restaurant" as a generic term for all hospitality businesses.

---

## 3. Button and Action Labels

### Standard Action Labels

| Action | Standard Label | Prohibited |
|--------|---------------|-----------|
| Create new business | "Add Business" | "Add Restaurant" |
| View business details | "View Business Details" | "View Restaurant" |
| Edit business | "Edit Business" | "Edit Restaurant" |
| Delete business | "Delete Business" | "Delete Restaurant" |
| Manage businesses | "Manage Businesses" | "Manage Restaurants" |
| Business settings | "Business Settings" | "Restaurant Settings" |
| Activate business | "Activate Business" | "Activate Restaurant" |
| Suspend business | "Suspend Business" | "Suspend Restaurant" |
| Approve business | "Approve Business" | "Approve Restaurant" |

### Button Patterns

```
✅ Good: "Add Business", "Save Changes", "Activate Business"
❌ Bad:  "Add Restaurant", "Save", "Activate"
```

---

## 4. Form Field Labels

### Standard Field Labels

| Field | Standard Label | Prohibited |
|-------|---------------|-----------|
| Business name | "Business Name" | "Restaurant Name" |
| Business type | "Business Type" | "Restaurant Type" |
| Business address | "Business Address" | "Restaurant Address" |
| Business phone | "Business Phone" | "Restaurant Phone" |
| Business email | "Business Email" | "Restaurant Email" |
| Service categories | "Service Categories" | "Cuisine Types" |
| Business description | "Business Description" | "Restaurant Description" |
| Business logo | "Business Logo" | "Restaurant Logo" |

### Business Type Options

```
Business Type:
  - Restaurant
  - Hotel
  - Café
  - Bar
  - Pool Bar
  - Lounge
  - Spa
  - Bakery
  - Catering
  - Fast Food
  - Fine Dining
  - Other
```

---

## 5. Validation Messages

### Standard Validation Messages

| Scenario | Standard Message | Prohibited |
|----------|-----------------|-----------|
| Required field | "Business name is required" | "Restaurant name is required" |
| Duplicate | "Business already exists" | "Restaurant already exists" |
| Invalid format | "Please enter a valid business name" | "Please enter a valid restaurant name" |
| Selection required | "Please select a business type" | "Please select a restaurant type" |
| Permission | "You don't have permission to manage this business" | "You don't have permission to manage this restaurant" |

### Pattern

```
✅ Good: "{Entity} {field} is required"
✅ Good: "Please enter a valid {entity} {field}"
✅ Good: "{Entity} already exists"
❌ Bad:  "Restaurant name is required"
```

---

## 6. Success Messages

| Scenario | Standard Message |
|----------|-----------------|
| Business created | "Business created successfully" |
| Business updated | "Business updated successfully" |
| Business activated | "Business activated successfully" |
| Business suspended | "Business suspended successfully" |
| Business approved | "Business approved successfully" |
| Branch added | "Branch added successfully" |
| Settings saved | "Settings saved successfully" |

---

## 7. Error Messages

| Scenario | Standard Message |
|----------|-----------------|
| Load failure | "Failed to load business data. Please try again." |
| Not found | "Business not found" |
| Permission denied | "You don't have permission to access this business" |
| Server error | "Something went wrong. Please try again or contact support." |
| Network error | "Network error. Please check your connection and try again." |

### Error Message Principles

1. **Be specific**: "Failed to load business data" (not "Error occurred")
2. **Be helpful**: "Please try again or contact support" (not just "Error")
3. **Be calm**: No exclamation marks, no ALL CAPS
4. **Be hospitality-first**: Use "business" not "restaurant"

---

## 8. Empty States

### Standard Empty State Text

| Context | Standard Text |
|---------|--------------|
| No businesses | "No businesses yet. Add your first hospitality business to get started." |
| No branches | "No branches found. Add a location to begin." |
| No guests | "No guests yet. Start welcoming guests to see them here." |
| No customers | "No customers yet. Customers will appear here once they sign up." |
| No partners | "No partners yet. Invite partners to grow your network." |
| No campaigns | "No campaigns found. Create a campaign to start acquiring businesses." |
| No data | "No data available. Data will appear here once available." |
| No results | "No results found. Try adjusting your search or filters." |

### Empty State Structure

```
[Icon]
[Headline: Clear, encouraging]
[Description: Helpful, action-oriented]
[CTA Button: "Add Business" / "Get Started"]
```

---

## 9. Notification Text

### In-App Notifications

| Event | Standard Text |
|-------|--------------|
| New business signup | "New business signup: {Business Name}" |
| Business requires attention | "Business {Name} requires attention" |
| Business approved | "Your business has been approved" |
| Business suspended | "Your business has been suspended. Contact support." |
| Payment received | "Payment received from {Business Name}" |
| Subscription activated | "Subscription activated for {Business Name}" |

### Email Subject Lines

| Event | Standard Subject |
|-------|----------------|
| Welcome | "Welcome to ImboniServe — Hospitality Intelligence Operating System" |
| Business approved | "Your Business Has Been Approved — ImboniServe" |
| Payment confirmation | "Payment Confirmation — ImboniServe" |
| Subscription renewal | "Subscription Renewal Reminder — ImboniServe" |
| Partnership invitation | "You're Invited to Join ImboniServe Partners" |

---

## 10. Onboarding Text

### Welcome Screen

```
Headline: "Welcome to ImboniServe"
Subtitle: "Hospitality Intelligence Operating System"
Description: "The platform that helps hospitality businesses
             grow, optimize, and delight their guests."
```

### Business Setup

```
Step 1: "Tell us about your hospitality business"
Step 2: "Choose your business type"
Step 3: "Set up your first branch"
Step 4: "Configure your service points"
Step 5: "Start welcoming guests"
```

### Partner Onboarding

```
Headline: "Become an ImboniServe Partner"
Description: "Help hospitality businesses begin their digital
             transformation and earn commissions."
```

---

## 11. Help Text and Tooltips

### Standard Help Text

| Field | Help Text |
|-------|----------|
| Business Name | "The name of your hospitality business as it appears to guests" |
| Business Type | "Select the type that best describes your business" |
| Branch | "A physical location of your business (e.g., downtown branch)" |
| Outlet | "A service point within a branch (e.g., main dining area, bar)" |
| Service Category | "The types of services your business offers" |
| Founder Code | "Share this code with hospitality businesses to earn commissions" |

### Tooltip Principles

1. **Be concise**: Maximum 1-2 sentences
2. **Be helpful**: Explain what the field does, not just what it is
3. **Be hospitality-first**: Use "business" and "guest" appropriately
4. **Avoid assumptions**: Don't assume restaurant context

---

## 12. Dashboard and Analytics Labels

### Standard Metric Labels

| Metric | Standard Label | Prohibited |
|--------|---------------|-----------|
| Total businesses | "Total Businesses" | "Total Restaurants" |
| Active businesses | "Active Businesses" | "Active Restaurants" |
| New businesses (7d) | "New Businesses (7d)" | "New Restaurants (7d)" |
| Business growth | "Business Growth" | "Restaurant Growth" |
| Business acquisition | "Business Acquisition" | "Restaurant Acquisition" |
| Guest count | "Total Guests" | "Total Diners" |
| Guest satisfaction | "Guest Satisfaction" | "Customer Satisfaction" (in hospitality context) |

---

## 13. Specific Fixes Required

### From Page Audits

| # | File | Line | Current Text | Standard Text |
|---|------|------|-------------|--------------|
| 1 | portal/businesses.tsx | 95 | "acquiring restaurants" | "acquiring hospitality businesses" |
| 2 | portal/codes.tsx | 62 | "with restaurants" | "with hospitality businesses" |
| 3 | dashboard/partner.tsx | 154 | "restaurant owners" | "hospitality business owners" |

### From Component Audits

| # | File | Line | Current | Standard |
|---|------|------|---------|----------|
| 4 | AchievementBadge.tsx | 14-17 | first_restaurant, ten_restaurants | first_business, ten_businesses |
| 5 | MilestoneCard.tsx | 26-29 | first_restaurant, ten_restaurants | first_business, ten_businesses |
| 6 | Multi-Location Dashboard | 46 | restaurantCount | businessCount |

### From Executive Audits (EOS-001I)

| # | File | Line | Current | Standard |
|---|------|------|---------|----------|
| 7 | ceo.tsx | 227 | "Restaurants currently active" | "Hospitality Businesses currently active" |
| 8 | cmo.tsx | 457 | "Restaurant acquisition" | "Hospitality Business acquisition" |
| 9 | GrowthPulse.tsx | 77 | "Restaurant Growth (7d)" | "Hospitality Business Growth (7d)" |
| 10 | RestaurantEcosystem.tsx | 56 | "Restaurant Ecosystem" | "Hospitality Business Ecosystem" |
| 11 | RestaurantOperations.tsx | 45 | "Restaurant Operations" | "Hospitality Business Operations" |
| 12 | AcquisitionFunnel.tsx | 56 | "Interested Restaurant" | "Interested Hospitality Business" |
| 13 | RegionalGrowthIntelligence.tsx | 92 | "Restaurant Density" | "Hospitality Business Density" |

---

## 14. Code Review Checklist

Before merging any UI change, verify:

- [ ] No "restaurant" in user-visible text (unless business type option)
- [ ] "Business" or "Hospitality Business" used consistently
- [ ] "Guest" used for end-consumers in hospitality context
- [ ] "Customer" used for B2B platform customers
- [ ] Empty states are encouraging and action-oriented
- [ ] Error messages are specific and helpful
- [ ] Success messages confirm the action taken
- [ ] Validation messages use entity + field pattern
- [ ] Button labels are action verbs + entity name
- [ ] Help text is concise and hospitality-first

---

## 15. Enforcement

### Automated Checks

```bash
# Search for prohibited user-visible "restaurant" text
grep -rn "restaurant" src/pages src/components --include="*.tsx" | grep -v "node_modules" | grep -v "\.test\."

# Should return only:
# - Business type options (value="RESTAURANT")
# - Outlet type references
# - Filter categories
# - Comments (should be updated separately)
```

### Manual Review

- Code reviewer must verify all new user-visible text follows this standard
- Product manager must approve any new entity terminology
- Design team must verify empty state and error message tone

---

## Conclusion

This standard ensures that every user-facing message in ImboniServe is clear, consistent, professional, hospitality-first, and action-oriented. Following this standard creates one coherent user experience across the entire platform.
