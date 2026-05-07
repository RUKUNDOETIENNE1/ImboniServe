import os
import re

# Directory to search
api_dir = r'c:\Users\Steve\Dropbox\PC\Desktop\ImboniResto\src\pages\api'

# Files to fix with specific patterns
fixes = {
    'dashboard/recent-transactions.ts': [
        (r'where: \{ businessId: restaurantId \}', r'where: { businessId }')
    ],
    'dashboard/sales-chart.ts': [
        (r'WHERE "businessId" = \$\{restaurantId\}', r'WHERE "businessId" = ${businessId}')
    ],
    'dashboard/stats.ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'grn/index.ts': [
        (r'if \(businessId\)', r'if (businessId)')
    ],
    'marketplace/orders.ts': [
        (r'businessId: restaurantId as string', r'businessId: businessId as string')
    ],
    'payments/irembo/create-invoice.ts': [
        (r'if \(!subscriptionId \|\| !businessId\)', r'if (!subscriptionId || !businessId)')
    ],
    'purchase-orders/index.ts': [
        (r'if \(businessId\)', r'if (businessId)')
    ],
    'sales/index.ts': [
        (r'input\.restaurantId', r'input.businessId')
    ],
    'smart-dining-slips/index.ts': [
        (r'restaurantId,', r'businessId,')
    ],
    'staff/[id].ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'staff/index.ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'supplier/orders.ts': [
        (r'if \(businessId\) where\.businessId = restaurantId', r'if (businessId) where.businessId = businessId')
    ],
    'tables/[id].ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'tables/index.ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'transactions/index.ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'auth/signup.ts': [
        (r'input\.restaurantName', r'input.businessName')
    ],
    'ai/cost-anomalies.ts': [
        (r'String\(businessId\)', r'String(businessId)'),
        (r'businessId: resolvedRestaurantId', r'restaurantId: resolvedRestaurantId')
    ],
    'ai/reorder.ts': [
        (r'String\(businessId\)', r'String(businessId)'),
        (r'businessId: resolvedRestaurantId', r'restaurantId: resolvedRestaurantId')
    ],
}

def fix_file(filepath, patterns):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all patterns for this file
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)
        
        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

# Process each file
updated_count = 0
for rel_path, patterns in fixes.items():
    filepath = os.path.join(api_dir, rel_path)
    if os.path.exists(filepath):
        if fix_file(filepath, patterns):
            updated_count += 1
            print(f"Fixed: {filepath}")
    else:
        print(f"Not found: {filepath}")

print(f"\nTotal files fixed: {updated_count}")
