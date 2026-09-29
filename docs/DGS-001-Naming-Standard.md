# DGS-001: Naming Standard

**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2024  
**Owner:** Development Team  
**Related:** DGS-002 (Terminology Standard)

---

## 1. Overview

This document defines the naming conventions for the Imboni Resto codebase to ensure consistency, maintainability, and alignment with our business domain terminology. All code MUST use "business" terminology instead of "restaurant" to reflect our multi-vertical platform strategy.

### 1.1 Guiding Principles

- **Domain Alignment:** Names must reflect our business domain (businesses, customers, partners)
- **Consistency:** Similar entities should follow similar patterns
- **Clarity:** Names should be self-documenting and unambiguous
- **Searchability:** Names should be unique and easily searchable
- **Future-Proof:** Names should accommodate platform expansion

---

## 2. Component Naming

### 2.1 Pattern

```
[Entity][Purpose].tsx
```

### 2.2 Rules

- **PascalCase** for component files and component names
- Entity comes first, followed by the purpose/type
- Use singular form for entity (Business, Customer, Partner)
- Purpose should describe the component's primary function

### 2.3 Examples

#### ✅ Correct

```typescript
// Supplier/provider components
BusinessSupplier.tsx
export const BusinessSupplier: React.FC = () => { ... }

// Customer-facing components
CustomerHealthCenter.tsx
export const CustomerHealthCenter: React.FC = () => { ... }

// Partner/partnership components
PartnerPerformance.tsx
export const PartnerPerformance: React.FC = () => { ... }

// Business-specific components
BusinessCard.tsx
BusinessList.tsx
BusinessDetails.tsx
BusinessMetrics.tsx
BusinessOnboarding.tsx

// Branch-specific components
BranchSelector.tsx
BranchMap.tsx
BranchDetails.tsx

// Customer-specific components
CustomerProfile.tsx
CustomerSegmentation.tsx
CustomerInsights.tsx

// Generic/shared components
DataTable.tsx
LoadingSpinner.tsx
ErrorBoundary.tsx
```

#### ❌ Incorrect

```typescript
// Using deprecated "restaurant" terminology
RestaurantSupplier.tsx
RestaurantCard.tsx
RestaurantMetrics.tsx

// Incorrect casing
businessSupplier.tsx
business-supplier.tsx
BUSINESS_SUPPLIER.tsx

// Ambiguous naming
Supplier.tsx  // Which entity?
Card.tsx      // Too generic
Metrics.tsx   // Missing entity context
```

### 2.4 Special Cases

```typescript
// Layout components
AdminLayout.tsx
DashboardLayout.tsx
PublicLayout.tsx

// Page components (in pages directory)
businesses.tsx          // kebab-case for Next.js pages
partnership-director.tsx
customer-insights.tsx

// HOC (Higher-Order Components)
withAuth.tsx
withBusinessContext.tsx

// Context providers
BusinessProvider.tsx
CustomerProvider.tsx
ThemeProvider.tsx
```

---

## 3. Service Naming

### 3.1 Pattern

```
[entity].service.ts
[domain]-[purpose].service.ts
```

### 3.2 Rules

- **kebab-case** for file names
- **camelCase** for service class/object names
- Use `.service.ts` suffix
- Group related functionality by entity or domain

### 3.3 Examples

#### ✅ Correct

```typescript
// Entity-based services
business.service.ts
export const businessService = {
  getBusinesses(): Promise<Business[]> { ... }
  getBusinessById(id: string): Promise<Business> { ... }
  updateBusinessStatus(id: string, status: BusinessStatus): Promise<void> { ... }
  getBusinessSlips(businessId: string): Promise<Slip[]> { ... }
}

customer.service.ts
export const customerService = {
  getCustomers(): Promise<Customer[]> { ... }
  getCustomerById(id: string): Promise<Customer> { ... }
  updateCustomerProfile(id: string, data: CustomerUpdate): Promise<void> { ... }
}

partner.service.ts
partnership.service.ts
branch.service.ts
slip.service.ts

// Domain-based services
guest-recognition.service.ts
export const guestRecognitionService = {
  recognizeGuest(data: GuestData): Promise<Customer> { ... }
  linkGuestToCustomer(guestId: string, customerId: string): Promise<void> { ... }
}

partnership-operational-query.service.ts
export const partnershipOperationalQueryService = {
  getActivePartnerships(): Promise<Partnership[]> { ... }
  getPartnershipMetrics(id: string): Promise<Metrics> { ... }
}

business-analytics.service.ts
customer-segmentation.service.ts
loyalty-rewards.service.ts
```

