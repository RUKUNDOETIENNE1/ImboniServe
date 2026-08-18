# DGS-001: Terminology Standard

**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2024  
**Owner:** Platform Architecture Team

---

## 1. Purpose

This document establishes the authoritative terminology standard for the ImboniResto platform. All code, documentation, UI text, and communications MUST adhere to these definitions to ensure consistency, clarity, and scalability across the multi-vertical hospitality platform.

---

## 2. Core Entity Terminology

### 2.1 Business / Hospitality Business

**Definition:** The primary entity representing any hospitality establishment on the platform.

- **Database Entity:** `Business`
- **Primary Key:** `businessId`
- **Scope:** Encompasses restaurants, cafes, bars, hotels, spas, event venues, and all other hospitality verticals

**When to Use:**
- ✅ Internal admin interfaces and dashboards
- ✅ Developer documentation and code comments
- ✅ Database schemas, API endpoints, and backend logic
- ✅ Analytics and reporting contexts

**Context-Specific Usage:**
- **"Business"** - Use in technical/internal contexts
- **"Hospitality Business"** - Use in public-facing, marketing, and customer-facing content

**Examples:**
```typescript
// ✅ CORRECT
interface Business {
  businessId: string;
  businessName: string;
  businessType: BusinessType;
}

function getBusinessById(businessId: string): Business {}
const activeBusiness = await businessService.findActive();

// ❌ INCORRECT
interface Restaurant {
  restaurantId: string;
}
function getRestaurantById(id: string) {}
```

---

### 2.2 Branch

**Definition:** A physical location or geographical instance of a Business.

- **Database Entity:** `Branch`
- **Primary Key:** `branchId`
- **Relationship:** Many Branches belong to one Business
- **Scope:** Physical address, operating hours, location-specific staff

**When to Use:**
- ✅ Multi-location business management
- ✅ Location-based analytics and reporting
- ✅ Delivery zone configuration
- ✅ Staff assignment and scheduling

**Examples:**
```typescript
// ✅ CORRECT
interface Branch {
  branchId: string;
  businessId: string;
  branchName: string;
  address: Address;
  operatingHours: OperatingHours;
}

const branches = await branchService.getByBusiness(businessId);
const mainBranch = business.branches.find(b => b.isMainBranch);

// ❌ INCORRECT
const locations = await getRestaurantLocations();
const store = business.stores[0];
```

---

### 2.3 Outlet

**Definition:** A service point within a Branch where transactions occur.

- **Database Entity:** `Outlet`
- **Primary Key:** `outletId`
- **Relationship:** Many Outlets belong to one Branch
- **Scope:** Service counters, bars, kiosks, room service stations

**When to Use:**
- ✅ Transaction and order processing
- ✅ POS system integration
- ✅ Service-point-specific reporting
- ✅ Staff station assignment

**Examples:**
```typescript
// ✅ CORRECT
interface Outlet {
  outletId: string;
  branchId: string;
  outletName: string;
  outletType: OutletType; // 'bar' | 'counter' | 'kiosk' | 'room_service'
}

const order = await createOrder({ outletId, customerId });
const barOutlet = branch.outlets.find(o => o.outletType === 'bar');

// ❌ INCORRECT
const counter = branch.counters[0];
const station = getServiceStation();
```

---

### 2.4 Customer

**Definition:** The database entity representing an end-consumer in the system.

- **Database Entity:** `Customer`
- **Primary Key:** `customerId`
- **Scope:** Raw data storage, authentication, transaction records

**When to Use:**
- ✅ Database schemas and migrations
- ✅ Authentication and authorization logic
- ✅ Transaction processing and order history
- ✅ Technical documentation and API contracts

**Examples:**
```typescript
// ✅ CORRECT - Technical/Database Context
interface Customer {
  customerId: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
}

const customer = await customerRepository.findById(customerId);
await customerService.updateProfile(customerId, profileData);

// ❌ INCORRECT - Using "guest" in database context
const guest = await guestRepository.findById(guestId); // Wrong layer
```

---

### 2.5 Guest

**Definition:** The intelligence layer wrapper around Customer, enriched with recognition, preferences, and hospitality experience data.

- **Conceptual Entity:** `Guest` (wraps `Customer`)
- **Scope:** Recognition, personalization, hospitality intelligence, experience optimization

**When to Use:**
- ✅ Guest recognition and identification features
- ✅ Preference management and personalization
- ✅ Hospitality experience and service quality contexts
- ✅ Marketing and customer-facing communications

