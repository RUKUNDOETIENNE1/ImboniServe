import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

function menuPosterSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="1200" viewBox="0 0 800 1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{{custom.primaryColor}}" />
      <stop offset="100%" stop-color="#1b4f72" />
    </linearGradient>
  </defs>
  <rect width="800" height="1200" fill="#f8f9fa"/>
  <rect x="0" y="0" width="800" height="220" fill="url(#grad)"/>
  <text x="400" y="110" font-family="Arial, sans-serif" font-size="48" fill="#ffffff" text-anchor="middle" font-weight="bold">{{business.name}}</text>
  <text x="400" y="160" font-family="Arial, sans-serif" font-size="18" fill="#ecf0f1" text-anchor="middle">{{custom.message}}</text>

  <rect x="60" y="260" width="680" height="70" fill="#ffffff" rx="8"/>
  <text x="80" y="305" font-family="Arial, sans-serif" font-size="28" fill="#2c3e50" font-weight="bold">Menu</text>

  <rect x="60" y="350" width="680" height="120" fill="#ffffff" rx="8"/>
  <text x="80" y="385" font-family="Arial, sans-serif" font-size="20" fill="#2c3e50" font-weight="600">Sample Dish</text>
  <text x="80" y="415" font-family="Arial, sans-serif" font-size="14" fill="#7f8c8d">Delicious description of the dish</text>
  <text x="720" y="385" font-family="Arial, sans-serif" font-size="20" fill="{{custom.primaryColor}}" text-anchor="end" font-weight="bold">5,000 RWF</text>

  <rect x="60" y="1100" width="680" height="70" fill="#ecf0f1" rx="8"/>
  <text x="400" y="1145" font-family="Arial, sans-serif" font-size="16" fill="#7f8c8d" text-anchor="middle">{{business.phone}} • {{business.address}}</text>
</svg>`
}

function tableTentSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="400" fill="#ffffff"/>
  <rect x="20" y="20" width="560" height="360" fill="#f8f9fa" stroke="{{custom.primaryColor}}" stroke-width="3" rx="12"/>
  <text x="300" y="110" font-family="Arial, sans-serif" font-size="40" fill="#2c3e50" text-anchor="middle" font-weight="bold">{{business.name}}</text>
  <text x="300" y="150" font-family="Arial, sans-serif" font-size="18" fill="#7f8c8d" text-anchor="middle">{{custom.message}}</text>
  <rect x="225" y="180" width="150" height="150" fill="#ffffff" stroke="#ddd" rx="10"/>
  <image href="{{qr.dataUrl}}" x="230" y="185" width="140" height="140"/>
  <text x="300" y="360" font-family="Arial, sans-serif" font-size="16" fill="#7f8c8d" text-anchor="middle">Table {{custom.tableNumber}}</text>
</svg>`
}

function coasterSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="200" cy="200" r="190" fill="{{custom.primaryColor}}"/>
  <circle cx="200" cy="200" r="170" fill="#ffffff"/>
  <text x="200" y="170" font-family="Arial, sans-serif" font-size="28" fill="#2c3e50" text-anchor="middle" font-weight="bold">{{business.name}}</text>
  <image href="{{qr.dataUrl}}" x="150" y="190" width="100" height="100"/>
</svg>`
}

function stickerSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="280" height="280" rx="20" fill="#ffffff" stroke="{{custom.primaryColor}}" stroke-width="4"/>
  <text x="150" y="80" font-family="Arial, sans-serif" font-size="22" fill="#2c3e50" text-anchor="middle" font-weight="bold">{{business.name}}</text>
  <image href="{{qr.dataUrl}}" x="100" y="100" width="100" height="100"/>
  <text x="150" y="230" font-family="Arial, sans-serif" font-size="14" fill="#7f8c8d" text-anchor="middle">{{custom.message}}</text>
</svg>`
}

function aFrameSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="800" fill="{{custom.primaryColor}}"/>
  <rect x="50" y="90" width="500" height="620" fill="#ffffff" rx="16"/>
  <text x="300" y="160" font-family="Arial, sans-serif" font-size="42" fill="#2c3e50" text-anchor="middle" font-weight="bold">Scan to Order</text>
  <image href="{{qr.dataUrl}}" x="225" y="200" width="150" height="150"/>
  <text x="300" y="400" font-family="Arial, sans-serif" font-size="24" fill="#2c3e50" text-anchor="middle">{{business.name}}</text>
  <text x="300" y="440" font-family="Arial, sans-serif" font-size="16" fill="#7f8c8d" text-anchor="middle">{{business.address}}</text>
</svg>`
}

function businessCardSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="240" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="240" fill="#2c3e50" rx="8"/>
  <rect x="10" y="10" width="380" height="220" fill="#ffffff" rx="8"/>
  <text x="200" y="80" font-family="Arial, sans-serif" font-size="24" fill="#2c3e50" text-anchor="middle" font-weight="bold">{{business.name}}</text>
  <text x="200" y="105" font-family="Arial, sans-serif" font-size="14" fill="#7f8c8d" text-anchor="middle">{{custom.message}}</text>
  <image href="{{qr.dataUrl}}" x="165" y="120" width="70" height="70"/>
  <text x="200" y="210" font-family="Arial, sans-serif" font-size="12" fill="#7f8c8d" text-anchor="middle">{{business.phone}} • {{business.address}}</text>
</svg>`
}

async function upsertTemplate(name: string, category: string, svg: string, previewUrl?: string) {
  // Try update first
  const updated: number = await prisma.$executeRaw`UPDATE "QrTemplate" SET "svgTemplate" = ${svg}, "previewUrl" = ${previewUrl ?? null}, "isActive" = true WHERE "name" = ${name} AND "category" = ${category}`
  if (updated && updated > 0) {
    console.log(`↻ Updated template: ${name}`)
    return
  }
  // Insert if not existing (provide id explicitly)
  const id = randomUUID()
  await prisma.$executeRaw`INSERT INTO "QrTemplate" ("id", "name", "category", "svgTemplate", "previewUrl") VALUES (${id}, ${name}, ${category}, ${svg}, ${previewUrl ?? null})`
  console.log(`✔ Created template: ${name}`)
}

async function main() {
  console.log('🌱 Seeding QR templates...')

  await upsertTemplate('Menu Poster Classic', 'menu_poster', menuPosterSVG(), '/templates/menu-template-1.svg')
  await upsertTemplate('Table Tent Classic', 'table_tent', tableTentSVG(), '/templates/table-tent-template-1.svg')
  await upsertTemplate('Coaster Round', 'coaster', coasterSVG(), '/templates/coaster-template-1.svg')
  await upsertTemplate('Sticker Square', 'sticker', stickerSVG(), '/templates/sticker-template-1.svg')
  await upsertTemplate('A-Frame Sign', 'aframe', aFrameSVG(), '/templates/aframe-template-1.svg')
  await upsertTemplate('Business Card', 'business_card', businessCardSVG(), '/templates/business-card-template-1.svg')

  console.log('✅ QR templates seeded successfully')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
