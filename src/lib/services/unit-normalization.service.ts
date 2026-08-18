export class UnitNormalizationService {
  private static canonical(raw: string): string {
    return (raw || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\.,]/g, '')
  }

  static normalizeUnit(raw: string): string {
    const s = this.canonical(raw)
    if (!s) return ''

    const map: Record<string, string> = {
      unit: 'unit',
      units: 'unit',
      u: 'unit',
      piece: 'pcs',
      pieces: 'pcs',
      pc: 'pcs',
      pcs: 'pcs',
      each: 'pcs',

      kg: 'kg',
      kgs: 'kg',
      kilogram: 'kg',
      kilograms: 'kg',

      g: 'g',
      gram: 'g',
      grams: 'g',

      l: 'l',
      litre: 'l',
      litres: 'l',
      liter: 'l',
      liters: 'l',

      ml: 'ml',
      milliliter: 'ml',
      milliliters: 'ml',
      millilitre: 'ml',
      millilitres: 'ml',

      box: 'box',
      boxes: 'box',
      pack: 'pack',
      packs: 'pack',
      pkt: 'pack',
      bag: 'bag',
      bags: 'bag',
      bottle: 'bottle',
      bottles: 'bottle',
    }

    return map[s] || s
  }

  static unitsMatch(extractedUnitRaw: string, inventoryUnitRaw: string): boolean {
    const a = this.normalizeUnit(extractedUnitRaw)
    const b = this.normalizeUnit(inventoryUnitRaw)
    return a !== '' && b !== '' && a === b
  }
}
