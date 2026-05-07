# Custom Instructions System - User Guide

**Version:** 1.0  
**Date:** March 16, 2026  
**Status:** ✅ Production Ready

---

## Overview

The Custom Instructions System allows customers to specify preferences and special requests for their orders, improving order accuracy and customer satisfaction.

---

## Features

### Per-Item Instructions
- Add specific notes to individual menu items
- Examples: "no mayo", "extra spicy", "less rice", "well done"
- Supports multiple instructions per item

### Order-Level Notes
- Add general notes that apply to the entire order
- Examples: "pack to-go", "serve kids first", "allergies: peanuts"

### Kitchen Display
- Items and instructions shown separately for clarity
- Reduces missed special requests
- Improves order accuracy

### Analytics Dashboard
- Track most common instruction tags
- Identify items that get the most customization
- Breakdown by category and order source
- Data-driven menu optimization

---

## How It Works

### WhatsApp Orders (Staff-Assisted)

**Basic Format:**
```
ORDER [table] [items]
```

**With Per-Item Instructions:**
```
ORDER T5 2x Chicken Burger [no mayo], 1x Fries [extra salt]
```

**With Order-Level Notes:**
```
ORDER T5 2x Chicken Burger, 1x Soda NOTES: pack to-go
```

**With Both:**
```
ORDER T5 2x Chicken Burger [no onions; extra spicy], 1x Soda NOTES: agaceri gake
```

**Instruction Formats:**
- Use square brackets `[...]` or parentheses `(...)` for item notes
- Separate multiple instructions with semicolons `;` or commas `,`
- Use `NOTES:` or `NOTE:` for order-level notes

### QR Orders (Self-Service)

**Backend Ready:**
- API accepts `notes` and `instructionTags` per item
- Order-level notes supported via `Sale.notes`

**Frontend Implementation (Coming Soon):**
- Preset toggles per item (No onions, Extra spicy, etc.)
- Free-text input field for custom notes
- Order-level notes field at checkout

---

## Kitchen Display

Orders now show two sections:

### Items Section
```
Items:
- 2x Chicken Burger
- 1x Fries
- 1x Soda
```

### Instructions Section
```
Instructions:
- Order: pack to-go
- 2x Chicken Burger: no mayo; extra spicy
- 1x Fries: extra salt
- Tags: NO_MAYO, EXTRA_SPICY, EXTRA_SALT
```

---

## Analytics Dashboard

Access: `/dashboard/analytics/instruction-insights`

### Metrics Tracked
1. **Total Orders with Instructions** - How many orders include special requests
2. **Instruction Rate** - Percentage of orders with instructions
3. **Top Instruction Tags** - Most common requests (e.g., NO_ONIONS, EXTRA_SPICY)
4. **Items with Most Instructions** - Which menu items get customized most
5. **Category Breakdown** - Instructions by menu category
6. **Source Breakdown** - Instructions by order channel (WhatsApp, QR, POS)

### Use Cases
- **Menu Optimization**: If "no onions" is common, consider making it optional by default
- **Portion Adjustments**: If "extra rice" is frequent, review standard portions
- **Pricing Strategy**: Consider charging for premium customizations
- **Staff Training**: Focus on items with most special requests

---

## Database Schema

### SaleItem Fields
```prisma
model SaleItem {
  // ... existing fields
  instructions    Json?      // Raw notes: { notes: ["no mayo"], source: "WHATSAPP" }
  instructionTags String[]   // Normalized tags: ["NO_MAYO", "EXTRA_SPICY"]
}
```

### Sale Fields
```prisma
model Sale {
  // ... existing fields
  notes String?  // Order-level notes
}
```

---

## API Endpoints

### Create Order with Instructions (QR/Pre-Order)
```typescript
POST /api/pre-order/schedule
{
  "businessId": "...",
  "items": [
    {
      "menuItemId": "...",
      "quantity": 2,
      "notes": "no mayo",
      "instructionTags": ["NO_MAYO"]
    }
  ],
  "scheduledAt": "2026-03-16T14:00:00Z"
}
```

### Get Instruction Insights
```typescript
GET /api/analytics/instruction-insights?period=30

Response:
{
  "data": {
    "totalOrders": 150,
    "totalOrdersWithInstructions": 45,
    "instructionRate": "30.0",
    "topTags": [
      { "tag": "NO_ONIONS", "count": 23 },
      { "tag": "EXTRA_SPICY", "count": 18 }
    ],
    "topItemsWithInstructions": [
      { "item": "Chicken Burger", "count": 15 }
    ],
    "categoryBreakdown": [...],
    "sourceBreakdown": [...]
  }
}
```

---

## Best Practices

### For Staff (WhatsApp)
1. **Be specific**: Use clear, concise instructions
2. **Use brackets**: `[no mayo]` is clearer than just "no mayo"
3. **Separate multiple**: Use semicolons: `[no onions; extra spicy]`
4. **Order notes**: Use `NOTES:` for general requests

### For Kitchen
1. **Check both sections**: Always review Items AND Instructions
2. **Confirm unclear requests**: Ask staff if instruction is ambiguous
3. **Mark as complete**: Only when all instructions are fulfilled

### For Management
1. **Review analytics weekly**: Check instruction insights dashboard
2. **Optimize menu**: Adjust defaults based on common requests
3. **Train staff**: Focus on items with most customization
4. **Consider pricing**: Evaluate premium customizations

---

## Troubleshooting

### Instructions Not Showing in Kitchen
- Check that order was created after schema update
- Verify Prisma Client regenerated: `npx prisma generate`
- Check unified orders API includes `instructions` and `instructionTags`

### WhatsApp Instructions Not Parsing
- Verify format: `ORDER T5 2x Item [note]`
- Use square brackets `[]` or parentheses `()`
- Check webhook is receiving messages
- Review logs in Twilio console

### Analytics Not Updating
- Verify orders have `instructionTags` populated
- Check date range in analytics dashboard
- Ensure database has recent orders with instructions

---

## Migration Notes

### Existing Orders
- Old orders without instructions will not break
- `instructions` and `instructionTags` are optional fields
- Kitchen display gracefully handles missing data

### Schema Update
```bash
# Regenerate Prisma Client
npx prisma generate

# Push to database
npx prisma db push
```

---

## Future Enhancements

### Planned Features
1. **QR UI Toggles**: Preset instruction buttons for common requests
2. **Multi-Language Tags**: Support for Kinyarwanda, French, Swahili instructions
3. **AI Suggestions**: Recommend instructions based on order history
4. **Pricing Rules**: Auto-apply charges for premium customizations
5. **Allergen Tracking**: Flag common allergens in instructions

---

## Support

For technical issues or questions:
- Review WHATSAPP_SETUP_GUIDE.md for WhatsApp configuration
- Check FINAL_COMPLETION_SUMMARY.md for feature overview
- Contact development team for custom requirements

---

**Status:** ✅ Fully Implemented and Production Ready  
**Last Updated:** March 16, 2026