**Examples:**
```typescript
// ✅ CORRECT - Intelligence/Experience Context
interface Guest {
  customerId: string; // References Customer entity
  recognitionProfile: RecognitionProfile;
  preferences: GuestPreferences;
  visitHistory: VisitSummary;
  loyaltyStatus: LoyaltyTier;
}

const guest = await guestIntelligence.recognize(customerId);
const recommendations = await guestService.getPersonalizedMenu(guest);

// UI Text Examples
"Welcome back, valued guest!"
"Guest Recognition System"
"Personalized Guest Experience"

// ❌ INCORRECT - Using "customer" in hospitality experience context
"Welcome back, customer!" // Too transactional
"Customer Recognition System" // Wrong layer
```

---

### 2.6 Partner / Founder Partner

**Definition:** An entity (individual or organization) that collaborates with or invests in the platform.

**Types:**
- **Partner:** General collaborator or stakeholder
- **Founder Partner:** Early-stage investor or strategic founding stakeholder

**When to Use:**
- ✅ Partnership management and onboarding
- ✅ Investment tracking and equity management
- ✅ Strategic relationship documentation
- ✅ Founder/investor communications

**Examples:**
```typescript
// ✅ CORRECT
interface Partner {
  partnerId: string;
  partnerType: 'founder' | 'strategic' | 'technology' | 'financial';
  partnerName: string;
  relationshipStartDate: Date;
}

const founderPartners = await partnerService.getByType('founder');
const partnerAgreement = await getPartnerAgreement(partnerId);

// ❌ INCORRECT
const investor = await getInvestor(id); // Too specific
const stakeholder = await getStakeholder(id); // Too vague
```

---

### 2.7 Campaign

**Definition:** A marketing or promotional initiative with defined goals, duration, and target audience.

- **Database Entity:** `Campaign`
- **Primary Key:** `campaignId`
- **Scope:** Promotional activities, discount programs, loyalty initiatives

**When to Use:**
- ✅ Marketing automation and promotion management
- ✅ Discount and offer configuration
- ✅ Campaign performance tracking
- ✅ Multi-business promotional programs

**Examples:**
```typescript
// ✅ CORRECT
interface Campaign {
  campaignId: string;
  campaignName: string;
  campaignType: CampaignType;
  startDate: Date;
  endDate: Date;
  targetAudience: AudienceSegment;
}

const activeCampaigns = await campaignService.getActive();
await campaignService.trackConversion(campaignId, customerId);

// ❌ INCORRECT
const promotion = await getPromotion(id); // Use Campaign
const offer = await getOffer(id); // Use Campaign or Code
```

---

### 2.8 Code

**Definition:** A redeemable promotional or discount code associated with a Campaign.

- **Database Entity:** `Code`
- **Primary Key:** `codeId`
- **Relationship:** Many Codes belong to one Campaign
- **Scope:** Discount codes, vouchers, promotional tokens

**When to Use:**
- ✅ Discount application at checkout
- ✅ Voucher redemption tracking
- ✅ Code generation and distribution
- ✅ Usage analytics and fraud prevention

**Examples:**
```typescript
// ✅ CORRECT
interface Code {
  codeId: string;
  campaignId: string;
  codeValue: string; // "SUMMER2024"
  discountType: DiscountType;
  discountAmount: number;
  usageLimit: number;
  usageCount: number;
}

const code = await codeService.validateCode(codeValue);
await codeService.redeemCode(codeId, customerId, orderId);

// ❌ INCORRECT
const coupon = await getCoupon(value); // Use Code
const voucher = await getVoucher(id); // Use Code
```

---

### 2.9 Agreement

**Definition:** A formal contract or terms document between the platform and a Business or Partner.

- **Database Entity:** `Agreement`
- **Primary Key:** `agreementId`
- **Scope:** Service terms, commission structures, SLAs, partnership contracts

**When to Use:**
- ✅ Business onboarding and contract management
- ✅ Commission and fee structure definition
- ✅ Legal compliance and terms tracking
- ✅ Partnership contract management

**Examples:**
```typescript
// ✅ CORRECT
interface Agreement {
  agreementId: string;
  entityId: string; // businessId or partnerId
  entityType: 'business' | 'partner';
  agreementType: AgreementType;
  commissionRate: number;
  startDate: Date;
  endDate?: Date;
  status: AgreementStatus;
}

const agreement = await agreementService.getActiveByBusiness(businessId);
await agreementService.renewAgreement(agreementId, newTerms);

// ❌ INCORRECT
const contract = await getContract(id); // Use Agreement
const terms = await getTerms(businessId); // Use Agreement
```

