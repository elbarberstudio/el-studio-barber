'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone, type FileRejection, type Accept } from 'react-dropzone';
import { File as FileIcon, UploadCloud, X, Video, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type FileType = 'video' | 'pdf' | 'other';

export interface FileUploadProps {
  onFileSelect?: (file: File | null) => void;
  onFileChange?: (file: File | null) => void;
  onUploadSuccess?: (file: { 
    url: string; 
    path: string; 
    name: string; 
    type: string; 
    size: number 
  }) => void;
  file?: File | null;
  disabled?: boolean;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
  bucket?: string;
  path?: string;
  label?: string;
  description?: string;
  previewUrl?: string | null;
  showPreview?: boolean;
}

const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/ogg': ['.ogv'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/x-ms-wmv': ['.wmv']
};

const ACCEPTED_PDF_TYPES = {
  'application/pdf': ['.pdf']
};

export function FileUpload(props: FileUploadProps) {
  const {
    onFileSelect,
    onFileChange,
    onUploadSuccess,
    file: initialFile,
    disabled = false,
    className,
    accept = 'all',
    maxSizeMB = 100,
    bucket,
    path,
    label = 'Arrastra y suelta archivos aquí, o haz clic para seleccionar',
    description = 'Se permiten archivos de video (MP4, WebM, OGG) o PDF (hasta 100MB)',
    previewUrl,
    showPreview = true
  } = props;
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const maxSize = maxSizeMB * 1024 * 1024;
  
  // State
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileType, setFileType] = useState<FileType>('other');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Determine file type from MIME
  const getFileTypeFromMime = useCallback((file: File): FileType => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'other';
  }, []);

  // Handle file upload
  const uploadFile = useCallback(
    async (fileToUpload: File) => {
      if (!fileToUpload || !bucket) return;

      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        const fileExt = fileToUpload.name.split('.').pop() || '';
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = path ? `${path}/${fileName}` : fileName;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = await supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        // Determine file type
        const fileType = getFileTypeFromMime(fileToUpload);

        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess({
            url: publicUrl,
            path: filePath,
            name: fileToUpload.name,
            type: fileToUpload.type,
            size: fileToUpload.size
          });
        }

        toast({
          title: '¡Archivo subido!',
          description: `${fileToUpload.name} se ha subido correctamente.`,
        });

      } catch (error) {
        console.error('Error uploading file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al subir el archivo';
        setUploadError(errorMessage);
        
        toast({
          title: 'Error al subir el archivo',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [bucket, onUploadSuccess, path, supabase.storage, toast, getFileTypeFromMime]
  );

  // Handle file drop/selection
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const error = fileRejections[0].errors[0];
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Reset states
      setUploadProgress(0);
      setUploadError(null);
      
      setFile(file);
      onFileSelect?.(file);
      onFileChange?.(file);
      
      if (bucket && path) {
        uploadFile(file);
      }
    },
    [onFileSelect, onFileChange, bucket, path, maxSizeMB, accept]
  );

  // Convert accept string to proper Accept object if needed
  const getAcceptObject = useCallback((acceptStr: string): Accept | undefined => {
    if (!acceptStr) return undefined;
    
    // Handle common cases
    if (acceptStr.includes('image/')) {
      return {
        'image/*': ['.jpg', '.jpeg', '.png', '.webp']
      };
    }
    if (acceptStr.includes('video/')) {
      return {
        'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv']
      };
    }
    if (acceptStr.includes('application/pdf')) {
      return {
        'application/pdf': ['.pdf']
      };
    }
    
    return undefined;
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? getAcceptObject(accept) : undefined,
    maxSize: maxSize,
    multiple: false,
    disabled: !!disabled,
  });

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [file]);

  // Determine if we should show the preview
  const shouldShowPreview = (props.showPreview === undefined ? true : props.showPreview) && 
    (props.previewUrl || (file && file.type.startsWith('image/')));

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="text-sm font-medium leading-none">
          {label}
        </div>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {shouldShowPreview ? (
        <div className="relative group">
          <img 
            src={props.previewUrl || (file ? URL.createObjectURL(file) : '')} 
            alt="Preview" 
            className="rounded-md border w-full h-48 object-cover"
            onLoad={() => {
              if (file && objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
              }
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div
              {...getRootProps()}
              className="text-white p-2 rounded-full bg-black/50 hover:bg-black/70 cursor-pointer"
            >
              <input {...getInputProps()} />
              <UploadCloud className="h-5 w-5" />
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25',
            disabled && 'opacity-60 cursor-not-allowed',
            className
          )}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
              {uploadProgress > 0 && (
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(uploadProgress)}% completado
                  </p>
                </div>
              )}
            </div>
          ) : file || previewUrl ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                {fileType === 'video' ? (
                  <Video className="h-12 w-12 text-muted-foreground" />
                ) : fileType === 'pdf' ? (
                  <FileText className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <FileIcon className="h-12 w-12 text-muted-foreground" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 rounded-full h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setUploadError(null);
                    onFileSelect?.(null);
                    onFileChange?.(null);
                  }}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Eliminar archivo</span>
                </Button>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground truncate max-w-xs">
                {file?.name || (previewUrl ? 'Archivo cargado' : '')}
              </p>
              <p className="text-xs text-muted-foreground">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept ? `Formatos aceptados: ${accept}` : 'Cualquier tipo de archivo'}
                </p>
                {maxSizeMB && (
                  <p className="text-xs text-muted-foreground">
                    Tamaño máximo: {maxSizeMB}MB
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
