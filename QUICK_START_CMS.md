# Contact Management System - Quick Start Guide

## 🚀 Installation & Setup

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

This regenerates the Prisma client with the new Contact Management System models.

### Step 2: Push Schema to Database
```bash
npx prisma db push
```

This creates all the new tables in your database:
- Contact
- ContactOrganization
- OrganizationMember
- ContactRelationship
- ContactActivity
- ContactSegment
- ContactTag

### Step 3: Verify Installation
```bash
npm run dev
```

Navigate to: `http://localhost:3000/dashboard/contacts`

## 📋 First Steps

### 1. Create Your First Contact

**Via UI:**
1. Go to `/dashboard/contacts`
2. Click "Add Contact"
3. Fill in the form
4. Click "Save"

**Via API:**
```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+250788123456",
    "type": "CLIENT",
    "city": "Kigali"
  }'
```

### 2. Create an Organization

```typescript
// In your code or admin panel
import { ContactOrganizationService } from '@/lib/services/contact-organization.service'

const org = await ContactOrganizationService.createOrganization(businessId, {
  name: "ABC Restaurant",
  type: "RESTAURANT",
  city: "Kigali",
  phone: "+250788999888",
  email: "info@abc.rw"
})
```

### 3. Link Contact to Organization

```typescript
await ContactOrganizationService.addMember(
  businessId,
  org.id,
  contact.id,
  "Manager",
  true // isPrimary contact
)
```

### 4. Create a Relationship

```typescript
import { ContactRelationshipService } from '@/lib/services/contact-relationship.service'

await ContactRelationshipService.createRelationship(businessId, {
  fromContactId: supplierContactId,
  toContactId: restaurantContactId,
  relationshipType: "SUPPLIES_TO",
  strength: 80
})
```

### 5. Log an Activity

```typescript
import { ContactService } from '@/lib/services/contact.service'

await ContactService.logActivity(contactId, businessId, {
  activityType: "CALL",
  title: "Follow-up call",
  description: "Discussed new menu items and pricing",
  performedBy: userId
})
```

## 🎯 Common Use Cases

### Use Case 1: Import Existing Customers

```typescript
import { ContactService } from '@/lib/services/contact.service'

// Prepare your data
const contacts = [
  {
    name: "Customer 1",
    phone: "+250788111111",
    type: "CUSTOMER",
    city: "Kigali"
  },
  {
    name: "Customer 2",
    phone: "+250788222222",
    type: "CUSTOMER",
    city: "Kigali"
  }
]

// Bulk import
const result = await ContactService.bulkImport(
  businessId,
  contacts,
  userId
)

console.log(`Imported: ${result.success}, Failed: ${result.failed}`)
```

### Use Case 2: Find Inactive Contacts

```typescript
// Get contacts with no activity in 30+ days
const inactiveContacts = await ContactService.getInactiveContacts(
  businessId,
  30 // days
)

// Send re-engagement campaign
for (const contact of inactiveContacts) {
  // Send WhatsApp message, email, etc.
}
```

### Use Case 3: Create Smart Segments

```typescript
import { ContactSegmentService } from '@/lib/services/contact-segment.service'

// Create "High-Value Clients in Kigali" segment
await ContactSegmentService.createSegment(businessId, {
  name: "High-Value Clients - Kigali",
  description: "Active clients in Kigali with high engagement",
  criteria: {
    type: "CLIENT",
    status: "ACTIVE",
    city: "Kigali",
    minActivityScore: 70
  },
  color: "#10b981",
  icon: "Star"
})

// Auto-refresh all segments
await ContactSegmentService.refreshAllSegments(businessId)
```

### Use Case 4: Visualize Relationship Network

```typescript
import { ContactRelationshipService } from '@/lib/services/contact-relationship.service'

// Get network graph for a contact (2 levels deep)
const network = await ContactRelationshipService.getContactNetwork(
  businessId,
  contactId,
  2 // depth
)

// Returns: { nodes: [...], edges: [...] }
// Use with D3.js, vis.js, or react-force-graph
```

### Use Case 5: Find Connection Between Two Contacts

```typescript
// Find how Contact A is connected to Contact B
const path = await ContactRelationshipService.findPath(
  businessId,
  contactAId,
  contactBId,
  5 // max depth
)

if (path) {
  console.log("Connection found!")
  path.forEach(rel => {
    console.log(`${rel.fromContact.name} → ${rel.toContact.name} (${rel.relationshipType})`)
  })
} else {
  console.log("No connection found")
}
```

## 🔧 Configuration

### Enable Auto-Creation from Orders

```typescript
// In your order creation logic
import { ContactService } from '@/lib/services/contact.service'

// After order is created
await ContactService.logActivity(supplierContactId, businessId, {
  activityType: "ORDER_PLACED",
  title: `Order #${order.orderNumber}`,
  description: `Order placed for ${order.totalAmountCents / 100} RWF`,
  source: "order",
  sourceId: order.id,
  performedBy: userId
})
```

### Enable Auto-Creation from WhatsApp

```typescript
// In your WhatsApp webhook handler
import { ContactService } from '@/lib/services/contact.service'

// When message received
await ContactService.logActivity(contactId, businessId, {
  activityType: "WHATSAPP_MESSAGE",
  description: message.body,
  source: "whatsapp",
  sourceId: message.id
})
```

### Create Default Segments

```typescript
// Run once per business
import { ContactSegmentService } from '@/lib/services/contact-segment.service'

const segments = await ContactSegmentService.getDefaultSegments(businessId)
console.log(`Created ${segments.length} default segments`)
```

## 📊 Analytics Queries

### Get Contact Statistics

```typescript
const stats = await ContactService.getContactStats(businessId)