---

## 3. Context-Specific Usage Rules

### 3.1 Internal vs. External Contexts

| Context | Use "Business" | Use "Hospitality Business" | Use "Restaurant" |
|---------|----------------|----------------------------|------------------|
| Admin Dashboard | ✅ Primary | ⚠️ Optional | ❌ Avoid |
| Public Website | ❌ Avoid | ✅ Primary | ⚠️ Only for restaurant-specific features |
| API Documentation | ✅ Primary | ❌ Avoid | ❌ Avoid |
| Marketing Materials | ❌ Avoid | ✅ Primary | ⚠️ Only for restaurant-specific content |
| Database Schema | ✅ Primary | ❌ Avoid | ❌ Avoid |
| User-Facing UI | ⚠️ Optional | ✅ Primary | ⚠️ Only for restaurant-specific features |

### 3.2 Customer vs. Guest Usage Matrix

| Context | Use "Customer" | Use "Guest" |
|---------|----------------|-------------|
| Database Tables | ✅ Required | ❌ Never |
| API Endpoints | ✅ Primary | ⚠️ Intelligence endpoints only |
| Authentication | ✅ Required | ❌ Never |
| Order Processing | ✅ Required | ❌ Never |
| Recognition Features | ❌ Never | ✅ Required |
| Personalization | ❌ Avoid | ✅ Primary |
| Marketing Copy | ❌ Avoid | ✅ Primary |
| Hospitality Experience | ❌ Avoid | ✅ Required |

---

## 4. Prohibited Terminology

### 4.1 Banned Terms in New Code

The following terms MUST NOT be used in new code, except where explicitly permitted:

| ❌ Prohibited Term | ✅ Use Instead | Notes |
|-------------------|----------------|-------|
| "restaurant" (generic) | "business" or "hospitality business" | Exception: When specifically referring to restaurant-only features OR as a `businessType` enum value |
| "eatery" | "business" or "hospitality business" | Never acceptable |
| "food establishment" | "business" or "hospitality business" | Never acceptable |
| "dining establishment" | "business" or "hospitality business" | Never acceptable |
| "venue" (generic) | "business" or "branch" | Exception: Event-specific contexts |
| "location" (generic) | "branch" | Exception: Geographical/mapping contexts |
| "store" | "branch" | Never acceptable |
| "shop" | "branch" or "business" | Never acceptable |
| "outlet" (for branch) | "branch" | "Outlet" is reserved for service points |
| "counter" (generic) | "outlet" | Exception: UI-specific contexts (e.g., "checkout counter") |
| "customer" (hospitality experience) | "guest" | Exception: Database/technical contexts |
| "user" (for end-consumer) | "customer" or "guest" | "User" reserved for platform users (admin, staff) |
| "client" | "customer" or "guest" | Never acceptable for end-consumers |
| "patron" | "guest" | Never acceptable |
| "diner" | "guest" | Never acceptable |
| "coupon" | "code" | Never acceptable |
| "voucher" | "code" | Never acceptable |
| "promo" | "campaign" or "code" | Never acceptable as standalone term |
| "deal" | "campaign" | Never acceptable |
| "contract" | "agreement" | Never acceptable |

### 4.2 Legacy Exceptions

The following legacy terms are acceptable in existing code but MUST be refactored when touched:

- `/admin/restaurants` URL paths (acceptable until API versioning allows migration)
- `restaurant_id` in legacy database columns (acceptable until schema migration)
- "Restaurant" in legacy component names (acceptable until component refactor)

**Migration Rule:** When refactoring any file containing legacy terminology, update ALL instances in that file to current standards.

---

## 5. Approved Terminology Patterns

### 5.1 Variable Naming

```typescript
// ✅ CORRECT
const businessId: string;
const businessName: string;
const businessCount: number;
const businessType: BusinessType;
const businessStatus: BusinessStatus;
const activeBusiness: Business;
const businessList: Business[];
const businessMetrics: BusinessMetrics;

const branchId: string;
const branchName: string;
const mainBranch: Branch;
const branchCount: number;

const outletId: string;
const outletType: OutletType;
const activeOutlet: Outlet;

const customerId: string;
const customerEmail: string;
const customerProfile: Customer;

const guestPreferences: GuestPreferences;
const guestRecognition: RecognitionProfile;
const recognizedGuest: Guest;

// ❌ INCORRECT
const restaurantId: string; // Use businessId
const restaurantName: string; // Use businessName
const locationId: string; // Use branchId
const storeId: string; // Use branchId
const counterId: string; // Use outletId
const userId: string; // Use customerId (for end-consumers)
const clientId: string; // Use customerId
const patronId: string; // Use customerId
```

