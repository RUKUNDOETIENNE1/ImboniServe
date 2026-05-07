import { describe, it, expect } from '@jest/globals'

// Staff Performance Calculation Tests
describe('Staff Performance Metrics', () => {
  // Helper function to calculate performance score
  const calculatePerformanceScore = (metrics: {
    ordersServed: number
    avgServiceTime: number
    customerRating: number
    tips: number
  }) => {
    const { ordersServed, avgServiceTime, customerRating, tips } = metrics
    
    // Scoring algorithm
    const orderScore = Math.min((ordersServed / 50) * 30, 30) // Max 30 points
    const speedScore = Math.max(30 - (avgServiceTime / 60) * 10, 0) // Max 30 points, faster is better
    const ratingScore = (customerRating / 5) * 25 // Max 25 points
    const tipScore = Math.min((tips / 50000) * 15, 15) // Max 15 points
    
    return Math.round(orderScore + speedScore + ratingScore + tipScore)
  }

  // Helper function to assign badge
  const assignBadge = (score: number, ordersServed: number) => {
    if (ordersServed < 10) return 'Rookie'
    if (score >= 90) return 'Gold'
    if (score >= 75) return 'Silver'
    if (score >= 60) return 'Bronze'
    if (score >= 50 && ordersServed >= 20) return 'Rising Star'
    return 'None'
  }

  describe('Performance Score Calculation', () => {
    it('should give perfect score to excellent performer', () => {
      const score = calculatePerformanceScore({
        ordersServed: 50,
        avgServiceTime: 120, // 2 minutes
        customerRating: 5.0,
        tips: 50000
      })
      
      expect(score).toBeGreaterThanOrEqual(95)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should give low score to poor performer', () => {
      const score = calculatePerformanceScore({
        ordersServed: 5,
        avgServiceTime: 600, // 10 minutes
        customerRating: 2.0,
        tips: 1000
      })
      
      expect(score).toBeLessThan(30)
    })

    it('should reward high order volume', () => {
      const highVolume = calculatePerformanceScore({
        ordersServed: 100,
        avgServiceTime: 300,
        customerRating: 3.5,
        tips: 10000
      })
      
      const lowVolume = calculatePerformanceScore({
        ordersServed: 10,
        avgServiceTime: 300,
        customerRating: 3.5,
        tips: 10000
      })
      
      expect(highVolume).toBeGreaterThan(lowVolume)
    })

    it('should reward fast service', () => {
      const fast = calculatePerformanceScore({
        ordersServed: 30,
        avgServiceTime: 120,
        customerRating: 4.0,
        tips: 20000
      })
      
      const slow = calculatePerformanceScore({
        ordersServed: 30,
        avgServiceTime: 480,
        customerRating: 4.0,
        tips: 20000
      })
      
      expect(fast).toBeGreaterThan(slow)
    })

    it('should reward high customer ratings', () => {
      const highRated = calculatePerformanceScore({
        ordersServed: 30,
        avgServiceTime: 300,
        customerRating: 5.0,
        tips: 20000
      })
      
      const lowRated = calculatePerformanceScore({
        ordersServed: 30,
        avgServiceTime: 300,
        customerRating: 2.0,
        tips: 20000
      })
      
      expect(highRated).toBeGreaterThan(lowRated)
    })

    it('should reward high tips', () => {
      const highTips = calculatePerformanceScore({
        ordersServed: 30,
        avgServiceTime: 300,
        customerRating: 4.0,
        tips: 100000
      })
      
      const lowTips = calculatePerformanceScore({
        ordersServed: 30,
        avgServiceTime: 300,
        customerRating: 4.0,
        tips: 5000
      })
      
      expect(highTips).toBeGreaterThan(lowTips)
    })
  })

  describe('Badge Assignment', () => {
    it('should assign Gold badge to top performers', () => {
      const badge = assignBadge(95, 50)
      expect(badge).toBe('Gold')
    })

    it('should assign Silver badge to good performers', () => {
      const badge = assignBadge(80, 40)
      expect(badge).toBe('Silver')
    })

    it('should assign Bronze badge to average performers', () => {
      const badge = assignBadge(65, 30)
      expect(badge).toBe('Bronze')
    })

    it('should assign Rookie badge to new staff', () => {
      const badge = assignBadge(70, 5)
      expect(badge).toBe('Rookie')
    })

    it('should assign Rising Star to improving performers', () => {
      const badge = assignBadge(55, 25)
      expect(badge).toBe('Rising Star')
    })

    it('should not give badge to underperformers', () => {
      const badge = assignBadge(40, 20)
      expect(badge).toBe('None')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const score = calculatePerformanceScore({
        ordersServed: 0,
        avgServiceTime: 0,
        customerRating: 0,
        tips: 0
      })
      
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should cap scores at 100', () => {
      const score = calculatePerformanceScore({
        ordersServed: 1000,
        avgServiceTime: 30,
        customerRating: 5.0,
        tips: 1000000
      })
      
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should handle negative service time gracefully', () => {
      const score = calculatePerformanceScore({
        ordersServed: 30,
        avgServiceTime: -100,
        customerRating: 4.0,
        tips: 20000
      })
      
      expect(score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Leaderboard Ranking', () => {
    it('should rank staff correctly', () => {
      const staff = [
        { name: 'Alice', score: calculatePerformanceScore({ ordersServed: 50, avgServiceTime: 120, customerRating: 5.0, tips: 50000 }) },
        { name: 'Bob', score: calculatePerformanceScore({ ordersServed: 30, avgServiceTime: 240, customerRating: 4.0, tips: 30000 }) },
        { name: 'Charlie', score: calculatePerformanceScore({ ordersServed: 20, avgServiceTime: 360, customerRating: 3.5, tips: 15000 }) }
      ]
      
      const ranked = staff.sort((a, b) => b.score - a.score)
      
      expect(ranked[0].name).toBe('Alice')
      expect(ranked[2].name).toBe('Charlie')
    })
  })
})