#### ❌ Incorrect

```typescript
// Using deprecated terminology
restaurant.service.ts
restaurantService.ts

// Incorrect casing
BusinessService.ts
business_service.ts
BUSINESS.SERVICE.TS

// Missing .service suffix
business.ts
businesses.ts

// Ambiguous naming
data.service.ts
api.service.ts
utils.service.ts
```

### 3.4 Method Naming

```typescript
// ✅ Correct method names
getBusinesses()
getBusinessById(id: string)
createBusiness(data: BusinessCreate)
updateBusiness(id: string, data: BusinessUpdate)
deleteBusiness(id: string)
getBusinessSlips(businessId: string)
updateBusinessStatus(id: string, status: BusinessStatus)
searchBusinesses(query: string)
getBusinessMetrics(businessId: string, period: DateRange)

// ❌ Incorrect method names
getRestaurants()
fetchBusiness()
retrieveBusinessData()
businessUpdate()
updateRestaurantStatus()
```

---

## 4. Variable Naming

### 4.1 Pattern

```
[entity][Property]     // Single entity
[entity]s              // Collections
is[Condition]          // Booleans
has[Property]          // Booleans
can[Action]            // Booleans
```

### 4.2 Rules

- **camelCase** for all variables
- Use descriptive, self-documenting names
- Plural for arrays/collections
- Boolean prefixes: is, has, can, should, will

### 4.3 Examples

#### ✅ Correct

```typescript
// Single entities
const businessId: string = "biz_123";
const businessName: string = "Acme Corp";
const businessStatus: BusinessStatus = "ACTIVE";
const customerId: string = "cust_456";
const partnerId: string = "part_789";
const branchId: string = "branch_101";

// Collections
const businesses: Business[] = [];
const customers: Customer[] = [];
const partners: Partner[] = [];
const branches: Branch[] = [];
const slips: Slip[] = [];

// Counts and aggregates
const businessCount: number = 150;
const totalBusinesses: number = 150;
const activeBusinessCount: number = 120;
const customerCount: number = 5000;
const partnershipCount: number = 25;

// Booleans
const isActive: boolean = true;
const hasAccess: boolean = false;
const canEdit: boolean = true;
const shouldUpdate: boolean = false;
const willExpire: boolean = true;
const isBusinessOwner: boolean = true;
const hasCustomerProfile: boolean = false;
const canManagePartnership: boolean = true;

// Specific properties
const businessLogo: string = "logo.png";
const customerEmail: string = "user@example.com";
const partnershipStartDate: Date = new Date();
const branchLocation: Location = { lat: 0, lng: 0 };
const slipAmount: number = 150.50;

// Filtered/derived collections
const activeBusinesses: Business[] = [];
const suspendedBusinesses: Business[] = [];
const premiumCustomers: Customer[] = [];
const expiredPartnerships: Partnership[] = [];
```

#### ❌ Incorrect

```typescript
// Using deprecated terminology
const restaurantId: string = "rest_123";
const restaurantName: string = "Acme";
const totalRestaurants: number = 150;
const restaurantGrowth: number = 15;
const restaurantOps: any = {};

// Poor naming
const data: any = {};
const temp: string = "";
const x: number = 0;
const arr: any[] = [];
const obj: object = {};

// Incorrect pluralization
const business: Business[] = [];  // Should be businesses
const customer: Customer[] = [];  // Should be customers

// Incorrect boolean naming
const active: boolean = true;     // Should be isActive
const access: boolean = false;    // Should be hasAccess
const edit: boolean = true;       // Should be canEdit
```

### 4.4 Special Cases

```typescript
// React state
const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
const [businesses, setBusinesses] = useState<Business[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [hasError, setHasError] = useState(false);

// React refs
const businessFormRef = useRef<HTMLFormElement>(null);
const customerListRef = useRef<HTMLDivElement>(null);

// Event handlers
const handleBusinessSelect = (business: Business) => { ... };
const handleCustomerUpdate = (customer: Customer) => { ... };
const onBusinessCreate = () => { ... };
const onPartnershipDelete = () => { ... };

// Computed values
const filteredBusinesses = useMemo(() => { ... }, [businesses, filter]);
const sortedCustomers = useMemo(() => { ... }, [customers, sortOrder]);
const businessMetrics = useMemo(() => { ... }, [business]);
```

