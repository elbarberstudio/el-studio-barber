import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Extract form data
    const titulo = formData.get('titulo') as string;
    const descripcion = formData.get('descripcion') as string;
    const publicado = formData.get('publicado') === 'true';
    const videoFile = formData.get('video') as File | null;
    const materialFile = formData.get('material') as File | null;

    // Upload video if exists
    let videoUrl = null;
    if (videoFile) {
      const videoExt = videoFile.name.split('.').pop();
      const videoPath = `cursos/${user.id}/${Date.now()}.${videoExt}`;
      
      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile);
      
      if (videoError) throw videoError;
      
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoPath);
      
      videoUrl = videoUrlData.publicUrl;
    }

    // Upload material if exists
    let materialUrl = null;
    if (materialFile) {
      const materialExt = materialFile.name.split('.').pop();
      const materialPath = `materiales/${user.id}/${Date.now()}.${materialExt}`;
      
      const { data: materialData, error: materialError } = await supabase.storage
        .from('materiales')
        .upload(materialPath, materialFile);
      
      if (materialError) throw materialError;
      
      const { data: materialUrlData } = supabase.storage
        .from('materiales')
        .getPublicUrl(materialPath);
      
      materialUrl = materialUrlData.publicUrl;
    }

    // Create course in database
    const { data: course, error } = await supabase
      .from('cursos')
      .insert([
        {
          titulo,
          descripcion,
          publicado,
          instructor_id: user.id,
          video_url: videoUrl,
          material_url: materialUrl,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Error al crear el curso' },
      { status: 500 }
    );
  }
}
