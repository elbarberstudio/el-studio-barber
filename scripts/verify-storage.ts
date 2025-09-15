import { supabase } from '../src/lib/supabase/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env.local') });

async function verifyStorage() {
  try {
    console.log('🔍 Verifying Supabase storage configuration...');
    
    // 1. Check if we can connect to Supabase
    console.log('\n🔄 Testing Supabase connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Failed to connect to Supabase:', authError.message);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase');
    
    // 2. Check if the bucket exists
    console.log('\n🔍 Checking for storage bucket...');
    const bucketName = 'profile-pictures';
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.error(`❌ Bucket '${bucketName}' does not exist`);
      console.log('\n💡 Run the setup-storage script to create the bucket:');
      console.log('   cd scripts && npm run setup-storage');
      return;
    }
    
    console.log(`✅ Bucket '${bucketName}' exists`);
    
    // 3. Check bucket policies
    console.log('\n🔒 Checking bucket policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('buckets')
      .select('*')
      .eq('id', bucketName);
    
    if (policiesError) {
      console.error('❌ Failed to fetch bucket policies:', policiesError.message);
      return;
    }
    
    if (!policies || policies.length === 0) {
      console.error('❌ No bucket policies found');
      return;
    }
    
    const bucketPolicy = policies[0];
    console.log('📋 Bucket policy:', {
      id: bucketPolicy.id,
      public: bucketPolicy.public,
      created_at: bucketPolicy.created_at,
      updated_at: bucketPolicy.updated_at
    });
    
    if (!bucketPolicy.public) {
      console.warn('⚠️ Bucket is not public. Profile pictures may not be accessible.');
    } else {
      console.log('✅ Bucket is public');
    }
    
    // 4. Test file upload
    console.log('\n🚀 Testing file upload...');
    // Archivos de prueba para diferentes formatos
    const testFiles = [
      { content: ['test'], type: 'text/plain', ext: 'txt' },
      { content: ['%PDF-1.4\n%\xE2\xE3\xCF\xD3'], type: 'application/pdf', ext: 'pdf' },
      { content: ['<svg></svg>'], type: 'image/svg+xml', ext: 'svg' },
      { content: ['RIFF....WEBPVP8 '], type: 'image/webp', ext: 'webp' }
    ];
    
    // Probar subida para cada tipo de archivo
    for (const testFile of testFiles) {
      const blob = new Blob(testFile.content, { type: testFile.type });
      const fileName = `test-${Date.now()}.${testFile.ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`test/${fileName}`, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError.message);
      return;
    }
    
    console.log('✅ Test file uploaded successfully:', uploadData.path);
    
    // 5. Test public URL generation
    console.log('\n🔗 Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);
    
    console.log('Generated URL:', urlData.publicUrl);
    
    // 6. Clean up test file
    console.log('\n🧹 Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([uploadData.path]);
    
    if (deleteError) {
      console.warn('⚠️ Failed to delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Storage verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during storage verification:', error);
  }
}

// Run the verification
verifyStorage();