---

## 5. API Route Naming

### 5.1 Pattern

```
/api/[version]/[domain]/[resource]
/api/[scope]/[resource]
```

### 5.2 Rules

- **kebab-case** for multi-word resources
- Use plural nouns for collections
- Use RESTful conventions
- Version when necessary (v1, v2)

### 5.3 Examples

#### ✅ Correct

```typescript
// Admin routes
/api/admin/businesses
/api/admin/businesses/:id
/api/admin/businesses/:id/branches
/api/admin/businesses/:id/slips
/api/admin/customers
/api/admin/customers/:id
/api/admin/partnerships
/api/admin/partnerships/:id

// Versioned routes
/api/v1/businesses
/api/v1/customers
/api/v1/partnerships
/api/v2/businesses  // New version

// Domain-specific routes
/api/analytics/business-metrics
/api/analytics/customer-insights
/api/analytics/partnership-performance

// Action routes (non-RESTful when needed)
/api/admin/businesses/:id/activate
/api/admin/businesses/:id/suspend
/api/admin/customers/:id/merge
/api/partnerships/:id/renew
```

#### ❌ Incorrect

```typescript
// Using deprecated terminology
/api/admin/restaurants
/api/admin/restaurants/:id

// Incorrect casing
/api/admin/Businesses
/api/admin/CUSTOMERS
/api/admin/business_list

// Singular when should be plural
/api/admin/business
/api/admin/customer

// Inconsistent patterns
/api/getBusinesses
/api/business/list
/api/fetchCustomers
```

### 5.4 Legacy Routes

```typescript
// Acceptable legacy routes with documentation
/admin/restaurants  // Redirects to /api/admin/businesses
// OR documented as deprecated with migration guide

// Route handler with redirect
export async function GET(request: Request) {
  // Redirect legacy route
  return NextResponse.redirect('/api/admin/businesses');
}
```

---

## 6. File Naming

### 6.1 Patterns by File Type

| File Type | Pattern | Example |
|-----------|---------|---------|
| Pages | kebab-case.tsx | businesses.tsx, partnership-director.tsx |
| Components | PascalCase.tsx | BusinessSupplier.tsx, CustomerCard.tsx |
| Services | kebab-case.service.ts | business.service.ts, customer.service.ts |
| Types | kebab-case.types.ts | business.types.ts, customer.types.ts |
| Utils | kebab-case.ts | date-utils.ts, format-utils.ts |
| Hooks | use-[name].ts | use-business.ts, use-customer.ts |
| Constants | kebab-case.constants.ts | business.constants.ts, api.constants.ts |
| Tests | [name].test.ts | business.service.test.ts, BusinessCard.test.tsx |

### 6.2 Examples

#### ✅ Correct

```
// Pages (Next.js app directory)
app/
  admin/
    businesses/
      page.tsx
      [id]/
        page.tsx
    customers/
      page.tsx
    partnership-director/
      page.tsx

// Components
components/
  business/
    BusinessCard.tsx
    BusinessList.tsx
    BusinessMetrics.tsx
  customer/
    CustomerProfile.tsx
    CustomerSegmentation.tsx
  partner/
    PartnerPerformance.tsx
    PartnershipDetails.tsx

// Services
services/
  business.service.ts
  customer.service.ts
  partnership.service.ts
  guest-recognition.service.ts
  business-analytics.service.ts

// Types
types/
  business.types.ts
  customer.types.ts
  partnership.types.ts
  common.types.ts

// Hooks
hooks/
  use-business.ts
  use-customer.ts
  use-partnership.ts
  use-auth.ts

// Utils
utils/
  date-utils.ts
  format-utils.ts
  validation-utils.ts
  business-utils.ts

// Constants
constants/
  business.constants.ts
  customer.constants.ts
  api.constants.ts
  routes.constants.ts
```

#### ❌ Incorrect

```
// Incorrect casing
app/admin/Businesses/page.tsx
components/business/businessCard.tsx
services/BusinessService.ts

// Using deprecated terminology
app/admin/restaurants/page.tsx
components/restaurant/RestaurantCard.tsx
services/restaurant.service.ts

// Inconsistent patterns
components/BusinessCard.component.tsx
services/business-service.ts
types/BusinessTypes.ts
```