### 5.2 Function and Method Naming

```typescript
// ✅ CORRECT - Business
function getBusiness(id: string): Promise<Business>;
function updateBusinessStatus(id: string, status: BusinessStatus): Promise<void>;
function getBusinessSlips(businessId: string): Promise<Slip[]>;
function createBusiness(data: CreateBusinessDto): Promise<Business>;
function listBusinesses(filters: BusinessFilters): Promise<Business[]>;
function getBusinessMetrics(businessId: string): Promise<BusinessMetrics>;

// ✅ CORRECT - Branch
function getBranchById(id: string): Promise<Branch>;
function getBranchesByBusiness(businessId: string): Promise<Branch[]>;
function updateBranchHours(branchId: string, hours: OperatingHours): Promise<void>;

// ✅ CORRECT - Outlet
function getOutletById(id: string): Promise<Outlet>;
function getOutletsByBranch(branchId: string): Promise<Outlet[]>;
function assignStaffToOutlet(outletId: string, staffId: string): Promise<void>;

// ✅ CORRECT - Customer
function getCustomerById(id: string): Promise<Customer>;
function updateCustomerProfile(id: string, data: ProfileData): Promise<void>;
function authenticateCustomer(credentials: Credentials): Promise<AuthToken>;

// ✅ CORRECT - Guest
function recognizeGuest(customerId: string): Promise<Guest>;
function getGuestPreferences(customerId: string): Promise<GuestPreferences>;
function updateGuestPreferences(customerId: string, prefs: GuestPreferences): Promise<void>;
function getPersonalizedRecommendations(guest: Guest): Promise<Recommendation[]>;

// ❌ INCORRECT
function getRestaurant(id: string); // Use getBusiness
function updateRestaurantStatus(id: string, status: string); // Use updateBusinessStatus
function getLocation(id: string); // Use getBranch
function getStore(id: string); // Use getBranch
function getCounter(id: string); // Use getOutlet
function getUser(id: string); // Use getCustomer (for end-consumers)
function recognizeCustomer(id: string); // Use recognizeGuest
```

### 5.3 Class and Component Naming

```typescript
// ✅ CORRECT - Services
class BusinessService {}
class BusinessRepository {}
class BusinessController {}
class BranchService {}
class OutletService {}
class CustomerService {}
class GuestIntelligenceService {}
class GuestRecognitionService {}

// ✅ CORRECT - React Components
const BusinessList: React.FC = () => {};
const BusinessCard: React.FC<{ business: Business }> = () => {};
const BusinessDashboard: React.FC = () => {};
const BranchSelector: React.FC = () => {};
const OutletManager: React.FC = () => {};
const GuestProfile: React.FC<{ guest: Guest }> = () => {};
const GuestRecognitionPanel: React.FC = () => {};

// ✅ CORRECT - Domain Models
class Business {}
class Branch {}
class Outlet {}
class Customer {}
class Guest {} // Intelligence layer wrapper

// ❌ INCORRECT
class RestaurantService {} // Use BusinessService
class RestaurantRepository {} // Use BusinessRepository
class LocationService {} // Use BranchService
class StoreService {} // Use BranchService
class CounterService {} // Use OutletService
class UserService {} // Use CustomerService (for end-consumers)
class CustomerRecognitionService {} // Use GuestRecognitionService

const RestaurantList: React.FC = () => {}; // Use BusinessList
const LocationCard: React.FC = () => {}; // Use BranchCard
const CustomerProfile: React.FC = () => {}; // Use GuestProfile (for hospitality experience)
```

### 5.4 URL and Route Patterns

```typescript
// ✅ CORRECT - New Routes
'/admin/businesses'
'/admin/businesses/:businessId'
'/admin/businesses/:businessId/branches'
'/admin/businesses/:businessId/branches/:branchId/outlets'
'/api/v2/businesses'
'/api/v2/businesses/:businessId/metrics'
'/api/v2/customers/:customerId'
'/api/v2/guests/:customerId/recognition'
'/api/v2/guests/:customerId/preferences'

// ⚠️ ACCEPTABLE - Legacy Routes (until migration)
'/admin/restaurants' // Acceptable until API v2 migration
'/api/v1/restaurants' // Acceptable until API v2 migration

// ❌ INCORRECT - New Routes
'/admin/restaurants' // Use /admin/businesses in new code
'/admin/locations' // Use /admin/branches
'/admin/stores' // Use /admin/branches
'/api/v2/restaurants' // Use /api/v2/businesses
'/api/v2/users' // Use /api/v2/customers (for end-consumers)
```

