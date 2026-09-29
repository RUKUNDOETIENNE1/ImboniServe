/**
 * Phase 0.8A — Database Truth Discovery Script
 * 
 * Purpose: Query actual Supabase database to discover:
 * - Tables
 * - Columns
 * - Enums
 * - Indexes
 * - Constraints
 * - Foreign Keys
 * 
 * This script is READ-ONLY and makes no modifications.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TableInfo {
  tableName: string
  schemaName: string
  tableType: string
}

interface ColumnInfo {
  tableName: string
  columnName: string
  dataType: string
  isNullable: string
  columnDefault: string | null
  characterMaximumLength: number | null
  numericPrecision: number | null
  numericScale: number | null
}

interface EnumInfo {
  enumName: string
  enumValues: string[]
}

interface IndexInfo {
  tableName: string
  indexName: string
  columnName: string
  isUnique: boolean
  isPrimary: boolean
}

interface ConstraintInfo {
  tableName: string
  constraintName: string
  constraintType: string
  columnName: string | null
  foreignTableName: string | null
  foreignColumnName: string | null
}

async function discoverTables(): Promise<TableInfo[]> {
  console.log('🔍 Discovering tables...')
  
  const tables = await prisma.$queryRaw<TableInfo[]>`
    SELECT 
      table_name as "tableName",
      table_schema as "schemaName",
      table_type as "tableType"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  
  console.log(`✅ Found ${tables.length} tables`)
  return tables
}

async function discoverColumns(): Promise<ColumnInfo[]> {
  console.log('🔍 Discovering columns...')
  
  const columns = await prisma.$queryRaw<ColumnInfo[]>`
    SELECT 
      table_name as "tableName",
      column_name as "columnName",
      data_type as "dataType",
      is_nullable as "isNullable",
      column_default as "columnDefault",
      character_maximum_length as "characterMaximumLength",
      numeric_precision as "numericPrecision",
      numeric_scale as "numericScale"
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `
  
  console.log(`✅ Found ${columns.length} columns`)
  return columns
}

async function discoverEnums(): Promise<EnumInfo[]> {
  console.log('🔍 Discovering enums...')
  
  const enumsRaw = await prisma.$queryRaw<{ enumName: string; enumValue: string }[]>`
    SELECT 
      t.typname as "enumName",
      e.enumlabel as "enumValue"
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `
  
  // Group enum values by enum name
  const enumsMap = new Map<string, string[]>()
  for (const row of enumsRaw) {
    if (!enumsMap.has(row.enumName)) {
      enumsMap.set(row.enumName, [])
    }
    enumsMap.get(row.enumName)!.push(row.enumValue)
  }
  
  const enums: EnumInfo[] = Array.from(enumsMap.entries()).map(([enumName, enumValues]) => ({
    enumName,
    enumValues
  }))
  
  console.log(`✅ Found ${enums.length} enums`)
  return enums
}

async function discoverIndexes(): Promise<IndexInfo[]> {
  console.log('🔍 Discovering indexes...')
  
  const indexes = await prisma.$queryRaw<IndexInfo[]>`
    SELECT 
      t.relname as "tableName",
      i.relname as "indexName",
      a.attname as "columnName",
      ix.indisunique as "isUnique",
      ix.indisprimary as "isPrimary"
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relkind = 'r'
    ORDER BY t.relname, i.relname, a.attnum
  `
  
  console.log(`✅ Found ${indexes.length} index entries`)
  return indexes
}

async function discoverConstraints(): Promise<ConstraintInfo[]> {
  console.log('🔍 Discovering constraints...')
  
  const constraints = await prisma.$queryRaw<ConstraintInfo[]>`
    SELECT 
      tc.table_name as "tableName",
      tc.constraint_name as "constraintName",
      tc.constraint_type as "constraintType",
      kcu.column_name as "columnName",
      ccu.table_name as "foreignTableName",
      ccu.column_name as "foreignColumnName"
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `
  
  console.log(`✅ Found ${constraints.length} constraints`)
  return constraints
}

async function discoverMigrations(): Promise<any[]> {
  console.log('🔍 Discovering applied migrations...')
  
  try {
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        checksum,
        finished_at as "finishedAt",
        migration_name as "migrationName",
        logs,
        rolled_back_at as "rolledBackAt",
        started_at as "startedAt",
        applied_steps_count as "appliedStepsCount"
      FROM _prisma_migrations
      ORDER BY started_at DESC
    `
    
    console.log(`✅ Found ${migrations.length} applied migrations`)
    return migrations
  } catch (error) {
    console.warn('⚠️ Could not query _prisma_migrations table:', error)
    return []
  }
}

async function discoverPaymentTables(): Promise<any> {
  console.log('🔍 Discovering payment-related tables...')
  
  const paymentTables = [
    'PaymentTransaction',
    'FinancialLedgerEntry',
    'BillingEvent',
    'Sale',
    'SalePayment',
    'Subscription',
    'Invoice',
    'Reservation'
  ]
  
  const results: any = {}
  
  for (const tableName of paymentTables) {
    try {
      const exists = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `
      results[tableName] = exists[0]?.exists || false
    } catch (error) {
      results[tableName] = false
    }
  }
  
  return results
}

async function generateReport() {
  console.log('🚀 Starting Database Truth Discovery...\n')
  
  try {
    // Discover all schema elements
    const tables = await discoverTables()
    const columns = await discoverColumns()
    const enums = await discoverEnums()
    const indexes = await discoverIndexes()
    const constraints = await discoverConstraints()
    const migrations = await discoverMigrations()
    const paymentTables = await discoverPaymentTables()
    
    // Generate report
    const report = {
      discoveryDate: new Date().toISOString(),
      summary: {
        totalTables: tables.length,
        totalColumns: columns.length,
        totalEnums: enums.length,
        totalIndexes: indexes.length,
        totalConstraints: constraints.length,
        totalMigrations: migrations.length
      },
      tables,
      columns,
      enums,
      indexes,
      constraints,
      migrations,
      paymentTables
    }
    
    console.log('\n📊 Discovery Summary:')
    console.log(`   Tables: ${report.summary.totalTables}`)
    console.log(`   Columns: ${report.summary.totalColumns}`)
    console.log(`   Enums: ${report.summary.totalEnums}`)
    console.log(`   Indexes: ${report.summary.totalIndexes}`)
    console.log(`   Constraints: ${report.summary.totalConstraints}`)
    console.log(`   Migrations: ${report.summary.totalMigrations}`)
    
    console.log('\n💾 Saving report to database-truth.json...')
    const fs = require('fs')
    fs.writeFileSync(
      'database-truth.json',
      JSON.stringify(report, null, 2)
    )
    
    console.log('✅ Report saved successfully!')
    console.log('\n🎯 Next step: Review database-truth.json and generate DATABASE_TRUTH_REPORT.md')
    
    return report
  } catch (error) {
    console.error('❌ Error during discovery:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run discovery
generateReport()
  .then(() => {
    console.log('\n✅ Database Truth Discovery Complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Discovery Failed:', error)
    process.exit(1)
  })