---

## 7. Database Naming

### 7.1 Prisma Models

```prisma
// ✅ Correct
model Business {
  id          String   @id @default(cuid())
  name        String
  status      BusinessStatus
  branches    Branch[]
  partnerships Partnership[]
  
  @@map("Business")  // NOT "Restaurant"
}

model Branch {
  id          String   @id @default(cuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id])
  
  @@map("Branch")
}

model Customer {
  id          String   @id @default(cuid())
  email       String   @unique
  firstName   String
  lastName    String
  
  @@map("Customer")
}

model Partner {
  id          String   @id @default(cuid())
  name        String
  partnerships Partnership[]
  
  @@map("Partner")
}

model Partnership {
  id          String   @id @default(cuid())
  businessId  String
  partnerId   String
  business    Business @relation(fields: [businessId], references: [id])
  partner     Partner  @relation(fields: [partnerId], references: [id])
  
  @@map("Partnership")
}
```

### 7.2 Enums

```prisma
// ✅ Correct - SCREAMING_SNAKE_CASE
enum BusinessStatus {
  ACTIVE
  SUSPENDED
  TERMINATED
  PENDING
  
  @@map("BusinessStatus")
}

enum CustomerTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
  
  @@map("CustomerTier")
}

enum PartnershipStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING
  
  @@map("PartnershipStatus")
}
```

### 7.3 Fields

```prisma
// ✅ Correct - camelCase
model Business {
  id              String   @id @default(cuid())
  businessName    String   @map("business_name")
  businessType    String   @map("business_type")
  contactEmail    String   @map("contact_email")
  phoneNumber     String   @map("phone_number")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
}
```

### 7.4 Anti-patterns

```prisma
// ❌ Incorrect
model Restaurant {  // Should be Business
  id          String   @id
  @@map("Restaurant")
}

model Business {
  restaurant_name String  // Should be businessName
  RestaurantType  String  // Should be businessType
  CONTACT_EMAIL   String  // Should be contactEmail
}

enum BusinessStatus {
  active      // Should be ACTIVE
  Suspended   // Should be SUSPENDED
  terminated  // Should be TERMINATED
}
```

---

## 8. Icon Key Naming

### 8.1 Pattern

```
[entity]_[milestone]
[entity]_[descriptor]
```

### 8.2 Rules

- **snake_case** for icon keys
- Use entity name first
- Use descriptive milestone/descriptor
- Consistent with entity terminology

### 8.3 Examples

#### ✅ Correct

```typescript
// Business milestones
const ICON_KEYS = {
  first_business: "first_business",
  ten_businesses: "ten_businesses",
  fifty_businesses: "fifty_businesses",
  hundred_businesses: "hundred_businesses",
  
  // Customer milestones
  first_customer: "first_customer",
  hundred_customers: "hundred_customers",
  thousand_customers: "thousand_customers",
  
  // Partnership milestones
  first_partnership: "first_partnership",
  ten_partnerships: "ten_partnerships",
  
  // Revenue milestones
  first_revenue: "first_revenue",
  million_revenue: "million_revenue",
  
  // Achievement icons
  business_growth: "business_growth",
  customer_satisfaction: "customer_satisfaction",
  partnership_excellence: "partnership_excellence",
};
```

#### ❌ Incorrect

```typescript
// Using deprecated terminology
const ICON_KEYS = {
  first_restaurant: "first_restaurant",
  ten_restaurants: "ten_restaurants",
  hundred_restaurants: "hundred_restaurants",
};

// Incorrect casing
const ICON_KEYS = {
  firstBusiness: "firstBusiness",
  TenBusinesses: "TenBusinesses",
  HUNDRED_BUSINESSES: "HUNDRED_BUSINESSES",
};

// Ambiguous naming
const ICON_KEYS = {
  first: "first",
  ten: "ten",
  milestone_1: "milestone_1",
};
```

---

## 9. CSS Class Naming

### 9.1 Pattern

```
[entity]-[property]
[component]-[element]
[state]-[modifier]
```

### 9.2 Rules

- **kebab-case** for all CSS classes
- Use BEM-like structure when appropriate
- Entity-first for domain classes
- Component-first for UI classes

### 9.3 Examples

#### ✅ Correct

