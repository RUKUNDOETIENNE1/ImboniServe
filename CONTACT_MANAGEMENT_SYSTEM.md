# Contact Management System (CMS) - Imboni Serve

## Overview

The Contact Management System is a **relationship intelligence platform** designed specifically for the hospitality ecosystem in Rwanda. It's not a simple CRM—it's a comprehensive system that connects clients, suppliers, staff, and operational data into one unified network.

## 🎯 Core Vision

The CMS serves as the **central intelligence layer** of Imboni Serve, enabling:
- **360° relationship visibility** across all stakeholders
- **Network graph analysis** to discover hidden connections
- **Activity tracking** for every interaction
- **Smart segmentation** for targeted engagement
- **AI-ready architecture** for predictive analytics

## 📊 Database Architecture

### Core Entities

#### 1. **Contact** (Individual People)
- Represents any person in the ecosystem
- Types: CLIENT, SUPPLIER, STAFF, CUSTOMER, PARTNER, LEAD
- Tracks: basic info, location, tags, activity score
- Auto-creation from: registrations, orders, WhatsApp interactions

#### 2. **ContactOrganization** (Businesses/Companies)
- Represents business entities
- Types: RESTAURANT, HOTEL, SUPPLIER, DISTRIBUTOR, MANUFACTURER
- Tracks: revenue, orders, members, location

#### 3. **ContactRelationship** (The Heart of CMS)
- Creates network graph between contacts and organizations
- Types: WORKS_AT, OWNS, MANAGES, SUPPLIES_TO, PARTNERS_WITH, REPORTS_TO
- Supports: strength scoring (0-100), metadata, date ranges
- Enables queries like:
  - "Who supplies this restaurant?"
  - "Show me all managers linked to suppliers"
  - "Find path between Contact A and Contact B"

#### 4. **ContactActivity** (Interaction Log)
- Chronological timeline of all interactions
- Types: CALL, EMAIL, MEETING, ORDER_PLACED, WHATSAPP_MESSAGE, etc.
- Sources: manual, system, WhatsApp, orders, API
- Automatically updates contact activity scores

#### 5. **ContactSegment** (Smart Filtering)
- Dynamic groups based on criteria
- Auto-updating membership
- Examples:
  - "Inactive clients (30+ days)"
  - "High-value restaurants in Kigali"
  - "Active suppliers with score > 70"

#### 6. **ContactTag** (Flexible Categorization)
- Business-specific tags
- Usage tracking
- Color-coded organization

## 🔧 Backend Services

### ContactService
```typescript
// Core CRUD operations
createContact(businessId, input)
updateContact(businessId, input)
deleteContact(businessId, contactId)
getContact(businessId, contactId)
listContacts(businessId, filters, page, limit)

// Advanced features
searchContacts(businessId, query, limit)
logActivity(contactId, businessId, activity)
updateActivityScore(contactId)
getContactStats(businessId)
bulkImport(businessId, contacts, createdBy)
getInactiveContacts(businessId, daysSinceActivity)
mergeContacts(businessId, primaryId, duplicateId)
```

### ContactOrganizationService
```typescript
createOrganization(businessId, input)
updateOrganization(businessId, input)
getOrganization(businessId, organizationId)
listOrganizations(businessId, filters, page, limit)

// Member management
addMember(businessId, organizationId, contactId, role, isPrimary)
removeMember(businessId, organizationId, contactId)
updateMember(businessId, memberId, updates)

getOrganizationStats(businessId)
updateOrganizationMetrics(organizationId, metrics)
```

### ContactRelationshipService
```typescript
createRelationship(businessId, input)
updateRelationship(businessId, input)
listRelationships(businessId, query, page, limit)

// Network intelligence
getContactNetwork(businessId, contactId, depth)
findPath(businessId, fromContactId, toContactId, maxDepth)

// Specialized queries
getSupplierRelationships(businessId)
getStaffHierarchy(businessId)
updateRelationshipStrength(relationshipId, strength)
```

