import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing required environment variables');
  console.log('\nPlease ensure you have the following in your .env.local file:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  console.log('\nYou can find these values in your Supabase project settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorage() {
  try {
    console.log('🚀 Setting up Supabase storage bucket...');
    
    // Check if the bucket already exists
    console.log('🔍 Checking for existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:');
      throw listError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'profile-pictures');
    
    if (!bucketExists) {
      console.log('ℹ️ Creating profile-pictures bucket...');
      const { error: createError } = await supabase.storage
        .createBucket('profile-pictures', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });
      
      if (createError && createError.message !== 'Bucket already exists') {
        throw createError;
      }
      
      console.log('✅ Created profile-pictures bucket');
    } else {
      console.log('ℹ️ profile-pictures bucket already exists');
    }
    
    // Update bucket policies to make it public
    console.log('🔒 Updating bucket policies...');
    const { error: policyError } = await supabase
      .from('buckets')
      .update({
        public: true,
      })
      .eq('id', 'profile-pictures');
    
    if (policyError && !policyError.message.includes('No rows found')) {
      throw policyError;
    }
    
    console.log('✅ Bucket policies updated');
    console.log('\n🎉 Setup completed successfully!');
    console.log('You can now upload profile pictures to the "profile-pictures" bucket.');
    
  } catch (error) {
    console.error('❌ Error setting up storage:');
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
setupStorage();
