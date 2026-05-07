import os
import re

base_dir = r'c:\Users\Steve\Dropbox\PC\Desktop\ImboniResto\src'

# Map of files to fix with their specific replacements
file_fixes = {
    'pages/api/dashboard/recent-transactions.ts': [
        (r'where: \{ businessId: restaurantId \}', r'where: { businessId }')
    ],
    'pages/api/dashboard/sales-chart.ts': [
        (r'WHERE "businessId" = \$\{restaurantId\}', r'WHERE "businessId" = ${businessId}')
    ],
    'pages/api/smart-dining-slips/index.ts': [
        (r'(\s+)restaurantId,', r'\1businessId,')
    ],
    'pages/api/staff/[id].ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'pages/api/staff/index.ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'pages/api/tables/[id].ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'pages/api/tables/index.ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'pages/api/transactions/index.ts': [
        (r'businessId: restaurantId', r'businessId')
    ],
    'pages/api/auth/signup.ts': [
        (r'input\.restaurantName', r'input.businessName')
    ],
    'pages/api/grn/index.ts': [
        (r'if \(businessId\) \{', r'if (businessId) {')
    ],
    'pages/api/purchase-orders/index.ts': [
        (r'if \(businessId\) \{', r'if (businessId) {')
    ],
    'pages/api/marketplace/orders.ts': [
        (r'businessId: restaurantId as string', r'businessId: businessId as string')
    ],
    'pages/api/payments/irembo/create-invoice.ts': [
        (r'if \(!subscriptionId \|\| !businessId\)', r'if (!subscriptionId || !businessId)')
    ],
    'pages/api/supplier/orders.ts': [
        (r'if \(businessId\) where\.businessId = restaurantId', r'if (businessId) where.businessId = businessId')
    ],
    'pages/api/sales/index.ts': [
        (r'input\.restaurantId', r'input.businessId')
    ],
    'lib/services/sales.service.ts': [
        (r'restaurantId:', r'businessId:')
    ],
    'pages/api/ai/cost-anomalies.ts': [
        (r'String\(businessId\)', r'String(restaurantId)'),
        (r'businessId: resolvedRestaurantId', r'restaurantId: resolvedRestaurantId')
    ],
    'pages/api/ai/reorder.ts': [
        (r'String\(businessId\)', r'String(restaurantId)'),
        (r'businessId: resolvedRestaurantId', r'restaurantId: resolvedRestaurantId')
    ],
}

def fix_file(filepath, patterns):
    try:
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            return False
            
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

updated_count = 0
for rel_path, patterns in file_fixes.items():
    filepath = os.path.join(base_dir, rel_path)
    if fix_file(filepath, patterns):
        updated_count += 1
        print(f"Fixed: {rel_path}")

print(f"\nTotal files fixed: {updated_count}")