```css
/* Entity-based classes */
.business-name { }
.business-logo { }
.business-card { }
.business-list { }
.business-metrics { }

.customer-avatar { }
.customer-name { }
.customer-profile { }
.customer-tier { }

.partner-logo { }
.partner-name { }
.partnership-status { }

/* Component-based classes (BEM) */
.business-card { }
.business-card__header { }
.business-card__body { }
.business-card__footer { }
.business-card--active { }
.business-card--suspended { }

.customer-list { }
.customer-list__item { }
.customer-list__item--selected { }

/* State classes */
.is-active { }
.is-loading { }
.is-selected { }
.has-error { }
.is-disabled { }

/* Utility classes */
.text-business-primary { }
.bg-customer-tier-gold { }
.border-partnership-active { }
```

#### ❌ Incorrect

```css
/* Using deprecated terminology */
.restaurant-name { }
.restaurant-logo { }
.restaurant-card { }

/* Incorrect casing */
.businessName { }
.Business_Logo { }
.BUSINESS-CARD { }

/* Ambiguous naming */
.name { }
.logo { }
.card { }
.item { }
```

### 9.4 Tailwind CSS Classes

```typescript
// ✅ Correct - using semantic naming in components
<div className="business-card rounded-lg shadow-md">
  <h2 className="business-name text-xl font-bold">{businessName}</h2>
  <img className="business-logo w-16 h-16" src={businessLogo} />
</div>

// ✅ Correct - direct Tailwind usage
<div className="rounded-lg shadow-md p-4 bg-white">
  <h2 className="text-xl font-bold text-gray-900">{businessName}</h2>
  <img className="w-16 h-16 rounded-full" src={businessLogo} />
</div>

// ❌ Incorrect
<div className="restaurant-card rounded-lg shadow-md">
  <h2 className="restaurantName text-xl font-bold">{restaurantName}</h2>
</div>
```

---

## 10. TypeScript Types and Interfaces

### 10.1 Pattern

```
[Entity]
[Entity][Purpose]
I[Entity]  // Interface (optional)
```

### 10.2 Rules

- **PascalCase** for types and interfaces
- Use singular form for entity types
- Descriptive suffixes for specific purposes
- Optional `I` prefix for interfaces (team preference)

### 10.3 Examples

#### ✅ Correct

```typescript
// Base entity types
type Business = {
  id: string;
  name: string;
  status: BusinessStatus;
};

type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type Partner = {
  id: string;
  name: string;
};

// Purpose-specific types
type BusinessCreate = Omit<Business, 'id'>;
type BusinessUpdate = Partial<Business>;
type BusinessWithBranches = Business & {
  branches: Branch[];
};

type CustomerProfile = Customer & {
  tier: CustomerTier;
  points: number;
};

type PartnershipMetrics = {
  partnershipId: string;
  revenue: number;
  customerCount: number;
};

// Enums
enum BusinessStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

enum CustomerTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

// Props types
type BusinessCardProps = {
  business: Business;
  onSelect?: (business: Business) => void;
};

type CustomerListProps = {
  customers: Customer[];
  isLoading?: boolean;
};

// API response types
type BusinessListResponse = {
  businesses: Business[];
  total: number;
  page: number;
};

type CustomerResponse = {
  customer: Customer;
  metadata: ResponseMetadata;
};
```

#### ❌ Incorrect

```typescript
// Using deprecated terminology
type Restaurant = {
  id: string;
  name: string;
};

type RestaurantCreate = Omit<Restaurant, 'id'>;

// Incorrect casing
type business = { };
type CUSTOMER = { };
type customer_profile = { };

// Ambiguous naming
type Data = { };
type Response = { };
type Props = { };
```

---

## 11. Environment Variables

### 11.1 Pattern

```
[SCOPE]_[ENTITY]_[PURPOSE]
[SERVICE]_[CONFIG]
```

### 11.2 Rules

- **SCREAMING_SNAKE_CASE** for all environment variables
- Group by scope or service
- Use descriptive names

### 11.3 Examples

#### ✅ Correct

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_BUSINESS_TABLE=Business
DATABASE_CUSTOMER_TABLE=Customer

# API Keys
STRIPE_API_KEY=sk_...
SENDGRID_API_KEY=SG...
GOOGLE_MAPS_API_KEY=AIza...

# Feature Flags
FEATURE_BUSINESS_ANALYTICS=true
FEATURE_CUSTOMER_SEGMENTATION=true
FEATURE_PARTNERSHIP_DIRECTOR=false

