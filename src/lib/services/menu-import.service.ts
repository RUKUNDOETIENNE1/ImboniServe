import Papa from 'papaparse'

export interface MenuItemImport {
  category: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  available?: boolean
}

export interface MenuImportResult {
  success: boolean
  items: MenuItemImport[]
  errors: string[]
  warnings: string[]
}

export class MenuImportService {
  static async importFromCSV(file: File): Promise<MenuImportResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const items: MenuItemImport[] = []
          const errors: string[] = []
          const warnings: string[] = []

          results.data.forEach((row: any, index: number) => {
            const lineNum = index + 2

            if (!row.name || !row.category) {
              errors.push(`Line ${lineNum}: Missing required fields (name, category)`)
              return
            }

            const price = parseFloat(row.price)
            if (isNaN(price) || price < 0) {
              errors.push(`Line ${lineNum}: Invalid price "${row.price}"`)
              return
            }

            if (row.imageUrl && !this.isValidUrl(row.imageUrl)) {
              warnings.push(`Line ${lineNum}: Invalid image URL "${row.imageUrl}"`)
            }

            items.push({
              category: row.category.trim(),
              name: row.name.trim(),
              description: row.description?.trim() || '',
              price: Math.round(price * 100),
              imageUrl: row.imageUrl?.trim() || '',
              available: row.available !== 'false' && row.available !== '0'
            })
          })

          resolve({
            success: errors.length === 0,
            items,
            errors,
            warnings
          })
        },
        error: (error) => {
          resolve({
            success: false,
            items: [],
            errors: [error.message],
            warnings: []
          })
        }
      })
    })
  }

  static async importFromGoogleSheets(sheetUrl: string): Promise<MenuImportResult> {
    try {
      const csvUrl = this.convertGoogleSheetsToCsvUrl(sheetUrl)
      
      const response = await fetch(csvUrl)
      if (!response.ok) {
        return {
          success: false,
          items: [],
          errors: ['Failed to fetch Google Sheets data. Make sure the sheet is publicly accessible.'],
          warnings: []
        }
      }

      const csvText = await response.text()
      const blob = new Blob([csvText], { type: 'text/csv' })
      const file = new File([blob], 'import.csv', { type: 'text/csv' })

      return this.importFromCSV(file)
    } catch (error) {
      return {
        success: false,
        items: [],
        errors: [(error as Error).message],
        warnings: []
      }
    }
  }

  static convertGoogleSheetsToCsvUrl(sheetUrl: string): string {
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
    const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/)
    
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL')
    }

    const sheetId = sheetIdMatch[1]
    const gid = gidMatch ? gidMatch[1] : '0'

    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static generateSampleCSV(): string {
    const headers = ['category', 'name', 'description', 'price', 'imageUrl', 'available']
    const sampleRows = [
      ['Appetizers', 'Spring Rolls', 'Crispy vegetable spring rolls', '5.99', 'https://example.com/spring-rolls.jpg', 'true'],
      ['Appetizers', 'Samosas', 'Spiced potato samosas', '4.99', '', 'true'],
      ['Main Course', 'Grilled Chicken', 'Marinated grilled chicken breast', '12.99', '', 'true'],
      ['Main Course', 'Beef Stew', 'Traditional Rwandan beef stew', '14.99', '', 'true'],
      ['Beverages', 'Fresh Juice', 'Seasonal fresh fruit juice', '3.99', '', 'true'],
      ['Desserts', 'Chocolate Cake', 'Rich chocolate layer cake', '6.99', '', 'true']
    ]

    const csv = [headers, ...sampleRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return csv
  }

  static downloadSampleCSV(): void {
    const csv = this.generateSampleCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'menu-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  static groupItemsByCategory(items: MenuItemImport[]): Map<string, MenuItemImport[]> {
    const grouped = new Map<string, MenuItemImport[]>()
    
    items.forEach(item => {
      const category = item.category
      if (!grouped.has(category)) {
        grouped.set(category, [])
      }
      grouped.get(category)!.push(item)
    })

    return grouped
  }

  static validateImportData(items: MenuItemImport[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (items.length === 0) {
      errors.push('No items to import')
    }

    const categories = new Set(items.map(i => i.category))
    if (categories.size === 0) {
      errors.push('No categories found')
    }

    const duplicates = new Map<string, number>()
    items.forEach(item => {
      const key = `${item.category}:${item.name}`
      duplicates.set(key, (duplicates.get(key) || 0) + 1)
    })

    duplicates.forEach((count, key) => {
      if (count > 1) {
        errors.push(`Duplicate item found: ${key.replace(':', ' - ')} (${count} times)`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