### ContactSegmentService
```typescript
createSegment(businessId, input)
updateSegment(businessId, input)
listSegments(businessId)

// Dynamic membership
updateSegmentMembers(segmentId)
getSegmentMembers(businessId, segmentId, page, limit)

// Presets
getDefaultSegments(businessId)
refreshAllSegments(businessId)
```

## 🌐 API Endpoints

### Contacts
- `GET /api/contacts` - List contacts with filters
- `POST /api/contacts` - Create contact
- `GET /api/contacts/:id` - Get contact details
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/contacts/search?q=` - Search contacts
- `GET /api/contacts/stats` - Get contact statistics
- `POST /api/contacts/:id/activities` - Log activity

### Organizations (To be created)
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization
- `PUT /api/organizations/:id` - Update organization
- `POST /api/organizations/:id/members` - Add member

### Relationships (To be created)
- `GET /api/relationships` - List relationships
- `POST /api/relationships` - Create relationship
- `GET /api/relationships/network/:contactId` - Get network graph
- `GET /api/relationships/path?from=&to=` - Find connection path

### Segments (To be created)
- `GET /api/segments` - List segments
- `POST /api/segments` - Create segment
- `GET /api/segments/:id/members` - Get segment members
- `POST /api/segments/refresh` - Refresh all segments

## 🎨 Frontend Pages

### 1. Contact List (`/dashboard/contacts`)
- Filterable table view
- Search functionality
- Type/status/city filters
- Activity score indicators
- Quick actions (call, email, WhatsApp)
- Bulk operations

### 2. Contact Profile (`/dashboard/contacts/:id`)
- Contact details
- Organization memberships
- Relationship network visualization
- Activity timeline
- Notes and tags
- Quick actions

### 3. Organization List (`/dashboard/organizations`)
- Organization directory
- Type-based filtering
- Member count
- Revenue/order metrics

### 4. Organization Profile (`/dashboard/organizations/:id`)
- Organization details
- Member list with roles
- Relationship graph
- Order history
- Financial metrics

### 5. Relationship Graph (`/dashboard/relationships`)
- Interactive network visualization
- Filter by relationship type
- Strength indicators
- Path finder tool

### 6. Segments (`/dashboard/segments`)
- Segment management
- Dynamic criteria builder
- Member preview
- Auto-update toggle

## 🔐 Role-Based Access Control (RBAC)

### Permission Levels

**OWNER**
- Full access to all CMS features
- Can create/edit/delete all contacts
- Can manage relationships
- Can create segments
- Can export data

**MANAGER**
- View all contacts
- Edit assigned contacts
- Log activities
- View relationships
- Limited export

**STAFF**
- View assigned contacts only
- Log activities on assigned contacts
- Read-only relationships

**SUPPLIER**
- View own contact record
- View related businesses
- Update own information

## 🤖 AI Readiness

The system is designed to support future AI features:

### 1. Churn Prediction
```typescript
// Activity score + last contact date → churn risk
if (activityScore < 30 && daysSinceLastActivity > 45) {
  risk = "HIGH"
}
```

### 2. Supplier Recommendations
```typescript
// Leverage relationship network + activity patterns
getOptimalSuppliers(contactId, productCategory)
```

### 3. Relationship Strength Scoring
```typescript
// Auto-calculate based on:
// - Interaction frequency
// - Order volume
// - Payment reliability
// - Communication sentiment
```

### 4. Network Analysis
```typescript
// Identify key connectors
// Detect communities
// Suggest introductions
```

## 📈 Analytics & Insights

### Contact Metrics
- Total contacts by type
- Active vs inactive ratio
- Activity score distribution
- Geographic distribution
- Tag usage

### Relationship Metrics
- Total relationships by type
- Network density
- Average relationship strength
- Supplier coverage
- Staff hierarchy depth

### Activity Metrics
- Activities per day/week/month
- Activity type breakdown
- Response time averages
- Engagement trends

## 🔄 Auto-Creation Workflows

### From New Registration
```typescript
// When a new business signs up
Contact.create({
  name: user.name,
  email: user.email,
  phone: user.phone,
  type: "CLIENT",
  source: "registration",
  sourceId: user.id
})
```

### From Order Placement
```typescript
// When an order is placed
ContactActivity.create({
  contactId: supplierId,
  activityType: "ORDER_PLACED",
  description: `Order #${orderNumber} placed`,
  source: "order",
  sourceId: orderId
})
```

### From WhatsApp Interaction
```typescript
// When WhatsApp message received
ContactActivity.create({
  contactId: contactId,
  activityType: "WHATSAPP_MESSAGE",
  description: message.body,
  source: "whatsapp",
  sourceId: message.id
})
```

## 🚀 Getting Started

### 1. Database Setup
```bash
# The schema is already added to prisma/schema.prisma
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 2. Create Default Segments
```typescript
// In your seed script or admin panel
import { ContactSegmentService } from '@/lib/services/contact-segment.service'

await ContactSegmentService.getDefaultSegments(businessId)
```