# Business Logic
MAX_BUSINESSES_PER_PARTNER=100
DEFAULT_CUSTOMER_TIER=BRONZE
PARTNERSHIP_RENEWAL_DAYS=30

# URLs
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_BUSINESS_PORTAL_URL=https://business.example.com
NEXT_PUBLIC_CUSTOMER_APP_URL=https://app.example.com
```

#### ❌ Incorrect

```bash
# Using deprecated terminology
DATABASE_RESTAURANT_TABLE=Restaurant
MAX_RESTAURANTS_PER_PARTNER=100
FEATURE_RESTAURANT_ANALYTICS=true

# Incorrect casing
database_url=postgresql://...
stripe_api_key=sk_...
featureBusinessAnalytics=true
```

---

## 12. Git Branch Naming

### 12.1 Pattern

```
[type]/[entity]-[description]
[type]/[ticket]-[description]
```

### 12.2 Rules

- **kebab-case** for branch names
- Use type prefix (feature, fix, refactor, etc.)
- Include entity or ticket reference
- Keep descriptions concise

### 12.3 Examples

#### ✅ Correct

```bash
# Feature branches
feature/business-analytics-dashboard
feature/customer-segmentation
feature/partnership-director
feature/DGS-001-naming-standard

# Bug fix branches
fix/business-status-update
fix/customer-profile-validation
fix/partnership-metrics-calculation

# Refactor branches
refactor/restaurant-to-business
refactor/business-service-cleanup
refactor/customer-types-consolidation

# Hotfix branches
hotfix/business-creation-error
hotfix/customer-login-issue
```

#### ❌ Incorrect

```bash
# Using deprecated terminology
feature/restaurant-analytics
fix/restaurant-status

# Incorrect casing
feature/BusinessAnalytics
feature/CUSTOMER_SEGMENTATION
feature/customer_Profile

# Ambiguous naming
feature/new-feature
fix/bug-fix
refactor/cleanup
```

---

## 13. Code Review Checklist

### 13.1 Component Review

- [ ] Component file uses PascalCase
- [ ] Component name matches file name
- [ ] No "restaurant" terminology in component name
- [ ] Props type follows naming convention
- [ ] Event handlers use handle/on prefix

### 13.2 Service Review

- [ ] Service file uses kebab-case with .service.ts suffix
- [ ] Service methods use camelCase
- [ ] Method names are descriptive (get, create, update, delete)
- [ ] No "restaurant" terminology in service or methods
- [ ] Return types are properly typed

### 13.3 Variable Review

- [ ] Variables use camelCase
- [ ] Collections use plural form
- [ ] Booleans use is/has/can prefix
- [ ] No "restaurant" terminology in variable names
- [ ] No single-letter or ambiguous names

### 13.4 API Route Review

- [ ] Routes use kebab-case
- [ ] Collections use plural nouns
- [ ] No "restaurant" in route paths
- [ ] RESTful conventions followed
- [ ] Versioning applied when needed

### 13.5 Database Review

- [ ] Models use PascalCase
- [ ] Fields use camelCase
- [ ] Enums use SCREAMING_SNAKE_CASE
- [ ] Table mapping uses correct entity name
- [ ] No "restaurant" in model or field names

### 13.6 CSS Review

- [ ] Classes use kebab-case
- [ ] Entity-based classes use correct entity name
- [ ] No "restaurant" in class names
- [ ] BEM structure followed for components
- [ ] State classes use is/has prefix

---

## 14. Enforcement Mechanisms

### 14.1 ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Enforce naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
      },
      {
        selector: 'function',
        format: ['camelCase'],
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],
    
    // Custom rule to prevent "restaurant" usage
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Identifier[name=/restaurant/i]',
        message: 'Use "business" terminology instead of "restaurant"',
      },
    ],
  },
};
```

### 14.2 Pre-commit Hooks

```bash
#!/bin/bash
# .husky/pre-commit

# Check for "restaurant" terminology in staged files
if git diff --cached --name-only | xargs grep -i "restaurant" 2>/dev/null; then
  echo "Error: Found 'restaurant' terminology. Use 'business' instead."
  echo "Run: npm run check:terminology"
  exit 1
fi

# Check file naming conventions
if git diff --cached --name-only | grep -E "[A-Z].*\.service\.ts$" 2>/dev/null; then
  echo "Error: Service files must use kebab-case"
  exit 1
fi
```

