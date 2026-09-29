/**
 * VERCEL-002C — Vercel Cron Hobby Plan Compatibility Regression Test
 *
 * Ensures vercel.json never contains a sub-daily cron schedule that
 * would cause Vercel Hobby plan to reject the deployment.
 *
 * Root cause of VERCEL-002B: Guardian cron (every-2-minutes) was rejected
 * by Vercel Hobby, breaking the entire deployment pipeline.
 *
 * This test prevents regression by verifying ALL cron schedules in
 * vercel.json run at most once per day.
 */

import * as fs from 'fs'
import * as path from 'path'

const vercelJsonPath = path.resolve(__dirname, '../../vercel.json')
const raw = fs.readFileSync(vercelJsonPath, 'utf-8')
const vercelJson = JSON.parse(raw)

describe('VERCEL-002C: vercel.json Hobby Plan Compatibility', () => {
  it('vercel.json should exist and be valid JSON', () => {
    expect(vercelJson).toBeDefined()
    expect(typeof vercelJson).toBe('object')
  })

  it('vercel.json should have crons array', () => {
    expect(vercelJson.crons).toBeDefined()
    expect(Array.isArray(vercelJson.crons)).toBe(true)
    expect(vercelJson.crons.length).toBeGreaterThan(0)
  })

  describe('each cron schedule must be daily (Hobby-compatible)', () => {
    for (const cron of vercelJson.crons) {
      describe(`cron: ${cron.path}`, () => {
        it('should have a path', () => {
          expect(cron.path).toBeDefined()
          expect(typeof cron.path).toBe('string')
          expect(cron.path).toMatch(/^\/api\/cron\//)
        })

        it('should have a schedule', () => {
          expect(cron.schedule).toBeDefined()
          expect(typeof cron.schedule).toBe('string')
        })

        it('schedule should NOT contain */ (sub-daily frequency)', () => {
          expect(cron.schedule).not.toContain('*/')
        })

        it('schedule should match daily pattern: 0 N * * *', () => {
          // Valid: "0 0 * * *" through "0 23 * * *"
          const dailyPattern = /^0\s+([0-9]|1[0-9]|2[0-3])\s+\*\s+\*\s+\*$/
          expect(cron.schedule).toMatch(dailyPattern)
        })

        it('schedule should run exactly once per day', () => {
          const parts = cron.schedule.split(/\s+/)
          // minute=0, hour=0-23, day=*, month=*, dow=*
          expect(parts[0]).toBe('0')
          expect(parseInt(parts[1])).toBeGreaterThanOrEqual(0)
          expect(parseInt(parts[1])).toBeLessThanOrEqual(23)
          expect(parts[2]).toBe('*')
          expect(parts[3]).toBe('*')
          expect(parts[4]).toBe('*')
        })
      })
    }
  })

  it('Guardian cron should NOT be */2 * * * * (the VERCEL-002B root cause)', () => {
    const guardianCron = vercelJson.crons.find(
      (c: any) => c.path === '/api/cron/guardian'
    )
    expect(guardianCron).toBeDefined()
    expect(guardianCron.schedule).not.toBe('*/2 * * * *')
  })

  it('Guardian cron should be daily (0 1 * * *)', () => {
    const guardianCron = vercelJson.crons.find(
      (c: any) => c.path === '/api/cron/guardian'
    )
    expect(guardianCron).toBeDefined()
    expect(guardianCron.schedule).toBe('0 1 * * *')
  })

  it('Promise Engine cron should exist as daily fallback', () => {
    const peCron = vercelJson.crons.find(
      (c: any) => c.path === '/api/cron/promise-evaluation'
    )
    expect(peCron).toBeDefined()
    expect(peCron.schedule).toBe('0 0 * * *')
  })

  it('no cron should run more than once per day', () => {
    const subDaily = vercelJson.crons.filter((c: any) => {
      const s = c.schedule
      if (s.includes('*/')) return true
      const parts = s.split(/\s+/)
      if (parts[0] !== '0') return true // non-zero minute = could be frequent
      if (parts[1].includes(',') || parts[1].includes('-') || parts[1].includes('/')) {
        return true
      }
      return false
    })
    expect(subDaily).toEqual([])
    if (subDaily.length > 0) {
      console.error('Sub-daily crons found:', subDaily)
    }
  })
})
