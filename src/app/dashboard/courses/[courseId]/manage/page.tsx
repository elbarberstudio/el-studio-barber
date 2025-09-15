'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Upload, Video, FileText, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import { VideoModal } from '@/components/ui/video-modal';

type Curso = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_portada_url?: string;
  video_url?: string;
  material_url?: string;
  barbero_id: string;
  publicado: boolean;
  creado_en: string;
  actualizado_en: string;
  categorias?: string[];
};

export default function CourseManagePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    titulo: '',
    descripcion: '',
    categorias: '',
  });
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null);

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

        // Set course data directly (no separate materials table)
        setCourse(courseData);
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

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona un archivo.',
      });
      return;
    }

    try {
      setUploading(true);
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${courseId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cursos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cursos')
        .getPublicUrl(filePath);

      // Determine file type and update appropriate field
      const fileType = selectedFile.type.includes('video') ? 'video' : 'pdf';
      const updateField = fileType === 'video' ? 'video_url' : 'material_url';

      // Update course record with new file URL
      const { error: updateError } = await supabase
        .from('cursos')
        .update({ [updateField]: publicUrl })
        .eq('id', courseId);

      if (updateError) throw updateError;

      toast({
        title: 'Éxito',
        description: `${fileType === 'video' ? 'Video' : 'Material PDF'} subido correctamente.`,
      });

      // Refresh course data
      const { data: courseData } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', courseId)
        .single();

      setCourse(courseData);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo subir el material.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!course) return;
    
    try {
      setUploading(true);
      
      let imageUrl = course.imagen_portada_url;
      
      // Upload new cover image if selected
      if (selectedCoverImage) {
        const fileExt = selectedCoverImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${courseId}/cover_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cursos')
          .upload(filePath, selectedCoverImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cursos')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Update course information
      const { error: updateError } = await supabase
        .from('cursos')
        .update({
          titulo: editForm.titulo,
          descripcion: editForm.descripcion,
          categorias: editForm.categorias.split(',').map(c => c.trim()).filter(c => c),
          imagen_portada_url: imageUrl,
        })
        .eq('id', courseId);

      if (updateError) throw updateError;

      toast({
        title: 'Éxito',
        description: 'Información del curso actualizada correctamente.',
      });

      // Refresh course data
      const { data: courseData } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', courseId)
        .single();

      setCourse(courseData);
      setIsEditing(false);
      setSelectedCoverImage(null);
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la información del curso.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialType: 'video' | 'pdf') => {
    try {
      const fieldToUpdate = materialType === 'video' ? 'video_url' : 'material_url';
      const currentUrl = materialType === 'video' ? course?.video_url : course?.material_url;
      
      if (!currentUrl) return;

      // Delete from storage
      const filePath = currentUrl.split('/').slice(-2).join('/');
      await supabase.storage
        .from('cursos')
        .remove([filePath]);

      // Update database to remove URL
      const { error: updateError } = await supabase
        .from('cursos')
        .update({ [fieldToUpdate]: null })
        .eq('id', courseId);

      if (updateError) throw updateError;

      toast({
        title: 'Éxito',
        description: `${materialType === 'video' ? 'Video' : 'Material PDF'} eliminado correctamente.`,
      });

      // Refresh course data
      const { data: courseData } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', courseId)
        .single();

      setCourse(courseData);
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el material.',
      });
    }
  };

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

  const hasVideo = course.video_url;
  const hasMaterial = course.material_url;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Gestionar: {course.titulo}</h1>
          <p className="text-muted-foreground">Agrega, edita y elimina videos y PDFs</p>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Información del Curso
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video {hasVideo ? '(1)' : '(0)'}
          </TabsTrigger>
          <TabsTrigger value="material" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Material PDF {hasMaterial ? '(1)' : '(0)'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información del Curso</CardTitle>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      setEditForm({
                        titulo: course.titulo,
                        descripcion: course.descripcion,
                        categorias: course.categorias?.join(', ') || '',
                      });
                    } else {
                      setIsEditing(true);
                      setEditForm({
                        titulo: course.titulo,
                        descripcion: course.descripcion,
                        categorias: course.categorias?.join(', ') || '',
                      });
                    }
                  }}
                >
                  {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      value={editForm.titulo}
                      onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={editForm.descripcion}
                      onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="categorias">Categorías (separadas por comas)</Label>
                    <Input
                      id="categorias"
                      value={editForm.categorias}
                      onChange={(e) => setEditForm({ ...editForm, categorias: e.target.value })}
                      placeholder="Ej: corte clásico, barbería moderna"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coverImage">Imagen de portada</Label>
                    <Input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedCoverImage(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button onClick={handleSaveEdit} disabled={uploading}>
                    <Save className="h-4 w-4 mr-2" />
                    {uploading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label>Título</Label>
                    <p className="text-sm">{course.titulo}</p>
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <p className="text-sm">{course.descripcion}</p>
                  </div>
                  <div>
                    <Label>Categorías</Label>
                    <p className="text-sm">{course.categorias?.join(', ') || 'Sin categorías'}</p>
                  </div>
                  {course.imagen_portada_url && (
                    <div>
                      <Label>Imagen de portada</Label>
                      <img src={course.imagen_portada_url} alt="Portada" className="w-32 h-20 object-cover rounded" />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Video del Curso</CardTitle>
            </CardHeader>
            <CardContent>
              {hasVideo ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                    <video 
                      src={course.video_url}
                      className="w-full h-full"
                      controls
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <VideoModal videoUrl={course.video_url!} title={course.titulo}>
                        <Button size="lg" className="bg-white/20 hover:bg-white/30 text-white">
                          <Video className="h-6 w-6 mr-2" />
                          Ver en Pantalla Completa
                        </Button>
                      </VideoModal>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <VideoModal videoUrl={course.video_url!} title={course.titulo}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Ver Video
                      </Button>
                    </VideoModal>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteMaterial('video')}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar Video
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay video para este curso</p>
                    <p className="text-sm text-muted-foreground">Sube un video usando el formulario de abajo</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoFile">Seleccionar video</Label>
                    <Input
                      id="videoFile"
                      type="file"
                      accept="video/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !selectedFile || !selectedFile.type.startsWith('video/')}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Subiendo...' : 'Subir Video'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="material" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Material PDF</CardTitle>
            </CardHeader>
            <CardContent>
              {hasMaterial ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Material del curso</p>
                      <p className="text-sm text-muted-foreground">Archivo PDF</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(course.material_url, '_blank')}
                    >
                      Ver PDF
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteMaterial('pdf')}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar PDF
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay material PDF para este curso</p>
                    <p className="text-sm text-muted-foreground">Sube un PDF usando el formulario de abajo</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdfFile">Seleccionar PDF</Label>
                    <Input
                      id="pdfFile"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || !selectedFile || selectedFile.type !== 'application/pdf'}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Subiendo...' : 'Subir PDF'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
