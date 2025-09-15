import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  console.log('Asegúrate de tener las siguientes variables en tu archivo .env.local:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase');
  console.log('SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function setupCoursesBucket() {
  try {
    const bucketName = 'cursos';
    
    console.log('🔍 Verificando bucket de cursos...');
    
    // 1. Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error al listar los buckets:', listError.message);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('🔄 Creando bucket de cursos...');
      
      // 2. Crear el bucket si no existe
      const { error: createError } = await supabase.storage
        .createBucket(bucketName, {
          public: true,
          allowedMimeTypes: [
            // Imágenes
            'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
            // Documentos
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            // Videos
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
            'video/x-matroska', 'video/3gpp', 'video/3gpp2', 'video/x-flv', 'video/x-ms-asf'
          ],
          fileSizeLimit: 1024 * 1024 * 1024, // 1GB
        });
      
      if (createError && createError.message !== 'Bucket already exists') {
        console.error('❌ Error al crear el bucket:', createError.message);
        return false;
      }
      
      console.log('✅ Bucket de cursos creado exitosamente');
    } else {
      console.log('✅ El bucket de cursos ya existe');
    }
    
    // 3. Configurar políticas de acceso
    console.log('🔒 Configurando políticas de acceso...');
    
    // Hacer que el bucket sea público
    const { error: policyError } = await supabase
      .from('buckets')
      .update({ 
        public: true,
        file_size_limit: 1024 * 1024 * 1024 // 1GB
      })
      .eq('id', bucketName);
    
    if (policyError) {
      console.warn('⚠️ No se pudo actualizar las políticas del bucket:', policyError.message);
      console.log('   Esto puede ser normal si no tienes permisos de administrador.');
      console.log('   El bucket seguirá funcionando, pero podrías necesitar configurar las políticas manualmente.');
    } else {
      console.log('✅ Políticas de acceso configuradas correctamente');
    }
    
    console.log('\n🎉 Configuración completada exitosamente!');
    console.log('\n📌 Recuerda que los archivos se almacenarán en el bucket: ' + bucketName);
    console.log('   Puedes acceder a ellos en: https://app.supabase.com/storage/buckets/' + bucketName);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en la configuración:', error);
    return false;
  }
}

// Ejecutar la configuración
setupCoursesBucket().then(success => {
  if (success) {
    console.log('\n✅ Configuración finalizada con éxito');
  } else {
    console.log('\n❌ Hubo un error durante la configuración');
    process.exit(1);
  }
});
