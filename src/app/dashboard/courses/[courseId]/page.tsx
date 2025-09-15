'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Video, FileText, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import { VideoModal } from '@/components/ui/video-modal';
import { useAuth } from '@/components/auth-provider';

type Material = {
  id: string;
  nombre: string;
  tipo: 'video' | 'pdf';
  url: string;
  fecha_creacion: string;
};

type Curso = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string;
  imagen_portada_url?: string;
  imagen_portada?: string;
  categorias: string[];
  publicado: boolean;
  video_url?: string;
  material_url?: string;
  barbero_id: string;
  creado_en: string;
  actualizado_en: string;
};

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('cursos')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        // Set course data with video and material URLs from the cursos table
        console.log('Raw course data from Supabase:', courseData);
        console.log('imagen_url field:', courseData.imagen_url);
        console.log('imagen_portada field:', courseData.imagen_portada);
        console.log('imagen_portada_url field:', courseData.imagen_portada_url);
        
        setCourse({
          ...courseData,
          video_url: courseData.video_url || null,
          material_url: courseData.material_url || null,
        });
      } catch (error) {
        console.error('Error fetching course:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar la información del curso.',
        });
        router.push('/dashboard/admin');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Curso no encontrado</h2>
        <Button onClick={() => router.push('/dashboard/admin')} className="mt-4">
          Volver al panel
        </Button>
      </div>
    );
  }

  // Use direct video and material URLs from course
  const hasVideo = course.video_url;
  const hasMaterial = course.material_url;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
              {course.imagen_portada_url ? (
                <img
                  src={course.imagen_portada_url.startsWith('http') 
                    ? course.imagen_portada_url 
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cursos/${course.imagen_portada_url}`
                  }
                  alt={course.titulo}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('Image loaded successfully:', course.imagen_portada_url);
                  }}
                  onError={(e) => {
                    console.log('Error loading course image:', course.imagen_portada_url);
                    const finalUrl = course.imagen_portada_url?.startsWith('http') 
                      ? course.imagen_portada_url 
                      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cursos/${course.imagen_portada_url}`;
                    console.log('Full URL attempted:', finalUrl);
                    e.currentTarget.style.display = 'none';
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700';
                    fallbackDiv.innerHTML = `
                      <div class="text-white/80 text-center">
                        <div class="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span class="text-lg font-medium">Error cargando imagen</span>
                      </div>
                    `;
                    e.currentTarget.parentElement?.appendChild(fallbackDiv);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
                  <div className="text-white/80 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-lg flex items-center justify-center">
                      <Video className="h-8 w-8" />
                    </div>
                    <span className="text-lg font-medium">Sin imagen</span>
                    <p className="text-sm mt-2 opacity-70">Campo imagen_portada_url: {String(course.imagen_portada_url || 'null')}</p>
                  </div>
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle>{course.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{course.descripcion}</p>
            </CardContent>
          </Card>
        </div>

        {/* Solo mostrar acciones si es barbero o administrador */}
        {user?.role !== 'Estudiante' && (
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => router.push(`/dashboard/courses/${courseId}/manage`)}
                  className="w-full"
                >
                  Gestionar Materiales
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video ({hasVideo ? '1' : '0'})
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Material PDF ({hasMaterial ? '1' : '0'})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-6">
          {hasVideo ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                <video 
                  src={course.video_url}
                  className="max-w-full max-h-full"
                  controls
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium">Video del Curso</h3>
                <p className="text-sm text-muted-foreground">
                  Curso: {course.titulo}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No hay video disponible para este curso.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="mt-6">
          {hasMaterial ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div>
                  <h3 className="font-medium">Material del Curso (PDF)</h3>
                  <p className="text-sm text-muted-foreground">
                    Curso: {course.titulo}
                  </p>
                </div>
                <a 
                  href={course.material_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-4"
                >
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No hay material PDF disponible para este curso.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
