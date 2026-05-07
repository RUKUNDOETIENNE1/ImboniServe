import { describe, it, expect } from '@jest/globals'

// RFM Segmentation Tests
describe('RFM Customer Segmentation', () => {
  // Helper function to calculate RFM scores
  const calculateRFMScore = (recency: number, frequency: number, monetary: number) => {
    // Normalize scores to 1-5 scale
    const recencyScore = recency <= 30 ? 5 : recency <= 60 ? 4 : recency <= 90 ? 3 : recency <= 180 ? 2 : 1
    const frequencyScore = frequency >= 20 ? 5 : frequency >= 10 ? 4 : frequency >= 5 ? 3 : frequency >= 2 ? 2 : 1
    const monetaryScore = monetary >= 500000 ? 5 : monetary >= 200000 ? 4 : monetary >= 100000 ? 3 : monetary >= 50000 ? 2 : 1
    
    return { recencyScore, frequencyScore, monetaryScore }
  }

  const getSegment = (r: number, f: number, m: number) => {
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions'
    if (r >= 3 && f >= 3 && m >= 3) return 'Loyal'
    if (r >= 4 && f <= 2) return 'New'
    if (r <= 2 && f >= 3) return 'At Risk'
    if (r <= 2 && f <= 2) return 'Lost'
    return 'Promising'
  }

  describe('Score Calculation', () => {
    it('should assign highest scores to recent, frequent, high-value customers', () => {
      const { recencyScore, frequencyScore, monetaryScore } = calculateRFMScore(15, 25, 600000)
      
      expect(recencyScore).toBe(5)
      expect(frequencyScore).toBe(5)
      expect(monetaryScore).toBe(5)
    })

    it('should assign lowest scores to old, infrequent, low-value customers', () => {
      const { recencyScore, frequencyScore, monetaryScore } = calculateRFMScore(200, 1, 10000)
      
      expect(recencyScore).toBe(1)
      expect(frequencyScore).toBe(1)
      expect(monetaryScore).toBe(1)
    })

    it('should handle mid-range customers correctly', () => {
      const { recencyScore, frequencyScore, monetaryScore } = calculateRFMScore(75, 7, 150000)
      
      expect(recencyScore).toBe(3)
      expect(frequencyScore).toBe(3)
      expect(monetaryScore).toBe(3)
    })
  })

  describe('Segment Assignment', () => {
    it('should classify as Champions when all scores are high', () => {
      const segment = getSegment(5, 5, 5)
      expect(segment).toBe('Champions')
    })

    it('should classify as Loyal when scores are good', () => {
      const segment = getSegment(3, 4, 4)
      expect(segment).toBe('Loyal')
    })

    it('should classify as New when recent but low frequency', () => {
      const segment = getSegment(5, 1, 3)
      expect(segment).toBe('New')
    })

    it('should classify as At Risk when not recent but frequent', () => {
      const segment = getSegment(2, 4, 4)
      expect(segment).toBe('At Risk')
    })

    it('should classify as Lost when all scores are low', () => {
      const segment = getSegment(1, 1, 1)
      expect(segment).toBe('Lost')
    })

    it('should classify as Promising for mixed scores', () => {
      const segment = getSegment(3, 2, 3)
      expect(segment).toBe('Promising')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const { recencyScore, frequencyScore, monetaryScore } = calculateRFMScore(0, 0, 0)
      
      expect(recencyScore).toBeGreaterThanOrEqual(1)
      expect(frequencyScore).toBeGreaterThanOrEqual(1)
      expect(monetaryScore).toBeGreaterThanOrEqual(1)
    })

    it('should handle very large values', () => {
      const { recencyScore, frequencyScore, monetaryScore } = calculateRFMScore(1000, 1000, 10000000)
      
      expect(recencyScore).toBeLessThanOrEqual(5)
      expect(frequencyScore).toBeLessThanOrEqual(5)
      expect(monetaryScore).toBeLessThanOrEqual(5)
    })
  })

  describe('Business Logic', () => {
    it('should prioritize recency for Champions', () => {
      const championSegment = getSegment(5, 5, 5)
      const notChampion = getSegment(3, 5, 5)
      
      expect(championSegment).toBe('Champions')
      expect(notChampion).not.toBe('Champions')
    })

    it('should identify At Risk customers correctly', () => {
      const atRisk = getSegment(1, 5, 5)
      expect(atRisk).toBe('At Risk')
    })

    it('should welcome New customers', () => {
      const newCustomer = getSegment(5, 1, 2)
      expect(newCustomer).toBe('New')
    })
  })
})