### 5.5 Database Schema Naming

```sql
-- ✅ CORRECT
CREATE TABLE businesses (
  business_id UUID PRIMARY KEY,
  business_name VARCHAR(255),
  business_type VARCHAR(50),
  business_status VARCHAR(50)
);

CREATE TABLE branches (
  branch_id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(business_id),
  branch_name VARCHAR(255)
);

CREATE TABLE outlets (
  outlet_id UUID PRIMARY KEY,
  branch_id UUID REFERENCES branches(branch_id),
  outlet_name VARCHAR(255),
  outlet_type VARCHAR(50)
);

CREATE TABLE customers (
  customer_id UUID PRIMARY KEY,
  email VARCHAR(255),
  phone_number VARCHAR(50)
);

-- Guest is a conceptual layer, not a separate table
-- Guest data is stored in related tables:
CREATE TABLE guest_preferences (
  customer_id UUID REFERENCES customers(customer_id),
  preference_key VARCHAR(100),
  preference_value TEXT
);

CREATE TABLE guest_recognition_profiles (
  customer_id UUID REFERENCES customers(customer_id),
  recognition_data JSONB
);

-- ❌ INCORRECT
CREATE TABLE restaurants ( -- Use businesses
  restaurant_id UUID PRIMARY KEY
);

CREATE TABLE locations ( -- Use branches
  location_id UUID PRIMARY KEY
);

CREATE TABLE stores ( -- Use branches
  store_id UUID PRIMARY KEY
);

CREATE TABLE counters ( -- Use outlets
  counter_id UUID PRIMARY KEY
);

CREATE TABLE users ( -- Use customers for end-consumers
  user_id UUID PRIMARY KEY
);

CREATE TABLE guests ( -- Guest is not a separate entity
  guest_id UUID PRIMARY KEY
);
```

---

## 6. Special Cases and Domain-Specific Terms

### 6.1 Kitchen-Related Terminology

**When Acceptable:**
- ✅ Restaurant-specific features (e.g., "Kitchen Display System")
- ✅ Food service workflows (e.g., "kitchen orders", "kitchen status")
- ✅ Restaurant business type contexts

**When to Avoid:**
- ❌ Generic business operations (use "operations" or "fulfillment")
- ❌ Multi-vertical features (use "fulfillment center" or "preparation area")

**Examples:**
```typescript
// ✅ CORRECT - Restaurant-specific context
interface KitchenOrder {
  orderId: string;
  businessId: string; // Must be restaurant type
  kitchenStatus: KitchenStatus;
}

if (business.businessType === 'restaurant') {
  const kitchenOrders = await getKitchenOrders(businessId);
}

// ❌ INCORRECT - Generic context
const kitchenOrders = await getKitchenOrders(businessId); // What about spas, hotels?

// ✅ CORRECT - Multi-vertical alternative
const fulfillmentOrders = await getFulfillmentOrders(businessId);
const preparationStatus = await getPreparationStatus(orderId);
```

### 6.2 Menu-Related Terminology

**When Acceptable:**
- ✅ Food and beverage service contexts
- ✅ Restaurant, cafe, bar business types
- ✅ Service offering lists

**When to Avoid:**
- ❌ Non-F&B businesses (use "service catalog" or "offering list")

**Examples:**
```typescript
// ✅ CORRECT - F&B context
interface Menu {
  menuId: string;
  businessId: string;
  menuName: string;
  menuItems: MenuItem[];
}

if (['restaurant', 'cafe', 'bar'].includes(business.businessType)) {
  const menu = await getMenu(businessId);
}

// ✅ CORRECT - Multi-vertical alternative
interface ServiceCatalog {
  catalogId: string;
  businessId: string;
  catalogName: string;
  services: Service[];
}

const catalog = await getServiceCatalog(businessId); // Works for all business types
```

### 6.3 Table-Related Terminology

**When Acceptable:**
- ✅ Restaurant reservation systems
- ✅ Seating management features
- ✅ Dine-in service contexts

**When to Avoid:**
- ❌ Generic booking systems (use "booking" or "reservation")
- ❌ Multi-vertical scheduling (use "appointment" or "slot")