### 3. Import Existing Data
```typescript
// Bulk import contacts
import { ContactService } from '@/lib/services/contact.service'

const contacts = [
  { name: "John Doe", type: "CLIENT", phone: "+250788123456" },
  // ... more contacts
]

await ContactService.bulkImport(businessId, contacts, userId)
```

## 📝 Usage Examples

### Create a Contact with Organization
```typescript
// 1. Create contact
const contact = await ContactService.createContact(businessId, {
  name: "Jane Smith",
  email: "jane@example.com",
  phone: "+250788123456",
  type: "SUPPLIER",
  role: "Procurement Manager",
  city: "Kigali"
})

// 2. Create organization
const org = await ContactOrganizationService.createOrganization(businessId, {
  name: "ABC Suppliers Ltd",
  type: "SUPPLIER",
  city: "Kigali",
  taxId: "123456789"
})

// 3. Link contact to organization
await ContactOrganizationService.addMember(
  businessId,
  org.id,
  contact.id,
  "Procurement Manager",
  true // isPrimary
)

// 4. Create relationship
await ContactRelationshipService.createRelationship(businessId, {
  fromContactId: contact.id,
  toContactId: myBusinessContactId,
  relationshipType: "SUPPLIES_TO",
  strength: 75
})
```

### Track Activity
```typescript
await ContactService.logActivity(contactId, businessId, {
  activityType: "CALL",
  title: "Follow-up call",
  description: "Discussed new product pricing",
  performedBy: userId
})
```

### Find Connection Path
```typescript
const path = await ContactRelationshipService.findPath(
  businessId,
  contactA,
  contactB,
  5 // max depth
)

// Returns array of relationships showing the connection
```

## 🎯 Success Metrics

The CMS is successful when:

✅ All stakeholders (restaurants, suppliers, staff) are tracked  
✅ Relationships are visible and queryable  
✅ Activity history is comprehensive  
✅ Segmentation enables targeted actions  
✅ System supports AI/automation expansion  
✅ Data integrity is maintained  
✅ Performance is fast (<500ms queries)  

## 🔮 Future Enhancements

1. **WhatsApp Integration** - Auto-log WhatsApp conversations
2. **Email Sync** - Import email threads as activities
3. **AI Insights** - Churn prediction, optimal contact time
4. **Mobile App** - On-the-go contact management
5. **Voice Notes** - Record and transcribe call notes
6. **Contract Management** - Link contracts to relationships
7. **Task Management** - Follow-up tasks per contact
8. **Calendar Integration** - Meeting scheduling

## 📚 Additional Resources

- **Prisma Schema**: `prisma/schema.prisma` (lines 2637-2984)
- **Services**: `src/lib/services/contact*.service.ts`
- **API Routes**: `src/pages/api/contacts/`
- **Translations**: `public/locales/en.json` (cms section)

---

**Built for Imboni Serve** | Production-Ready | AI-Ready | Scalable
