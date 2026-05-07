-- Seed QR Templates for Imboni Serve
-- Run this after ensuring the QrTemplate table exists

INSERT INTO "QrTemplate" ("id", "name", "category", "svgTemplate", "previewUrl", "isActive", "createdAt")
VALUES
  (
    'qr_template_minimal_001',
    'Minimal QR',
    'minimal',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="white"/>
      <text x="200" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#0ea5e9">{{business.name}}</text>
      <text x="200" y="70" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#64748b">{{custom.message}}</text>
      <image x="100" y="100" width="200" height="200" href="{{qr.dataUrl}}"/>
      <text x="200" y="330" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#94a3b8">Scan to order</text>
      <text x="200" y="360" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#cbd5e1">{{business.phone}}</text>
    </svg>',
    NULL,
    true,
    NOW()
  ),
  (
    'qr_template_table_tent_001',
    'Table Tent',
    'table_tent',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
      <rect width="600" height="400" fill="{{custom.primaryColor}}"/>
      <rect x="20" y="20" width="560" height="360" fill="white" rx="10"/>
      <text x="300" y="60" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="{{custom.primaryColor}}">{{business.name}}</text>
      <text x="300" y="95" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#64748b">{{custom.message}}</text>
      <image x="200" y="120" width="200" height="200" href="{{qr.dataUrl}}"/>
      <text x="300" y="345" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#94a3b8">Table {{custom.tableNumber}}</text>
      <text x="300" y="370" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#cbd5e1">{{business.phone}} • {{business.address}}</text>
    </svg>',
    NULL,
    true,
    NOW()
  ),
  (
    'qr_template_poster_001',
    'Menu Poster',
    'menu_poster',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:{{custom.primaryColor}};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="1200" fill="url(#grad1)"/>
      <rect x="40" y="40" width="720" height="1120" fill="white" rx="20" opacity="0.95"/>
      <text x="400" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="{{custom.primaryColor}}">{{business.name}}</text>
      <text x="400" y="170" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#64748b">{{custom.message}}</text>
      <line x1="100" y1="200" x2="700" y2="200" stroke="#e2e8f0" stroke-width="2"/>
      <image x="250" y="250" width="300" height="300" href="{{qr.dataUrl}}"/>
      <text x="400" y="600" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#1e293b">Scan to View Menu</text>
      <text x="400" y="640" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#64748b">Order from your phone</text>
      <text x="400" y="680" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#64748b">No app needed • Fast checkout</text>
      <rect x="100" y="750" width="600" height="300" fill="#f8fafc" rx="10"/>
      <text x="400" y="800" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#334155">Contact Us</text>
      <text x="400" y="850" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#64748b">{{business.phone}}</text>
      <text x="400" y="890" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#64748b">{{business.address}}</text>
    </svg>',
    NULL,
    true,
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;
