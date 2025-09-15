'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '../auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Spinner } from '../spinner';
import { FileUpload } from './file-upload';
import { Progress } from '../ui/progress';

// Límites
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_PDF_SIZE   = 50 * 1024 * 1024;  // 50MB

// Tipos aceptados
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

const formSchema = z.object({
  titulo: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  categorias: z.string().transform(str => str.split(',').map(s => s.trim())),
  imagenPortada: z
    .instanceof(File, { message: 'Debes seleccionar una imagen de portada.' })
    .refine((file) => file.size <= MAX_IMAGE_SIZE, 'La imagen es demasiado grande. Máximo 5MB.')
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Solo se aceptan imágenes .jpg, .jpeg, .png o .webp'
    ),
  videoIntroduccion: z
    .instanceof(File)
    .optional(),
  materialApoyo: z
    .instanceof(File)
    .optional(),
});
type FormValues = z.infer<typeof formSchema>;

/** Sube a Storage (bucket "cursos") en carpeta `path` y devuelve publicUrl */
async function uploadToSupabase(file: File, path: string) {
  const ext = file.name.split('.').pop() || 'bin';
  const base = file.name.replace(/[^\w\-.]+/g, '_').replace(/\.[^/.]+$/, '');
  const fileName = `${base}_${Date.now()}.${ext}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('cursos')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = supabase.storage.from('cursos').getPublicUrl(filePath);
  return pub.publicUrl;
}

interface CreateCourseFormProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onCourseCreated?: () => void;
  open?: boolean;                         // alias
  onOpenChange?: (isOpen: boolean) => void; // alias
  onSuccess?: () => void;                   // alias
}

export function CreateCourseForm(props: CreateCourseFormProps) {
  const {
    children, isOpen, setIsOpen, open, onOpenChange, onCourseCreated, onSuccess,
  } = props;

  // normalizamos nombres de props
  const controlledOpen = typeof isOpen === 'boolean' ? isOpen : !!open;
  const setOpen = setIsOpen ?? onOpenChange ?? (() => {});
  const handleSuccess = onCourseCreated ?? onSuccess ?? (() => {});

  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      categorias: [],
      imagenPortada: undefined,
      videoIntroduccion: undefined,
      materialApoyo: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setUploadProgress(0);
      setUploadError(null);

      console.log('Starting course creation with values:', values);
      console.log('Current user:', user);

      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }
  
      // 1) Subir imagen de portada
      console.log('Uploading cover image...');
      const imagenPortadaUrl = await uploadToSupabase(values.imagenPortada, 'portadas');
      console.log('Cover image uploaded:', imagenPortadaUrl);
      setUploadProgress(30);
  
      // 2) Subir video (si existe)
      let videoUrl: string | null = null;
      if (values.videoIntroduccion) {
        console.log('Uploading video...');
        videoUrl = await uploadToSupabase(values.videoIntroduccion, 'videos');
        console.log('Video uploaded:', videoUrl);
      }
      setUploadProgress(60);
  
      // 3) Subir material (si existe)
      let materialUrl: string | null = null;
      if (values.materialApoyo) {
        console.log('Uploading material...');
        materialUrl = await uploadToSupabase(values.materialApoyo, 'materiales');
        console.log('Material uploaded:', materialUrl);
      }
      setUploadProgress(85);
  
      // 4) Insertar en la base de datos
      console.log('Inserting into database...');
      const courseData = {
        titulo: values.titulo,
        descripcion: values.descripcion,
        barbero_id: user.id,
        imagen_portada_url: imagenPortadaUrl,
        video_url: videoUrl,
        material_url: materialUrl,
        categorias: values.categorias,
        publicado: false,
      };
      console.log('Course data to insert:', courseData);

      const { data: insertResult, error: dbError } = await supabase.from('cursos').insert([courseData]);
  
      if (dbError) {
        console.error('Database error details:', dbError);
        console.error('Full error object:', JSON.stringify(dbError, null, 2));
        throw new Error(`Database error: ${JSON.stringify(dbError)}`);
      }

      console.log('Course inserted successfully:', insertResult);
  
      setUploadProgress(100);
      toast({ title: 'Éxito', description: 'El curso ha sido creado correctamente.' });
      form.reset();
      onSuccess?.();
  
    } catch (error) {
      console.error('Error creando curso:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      setUploadError(errorMessage);
      toast({
        title: 'Error',
        description: `No se pudo crear el curso: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={controlledOpen} onOpenChange={(o) => { if (!loading) setOpen(o); }}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Curso</DialogTitle>
          <DialogDescription>
            Completa los detalles básicos y la portada del curso. Podrás añadir lecciones después.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Curso</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Curso de Corte Clásico" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Curso</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe de qué trata el curso..." {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categorias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorías</FormLabel>
                  <FormControl>
                    <Input placeholder="Corte, Barba, Color (separadas por coma)" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              {/* Portada (imagen) con input nativo */}
              <FormField
                control={form.control}
                name="imagenPortada"
                render={({ field: { onChange } }) => (
                  <FormItem>
                    <FormLabel>Imagen de portada *</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        disabled={loading}
                        onChange={(e) => onChange(e.target.files?.[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Video (opcional) → nuestro FileUpload acepta 'video' */}
              <FormField
                control={form.control}
                name="videoIntroduccion"
                render={({ field: { onChange, value } }) => (
                  <FormItem>
                    <FormLabel>Video de introducción (opcional)</FormLabel>
                    <div className="mt-1">
                      <FileUpload
                        file={value ?? null}
                        onFileSelect={(f) => onChange(f ?? undefined)}
                        accept="video"
                        maxSizeMB={100}
                        bucket="cursos"
                        path="videos"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PDF (opcional) → nuestro FileUpload acepta 'pdf' */}
              <FormField
                control={form.control}
                name="materialApoyo"
                render={({ field: { onChange, value } }) => (
                  <FormItem>
                    <FormLabel>Material de apoyo (PDF opcional)</FormLabel>
                    <div className="mt-1">
                      <FileUpload
                        file={value ?? null}
                        onFileSelect={(f) => onChange(f ?? undefined)}
                        accept="pdf"
                        maxSizeMB={50}
                        bucket="cursos"
                        path="materiales"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {loading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                {uploadError && <p className="text-sm font-medium text-destructive">{uploadError}</p>}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={loading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                {loading ? `Creando... ${Math.round(uploadProgress)}%` : 'Crear Curso'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
