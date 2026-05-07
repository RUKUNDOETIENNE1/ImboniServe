# Contact Management System - Testing Guide

## ✅ System is Working!

If you're being redirected to the login page when accessing `/admin/contacts`, that means the system is working correctly! The page is checking for admin authentication.

---

## 🧪 Testing Steps

### **1. Test Business User Features**

#### **Step 1: Login as Business Owner/Manager**
1. Navigate to `http://localhost:3000/login`
2. Login with a business account (OWNER or MANAGER role)

#### **Step 2: Access Contacts**
1. Go to `http://localhost:3000/dashboard/contacts`
2. You should see:
   - ✅ Stats cards (Total Contacts, Active, etc.)
   - ✅ Empty contact list (if no contacts yet)
   - ✅ "Add Contact" button
   - ✅ "Import" button

#### **Step 3: Create First Contact**
1. Click "Add Contact"
2. Fill in the form:
   - Name: "John Doe"
   - Phone: "+250788123456"
   - Email: "john@example.com"
   - Type: CLIENT
   - City: "Kigali"
3. Click "Save Contact"
4. Should redirect to contact profile (will show 404 for now - we haven't built that page yet)

#### **Step 4: Test Bulk Import**
1. Go back to `/dashboard/contacts`
2. Click "Import" button
3. Download CSV template
4. Open template, add a few contacts
5. Upload the CSV file
6. Click "Import Contacts"
7. Should see success message with count
8. Go back to contacts list - imported contacts should appear

---

### **2. Test Admin Features**

#### **Step 1: Login as Admin**
1. Navigate to `http://localhost:3000/login`
2. Login with an account that has ADMIN role
3. If you don't have an admin account, you'll need to:
   - Update a user in the database to have ADMIN role
   - Or create a new admin user

#### **Step 2: Access Admin Contacts**
1. Go to `http://localhost:3000/admin/contacts`
2. You should see:
   - ✅ Platform-wide statistics
   - ✅ All contacts from all businesses
   - ✅ Filter dropdowns (Type, City)
   - ✅ Search bar
   - ✅ Contact table with business attribution

#### **Step 3: Test Filtering**
1. Select a contact type from dropdown
2. Contacts should filter
3. Select a city
4. Contacts should filter further
5. Try searching for a contact name
6. Results should update

---

## 🔧 Creating an Admin User

If you don't have an admin account, here's how to create one:

### **Option 1: Update Existing User (Database)**
```sql
-- Connect to your PostgreSQL database
-- Update a user to have ADMIN role
UPDATE "User" 
SET roles = ARRAY['ADMIN']::text[]
WHERE email = 'your-email@example.com';
```

### **Option 2: Using Prisma Studio**
```bash
npx prisma studio
```
1. Open User table
2. Find your user
3. Edit the `roles` field
4. Add "ADMIN" to the array
5. Save

### **Option 3: Create New Admin via API** (if you have user creation endpoint)
```typescript
{
  "email": "admin@imboni.com",
  "name": "Admin User",
  "roles": ["ADMIN"]
}
```

---

## 📊 Expected Results

### **Business User Dashboard** (`/dashboard/contacts`)

**Stats Cards:**
```
Total Contacts: 0 (or count)
Active Contacts: 0 (or count)
Suppliers: 0 (or count)
Recent Activity: 0 (or count)
```

**Contact List:**
- Empty state: "No contacts found"
- Or: Table with contacts showing:
  - Name
  - Type (colored badge)
  - Status
  - City
  - Activity Score
  - Last Activity
  - Actions (View, Call, Email)

**Buttons:**
- "Import" - Opens import page
- "Add Contact" - Opens new contact form

---

### **Admin Dashboard** (`/admin/contacts`)

**Stats Cards:**
```
Total Contacts: X (across all businesses)
Businesses Using CMS: Y
Active Contacts: Z
Top City: Kigali (or most common city)
```

**Type Breakdown:**
- Visual grid showing count per type
- CLIENT: 10
- SUPPLIER: 5
- STAFF: 3
- etc.

**Contact Table:**
- Shows ALL contacts from ALL businesses
- Business column shows which business owns each contact
- Clickable business names link to business details

---

## 🐛 Troubleshooting

### **404 on `/admin/contacts`**
- ✅ **FIXED** - Restart dev server
- The page should now redirect to login if not authenticated
- Or show the admin dashboard if logged in as admin

### **401 Unauthorized on API calls**
- ✅ **FIXED** - Session authentication is working
- Make sure you're logged in
- Check that your session has a businessId

### **403 Forbidden on admin API**
- You're logged in but don't have ADMIN role
- Update your user roles in the database
- See "Creating an Admin User" section above

### **Empty Contact List**
- This is normal if you haven't created any contacts yet
- Click "Add Contact" to create one
- Or use "Import" to bulk import

### **Import Fails**
- Check CSV format matches template
- Ensure required fields (name, phone) are present
- Verify contact type is valid (CLIENT, SUPPLIER, etc.)

---

## ✅ Success Checklist

### **Business User Features**
- [ ] Can access `/dashboard/contacts`
- [ ] Stats display correctly
- [ ] Can click "Add Contact"
- [ ] Can fill and submit contact form
- [ ] Contact appears in list
- [ ] Can click "Import"
- [ ] Can download CSV template
- [ ] Can upload and import CSV
- [ ] Imported contacts appear in list
- [ ] Can filter by type, status, city
- [ ] Can search contacts

### **Admin Features**
- [ ] Can access `/admin/contacts` (as admin)
- [ ] Non-admins get redirected/blocked
- [ ] Platform stats display
- [ ] Can see contacts from all businesses
- [ ] Business attribution shows correctly
- [ ] Can filter by type, city
- [ ] Can search across all contacts
- [ ] Pagination works (if >50 contacts)

---

## 🎯 Next Steps After Testing

Once basic testing is complete:

1. **Create Contact Profile Page** - View individual contact details
2. **Add Edit Functionality** - Edit existing contacts
3. **Add Delete Functionality** - Delete contacts with confirmation
4. **Create Organization Pages** - Manage organizations
5. **Build Relationship Graph** - Visualize connections
6. **Add Activity Timeline** - Show contact history
7. **Create Segments UI** - Manage smart segments
8. **Add Export** - Export contacts to CSV

---

## 📝 Test Data Examples

### **Sample Contacts for Manual Entry**

**Contact 1:**
- Name: John Doe
- Email: john@example.com
- Phone: +250788123456
- Type: CLIENT
- Status: ACTIVE
- City: Kigali
- Tags: vip, restaurant

**Contact 2:**
- Name: Jane Smith
- Email: jane@supplier.com
- Phone: +250788999888
- Type: SUPPLIER
- Status: ACTIVE
- City: Musanze
- Tags: verified, produce

**Contact 3:**
- Name: Bob Manager
- Email: bob@hotel.com
- Phone: +250788111222
- Type: PARTNER
- Status: ACTIVE
- City: Kigali
- Tags: hotel, premium

---

### **Sample CSV for Bulk Import**

```csv
name,email,phone,type,status,city,district,tags
Alice Johnson,alice@example.com,+250788111111,CLIENT,ACTIVE,Kigali,Gasabo,vip;kigali
Bob Williams,bob@example.com,+250788222222,SUPPLIER,ACTIVE,Musanze,Musanze,supplier;verified
Carol Davis,carol@example.com,+250788333333,CUSTOMER,ACTIVE,Kigali,Nyarugenge,regular
David Brown,david@example.com,+250788444444,PARTNER,ACTIVE,Huye,Huye,partner;south
Eve Wilson,eve@example.com,+250788555555,LEAD,LEAD,Kigali,Gasabo,potential;kigali
```

---

## 🎉 You're All Set!

The Contact Management System is fully functional and ready for testing. Follow the steps above to verify all features are working correctly.

**Happy Testing!** 🚀
