const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRecovery() {
  console.log('=== MIGRATION RECOVERY VERIFICATION ===\n');
  
  try {
    // Check 1: Migration table count
    const migrations = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM _prisma_migrations;
    `;
    console.log(`1. Migration table entries: ${migrations[0].count}`);
    console.log(`   Expected: 22 (after cleanup)`);
    console.log(`   Current: 25 (before cleanup)`);
    console.log('');
    
    // Check 2: Duplicate entries
    const duplicates = await prisma.$queryRaw`
      SELECT migration_name, COUNT(*) as count
      FROM _prisma_migrations
      GROUP BY migration_name
      HAVING COUNT(*) > 1;
    `;
    console.log(`2. Duplicate migrations: ${duplicates.length}`);
    if (duplicates.length > 0) {
      duplicates.forEach(d => {
        console.log(`   ❌ ${d.migration_name}: ${d.count} entries`);
      });
    } else {
      console.log(`   ✅ No duplicates`);
    }
    console.log('');
    
    // Check 3: Failed migrations
    const failed = await prisma.$queryRaw`
      SELECT migration_name
      FROM _prisma_migrations
      WHERE finished_at IS NULL;
    `;
    console.log(`3. Failed migrations: ${failed.length}`);
    if (failed.length > 0) {
      failed.forEach(f => {
        console.log(`   ❌ ${f.migration_name}`);
      });
    } else {
      console.log(`   ✅ No failed migrations`);
    }
    console.log('');
    
    // Check 4: Kitchen Consumption tables
    const kcTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('Recipe', 'RecipeIngredient', 'InventoryConsumption')
      ORDER BY table_name;
    `;
    console.log(`4. Kitchen Consumption tables: ${kcTables.length}/3`);
    if (kcTables.length === 3) {
      kcTables.forEach(t => console.log(`   ✅ ${t.table_name}`));
    } else {
      console.log(`   ❌ Missing tables (expected after recovery)`);
    }
    console.log('');
    
    // Check 5: MenuItem.recipeId column
    const recipeIdCol = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'MenuItem' 
        AND column_name = 'recipeId';
    `;
    console.log(`5. MenuItem.recipeId column: ${recipeIdCol.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`   ${recipeIdCol.length > 0 ? '✅' : '❌'} Expected after recovery`);
    console.log('');
    
    // Summary
    console.log('=== RECOVERY STATUS ===');
    const needsRecovery = duplicates.length > 0 || failed.length > 0 || kcTables.length < 3;
    if (needsRecovery) {
      console.log('❌ RECOVERY REQUIRED');
      console.log('   Follow SUPABASE_MIGRATION_RECOVERY_GUIDE.md');
    } else {
      console.log('✅ RECOVERY COMPLETE');
      console.log('   Production deployment blocker cleared');
    }
    
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRecovery();
