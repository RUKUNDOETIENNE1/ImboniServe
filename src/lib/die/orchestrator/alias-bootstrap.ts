import Module from 'module'
import path from 'path'

const globalKey = '__DIE_ALIAS_BOOTSTRAPPED__'

if (!(globalThis as any)[globalKey]) {
  const mod: any = Module
  const originalResolveFilename = mod._resolveFilename?.bind(mod)

  if (typeof originalResolveFilename === 'function') {
    const distRoot = path.resolve(__dirname, '..', '..')

    mod._resolveFilename = function patchedResolveFilename(
      request: string,
      parent: NodeModule | null,
      isMain: boolean,
      options: any,
    ) {
      if (typeof request === 'string' && request.startsWith('@/lib/')) {
        const relativePath = request.slice('@/lib/'.length)
        const target = path.resolve(distRoot, relativePath)
        return originalResolveFilename.call(this, target, parent, isMain, options)
      }

      return originalResolveFilename.call(this, request, parent, isMain, options)
    }
  }

  ;(globalThis as any)[globalKey] = true
}