**Examples:**
```typescript
// ✅ CORRECT - Restaurant-specific
interface Table {
  tableId: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
}

if (business.businessType === 'restaurant') {
  const tables = await getTables(branchId);
}

// ✅ CORRECT - Multi-vertical alternative
interface Reservation {
  reservationId: string;
  branchId: string;
  resourceType: 'table' | 'room' | 'appointment_slot';
  resourceId: string;
}

const reservation = await createReservation({
  branchId,
  resourceType: 'table',
  resourceId: tableId
});
```

### 6.4 Waiter/Staff Terminology

**When Acceptable:**
- ✅ Restaurant-specific service roles
- ✅ F&B service contexts

**When to Avoid:**
- ❌ Generic staff management (use "staff" or "employee")
- ❌ Multi-vertical service roles (use "service provider" or "staff member")

**Examples:**
```typescript
// ✅ CORRECT - Restaurant-specific
interface Waiter {
  staffId: string;
  branchId: string;
  role: 'waiter';
  assignedTables: string[];
}

// ✅ CORRECT - Multi-vertical
interface Staff {
  staffId: string;
  branchId: string;
  role: StaffRole; // 'waiter' | 'therapist' | 'receptionist' | 'bartender'
  assignedResources: string[];
}

const staff = await getStaffByBranch(branchId);
const waiters = staff.filter(s => s.role === 'waiter');
```

### 6.5 Cuisine vs. Category vs. Service Type

**Cuisine:**
- ✅ Use for food-related categorization
- ✅ Restaurant, cafe business types
- Examples: "Italian", "Japanese", "Fusion"

**Category:**
- ✅ Use for broad business classification
- ✅ All business types
- Examples: "Food & Beverage", "Wellness", "Accommodation"

**Service Type:**
- ✅ Use for specific service offerings
- ✅ All business types
- Examples: "Dine-in", "Takeaway", "Spa Treatment", "Room Service"

**Examples:**
```typescript
// ✅ CORRECT
interface Business {
  businessId: string;
  businessType: BusinessType; // 'restaurant' | 'spa' | 'hotel' | 'cafe' | 'bar'
  category: Category; // 'food_beverage' | 'wellness' | 'accommodation'
  cuisine?: Cuisine; // Only for F&B businesses
  serviceTypes: ServiceType[]; // ['dine_in', 'takeaway', 'delivery']
}

// Restaurant example
const restaurant: Business = {
  businessType: 'restaurant',
  category: 'food_beverage',
  cuisine: 'italian',
  serviceTypes: ['dine_in', 'takeaway', 'delivery']
};

// Spa example
const spa: Business = {
  businessType: 'spa',
  category: 'wellness',
  cuisine: undefined, // Not applicable
  serviceTypes: ['massage', 'facial', 'body_treatment']
};

// ❌ INCORRECT
interface Business {
  cuisine: string; // Required for all businesses - wrong!
}
```

### 6.6 Client vs. Customer vs. Guest

**Client:**
- ❌ NEVER use for end-consumers
- ⚠️ Only acceptable for B2B contexts (e.g., "API client", "integration client")

**Customer:**
- ✅ Database and technical contexts
- ✅ Transaction processing
- ✅ Authentication and authorization

**Guest:**
- ✅ Hospitality experience contexts
- ✅ Recognition and personalization
- ✅ Marketing and customer-facing content

**Examples:**
```typescript
// ✅ CORRECT
const customer = await customerRepository.findById(customerId); // Database
const guest = await guestIntelligence.recognize(customerId); // Experience
const apiClient = await getApiClient(clientId); // B2B integration

// ❌ INCORRECT
const client = await getClient(customerId); // Use customer or guest
const patron = await getPatron(customerId); // Use customer or guest
```

---

## 7. Examples and Anti-Patterns

### 7.1 Good Examples

#### Admin Dashboard
```typescript
// ✅ Page Title
"Business Management Dashboard"
"Active Businesses: 1,247"
"Business Performance Metrics"

// ✅ Component
const BusinessList: React.FC = () => {
  const businesses = useBusinesses();
  return (
    <div>
      <h1>Businesses</h1>
      {businesses.map(business => (
        <BusinessCard key={business.businessId} business={business} />
      ))}
    </div>
  );
};

// ✅ API Call
const response = await fetch('/api/v2/businesses', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});
const businesses: Business[] = await response.json();
```