console.log(`
  Total Contacts: ${stats.totalContacts}
  Active: ${stats.activeContacts}
  Inactive: ${stats.inactiveContacts}
  Leads: ${stats.leads}
  
  By Type:
  - Clients: ${stats.typeBreakdown.CLIENT || 0}
  - Suppliers: ${stats.typeBreakdown.SUPPLIER || 0}
  - Staff: ${stats.typeBreakdown.STAFF || 0}
  
  Recent Activities (7 days): ${stats.recentActivities}
`)
```

### Get Organization Statistics

```typescript
import { ContactOrganizationService } from '@/lib/services/contact-organization.service'

const stats = await ContactOrganizationService.getOrganizationStats(businessId)

console.log(`
  Total Organizations: ${stats.totalOrganizations}
  
  By Type:
  - Restaurants: ${stats.typeBreakdown.RESTAURANT || 0}
  - Hotels: ${stats.typeBreakdown.HOTEL || 0}
  - Suppliers: ${stats.typeBreakdown.SUPPLIER || 0}
`)
```

### Get Relationship Statistics

```typescript
import { ContactRelationshipService } from '@/lib/services/contact-relationship.service'

const stats = await ContactRelationshipService.getRelationshipStats(businessId)

console.log(`
  Total Relationships: ${stats.totalRelationships}
  Active: ${stats.activeRelationships}
  Strong Relationships (75+): ${stats.strongRelationships}
  
  By Type:
  - Supplies To: ${stats.typeBreakdown.SUPPLIES_TO || 0}
  - Works At: ${stats.typeBreakdown.WORKS_AT || 0}
  - Manages: ${stats.typeBreakdown.MANAGES || 0}
`)
```

## 🎨 Frontend Integration

### Add Navigation Link

Edit `src/components/DashboardLayout.tsx`:

```typescript
// Add to navigation items
{
  name: t('cms.contacts', 'Contacts'),
  href: '/dashboard/contacts',
  icon: Users,
  current: pathname === '/dashboard/contacts'
}
```

### Create Contact Profile Page

Create `src/pages/dashboard/contacts/[id].tsx`:

```typescript
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function ContactProfile() {
  const router = useRouter()
  const { id } = router.query
  const [contact, setContact] = useState(null)

  useEffect(() => {
    if (id) {
      fetch(`/api/contacts/${id}`)
        .then(res => res.json())
        .then(data => setContact(data))
    }
  }, [id])

  if (!contact) return <div>Loading...</div>

  return (
    <div>
      <h1>{contact.name}</h1>
      {/* Contact details, activities, relationships */}
    </div>
  )
}
```

## 🔐 Security & Permissions

### Add RBAC Middleware

Create `src/lib/middleware/withContactPermission.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

export function withContactPermission(
  handler: Function,
  requiredPermission: 'read' | 'write' | 'delete'
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userRole = (session.user as any).roles?.[0]
    
    // OWNER and MANAGER have full access
    if (['OWNER', 'MANAGER'].includes(userRole)) {
      return handler(req, res)
    }

    // STAFF has read-only access
    if (userRole === 'STAFF' && requiredPermission === 'read') {
      return handler(req, res)
    }

    return res.status(403).json({ error: 'Forbidden' })
  }
}
```

## 🧪 Testing

### Test Contact Creation

```typescript
// Test file: __tests__/contact.service.test.ts
import { ContactService } from '@/lib/services/contact.service'

describe('ContactService', () => {
  it('should create a contact', async () => {
    const contact = await ContactService.createContact('business-id', {
      name: 'Test Contact',
      type: 'CLIENT',
      phone: '+250788123456'
    })

    expect(contact.name).toBe('Test Contact')
    expect(contact.type).toBe('CLIENT')
  })
})
```

## 📱 Mobile Considerations

The system is mobile-responsive by default. For mobile apps:

1. Use the same API endpoints
2. Implement offline-first with local storage
3. Sync activities when online
4. Use simplified UI for small screens

## 🔄 Data Migration

### Migrate Existing Customers

```typescript
// Migration script
import { prisma } from '@/lib/prisma'
import { ContactService } from '@/lib/services/contact.service'

async function migrateCustomers(businessId: string) {
  const customers = await prisma.customer.findMany({
    where: { businessId }
  })

  for (const customer of customers) {
    await ContactService.createContact(businessId, {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      type: 'CUSTOMER',
      source: 'migration',
      sourceId: customer.id
    })
  }
}
```

## 🎯 Next Steps

1. ✅ Set up database schema
2. ✅ Create first contacts
3. ✅ Set up organizations
4. ✅ Create relationships
5. ✅ Log activities
6. ⏭️ Create segments
7. ⏭️ Build relationship graph UI
8. ⏭️ Integrate with WhatsApp
9. ⏭️ Add AI insights
10. ⏭️ Build mobile app

## 📚 Additional Resources

- **Full Documentation**: `CONTACT_MANAGEMENT_SYSTEM.md`
- **API Reference**: Check `/api/contacts/*` endpoints
- **Database Schema**: `prisma/schema.prisma` (lines 2637-2984)
- **Services**: `src/lib/services/contact*.service.ts`

## 💡 Pro Tips

1. **Use Tags Liberally** - Tags are flexible and searchable
2. **Log Everything** - Activities build the intelligence layer
3. **Update Regularly** - Keep contact info current
4. **Leverage Segments** - Auto-updating segments save time
5. **Monitor Activity Scores** - Low scores = re-engagement needed
6. **Build Relationships** - Network graph reveals opportunities
7. **Export Often** - Backup your contact data

## 🆘 Troubleshooting

### Prisma Client Errors
```bash
# Regenerate Prisma client
npx prisma generate

# If still failing, clear cache
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset

# Or migrate properly
npx prisma migrate dev
```

---

**Ready to build the future of hospitality relationship management!** 🚀