### 14.3 CI/CD Checks

```yaml
# .github/workflows/naming-check.yml
name: Naming Convention Check

on: [pull_request]

jobs:
  check-naming:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Check for restaurant terminology
        run: |
          if grep -r -i "restaurant" --include="*.ts" --include="*.tsx" .; then
            echo "Found 'restaurant' terminology. Use 'business' instead."
            exit 1
          fi
      
      - name: Check file naming
        run: |
          # Check service files use kebab-case
          find . -name "*.service.ts" | grep -E "[A-Z]" && exit 1 || exit 0
          
          # Check component files use PascalCase
          find ./components -name "*.tsx" | grep -v -E "^[A-Z]" && exit 1 || exit 0
```

### 14.4 Code Generation Templates

```typescript
// scripts/generate-component.ts
import { pascalCase } from 'change-case';

function generateComponent(name: string) {
  // Validate name doesn't contain "restaurant"
  if (name.toLowerCase().includes('restaurant')) {
    throw new Error('Use "business" terminology instead of "restaurant"');
  }
  
  const componentName = pascalCase(name);
  const fileName = `${componentName}.tsx`;
  
  const template = `
import React from 'react';

type ${componentName}Props = {
  // Props here
};

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className="${name.toLowerCase()}">
      {/* Component content */}
    </div>
  );
};
`;
  
  // Write file...
}
```

---

## 15. Migration Guide

### 15.1 Automated Refactoring

```bash
# Find all instances of "restaurant" terminology
npm run find:restaurant

# Automated replacement (with manual review)
npm run refactor:restaurant-to-business

# Verify changes
npm run test
npm run type-check
```

### 15.2 Manual Migration Steps

1. **Identify** all files containing "restaurant" terminology
2. **Plan** the refactoring (components, services, variables, etc.)
3. **Update** code following this naming standard
4. **Test** thoroughly after each change
5. **Document** any legacy routes or backwards compatibility
6. **Review** with team before merging

### 15.3 Backwards Compatibility

```typescript
// Maintain backwards compatibility during transition
export const businessService = {
  getBusinesses: async () => { ... },
  
  // Deprecated: Use getBusinesses() instead
  /** @deprecated Use getBusinesses() instead */
  getRestaurants: async () => {
    console.warn('getRestaurants() is deprecated. Use getBusinesses() instead.');
    return businessService.getBusinesses();
  },
};
```

---

## 16. Examples by Domain

### 16.1 Business Domain

```typescript
// Component
BusinessSupplier.tsx
export const BusinessSupplier: React.FC<BusinessSupplierProps> = ({ business }) => {
  const [isActive, setIsActive] = useState(business.isActive);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  
  const handleBusinessUpdate = async (businessId: string) => {
    await businessService.updateBusiness(businessId, { isActive });
  };
  
  return (
    <div className="business-supplier">
      <h2 className="business-name">{business.name}</h2>
      <div className="business-metrics">
        <span>Total Businesses: {businesses.length}</span>
      </div>
    </div>
  );
};

// Service
business.service.ts
export const businessService = {
  async getBusinesses(): Promise<Business[]> {
    const response = await fetch('/api/admin/businesses');
    return response.json();
  },
  
  async updateBusinessStatus(businessId: string, status: BusinessStatus) {
    await fetch(`/api/admin/businesses/${businessId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Types
business.types.ts
export type Business = {
  id: string;
  name: string;
  status: BusinessStatus;
  branches: Branch[];
};

export enum BusinessStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}
```

### 16.2 Customer Domain

```typescript
// Component
CustomerHealthCenter.tsx
export const CustomerHealthCenter: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };
  
  return (
    <div className="customer-health-center">
      <CustomerList 
        customers={customers}
        onSelect={handleCustomerSelect}
      />
    </div>
  );
};

