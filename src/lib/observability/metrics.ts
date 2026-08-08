type Labels = Record<string, string>

type Counter = {
  name: string
  help?: string
  values: Map<string, number>
}

const counters = new Map<string, Counter>()

function labelsKey(labels?: Labels): string {
  if (!labels) return ''
  return Object.keys(labels)
    .sort()
    .map((k) => `${k}:${labels[k]}`)
    .join(',')
}

export function counter(name: string, help?: string) {
  if (!counters.has(name)) {
    counters.set(name, { name, help, values: new Map() })
  }
  return {
    inc: (labels?: Labels, value: number = 1) => {
      const c = counters.get(name)!
      const key = labelsKey(labels)
      c.values.set(key, (c.values.get(key) || 0) + value)
    },
  }
}

export function renderPrometheus(): string {
  let out = ''
  for (const c of counters.values()) {
    if (c.help) out += `# HELP ${c.name} ${c.help}\n`
    out += `# TYPE ${c.name} counter\n`
    if (c.values.size === 0) {
      out += `${c.name} 0\n`
    } else {
      for (const [k, v] of c.values.entries()) {
        const labels = k
          ? '{' + k.split(',').map((p) => {
              const [lk, lv] = p.split(':')
              return `${lk}="${lv}"`
            }).join(',') + '}'
          : ''
        out += `${c.name}${labels} ${v}\n`
      }
    }
  }
  return out
}
