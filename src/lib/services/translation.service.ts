import { prisma } from '@/lib/prisma'

export const SUPPORTED_LOCALES = ['en', 'rw', 'fr', 'sw'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export class TranslationService {
  static async getTranslations(menuItemId: string) {
    return prisma.menuItemTranslation.findMany({ where: { menuItemId } })
  }

  static async upsertTranslation(params: {
    menuItemId: string
    businessId: string
    locale: string
    name: string
    description?: string
  }) {
    return prisma.menuItemTranslation.upsert({
      where: { menuItemId_locale: { menuItemId: params.menuItemId, locale: params.locale } },
      update: { name: params.name, description: params.description },
      create: {
        menuItemId: params.menuItemId,
        businessId: params.businessId,
        locale: params.locale,
        name: params.name,
        description: params.description,
      },
    })
  }

  static async deleteTranslation(menuItemId: string, locale: string) {
    return prisma.menuItemTranslation.delete({
      where: { menuItemId_locale: { menuItemId, locale } },
    })
  }

  static async getMenuWithTranslations(businessId: string, locale: string) {
    const items = await prisma.menuItem.findMany({
      where: { businessId, isAvailable: true },
      include: {
        translations: { where: { locale } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return items.map(item => {
      const t = item.translations[0]
      return {
        ...item,
        name: t?.name || item.name,
        description: t?.description || item.description,
        translations: undefined,
      }
    })
  }
}
