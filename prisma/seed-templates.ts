import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const templates = [
  {
    id: 'qr_template_minimal_001',
    name: 'Minimal QR',
    category: 'minimal',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="white"/>
      <text x="200" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#0ea5e9">{{business.name}}</text>
      <text x="200" y="70" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#64748b">{{custom.message}}</text>
      <image x="100" y="100" width="200" height="200" href="{{qr.dataUrl}}"/>
      <text x="200" y="330" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#94a3b8">Scan to order</text>
      <text x="200" y="360" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#cbd5e1">{{business.phone}}</text>
    </svg>`,
    previewUrl: null,
    isActive: true,
  },
  {
    id: 'qr_template_table_tent_001',
    name: 'Table Tent',
    category: 'table_tent',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
      <rect width="600" height="400" fill="{{custom.primaryColor}}"/>
      <rect x="20" y="20" width="560" height="360" fill="white" rx="10"/>
      <text x="300" y="60" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="{{custom.primaryColor}}">{{business.name}}</text>
      <text x="300" y="95" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#64748b">{{custom.message}}</text>
      <image x="200" y="120" width="200" height="200" href="{{qr.dataUrl}}"/>
      <text x="300" y="345" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#94a3b8">Table {{custom.tableNumber}}</text>
      <text x="300" y="370" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#cbd5e1">{{business.phone}} • {{business.address}}</text>
    </svg>`,
    previewUrl: null,
    isActive: true,
  },
  {
    id: 'qr_template_poster_001',
    name: 'Menu Poster',
    category: 'menu_poster',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200">
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
    </svg>`,
    previewUrl: null,
    isActive: true,
  },
  {
    id: 'qr_template_coaster_001',
    name: 'Coaster Round',
    category: 'coaster',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <circle cx="200" cy="200" r="195" fill="{{custom.primaryColor}}"/>
      <circle cx="200" cy="200" r="185" fill="white"/>
      <text x="200" y="60" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="{{custom.primaryColor}}">{{business.name}}</text>
      <image x="125" y="80" width="150" height="150" href="{{qr.dataUrl}}"/>
      <text x="200" y="260" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#64748b">{{custom.message}}</text>
      <text x="200" y="285" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#94a3b8">Scan to order</text>
    </svg>`,
    previewUrl: null,
    isActive: true,
  },
  {
    id: 'qr_template_business_card_001',
    name: 'Business Card',
    category: 'business_card',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="600" height="350">
      <rect width="600" height="350" fill="white"/>
      <rect x="0" y="0" width="600" height="80" fill="{{custom.primaryColor}}"/>
      <text x="30" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">{{business.name}}</text>
      <image x="30" y="110" width="150" height="150" href="{{qr.dataUrl}}"/>
      <text x="220" y="140" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1e293b">{{custom.message}}</text>
      <text x="220" y="180" font-family="Arial, sans-serif" font-size="14" fill="#64748b">{{business.phone}}</text>
      <text x="220" y="210" font-family="Arial, sans-serif" font-size="14" fill="#64748b">{{business.address}}</text>
      <text x="220" y="250" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">Scan to view our menu</text>
    </svg>`,
    previewUrl: null,
    isActive: true,
  },
]

async function main() {
  console.log('Seeding QR templates...')
  
  for (const template of templates) {
    await prisma.qrTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    })
    console.log(`✓ Seeded template: ${template.name}`)
  }
  
  console.log('✓ All templates seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
