/**
 * Intelligence Knowledge Base (IKB) - Serialization
 * 
 * Handles serialization and deserialization of knowledge records.
 */

import type { KnowledgeRecord } from './types'

export class KnowledgeSerializer {
  private version = '1.0.0'

  /**
   * Serialize knowledge records to JSON.
   */
  serialize(records: KnowledgeRecord[]): string {
    const envelope = {
      version: this.version,
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records,
    }

    return JSON.stringify(envelope, this.jsonReplacer, 2)
  }

  /**
   * Deserialize knowledge records from JSON.
   */
  deserialize(json: string): KnowledgeRecord[] {
    const envelope = JSON.parse(json, this.jsonReviver)

    // Version check
    if (envelope.version !== this.version) {
      console.warn(`Version mismatch: expected ${this.version}, got ${envelope.version}`)
    }

    return envelope.records
  }

  /**
   * Serialize a single record.
   */
  serializeRecord(record: KnowledgeRecord): string {
    return JSON.stringify(record, this.jsonReplacer, 2)
  }

  /**
   * Deserialize a single record.
   */
  deserializeRecord(json: string): KnowledgeRecord {
    return JSON.parse(json, this.jsonReviver)
  }

  /**
   * Custom JSON replacer for serialization.
   */
  private jsonReplacer(key: string, value: any): any {
    // Convert Maps to objects
    if (value instanceof Map) {
      return {
        __type: 'Map',
        value: Array.from(value.entries()),
      }
    }

    // Convert Sets to arrays
    if (value instanceof Set) {
      return {
        __type: 'Set',
        value: Array.from(value),
      }
    }

    return value
  }

  /**
   * Custom JSON reviver for deserialization.
   */
  private jsonReviver(key: string, value: any): any {
    // Restore Maps
    if (value && value.__type === 'Map') {
      return new Map(value.value)
    }

    // Restore Sets
    if (value && value.__type === 'Set') {
      return new Set(value.value)
    }

    return value
  }
}