#### Public Website
```typescript
// ✅ Marketing Copy
"Discover Exceptional Hospitality Businesses"
"Join 1,000+ Hospitality Businesses on ImboniResto"
"Transform Your Hospitality Business with Intelligence"

// ✅ Component
const HospitalityBusinessDirectory: React.FC = () => {
  return (
    <section>
      <h1>Explore Hospitality Businesses</h1>
      <p>Find restaurants, cafes, spas, and more</p>
    </section>
  );
};
```

#### Guest Experience
```typescript
// ✅ Recognition Feature
const GuestRecognitionPanel: React.FC<{ customerId: string }> = ({ customerId }) => {
  const guest = useGuestRecognition(customerId);
  
  return (
    <div>
      <h2>Welcome back, {guest.firstName}!</h2>
      <p>We've prepared your favorite table.</p>
      <GuestPreferences preferences={guest.preferences} />
    </div>
  );
};

// ✅ Personalization
const recommendations = await guestService.getPersonalizedRecommendations(guest);
const favoriteItems = await guestService.getFavoriteItems(guest.customerId);
```

#### Multi-Vertical Feature
```typescript
// ✅ Generic Service Catalog
interface ServiceCatalog {
  catalogId: string;
  businessId: string;
  businessType: BusinessType;
  items: ServiceItem[];
}

function getServiceCatalog(businessId: string): Promise<ServiceCatalog> {
  // Works for restaurants (menu), spas (treatment list), hotels (room service)
  return catalogService.getByBusiness(businessId);
}

// ✅ Type-specific rendering
const ServiceCatalogView: React.FC<{ catalog: ServiceCatalog }> = ({ catalog }) => {
  switch (catalog.businessType) {
    case 'restaurant':
    case 'cafe':
    case 'bar':
      return <MenuView items={catalog.items} />;
    case 'spa':
      return <TreatmentListView items={catalog.items} />;
    case 'hotel':
      return <RoomServiceView items={catalog.items} />;
    default:
      return <GenericCatalogView items={catalog.items} />;
  }
};
```

### 7.2 Anti-Patterns (Bad Examples)

#### ❌ Generic "Restaurant" Usage
```typescript
// ❌ WRONG - Assumes all businesses are restaurants
"Total Restaurants: 1,247" // Should be "Total Businesses"
"Restaurant Discovery" // Should be "Hospitality Business Discovery"
"Restaurant Operations" // Should be "Business Operations"

// ❌ WRONG - Code
const restaurants = await getRestaurants(); // Should be getBusiness()
const restaurantCount = await countRestaurants(); // Should be countBusinesses()

interface Restaurant { // Should be Business
  restaurantId: string; // Should be businessId
}
```

#### ❌ Ambiguous Entity References
```typescript
// ❌ WRONG - Unclear what "location" means
const location = await getLocation(id); // Branch? Address? Coordinates?
const locations = business.locations; // Branches? Outlets?

// ✅ CORRECT - Explicit
const branch = await getBranch(branchId);
const branches = await getBranchesByBusiness(businessId);
const address = branch.address;
const coordinates = branch.coordinates;
```

#### ❌ Mixing Customer/Guest Contexts
```typescript
// ❌ WRONG - Using "guest" in database layer
const guest = await guestRepository.findById(guestId); // Should be customerRepository
await guestRepository.update(guestId, data); // Should be customerRepository

// ❌ WRONG - Using "customer" in hospitality experience
"Welcome back, customer!" // Should be "Welcome back, valued guest!"
const customerPreferences = await getCustomerPreferences(id); // Should be getGuestPreferences

// ✅ CORRECT - Proper layer separation
// Database layer
const customer = await customerRepository.findById(customerId);
await customerRepository.update(customerId, data);

// Intelligence layer
const guest = await guestIntelligence.recognize(customerId);
const preferences = await guestService.getPreferences(customerId);

// UI layer
"Welcome back, {guest.firstName}!"
```

#### ❌ Restaurant-Specific Terms in Multi-Vertical Features
```typescript
// ❌ WRONG - Kitchen terminology for all businesses
const kitchenOrders = await getKitchenOrders(businessId); // What about spas?
const kitchenStatus = order.kitchenStatus; // Not applicable to hotels

// ✅ CORRECT - Generic terminology
const fulfillmentOrders = await getFulfillmentOrders(businessId);
const preparationStatus = order.preparationStatus;

// ❌ WRONG - Menu for all businesses
const menu = await getMenu(businessId); // Spas don't have menus

// ✅ CORRECT - Generic service catalog
const catalog = await getServiceCatalog(businessId);
```

