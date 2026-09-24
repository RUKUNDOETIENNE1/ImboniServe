import type { Session } from 'next-auth'

export interface EditorialUser {
  id: string
  roles: string[]
  editorialRoles: string[]
}

export function hasEditorialAccess(session: Session | null): boolean {
  if (!session?.user) return false
  const user = session.user as any
  if (user.roles?.includes('ADMIN')) return true
  const editorialRoles = user.editorialRoles || []
  return editorialRoles.length > 0
}

export function hasEditorialRole(
  session: Session | null,
  requiredRoles: string[]
): boolean {
  if (!session?.user) return false
  const user = session.user as any
  if (user.roles?.includes('ADMIN')) return true
  const editorialRoles = user.editorialRoles || []
  return requiredRoles.some((r) => editorialRoles.includes(r))
}

export function isEditor(session: Session | null): boolean {
  return hasEditorialRole(session, ['EDITOR', 'REVIEWER', 'PUBLISHER'])
}

export function isReviewer(session: Session | null): boolean {
  return hasEditorialRole(session, ['REVIEWER', 'PUBLISHER'])
}

export function isPublisher(session: Session | null): boolean {
  return hasEditorialRole(session, ['PUBLISHER'])
}

export function isAdmin(session: Session | null): boolean {
  if (!session?.user) return false
  const user = session.user as any
  return user.roles?.includes('ADMIN') ?? false
}

export function getEditorialUser(session: Session | null): EditorialUser | null {
  if (!session?.user) return null
  const user = session.user as any
  return {
    id: user.id,
    roles: user.roles || [],
    editorialRoles: user.editorialRoles || [],
  }
}
