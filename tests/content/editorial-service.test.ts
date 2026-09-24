import { EditorialService } from '../../src/lib/content/editorial.service'
import { hasEditorialAccess, isAdmin, isEditor, isReviewer, isPublisher, getEditorialUser } from '../../src/lib/content/auth'

describe('Editorial Auth Helpers', () => {
  const adminSession: any = {
    user: { id: 'u1', roles: ['ADMIN'], editorialRoles: [] }
  }
  const editorSession: any = {
    user: { id: 'u2', roles: ['OWNER'], editorialRoles: ['EDITOR'] }
  }
  const reviewerSession: any = {
    user: { id: 'u3', roles: ['OWNER'], editorialRoles: ['REVIEWER'] }
  }
  const publisherSession: any = {
    user: { id: 'u4', roles: ['OWNER'], editorialRoles: ['PUBLISHER'] }
  }
  const noAccessSession: any = {
    user: { id: 'u5', roles: ['CASHIER'], editorialRoles: [] }
  }
  const nullSession = null

  describe('hasEditorialAccess', () => {
    it('returns true for ADMIN role', () => {
      expect(hasEditorialAccess(adminSession)).toBe(true)
    })
    it('returns true for editorial role holders', () => {
      expect(hasEditorialAccess(editorSession)).toBe(true)
    })
    it('returns false for users without editorial access', () => {
      expect(hasEditorialAccess(noAccessSession)).toBe(false)
    })
    it('returns false for null session', () => {
      expect(hasEditorialAccess(nullSession)).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('returns true for ADMIN role', () => {
      expect(isAdmin(adminSession)).toBe(true)
    })
    it('returns false for non-admin', () => {
      expect(isAdmin(editorSession)).toBe(false)
    })
  })

  describe('isEditor', () => {
    it('returns true for EDITOR role', () => {
      expect(isEditor(editorSession)).toBe(true)
    })
    it('returns true for ADMIN', () => {
      expect(isEditor(adminSession)).toBe(true)
    })
    it('returns false for non-editor', () => {
      expect(isEditor(noAccessSession)).toBe(false)
    })
  })

  describe('isReviewer', () => {
    it('returns true for REVIEWER role', () => {
      expect(isReviewer(reviewerSession)).toBe(true)
    })
    it('returns false for EDITOR only', () => {
      expect(isReviewer(editorSession)).toBe(false)
    })
  })

  describe('isPublisher', () => {
    it('returns true for PUBLISHER role', () => {
      expect(isPublisher(publisherSession)).toBe(true)
    })
    it('returns false for REVIEWER only', () => {
      expect(isPublisher(reviewerSession)).toBe(false)
    })
  })

  describe('getEditorialUser', () => {
    it('extracts editorial user from session', () => {
      const user = getEditorialUser(editorSession)
      expect(user).not.toBeNull()
      expect(user!.id).toBe('u2')
      expect(user!.roles).toContain('OWNER')
      expect(user!.editorialRoles).toContain('EDITOR')
    })
    it('returns null for null session', () => {
      expect(getEditorialUser(nullSession)).toBeNull()
    })
  })
})

describe('EditorialService Static Methods', () => {
  describe('getValidTransitions', () => {
    it('returns transitions from DRAFT', () => {
      const transitions = EditorialService.getValidTransitions('DRAFT')
      expect(transitions.length).toBeGreaterThan(0)
      const toStatuses = transitions.map(t => t.to)
      expect(toStatuses).toContain('REVIEW')
    })

    it('returns transitions from REVIEW', () => {
      const transitions = EditorialService.getValidTransitions('REVIEW')
      const toStatuses = transitions.map(t => t.to)
      expect(toStatuses).toContain('APPROVED')
    })

    it('returns transitions from APPROVED', () => {
      const transitions = EditorialService.getValidTransitions('APPROVED')
      const toStatuses = transitions.map(t => t.to)
      expect(toStatuses).toContain('SCHEDULED')
      expect(toStatuses).toContain('PUBLISHED')
    })

    it('returns empty for unknown status', () => {
      expect(EditorialService.getValidTransitions('UNKNOWN')).toEqual([])
    })
  })

  describe('canTransition', () => {
    it('returns true for valid transition', () => {
      expect(EditorialService.canTransition('DRAFT', 'REVIEW')).toBe(true)
    })
    it('returns false for invalid transition', () => {
      expect(EditorialService.canTransition('DRAFT', 'PUBLISHED')).toBe(false)
    })
  })

  describe('hasRoleForTransition', () => {
    it('returns true for ADMIN regardless of editorial roles', () => {
      expect(EditorialService.hasRoleForTransition(['ADMIN'], [], 'DRAFT', 'REVIEW')).toBe(true)
    })

    it('returns true when editorial role matches', () => {
      const transitions = EditorialService.getValidTransitions('REVIEW')
      const approveRule = transitions.find(t => t.to === 'APPROVED')
      if (approveRule && approveRule.requiredRoles.length > 0) {
        expect(
          EditorialService.hasRoleForTransition(['OWNER'], approveRule.requiredRoles, 'REVIEW', 'APPROVED')
        ).toBe(true)
      }
    })

    it('returns false when no matching role', () => {
      expect(EditorialService.hasRoleForTransition(['OWNER'], [], 'REVIEW', 'APPROVED')).toBe(false)
    })
  })

  describe('isBodyEditable', () => {
    it('returns true for DRAFT', () => {
      expect(EditorialService.isBodyEditable('DRAFT')).toBe(true)
    })
    it('returns false for PUBLISHED', () => {
      expect(EditorialService.isBodyEditable('PUBLISHED')).toBe(false)
    })
  })

  describe('isDeletable', () => {
    it('returns true for DRAFT', () => {
      expect(EditorialService.isDeletable('DRAFT')).toBe(true)
    })
    it('returns false for PUBLISHED', () => {
      expect(EditorialService.isDeletable('PUBLISHED')).toBe(false)
    })
  })
})
