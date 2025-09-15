import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing required environment variables');
  console.log('Please ensure you have the following in your .env.local file:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function checkAndCreateBucket() {
  try {
    console.log('🔍 Checking for existing buckets...');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return false;
    }
    
    console.log('📦 Existing buckets:', buckets.map(b => b.name).join(', ') || 'None');
    
    const bucketName = 'profile-pictures';
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`🔄 Creating bucket '${bucketName}'...`);
      const { error: createError } = await supabase.storage
        .createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });
      
      if (createError && createError.message !== 'Bucket already exists') {
        console.error('❌ Error creating bucket:', createError);
        return false;
      }
      
      console.log(`✅ Created bucket '${bucketName}'`);
    } else {
      console.log(`✅ Bucket '${bucketName}' already exists`);
    }
    
    // Update bucket policies
    console.log('🔒 Updating bucket policies...');
    const { error: policyError } = await supabase
      .from('buckets')
      .update({ public: true })
      .eq('id', bucketName);
    
    if (policyError) {
      console.warn('⚠️ Warning: Failed to update bucket policies:', policyError);
    } else {
      console.log('✅ Bucket policies updated');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error in checkAndCreateBucket:', error);
    return false;
  }
}

// Run the check
checkAndCreateBucket().then(success => {
  if (success) {
    console.log('\n🎉 Storage setup completed successfully!');
  } else {
    console.log('\n❌ Storage setup failed. Please check the logs above for details.');
    process.exit(1);
  }
});
