import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient({ log: ['error'] })

async function run() {
  try {
    await p.$connect()
    console.log('CONNECTED')
    
    const r1 = await p.$queryRawUnsafe<any[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name LIMIT 20"
    )
    console.log('TABLES:', r1.map((t: any) => t.table_name))

    const r2 = await p.$queryRawUnsafe<any[]>(
      "SELECT 1+1 as two"
    )
    console.log('1+1=', (r2 as any[])[0]?.two)

  } catch (e: any) {
    console.error('ERROR:', e.message)
    process.exit(1)
  } finally {
    await p.$disconnect()
    console.log('DISCONNECTED')
  }
}

run()
