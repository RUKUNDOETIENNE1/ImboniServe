import os
import re

# Directory to search
api_dir = r'c:\Users\Steve\Dropbox\PC\Desktop\ImboniResto\src\pages\api'

# Patterns to replace
replacements = [
    (r'const restaurantId = user\.restaurantId', r'const businessId = user.businessId'),
    (r'const restaurantId = \(session\.user as any\)\.restaurantId', r'const businessId = (session.user as any).businessId'),
    (r'user\.restaurantId', r'user.businessId'),
    (r'if \(!restaurantId\) \{', r'if (!businessId) {'),
    (r'restaurantId:', r'businessId:'),
    (r'\(restaurantId,', r'(businessId,'),
    (r', restaurantId\)', r', businessId)'),
    (r'restaurantId\)', r'businessId)'),
    (r'No restaurant associated', r'No business associated'),
]

def update_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for pattern, replacement in replacements:
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

# Walk through all .ts files in api directory
updated_count = 0
for root, dirs, files in os.walk(api_dir):
    for file in files:
        if file.endswith('.ts'):
            filepath = os.path.join(root, file)
            if update_file(filepath):
                updated_count += 1
                print(f"Updated: {filepath}")

print(f"\nTotal files updated: {updated_count}")
