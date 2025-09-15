import { toast } from '@/components/ui/use-toast';

export type UploadOptions = {
  bucket: string;
  path: string;
  onProgress?: (progress: number) => void;
  maxFileSizeMB?: number;
};

export async function uploadFile(
  file: File,
  { bucket, path, onProgress, maxFileSizeMB = 100 }: UploadOptions
): Promise<{ url: string; path: string } | null> {
  // Validate file size
  const maxSize = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes
  if (file.size > maxSize) {
    toast({
      title: 'Error',
      description: `El archivo es demasiado grande. Tamaño máximo permitido: ${maxFileSizeMB}MB`,
      variant: 'destructive',
    });
    return null;
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('path', path);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al subir el archivo');
    }

    toast({
      title: '¡Archivo subido con éxito!',
      description: `El archivo ${file.name} se ha subido correctamente.`,
    });

    return {
      url: result.url,
      path: result.path,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Error al subir el archivo',
      variant: 'destructive',
    });
    return null;
  }
}

export const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/ogg': ['.ogv', '.ogg'],
};

export const ACCEPTED_PDF_TYPES = {
  'application/pdf': ['.pdf'],
};

export function getFileType(file: File): 'video' | 'pdf' | 'other' {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'pdf';
  return 'other';
}

export function validateFile(file: File, acceptedTypes: Record<string, string[]>, maxSizeMB: number): string | null {
  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const acceptedExtensions = Object.values(acceptedTypes).flat();
  
  if (!fileExtension || !acceptedExtensions.includes(fileExtension)) {
    return `Tipo de archivo no soportado. Formatos aceptados: ${acceptedExtensions.join(', ')}`;
  }

  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  if (file.size > maxSize) {
    return `El archivo es demasiado grande. Tamaño máximo permitido: ${maxSizeMB}MB`;
  }

  return null;
}