#### ❌ Inconsistent Naming
```typescript
// ❌ WRONG - Mixed terminology in same codebase
const business = await getBusiness(businessId);
const restaurant = await getRestaurant(restaurantId); // Inconsistent
const location = await getLocation(locationId); // Ambiguous

// ✅ CORRECT - Consistent terminology
const business = await getBusiness(businessId);
const branch = await getBranch(branchId);
const outlet = await getOutlet(outletId);
```

---

## 8. Migration and Refactoring Guidelines

### 8.1 When to Refactor

**MUST Refactor:**
- ✅ When creating new features or components
- ✅ When modifying existing files (update ALL terminology in that file)
- ✅ When touching database schemas or migrations
- ✅ When updating API endpoints or contracts

**MAY Defer:**
- ⚠️ Legacy URL paths (until API versioning allows migration)
- ⚠️ Legacy database column names (until schema migration sprint)
- ⚠️ Third-party integrations with fixed terminology

### 8.2 Refactoring Checklist

When refactoring a file, ensure:

- [ ] All variable names follow approved patterns
- [ ] All function/method names follow approved patterns
- [ ] All class/component names follow approved patterns
- [ ] All UI text uses context-appropriate terminology
- [ ] All comments and documentation updated
- [ ] All related tests updated
- [ ] No prohibited terms remain (except documented legacy exceptions)

### 8.3 Code Review Checklist

Reviewers MUST verify:

- [ ] No prohibited terms in new code
- [ ] Consistent terminology throughout the PR
- [ ] Context-appropriate usage (Business vs. Hospitality Business)
- [ ] Proper Customer vs. Guest layer separation
- [ ] No restaurant-specific terms in multi-vertical features
- [ ] Database entities use correct terminology
- [ ] UI text matches context (internal vs. external)

---

## 9. Enforcement and Compliance

### 9.1 Automated Checks

The following automated checks are enforced in CI/CD:

1. **ESLint Rules:** Custom rules to flag prohibited terms
2. **Database Migration Linter:** Validates schema naming conventions
3. **API Contract Validator:** Ensures endpoint naming consistency
4. **UI Text Linter:** Flags context-inappropriate terminology

### 9.2 Manual Review Requirements

All PRs MUST be reviewed by at least one team member familiar with this standard.

### 9.3 Exceptions Process

To request an exception to this standard:

1. Create a GitHub issue with label `terminology-exception`
2. Provide clear justification and context
3. Obtain approval from Platform Architecture Team
4. Document the exception in this document (Section 10)

---

## 10. Documented Exceptions

### 10.1 Legacy API Endpoints

**Exception:** `/admin/restaurants` and `/api/v1/restaurants` endpoints

**Justification:** Breaking change for existing integrations

**Expiration:** API v2 migration (Q2 2024)

**Mitigation:** All new endpoints use `/businesses`

### 10.2 Database Column Names

**Exception:** `restaurant_id` in legacy tables

**Justification:** Requires coordinated schema migration

**Expiration:** Schema migration sprint (Q3 2024)

**Mitigation:** All new tables use `business_id`

---

## 11. Glossary

### Quick Reference

| Term | Definition | Primary Context |
|------|------------|-----------------|
| **Business** | Primary entity representing any hospitality establishment | Internal/Technical |
| **Hospitality Business** | Public-facing term for Business | External/Marketing |
| **Branch** | Physical location of a Business | Multi-location management |
| **Outlet** | Service point within a Branch | Transaction processing |
| **Customer** | Database entity for end-consumer | Database/Technical |
| **Guest** | Intelligence layer wrapper for Customer | Hospitality Experience |
| **Partner** | Collaborator or stakeholder | Partnership management |
| **Founder Partner** | Early-stage investor or founding stakeholder | Investment tracking |
| **Campaign** | Marketing or promotional initiative | Marketing automation |
| **Code** | Redeemable promotional code | Discount application |
| **Agreement** | Formal contract or terms document | Contract management |

---

## 12. References

- **DGS-002:** API Design Standards
- **DGS-003:** Database Schema Conventions
- **DGS-004:** UI/UX Terminology Guidelines
- **DGS-005:** Multi-Vertical Architecture Patterns

---

## 13. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Platform Architecture Team | Initial release |

---

## 14. Approval

**Approved by:** Platform Architecture Team  
**Effective Date:** Immediate  
**Review Cycle:** Quarterly

---

**END OF DOCUMENT**