// Service
customer.service.ts
export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const response = await fetch('/api/admin/customers');
    return response.json();
  },
  
  async getCustomerById(customerId: string): Promise<Customer> {
    const response = await fetch(`/api/admin/customers/${customerId}`);
    return response.json();
  },
};
```

### 16.3 Partnership Domain

```typescript
// Component
PartnerPerformance.tsx
export const PartnerPerformance: React.FC<PartnerPerformanceProps> = ({ partnerId }) => {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [partnershipMetrics, setPartnershipMetrics] = useState<PartnershipMetrics | null>(null);
  
  const handlePartnershipRenew = async (partnershipId: string) => {
    await partnershipService.renewPartnership(partnershipId);
  };
  
  return (
    <div className="partner-performance">
      <h2 className="partner-name">Partner Performance</h2>
      <div className="partnership-metrics">
        {/* Metrics display */}
      </div>
    </div>
  );
};

// Service
partnership.service.ts
export const partnershipService = {
  async getPartnerships(): Promise<Partnership[]> {
    const response = await fetch('/api/admin/partnerships');
    return response.json();
  },
  
  async renewPartnership(partnershipId: string): Promise<void> {
    await fetch(`/api/admin/partnerships/${partnershipId}/renew`, {
      method: 'POST',
    });
  },
};
```

---

## 17. Quick Reference

### 17.1 Naming Patterns Summary

| Element | Pattern | Example |
|---------|---------|---------|
| Component File | PascalCase.tsx | BusinessSupplier.tsx |
| Service File | kebab-case.service.ts | business.service.ts |
| Page File | kebab-case.tsx | partnership-director.tsx |
| Type File | kebab-case.types.ts | business.types.ts |
| Variable | camelCase | businessId, businesses |
| Function | camelCase | getBusinesses() |
| Type/Interface | PascalCase | Business, BusinessCreate |
| Enum | PascalCase | BusinessStatus |
| Enum Value | SCREAMING_SNAKE_CASE | ACTIVE, SUSPENDED |
| CSS Class | kebab-case | business-name, customer-avatar |
| API Route | /kebab-case | /api/admin/businesses |
| Environment Var | SCREAMING_SNAKE_CASE | DATABASE_BUSINESS_TABLE |
| Icon Key | snake_case | first_business, ten_businesses |
| Git Branch | type/kebab-case | feature/business-analytics |

### 17.2 Entity Terminology

| ✅ Use | ❌ Avoid |
|--------|----------|
| business | restaurant |
| businesses | restaurants |
| businessId | restaurantId |
| Business | Restaurant |
| customer | guest (in code) |
| partner | vendor |
| partnership | partnership |
| branch | location (when referring to business branch) |

---

## 18. Exceptions and Special Cases

### 18.1 Acceptable Exceptions

1. **Legacy Database Tables**: If migrating existing tables is too risky, document the mapping clearly
2. **Third-party APIs**: When integrating with external systems that use different terminology
3. **User-facing Text**: UI text can use "restaurant" if it's customer-facing and contextually appropriate
4. **Historical Data**: Archive/backup systems may retain old naming

### 18.2 Documentation Requirements

When exceptions are made, document:
- Why the exception exists
- What the correct terminology should be
- Migration plan (if applicable)
- Date of exception approval

```typescript
// Example: Legacy API integration
/**
 * EXCEPTION: This service integrates with a third-party API that uses
 * "restaurant" terminology. Internal mapping to "business" is done.
 * 
 * @see DGS-001 Section 18.1
 * Approved: 2024-01-15
 */
export const legacyRestaurantApiService = {
  async fetchRestaurants(): Promise<Business[]> {
    const restaurants = await externalApi.getRestaurants();
    return restaurants.map(mapRestaurantToBusiness);
  },
};
```

---

## 19. Glossary

| Term | Definition | Example |
|------|------------|---------|
| Business | A registered entity on the platform (restaurant, cafe, etc.) | Acme Restaurant Corp |
| Branch | A physical location of a business | Downtown Branch |
| Customer | An end-user who visits businesses | John Doe |
| Partner | An organization partnering with businesses | Loyalty Program Inc |
| Partnership | A relationship between a business and partner | Acme ↔ Loyalty Program |
| Slip | A transaction record | Purchase receipt |
| Guest | An unregistered customer (UI only) | Anonymous visitor |

---

## 20. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024 | Initial naming standard document | Development Team |

---

## 21. Related Documents

- **DGS-002**: Terminology Standard
- **DGS-003**: Code Review Guidelines
- **DGS-004**: API Design Guidelines
- **DGS-005**: Database Schema Guidelines

---

## 22. Approval

This standard has been reviewed and approved by:

- [ ] Technical Lead
- [ ] Product Owner
- [ ] Development Team
- [ ] QA Team

---

**Document End**
