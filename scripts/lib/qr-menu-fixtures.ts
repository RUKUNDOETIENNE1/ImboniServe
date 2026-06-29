import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { pluginRunner } from '@/lib/die/plugins/runtime/plugin-runner'
import { QRMenuPlugin } from '@/lib/die/plugins/built-in/qr-menu.plugin'

type FixtureState = {
  primaryBusinessId: string
  secondaryBusinessId: string
  createdSecondaryBusiness?: boolean
  menuId: string
  publicUrl: string
}

export type { FixtureState as QrMenuFixtureState }

export async function ensureQrMenuFixtures(): Promise<FixtureState> {
  const primaryBusiness = await prisma.business.findFirst()
  if (!primaryBusiness) {
    throw new Error('No businesses available. Populate Business data before running validation.')
  }

  const services = pluginRunner.getServices(primaryBusiness.id)
  if (QRMenuPlugin.install) {
    await QRMenuPlugin.install({ services })
  }

  let secondaryBusiness = await prisma.business.findFirst({ where: { id: { not: primaryBusiness.id } } })
  let createdSecondaryBusiness = false

  if (!secondaryBusiness) {
    secondaryBusiness = await prisma.business.create({
      data: {
        id: `plugin-cert-${nanoid(10)}`,
        name: 'Plugin Certification Tenant',
        phone: primaryBusiness.phone,
        ownerId: primaryBusiness.ownerId,
        currency: primaryBusiness.currency,
        timezone: primaryBusiness.timezone,
        city: primaryBusiness.city,
        district: primaryBusiness.district,
        country: primaryBusiness.country,
      },
    })
    createdSecondaryBusiness = true
  }

  const menuId = `plugin-cert-${nanoid(10)}`
  const publicUrl = `/plugins/qr-menu/${menuId}`

  const prismaAny = prisma as any
  await prismaAny.pluginQrMenu.upsert({
    where: { id: menuId },
    update: {
      businessId: primaryBusiness.id,
      menuItems: [
        { name: 'Grilled Brochette', price: 4000, category: 'Mains' },
        { name: 'Chapati Royale', price: 2500, category: 'Starters' },
      ],
      qrCodeStorageKey: `cert://qr/${menuId}`,
      jsonStorageKey: `cert://json/${menuId}`,
      publicUrl,
      sourceDocumentId: null,
      sourceScanJobId: null,
      sourceFileKey: `cert://file/${menuId}.png`,
      status: 'GENERATED',
      updatedAt: new Date(),
    },
    create: {
      id: menuId,
      businessId: primaryBusiness.id,
      menuItems: [
        { name: 'Grilled Brochette', price: 4000, category: 'Mains' },
        { name: 'Chapati Royale', price: 2500, category: 'Starters' },
      ],
      qrCodeStorageKey: `cert://qr/${menuId}`,
      jsonStorageKey: `cert://json/${menuId}`,
      publicUrl,
      sourceDocumentId: null,
      sourceScanJobId: null,
      sourceFileKey: `cert://file/${menuId}.png`,
      status: 'GENERATED',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  return {
    primaryBusinessId: primaryBusiness.id,
    secondaryBusinessId: secondaryBusiness.id,
    createdSecondaryBusiness,
    menuId,
    publicUrl,
  }
}

export async function cleanupQrMenuFixtures(state: FixtureState | null) {
  if (!state) return

  const prismaAny = prisma as any
  await prismaAny.pluginQrMenu
    .delete({
      where: { id: state.menuId },
    })
    .catch(() => null)

  if (state.createdSecondaryBusiness) {
    await prisma.business.delete({ where: { id: state.secondaryBusinessId } }).catch(() => null)
  }
}
