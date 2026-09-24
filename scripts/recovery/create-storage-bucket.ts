import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkhnocretmzpskadqhlq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraG5vY3JldG16cHNrYWRxaGxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIzNDE2NiwiZXhwIjoyMDg1ODEwMTY2fQ.KcuM-wzT1i2kcp69rVS0fRwCYKESsD8xDSjQRwc0U6w';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  // Step 1: Check if bucket already exists
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('ERROR listing buckets:', listError);
    process.exit(1);
  }
  console.log(`EXISTING BUCKETS (${existingBuckets.length}):`);
  existingBuckets.forEach(b => console.log(`  - ${b.name} (public: ${b.public})`));

  const bucketName = 'documents-priv';
  const existing = existingBuckets.find(b => b.name === bucketName);

  if (existing) {
    console.log(`\nBucket '${bucketName}' already exists (public: ${existing.public}). Skipping creation.`);
  } else {
    // Step 2: Create the bucket (private)
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: '50MB',
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/quicktime', 'video/webm',
        'application/pdf',
        'text/csv', 'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    });

    if (error) {
      console.error('ERROR creating bucket:', error);
      process.exit(1);
    }
    console.log(`\nBucket '${bucketName}' created successfully:`, data);
  }

  // Step 3: Verify bucket exists
  const { data: verifyBuckets, error: verifyError } = await supabase.storage.listBuckets();
  if (verifyError) {
    console.error('ERROR verifying buckets:', verifyError);
    process.exit(1);
  }
  const verified = verifyBuckets.find(b => b.name === bucketName);
  if (verified) {
    console.log(`\nVERIFICATION: Bucket '${bucketName}' exists (public: ${verified.public})`);
  } else {
    console.error(`\nVERIFICATION FAILED: Bucket '${bucketName}' not found after creation`);
    process.exit(1);
  }

  // Step 4: Test upload (tiny file)
  const testContent = Buffer.from('recovery-verification-test');
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload('recovery-test.txt', testContent, { contentType: 'text/plain' });

  if (uploadError) {
    console.error('ERROR test upload:', uploadError);
    process.exit(1);
  }
  console.log('TEST UPLOAD: SUCCESS (recovery-test.txt uploaded)');

  // Step 5: Test download
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from(bucketName)
    .download('recovery-test.txt');

  if (downloadError) {
    console.error('ERROR test download:', downloadError);
    process.exit(1);
  }
  const downloadedText = await downloadData.text();
  console.log(`TEST DOWNLOAD: SUCCESS (content: "${downloadedText}")`);

  // Step 6: Cleanup test file
  const { error: deleteError } = await supabase.storage
    .from(bucketName)
    .remove(['recovery-test.txt']);

  if (deleteError) {
    console.error('ERROR cleanup test file:', deleteError);
  } else {
    console.log('CLEANUP: Test file removed');
  }

  console.log('\n=== STAGE 5 INFRASTRUCTURE RECONSTRUCTION: PASS ===');
  console.log(`Bucket: ${bucketName}`);
  console.log(`Public: false (private)`);
  console.log(`URL: ${supabaseUrl}/storage/v1/bucket/${bucketName}`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
