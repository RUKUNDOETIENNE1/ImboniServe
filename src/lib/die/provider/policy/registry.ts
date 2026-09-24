import type { DocumentType } from '../gateway'
import type { ProviderPolicy, PolicyInput, ProviderRanking } from './types'

// ---------------------------------------------------------------------------
// ProviderPolicyRegistry
//
// Maps documentType → ProviderPolicy.  The router asks the registry for the
// policy matching the incoming document type.  If no policy is registered for
// a given type, the GenericPolicy is used as the default.
//
// This is the extension point: adding a new document type's routing logic is
// one new policy file + one register() call.  The router never changes.
// ---------------------------------------------------------------------------
export class ProviderPolicyRegistry {
  private policies = new Map<DocumentType, ProviderPolicy>()
  private defaultPolicy: ProviderPolicy

  constructor(defaultPolicy: ProviderPolicy) {
    this.defaultPolicy = defaultPolicy
  }

  register(policy: ProviderPolicy): void {
    this.policies.set(policy.documentType, policy)
  }

  resolve(documentType: DocumentType | undefined): ProviderPolicy {
    if (documentType && this.policies.has(documentType)) {
      return this.policies.get(documentType)!
    }
    return this.defaultPolicy
  }

  select(input: PolicyInput): ProviderRanking {
    return this.resolve(input.documentType).select(input)
  }
}
