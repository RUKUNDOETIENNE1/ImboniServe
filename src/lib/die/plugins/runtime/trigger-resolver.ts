import type { DIEPlugin } from '../core/plugin-types'

export class TriggerResolver {
  constructor(private readonly plugins: () => DIEPlugin[]) {}

  resolve(eventType: string): DIEPlugin[] {
    return this.plugins().filter((plugin) => plugin.triggers.includes(eventType))
  }
}
