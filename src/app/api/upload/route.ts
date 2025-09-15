import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const maxDuration = 300; // 5 minutes for large file uploads
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Bucket y path son requeridos' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Use admin client for the upload
    const adminClient = getSupabaseAdmin();
    
    // Upload the file
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await adminClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json(
        { error: 'Error al subir el archivo' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      path: data.path,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
