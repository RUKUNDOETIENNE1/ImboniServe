/**
 * OEC-001E Executive Excellence Remediation Tests
 *
 * Tests for executive decision quality improvements implemented in OEC-001E:
 * - EXEC-CRIT-001: AI Assistant suggested actions must be clickable across all executive centers
 */

import fs from 'fs'
import path from 'path'

describe('OEC-001E Executive Excellence Remediation', () => {
  const componentsDir = path.join(process.cwd(), 'src', 'components', 'executive')
  const pagesDir = path.join(process.cwd(), 'src', 'pages', 'admin', 'executive')

  const readComponent = (name: string): string => {
    return fs.readFileSync(path.join(componentsDir, name), 'utf-8')
  }

  const readPage = (name: string): string => {
    return fs.readFileSync(path.join(pagesDir, name), 'utf-8')
  }

  describe('EXEC-CRIT-001: AI Assistant actionability across all centers', () => {
    const allAIAssistants = [
      'AIAssistant.tsx',
      'AIFinancialAssistant.tsx',
      'AIOperationsAssistant.tsx',
      'AIMarketingAssistant.tsx',
      'AIPartnershipAssistant.tsx',
      'AICustomerSuccessAssistant.tsx',
      'AIIntelligenceAssistant.tsx',
    ]

    allAIAssistants.forEach((file) => {
      it(`${file} should accept onNavigate prop`, () => {
        const content = readComponent(file)
        expect(content).toContain('onNavigate')
      })

      it(`${file} should render suggested actions as clickable buttons (not plain text)`, () => {
        const content = readComponent(file)
        // Every AI assistant should have a <button> with onClick that calls onNavigate
        expect(content).toContain('<button')
        // The button should call onNavigate
        expect(content).toMatch(/onNavigate\?\.\(/)
      })
    })

    it('AIAssistant (CEO) should pass onNavigate from the page', () => {
      const content = readPage('ceo.tsx')
      expect(content).toContain('AIAssistant')
      expect(content).toContain('onNavigate={handleNavigate}')
    })

    it('AIPartnershipAssistant should pass onNavigate from the page', () => {
      const content = readPage('partnership-director.tsx')
      expect(content).toContain('AIPartnershipAssistant')
      expect(content).toContain('onNavigate={handleNavigate}')
    })

    it('AIIntelligenceAssistant should pass onNavigate from the page', () => {
      const content = readPage('executive-intelligence.tsx')
      expect(content).toContain('AIIntelligenceAssistant')
      expect(content).toContain('onNavigate={handleNavigate}')
    })

    it('AIFinancialAssistant should pass onNavigate from the page', () => {
      const content = readPage('cfo.tsx')
      expect(content).toContain('AIFinancialAssistant')
      expect(content).toContain('onNavigate={handleNavigate}')
    })

    it('AIOperationsAssistant should pass onNavigate from the page', () => {
      const content = readPage('coo.tsx')
      expect(content).toContain('AIOperationsAssistant')
      expect(content).toContain('onNavigate={handleNavigate}')
    })

    it('AIMarketingAssistant should pass onNavigate from the page', () => {
      const content = readPage('cmo.tsx')
      expect(content).toContain('AIMarketingAssistant')
      expect(content).toContain('onNavigate={handleNavigate}')
    })

    it('AICustomerSuccessAssistant should pass onNavigate from the page', () => {
      const content = readPage('customer-success-director.tsx')
      expect(content).toContain('AICustomerSuccessAssistant')
      expect(content).toContain('onNavigate={handleNavigate}')
    })
  })

  describe('AIIntelligenceAssistant cross-center navigation', () => {
    it('should have centerLinkMap for cross-center navigation', () => {
      const content = readComponent('AIIntelligenceAssistant.tsx')
      expect(content).toContain('centerLinkMap')
      expect(content).toContain("'CEO'")
      expect(content).toContain("'CFO'")
      expect(content).toContain("'COO'")
      expect(content).toContain("'CMO'")
      expect(content).toContain("'Partnership Director'")
      expect(content).toContain("'Customer Success Director'")
    })

    it('should navigate to the first center mentioned in the insight', () => {
      const content = readComponent('AIIntelligenceAssistant.tsx')
      expect(content).toContain('insight.centers[0]')
      expect(content).toContain('centerLinkMap')
    })
  })

  describe('Executive Excellence Framework — all centers answer 6 questions', () => {
    const executivePages = [
      'ceo.tsx',
      'cfo.tsx',
      'coo.tsx',
      'cmo.tsx',
      'partnership-director.tsx',
      'customer-success-director.tsx',
      'executive-intelligence.tsx',
    ]

    executivePages.forEach((page) => {
      it(`${page} should have AI Assistant for recommendations (Q4: Recommendation)`, () => {
        const content = readPage(page)
        const hasAI = content.includes('AIAssistant') ||
                      content.includes('AIFinancial') ||
                      content.includes('AIOperations') ||
                      content.includes('AIMarketing') ||
                      content.includes('AIPartnership') ||
                      content.includes('AICustomerSuccess') ||
                      content.includes('AIIntelligence')
        expect(hasAI).toBe(true)
      })

      it(`${page} should have Attention Center or Priority Queue for prioritization (Q3: Prioritization)`, () => {
        const content = readPage(page)
        const hasPrioritization = content.includes('AttentionCenter') ||
                                   content.includes('Attention') ||
                                   content.includes('attention') ||
                                   content.includes('PriorityQueue') ||
                                   content.includes('priority')
        expect(hasPrioritization).toBe(true)
      })

      it(`${page} should have Daily Brief or Pulse for awareness (Q1: Awareness)`, () => {
        const content = readPage(page)
        const hasAwareness = content.includes('DailyBrief') ||
                             content.includes('Daily') ||
                             content.includes('brief') ||
                             content.includes('Pulse') ||
                             content.includes('pulse')
        expect(hasAwareness).toBe(true)
      })

      it(`${page} should have drill-down navigation for actionability (Q6: Actionability)`, () => {
        const content = readPage(page)
        expect(content).toContain('handleNavigate')
        expect(content).toContain('router.push')
      })
    })
  })

  describe('Cross-center metric consistency', () => {
    it('all executive API endpoints should exist', () => {
      const apiDir = path.join(process.cwd(), 'src', 'pages', 'api', 'admin', 'executive')
      const expectedApis = [
        'ceo.ts',
        'cfo.ts',
        'coo.ts',
        'cmo.ts',
        'partnership-director.ts',
        'customer-success-director.ts',
        'executive-intelligence.ts',
      ]
      expectedApis.forEach((api) => {
        expect(fs.existsSync(path.join(apiDir, api))).toBe(true)
      })
    })

    it('all executive pages should have role-based access control', () => {
      const executivePages = [
        'ceo.tsx',
        'cfo.tsx',
        'coo.tsx',
        'cmo.tsx',
        'partnership-director.tsx',
        'customer-success-director.tsx',
        'executive-intelligence.tsx',
      ]
      executivePages.forEach((page) => {
        const content = readPage(page)
        expect(content).toContain('getServerSession')
        expect(content).toMatch(/roles|allowedRoles|ADMIN/)
      })
    })
  })

  describe('Severity level consistency across centers', () => {
    const attentionComponents = [
      'AttentionCenter.tsx',
      'FinancialAttentionCenter.tsx',
      'OperationalAttentionCenter.tsx',
      'MarketingAttentionCenter.tsx',
      'PartnershipAttentionCenter.tsx',
      'CustomerAttentionCenter.tsx',
    ]

    attentionComponents.forEach((component) => {
      it(`${component} should use 4-level severity system`, () => {
        const fullPath = path.join(componentsDir, component)
        if (!fs.existsSync(fullPath)) return
        const content = fs.readFileSync(fullPath, 'utf-8')
        expect(content).toContain('CRITICAL')
        expect(content).toContain('HIGH')
        expect(content).toContain('MEDIUM')
        expect(content).toContain('LOW')
      })
    })
  })
})
